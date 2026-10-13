import { ErrorCode } from "#shared/types/errorCodes";
import {eq} from "drizzle-orm";
import {userRoles} from "#server/db/schema";
import {db} from "#server/db";
import {z} from "zod";
import {requireAdmin} from "#server/utils/admin";

const idSchema = z.coerce.number().int().positive();

export default defineEventHandler(async (event) => {
    await requireAdmin(event);
    const id = getRouterParam(event, "id");
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.USER_NOT_FOUND } });
    }

    const [ deleted ] = await db
        .delete(userRoles)
        .where(eq(userRoles.userId, parsed.data))
        .returning({ id: userRoles.userId });

    if (!deleted) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.USER_NOT_FOUND } });
    }

    return { id: deleted.id };
});