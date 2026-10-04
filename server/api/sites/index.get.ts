import {db} from "../../db";
import {studentSites} from "../../db/schema";
import {desc} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    return await db
        .select({
            userId: studentSites.userId,
            name: studentSites.name,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        })
        .from(studentSites)
        .orderBy(desc(studentSites.updatedAt));
});