import { z } from "zod";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";
import { curriculumSubjectCredits, getStudentCurriculum } from "../../db/queries/absolutorium";

const querySchema = z.object({
    q: z.string().trim().min(2, "Legalább 2 karakter kell a kereséshez.").max(100),
});

/** Tárgykereső – csak a hallgató kiválasztott tantervének tárgyai között. */
export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const parsed = querySchema.safeParse(getQuery(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? "Adat feldolgozási hiba.",
        });
    }

    const student = await getStudentCurriculum(db, session.user.id);
    if (!student) {
        throw createError({ statusCode: 400, message: "Előbb válassz tantervet." });
    }

    const pattern = `%${parsed.data.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const cs = curriculumSubjectCredits(db, student.id);

    return db
        .select({
            id: subjects.id,
            code: subjects.code,
            name: subjects.name,
            credits: cs.credits,
            requirementType: subjects.requirementType,
        })
        .from(subjects)
        .innerJoin(cs, eq(cs.subjectId, subjects.id))
        .where(or(ilike(subjects.name, pattern), ilike(subjects.code, pattern)))
        .orderBy(asc(subjects.name))
        .limit(20);
});