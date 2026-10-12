import { eq } from "drizzle-orm";
import { db } from "../../db";
import { ldapInfo } from "../../db/schema";
import {canModerateMidterms} from "#server/utils/roles";
import {isAdminLogin} from "#server/utils/admin";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const exists = await db
        .select({ id: ldapInfo.id })
        .from(ldapInfo)
        .where(eq(ldapInfo.id, user.id));

    if (exists.length === 0) {
        await clearUserSession(event);
        throw createError({ statusCode: 401 });
    }

    return {
        ...user,
        canModerateMidterms: await canModerateMidterms(event, user),
        isAdmin: isAdminLogin(event, user.login),
    };
});