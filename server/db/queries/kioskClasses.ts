import {and, asc, eq, gt, inArray, lt} from "drizzle-orm";
import type {PostgresJsDatabase} from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import {
    classSessions,
    curricula,
    curriculumGroups,
    curriculumSubgroups,
    curriculumSubjects,
    subjects,
} from "../schema";
import type {SubjectCurriculumRow} from "../../utils/kioskClasses";

export type Db = PostgresJsDatabase<typeof schema>;

export async function findClassSessions(db: Db, from: Date, to: Date) {
    return db
        .select()
        .from(classSessions)
        .where(and(lt(classSessions.startsAt, to), gt(classSessions.endsAt, from)))
        .orderBy(asc(classSessions.startsAt), asc(classSessions.room));
}

export async function findSubjectCurricula(db: Db, codes: string[]): Promise<SubjectCurriculumRow[]> {
    if (codes.length === 0) return [];
    return db
        .selectDistinct({
            code: subjects.code,
            nameEn: subjects.nameEn,
            curriculumCode: curricula.code,
            curriculumName: curricula.name,
            major: curricula.major,
        })
        .from(subjects)
        .leftJoin(curriculumSubjects, eq(curriculumSubjects.subjectId, subjects.id))
        .leftJoin(curriculumSubgroups, eq(curriculumSubgroups.id, curriculumSubjects.subgroupId))
        .leftJoin(curriculumGroups, eq(curriculumGroups.id, curriculumSubgroups.groupId))
        .leftJoin(curricula, eq(curricula.id, curriculumGroups.curriculumId))
        .where(inArray(subjects.code, codes));
}