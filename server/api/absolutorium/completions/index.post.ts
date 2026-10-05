import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { subjectCompletions, subjects } from "../../../db/schema";

const bodySchema = z.object({
    subjectId: z.number().int().positive("Érvénytelen tárgy."),
    semester: z
        .string()
        .trim()
        .regex(/^\d{4}\/\d{2}\/[12]$/, "A félév formátuma: 2025/26/1."),
    grade: z
        .number()
        .int()
        .min(1, "A jegy 1 és 5 között lehet.")
        .max(5, "A jegy 1 és 5 között lehet.")
        .nullable(),
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
    const { subjectId, semester, grade } = parsed.data;

    const [startYear, endYY] = semester.split("/").map(Number) as [number, number];
    if ((startYear + 1) % 100 !== endYY) {
        throw createError({ statusCode: 400, message: "Érvénytelen tanév (pl. 2025/26/1)." });
    }

    const [subject] = await db
        .select({ id: subjects.id, requirementType: subjects.requirementType })
        .from(subjects)
        .where(eq(subjects.id, subjectId));
    if (!subject) {
        throw createError({ statusCode: 404, message: "Nincs ilyen tárgy." });
    }

    const signatureOnly = subject.requirementType?.toLowerCase().startsWith("aláírás") ?? false;
    if (signatureOnly && grade !== null) {
        throw createError({ statusCode: 400, message: "Ennél a tárgynál nincs jegy, csak aláírás." });
    }
    if (!signatureOnly && subject.requirementType !== null && grade === null) {
        throw createError({ statusCode: 400, message: "Ennél a tárgynál jegyet kell megadni." });
    }

    const [row] = await db
        .insert(subjectCompletions)
        .values({ userId: session.user.id, subjectId, semester, grade })
        .onConflictDoUpdate({
            target: [subjectCompletions.userId, subjectCompletions.subjectId, subjectCompletions.semester],
            set: { grade },
        })
        .returning({
            id: subjectCompletions.id,
            subjectId: subjectCompletions.subjectId,
            semester: subjectCompletions.semester,
            grade: subjectCompletions.grade,
        });

    return row;
});