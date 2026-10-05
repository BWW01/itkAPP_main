import { desc, eq } from "drizzle-orm";
import { db } from "../../../db";
import { subjectCompletions, subjects } from "../../../db/schema";
import { curriculumSubjectCredits, getStudentCurriculum } from "../../../db/queries/absolutorium";

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const student = await getStudentCurriculum(db, session.user.id);
    if (!student) return [];

    const cs = curriculumSubjectCredits(db, student.id);

    return db
        .select({
            id: subjectCompletions.id,
            subjectId: subjects.id,
            code: subjects.code,
            name: subjects.name,
            credits: cs.credits,
            requirementType: subjects.requirementType,
            semester: subjectCompletions.semester,
            grade: subjectCompletions.grade,
        })
        .from(subjectCompletions)
        .innerJoin(subjects, eq(subjects.id, subjectCompletions.subjectId))
        .innerJoin(cs, eq(cs.subjectId, subjectCompletions.subjectId))
        .where(eq(subjectCompletions.userId, session.user.id))
        .orderBy(desc(subjectCompletions.semester), subjects.name);
});