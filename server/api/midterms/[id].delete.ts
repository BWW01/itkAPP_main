import { z } from "zod";
import { db } from "../../db";
import {midtermDates} from "../../db/schema";
import { ErrorCode } from "#shared/types/errorCodes";
import {eq} from "drizzle-orm";
import {requireMidtermModerator} from "#server/utils/roles";

const idSchema = z.coerce.number().int().positive();

export default defineEventHandler(async (event) => {
    await requireMidtermModerator(event);
    const id = getRouterParam(event, "id");
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.MIDTERM_NOT_FOUND } });
    }

    const [ deleted ] = await db
        .delete(midtermDates)
        .where(eq(midtermDates.id, parsed.data))
        .returning({ id: midtermDates.id });

    if (!deleted) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.MIDTERM_NOT_FOUND } });
    }

    return { id: deleted.id };
});