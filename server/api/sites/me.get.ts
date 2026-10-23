import { db } from "../../db";
import { ldapInfo, studentSites } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const [site] = await db
        .select({
            name: ldapInfo.fullName,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        })
        .from(studentSites)
        .innerJoin(ldapInfo, eq(studentSites.login, ldapInfo.ldapUsername))
        .where(eq(studentSites.login, user.login));

    return site ?? null;
});