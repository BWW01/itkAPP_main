import { ErrorCode } from "#shared/types/errorCodes";
import {eq} from "drizzle-orm";
import {db} from "#server/db";
import {ldapInfo, userRole, userRoles} from "#server/db/schema";
import {z} from "zod";
import {requireAdmin} from "#server/utils/admin";

const bodySchema = z.object({
    userId: z.number().int().positive(),
    role: z.enum(userRole.enumValues),
});

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: { code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY },
        });
    }

    const [ targetUser ] = await db
        .select({ id: ldapInfo.id })
        .from(ldapInfo)
        .where(eq(ldapInfo.id, parsed.data.userId))
        .limit(1);

    if (!targetUser) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.USER_NOT_FOUND } });
    }

    await db
        .insert(userRoles)
        .values(parsed.data)
        .onConflictDoNothing();

    return parsed.data;

});