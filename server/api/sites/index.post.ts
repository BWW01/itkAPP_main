import { z } from "zod";
import { db } from "../../db";
import { studentSites } from "../../db/schema";

const bodySchema = z.object({
    name: z.string().trim().min(1).max(80),
    url: z.string().trim().url(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10),
    category: z.enum(["og", "current", "wip"]),
});

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? "Error parsing data.",
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