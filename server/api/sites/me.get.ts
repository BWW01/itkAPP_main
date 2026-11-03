import { db } from "../../db";
import { ldapInfo, studentSites } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const [site] = await db
        .select({
            name: ldapInfo.fullName,
            login: studentSites.login,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
            isPublic: studentSites.isPublic,
            isPhpEnabled: studentSites.isPhpEnabled,
            color: studentSites.color,
        })
        .from(studentSites)
        .innerJoin(ldapInfo, eq(studentSites.login, ldapInfo.ldapUsername))
        .where(eq(studentSites.login, user.login));

    return site ?? null;
});