import { z } from "zod";
import { db } from "../../db";
import {midtermDates, subjects} from "../../db/schema";
import { ErrorCode } from "#shared/types/errorCodes";
import {eq} from "drizzle-orm";

const bodySchema = z.object({
    subjectId: z.number().int().positive(),
    startsAt: z.coerce.date(),
    location: z.string().trim().min(1).max(100).optional(),
});

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: { code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY },
        });
    }

    const values = {
        ...parsed.data,
        createdBy: user.id,
    };

    const [ subject ] = await db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.id, parsed.data.subjectId))
        .limit(1);

    if (!subject) {
        throw createError({ statusCode: 404, data: { code: ErrorCode.SUBJECT_NOT_FOUND } });
    }

    const [ midtermDate ] = await db
        .insert(midtermDates)
        .values(values)
        .returning();

    return midtermDate;
});