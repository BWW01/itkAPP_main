import {db} from "../../db";
import {studentSites, ldapInfo} from "../../db/schema";
import {desc, eq} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    return await db
        .select({
            userId: studentSites.userId,
            name: ldapInfo.fullName,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        })
        .from(studentSites)
        .innerJoin(ldapInfo, eq(studentSites.userId, ldapInfo.id))
        .orderBy(desc(studentSites.updatedAt));
});