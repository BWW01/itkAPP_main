import { z } from "zod";
import { db } from "../../db";
import { studentSites } from "../../db/schema";

const bodySchema = z.object({
    name: z.string().trim().min(1, "A név nem lehet üres.").max(50, "A név legfeljebb 50 karakter lehet."),
    url: z.string().trim().url("Érvénytelen URL formátum."),
    tags: z.array(z.string().trim()),
    category: z.enum(["og", "current", "wip"], {message: "Érvénytelen kategória."}),
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

    const [site] = await db
        .insert(studentSites)
        .values({
            userId: session.user.id,
            ...parsed.data,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: studentSites.userId,
            set: {
                ...parsed.data,
                updatedAt: new Date(),
            },
        })
        .returning({
            name: studentSites.name,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        });

    return site;
});