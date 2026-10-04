import { eq } from "drizzle-orm";
import { db } from "../../db";
import { ldapInfo } from "../../db/schema";

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

    return user;
});