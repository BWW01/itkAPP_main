import {db} from "../../db";
import {studentSites, ldapInfo} from "../../db/schema";
import {desc, eq, sql} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    return await db
        .select({
            login: studentSites.login,
            name: sql<string>`COALESCE(${ldapInfo.fullName}, ${studentSites.legacyName}, ${studentSites.login})`,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        })
        .from(studentSites)
        .leftJoin(ldapInfo, eq(studentSites.login, ldapInfo.ldapUsername))
        .orderBy(desc(studentSites.updatedAt));
});