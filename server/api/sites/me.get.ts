import { db } from "../../db";
import { studentSites } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const [site] = await db
        .select({
            name: studentSites.name,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        })
        .from(studentSites)
        .where(eq(studentSites.userId, user.id));

    return site ?? null;
});