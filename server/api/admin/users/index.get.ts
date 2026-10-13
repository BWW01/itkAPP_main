import {asc} from "drizzle-orm";
import {db} from "#server/db";
import {ldapInfo} from "#server/db/schema";
import {requireAdmin} from "#server/utils/admin";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    return await db
        .select({
            userId: ldapInfo.id,
            fullName: ldapInfo.fullName,
            ldapUsername: ldapInfo.ldapUsername,
        })
        .from(ldapInfo)
        .orderBy(asc(ldapInfo.familyName), asc(ldapInfo.givenName));
});