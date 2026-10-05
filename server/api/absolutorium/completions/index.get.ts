import { desc, eq } from "drizzle-orm";
import { db } from "../../../db";
import { subjectCompletions, subjects } from "../../../db/schema";

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    return db
        .select({
            id: subjectCompletions.id,
            subjectId: subjects.id,
            code: subjects.code,
            name: subjects.name,
            credits: subjects.credits,
            requirementType: subjects.requirementType,
            semester: subjectCompletions.semester,
            grade: subjectCompletions.grade,
        })
        .from(subjectCompletions)
        .innerJoin(subjects, eq(subjects.id, subjectCompletions.subjectId))
        .where(eq(subjectCompletions.userId, session.user.id))
        .orderBy(desc(subjectCompletions.semester), subjects.name);
});