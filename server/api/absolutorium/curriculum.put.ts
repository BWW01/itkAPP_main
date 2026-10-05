import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { curricula, curriculumGroups, studentCurricula } from "../../db/schema";

const bodySchema = z.object({
    curriculumId: z.number().int().positive("Érvénytelen tanterv."),
    specializationGroupId: z.number().int().positive("Érvénytelen specializáció.").nullable().default(null),
});

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? "Adat feldolgozási hiba.",
        });
    }
    const { curriculumId, specializationGroupId } = parsed.data;

    const [curriculum] = await db
        .select({ id: curricula.id })
        .from(curricula)
        .where(eq(curricula.id, curriculumId));
    if (!curriculum) {
        throw createError({ statusCode: 404, message: "Nincs ilyen tanterv." });
    }

    if (specializationGroupId !== null) {
        const [spec] = await db
            .select({ id: curriculumGroups.id })
            .from(curriculumGroups)
            .where(and(
                eq(curriculumGroups.id, specializationGroupId),
                eq(curriculumGroups.curriculumId, curriculumId),
                eq(curriculumGroups.isSpecialization, true),
            ));
        if (!spec) {
            throw createError({ statusCode: 400, message: "Ez a specializáció nem tartozik a kiválasztott tantervhez." });
        }
    }

    const [row] = await db
        .insert(studentCurricula)
        .values({ userId: session.user.id, curriculumId, specializationGroupId })
        .onConflictDoUpdate({
            target: studentCurricula.userId,
            set: { curriculumId, specializationGroupId, updatedAt: new Date() },
        })
        .returning({
            curriculumId: studentCurricula.curriculumId,
            specializationGroupId: studentCurricula.specializationGroupId,
        });

    return row;
});