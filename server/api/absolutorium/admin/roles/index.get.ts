import {asc, eq} from "drizzle-orm";
import {db} from "#server/db";
import {ldapInfo, userRoles} from "#server/db/schema";
import {requireAdmin} from "#server/utils/admin";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    return await db
        .select({
            userId: userRoles.userId,
            fullName: ldapInfo.fullName,
            ldapUsername: ldapInfo.ldapUsername,
            role: userRoles.role,
        })
        .from(userRoles)
        .innerJoin(ldapInfo, eq(userRoles.userId, ldapInfo.id))
        .orderBy(asc(ldapInfo.familyName), asc(ldapInfo.givenName));
});