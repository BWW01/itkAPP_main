import { and, asc, eq, gte, isNull, or, sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "../schema";
import {
    curricula,
    curriculumGroups,
    curriculumSubgroups,
    curriculumSubjects,
    studentCurricula,
    subjectCompletions,
    subjects,
} from "../schema";
import type {
    AbsolutoriumProgress,
    CompletedSubject,
    GroupProgress,
    MissingSubject,
    SubgroupProgress,
    SubgroupType,
    TypeTotals,
} from "../../../shared/types/absolutorium";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

export const PASSING_GRADE = 2;

export const isPassing = (grade: number | null): boolean => grade === null || grade >= PASSING_GRADE;

export interface CurriculumRow {
    id: number;
    code: string;
    name: string;
    major: string;
    totalCreditsRequired: number;
}

export interface GroupRow {
    id: number;
    name: string;
    requiredCredits: number;
    requiredSubgroupCount: number;
    isSpecialization: boolean;
}

export interface SubgroupRow {
    id: number;
    groupId: number;
    name: string;
    type: SubgroupType;
    requiredCredits: number;
    requiredCount: number | null;
}

export interface CurriculumSubjectRow {
    subgroupId: number;
    subjectId: number;
    code: string;
    name: string;
    credits: number;
    recommendedSemester: number | null;
}

export interface AttemptRow {
    subjectId: number;
    code: string;
    name: string;
    credits: number;
    grade: number | null;
    semester: string;
}

export interface SummarizeInput {
    curriculum: CurriculumRow;
    groups: GroupRow[];
    subgroups: SubgroupRow[];
    curriculumSubjects: CurriculumSubjectRow[];
    attempts: AttemptRow[];
    specializationGroupId: number | null;
}

export function pickBestAttempts(attempts: AttemptRow[]): AttemptRow[] {
    const score = (a: AttemptRow) => a.grade ?? 0;
    const best = new Map<number, AttemptRow>();
    for (const a of attempts) {
        if (!isPassing(a.grade)) continue;
        const cur = best.get(a.subjectId);
        if (!cur || score(a) > score(cur) || (score(a) === score(cur) && a.semester > cur.semester)) {
            best.set(a.subjectId, a);
        }
    }
    return [...best.values()];
}

const emptyTotals = (): TypeTotals => ({ earnedCredits: 0, requiredCredits: 0, countedCredits: 0 });

const bySemesterThenCode = (a: CompletedSubject, b: CompletedSubject) =>
    a.semester.localeCompare(b.semester) || a.code.localeCompare(b.code);

const byRecommendedThenCode = (a: MissingSubject, b: MissingSubject) =>
    (a.recommendedSemester ?? 99) - (b.recommendedSemester ?? 99) || a.code.localeCompare(b.code);

function groupBy<T>(items: T[], keyOf: (item: T) => number): Map<number, T[]> {
    const map = new Map<number, T[]>();
    for (const item of items) {
        const k = keyOf(item);
        const list = map.get(k);
        if (list) list.push(item);
        else map.set(k, [item]);
    }
    return map;
}

export function summarizeProgress(input: SummarizeInput): AbsolutoriumProgress {
    const { curriculum, groups, subgroups, curriculumSubjects, attempts, specializationGroupId } = input;

    const specs = groups.filter((g) => g.isSpecialization);
    const chosenSpec = specs.find((g) => g.id === specializationGroupId) ?? null;
    const activeGroups = groups.filter((g) => !g.isSpecialization || g === chosenSpec);

    const subgroupsByGroup = groupBy(subgroups, (s) => s.groupId);
    const linksBySubgroup = groupBy(curriculumSubjects, (l) => l.subgroupId);
    const activeSubgroups = activeGroups.flatMap((g) => subgroupsByGroup.get(g.id) ?? []);

    const placement = new Map<number, CurriculumSubjectRow>();
    for (const s of activeSubgroups) {
        for (const link of linksBySubgroup.get(s.id) ?? []) {
            if (!placement.has(link.subjectId)) placement.set(link.subjectId, link);
        }
    }
    const freeElective = activeSubgroups.find((s) => s.type === "FREE_ELECTIVE");

    const completedBySubgroup = new Map<number, CompletedSubject[]>(activeSubgroups.map((s) => [s.id, []]));
    const uncategorized: CompletedSubject[] = [];
    const passedIds = new Set<number>();
    let earnedTotal = 0;

    for (const a of pickBestAttempts(attempts)) {
        passedIds.add(a.subjectId);
        const link = placement.get(a.subjectId);
        const credits = link ? link.credits : a.credits;
        earnedTotal += credits;

        const entry: CompletedSubject = {
            subjectId: a.subjectId,
            code: a.code,
            name: a.name,
            credits,
            grade: a.grade,
            semester: a.semester,
            countedAsFreeElective: !link && freeElective !== undefined,
        };

        const targetId = link?.subgroupId ?? freeElective?.id;
        const bucket = targetId !== undefined ? completedBySubgroup.get(targetId) : undefined;
        (bucket ?? uncategorized).push(entry);
    }

    const ownEarned = new Map<number, number>(
        activeSubgroups.map((s) => [
            s.id,
            (completedBySubgroup.get(s.id) ?? []).reduce((sum, x) => sum + x.credits, 0),
        ]),
    );
    const overflowOf = (s: SubgroupRow): number =>
        s.type === "ELECTIVE" ? Math.max(0, ownEarned.get(s.id)! - s.requiredCredits) : 0;
    const totalOverflow = activeSubgroups.reduce((sum, s) => sum + overflowOf(s), 0);

    const byType: Record<SubgroupType, TypeTotals> = {
        MANDATORY: emptyTotals(),
        ELECTIVE: emptyTotals(),
        FREE_ELECTIVE: emptyTotals(),
    };

    const toSubgroupProgress = (s: SubgroupRow): SubgroupProgress => {
        const completed = (completedBySubgroup.get(s.id) ?? []).sort(bySemesterThenCode);
        const own = ownEarned.get(s.id)!;
        const received = s === freeElective ? totalOverflow : 0;
        const earned = own + received;
        const counted = Math.min(earned, s.requiredCredits);

        const missing: MissingSubject[] = s.type !== "MANDATORY" ? [] : (linksBySubgroup.get(s.id) ?? [])
            .filter((l) => !passedIds.has(l.subjectId))
            .map((l) => ({
                subjectId: l.subjectId,
                code: l.code,
                name: l.name,
                credits: l.credits,
                recommendedSemester: l.recommendedSemester,
            }))
            .sort(byRecommendedThenCode);

        const countOk = s.requiredCount === null || completed.length >= s.requiredCount;

        const t = byType[s.type];
        t.earnedCredits += own;
        t.requiredCredits += s.requiredCredits;
        t.countedCredits += counted;

        return {
            id: s.id,
            name: s.name,
            type: s.type,
            requiredCredits: s.requiredCredits,
            requiredCount: s.requiredCount,
            earnedCredits: earned,
            countedCredits: counted,
            remainingCredits: s.requiredCredits - counted,
            completedCount: completed.length,
            overflowCredits: overflowOf(s),
            receivedOverflowCredits: received,
            isComplete: earned >= s.requiredCredits && missing.length === 0 && countOk,
            completed,
            missing,
        };
    };

    const groupProgress: GroupProgress[] = activeGroups.map((g) => {
        const subs = (subgroupsByGroup.get(g.id) ?? []).map(toSubgroupProgress);
        const earned = subs.reduce((sum, s) => sum + s.earnedCredits, 0);
        const counted = Math.min(subs.reduce((sum, s) => sum + s.countedCredits, 0), g.requiredCredits);
        const completedSubgroupCount = subs.filter((s) => s.isComplete).length;

        return {
            id: g.id,
            name: g.name,
            isSpecialization: g.isSpecialization,
            requiredCredits: g.requiredCredits,
            requiredSubgroupCount: g.requiredSubgroupCount,
            earnedCredits: earned,
            countedCredits: counted,
            remainingCredits: g.requiredCredits - counted,
            completedSubgroupCount,
            isComplete: completedSubgroupCount >= g.requiredSubgroupCount && counted >= g.requiredCredits,
            subgroups: subs,
        };
    });

    const required = curriculum.totalCreditsRequired;
    const specializationChosen = specs.length === 0 || chosenSpec !== null;

    return {
        curriculum,
        specialization: {
            chosenId: chosenSpec?.id ?? null,
            options: specs.map((g) => ({ id: g.id, name: g.name, requiredCredits: g.requiredCredits })),
        },
        totals: {
            earnedCredits: earnedTotal,
            requiredCredits: required,
            remainingCredits: Math.max(0, required - earnedTotal),
            percent: Math.min(100, Math.round((earnedTotal / required) * 100)),
        },
        byType,
        groups: groupProgress,
        uncategorized,
        isComplete: specializationChosen
            && earnedTotal >= required
            && groupProgress.every((g) => g.isComplete),
    };
}

/** A tanterv tárgyai a tantervben érvényes kredittel (ha több helyen szerepel, a legnagyobbal). */
export function curriculumSubjectCredits(db: Db, curriculumId: number) {
    return db
        .select({
            subjectId: curriculumSubjects.subjectId,
            credits: sql<number>`max(${curriculumSubjects.credits})`.as("curriculumCredits"),
        })
        .from(curriculumSubjects)
        .innerJoin(curriculumSubgroups, eq(curriculumSubgroups.id, curriculumSubjects.subgroupId))
        .innerJoin(curriculumGroups, eq(curriculumGroups.id, curriculumSubgroups.groupId))
        .where(eq(curriculumGroups.curriculumId, curriculumId))
        .groupBy(curriculumSubjects.subjectId)
        .as("cs");
}

export async function getStudentCurriculum(db: Db, userId: number) {
    const [row] = await db
        .select({
            id: curricula.id,
            code: curricula.code,
            name: curricula.name,
            major: curricula.major,
            totalCreditsRequired: curricula.totalCreditsRequired,
            specializationGroupId: studentCurricula.specializationGroupId,
        })
        .from(studentCurricula)
        .innerJoin(curricula, eq(curricula.id, studentCurricula.curriculumId))
        .where(eq(studentCurricula.userId, userId));
    return row ?? null;
}

export async function getAbsolutoriumProgress(db: Db, userId: number): Promise<AbsolutoriumProgress | null> {
    const student = await getStudentCurriculum(db, userId);
    if (!student) return null;
    const { specializationGroupId, ...curriculum } = student;

    const [groups, subgroups, links, attempts] = await Promise.all([
        db
            .select({
                id: curriculumGroups.id,
                name: curriculumGroups.name,
                requiredCredits: curriculumGroups.requiredCredits,
                requiredSubgroupCount: curriculumGroups.requiredSubgroupCount,
                isSpecialization: curriculumGroups.isSpecialization,
            })
            .from(curriculumGroups)
            .where(eq(curriculumGroups.curriculumId, curriculum.id))
            .orderBy(asc(curriculumGroups.sortOrder), asc(curriculumGroups.id)),

        db
            .select({
                id: curriculumSubgroups.id,
                groupId: curriculumSubgroups.groupId,
                name: curriculumSubgroups.name,
                type: curriculumSubgroups.type,
                requiredCredits: curriculumSubgroups.requiredCredits,
                requiredCount: curriculumSubgroups.requiredCount,
            })
            .from(curriculumSubgroups)
            .innerJoin(curriculumGroups, eq(curriculumGroups.id, curriculumSubgroups.groupId))
            .where(eq(curriculumGroups.curriculumId, curriculum.id))
            .orderBy(asc(curriculumSubgroups.sortOrder), asc(curriculumSubgroups.id)),

        db
            .select({
                subgroupId: curriculumSubjects.subgroupId,
                subjectId: curriculumSubjects.subjectId,
                code: subjects.code,
                name: subjects.name,
                credits: curriculumSubjects.credits,
                recommendedSemester: curriculumSubjects.recommendedSemester,
            })
            .from(curriculumSubjects)
            .innerJoin(curriculumSubgroups, eq(curriculumSubgroups.id, curriculumSubjects.subgroupId))
            .innerJoin(curriculumGroups, eq(curriculumGroups.id, curriculumSubgroups.groupId))
            .innerJoin(subjects, eq(subjects.id, curriculumSubjects.subjectId))
            .where(eq(curriculumGroups.curriculumId, curriculum.id)),

        db
            .select({
                subjectId: subjectCompletions.subjectId,
                code: subjects.code,
                name: subjects.name,
                credits: subjects.credits,
                grade: subjectCompletions.grade,
                semester: subjectCompletions.semester,
            })
            .from(subjectCompletions)
            .innerJoin(subjects, eq(subjects.id, subjectCompletions.subjectId))
            .where(and(
                eq(subjectCompletions.userId, userId),
                or(isNull(subjectCompletions.grade), gte(subjectCompletions.grade, PASSING_GRADE)),
            )),
    ]);

    const inCurriculum = new Set(links.map((l) => l.subjectId));

    return summarizeProgress({
        curriculum,
        groups,
        subgroups,
        curriculumSubjects: links,
        attempts: attempts.filter((a) => inCurriculum.has(a.subjectId)),
        specializationGroupId,
    });
}