import { and, count, eq, inArray, notInArray, sql } from "drizzle-orm";
import type { Db } from "../queries/absolutorium";
import {
    curricula,
    curriculumGroups,
    curriculumSubgroups,
    curriculumSubjects,
    studentCurricula,
    subjects,
} from "../schema";
import type { CurriculumFile } from "./curriculumFile";

export interface ImportResult {
    curriculumId: number;
    groups: number;
    subgroups: number;
    subjectLinks: number;
    removedGroups: string[];
    removedSubgroups: string[];
}


export async function importCurriculum(db: Db, file: CurriculumFile): Promise<ImportResult> {
    return db.transaction(async (tx) => {

        const [cur] = await tx
            .insert(curricula)
            .values({
                code: file.code,
                name: file.name,
                major: file.major,
                totalCreditsRequired: file.totalCreditsRequired,
            })
            .onConflictDoUpdate({
                target: curricula.code,
                set: { name: file.name, major: file.major, totalCreditsRequired: file.totalCreditsRequired },
            })
            .returning({ id: curricula.id });
        const curriculumId = cur!.id;

        const uniqueSubjects = new Map<string, CurriculumFile["groups"][number]["subgroups"][number]["subjects"][number]>();
        for (const g of file.groups) {
            for (const s of g.subgroups) {
                for (const subj of s.subjects) {
                    if (!uniqueSubjects.has(subj.code)) uniqueSubjects.set(subj.code, subj);
                }
            }
        }

        const subjectRows = await tx
            .insert(subjects)
            .values([...uniqueSubjects.values()].map((s) => ({
                code: s.code,
                name: s.name,
                nameEn: s.nameEn,
                credits: s.credits,
                requirementType: s.requirementType,
            })))
            .onConflictDoUpdate({
                target: subjects.code,
                set: {
                    name: sql`excluded."name"`,
                    nameEn: sql`excluded."nameEn"`,
                    credits: sql`excluded."credits"`,
                    requirementType: sql`excluded."requirementType"`,
                },
            })
            .returning({ id: subjects.id, code: subjects.code });
        const subjectIdByCode = new Map(subjectRows.map((r) => [r.code, r.id]));

        const groupIdByName = new Map<string, number>();
        for (const [i, g] of file.groups.entries()) {
            const [row] = await tx
                .insert(curriculumGroups)
                .values({
                    curriculumId,
                    name: g.name,
                    requiredCredits: g.requiredCredits,
                    requiredSubgroupCount: g.requiredSubgroupCount,
                    isSpecialization: g.isSpecialization,
                    sortOrder: i,
                })
                .onConflictDoUpdate({
                    target: [curriculumGroups.curriculumId, curriculumGroups.name],
                    set: {
                        requiredCredits: g.requiredCredits,
                        requiredSubgroupCount: g.requiredSubgroupCount,
                        isSpecialization: g.isSpecialization,
                        sortOrder: i,
                    },
                })
                .returning({ id: curriculumGroups.id });
            groupIdByName.set(g.name, row!.id);
        }
        const keepGroupIds = [...groupIdByName.values()];

        const staleGroups = await tx
            .select({ id: curriculumGroups.id, name: curriculumGroups.name })
            .from(curriculumGroups)
            .where(and(
                eq(curriculumGroups.curriculumId, curriculumId),
                notInArray(curriculumGroups.id, keepGroupIds),
            ));

        if (staleGroups.length > 0) {
            const staleIds = staleGroups.map((g) => g.id);
            const inUse = await tx
                .select({ groupId: studentCurricula.specializationGroupId, students: count() })
                .from(studentCurricula)
                .where(inArray(studentCurricula.specializationGroupId, staleIds))
                .groupBy(studentCurricula.specializationGroupId);

            if (inUse.length > 0) {
                const list = inUse
                    .map((u) => `"${staleGroups.find((g) => g.id === u.groupId)?.name}" (${u.students} hallgató)`)
                    .join(", ");
                throw new Error(
                    `Az új fájlból hiányzik a(z) ${list} specializáció, de hallgató választotta. ` +
                    `Nevezd át vissza a csoportot az XLS-ben, vagy előbb állítsd át ezeket a hallgatókat.`,
                );
            }
            await tx.delete(curriculumGroups).where(inArray(curriculumGroups.id, staleIds));
        }

        const removedSubgroups: string[] = [];
        const allSubgroupIds: number[] = [];
        const links: (typeof curriculumSubjects.$inferInsert)[] = [];

        for (const g of file.groups) {
            const groupId = groupIdByName.get(g.name)!;
            const keepSubgroupIds: number[] = [];

            for (const [i, s] of g.subgroups.entries()) {
                const [row] = await tx
                    .insert(curriculumSubgroups)
                    .values({
                        groupId,
                        name: s.name,
                        type: s.type,
                        requiredCredits: s.requiredCredits,
                        requiredCount: s.requiredCount,
                        sortOrder: i,
                    })
                    .onConflictDoUpdate({
                        target: [curriculumSubgroups.groupId, curriculumSubgroups.name],
                        set: {
                            type: s.type,
                            requiredCredits: s.requiredCredits,
                            requiredCount: s.requiredCount,
                            sortOrder: i,
                        },
                    })
                    .returning({ id: curriculumSubgroups.id });
                const subgroupId = row!.id;
                keepSubgroupIds.push(subgroupId);

                for (const subj of s.subjects) {
                    links.push({
                        subgroupId,
                        subjectId: subjectIdByCode.get(subj.code)!,
                        credits: subj.credits,
                        recommendedSemester: subj.recommendedSemester,
                        prerequisites: subj.prerequisites,
                    });
                }
            }

            const deleted = await tx
                .delete(curriculumSubgroups)
                .where(and(
                    eq(curriculumSubgroups.groupId, groupId),
                    notInArray(curriculumSubgroups.id, keepSubgroupIds),
                ))
                .returning({ name: curriculumSubgroups.name });
            removedSubgroups.push(...deleted.map((d) => `${g.name} / ${d.name}`));
            allSubgroupIds.push(...keepSubgroupIds);
        }

        await tx.delete(curriculumSubjects).where(inArray(curriculumSubjects.subgroupId, allSubgroupIds));
        if (links.length > 0) await tx.insert(curriculumSubjects).values(links);

        return {
            curriculumId,
            groups: file.groups.length,
            subgroups: allSubgroupIds.length,
            subjectLinks: links.length,
            removedGroups: staleGroups.map((g) => g.name),
            removedSubgroups,
        };
    });
}