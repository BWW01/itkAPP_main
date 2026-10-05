import { z } from "zod";
import { asc, ilike, or } from "drizzle-orm";
import { db } from "../../db";
import { subjects } from "../../db/schema";

const querySchema = z.object({
    q: z.string().trim().min(2, "Legalább 2 karakter kell a kereséshez.").max(100),
});

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    const parsed = querySchema.safeParse(getQuery(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? "Adat feldolgozási hiba.",
        });
    }

    const pattern = `%${parsed.data.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

    return db
        .select({
            id: subjects.id,
            code: subjects.code,
            name: subjects.name,
            credits: subjects.credits,
            requirementType: subjects.requirementType,
        })
        .from(subjects)
        .where(or(ilike(subjects.name, pattern), ilike(subjects.code, pattern)))
        .orderBy(asc(subjects.name))
        .limit(20);
});