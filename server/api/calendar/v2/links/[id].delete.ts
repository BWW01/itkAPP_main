import {and, eq} from "drizzle-orm";
import {db} from "#server/db";
import {calendarLinks} from "#server/db/schema";
import { z } from "zod";
import { ErrorCode } from "#shared/types/errorCodes";


const idSchema = z.coerce.number().int().positive();

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    
    const parsed = idSchema.safeParse(getRouterParam(event, "id"));
    if (!parsed.success) {
        throw createError({ statusCode: 400, data: { code: ErrorCode.INVALID_ID } });
    }

    const [ deleted ] = await db
        .delete(calendarLinks)
        .where(and(eq(calendarLinks.id, parsed.data), eq(calendarLinks.userId, user.id)))
        .returning({ id: calendarLinks.id });

    if (!deleted) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.LINK_NOT_FOUND } });
    }

    return { id: deleted.id };
});