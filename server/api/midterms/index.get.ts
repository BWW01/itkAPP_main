import {db} from "../../db";
import {midtermDates, midtermType, subjects} from "../../db/schema";
import {and, asc, eq, gte, inArray} from "drizzle-orm";
import {z} from "zod";
import {ErrorCode} from "#shared/types/errorCodes";

const querySchema = z.object({
    type: z
        .string()
        .optional()
        .transform((value) => value?.split(","))
        .pipe(z.array(z.enum(midtermType.enumValues, ErrorCode.INVALID_TYPE)).optional()),
});

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    const parsed = querySchema.safeParse(getQuery(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: { code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY },
        });
    }
    const types = parsed.data.type;

    return await db
        .select({
            id: midtermDates.id,
            type: midtermDates.type,
            createdBy: midtermDates.createdBy,
            startsAt: midtermDates.startsAt,
            location: midtermDates.location,
            subject: {
                id: subjects.id,
                name: subjects.name,
                code: subjects.code,
            }
        })
        .from(midtermDates)
        .innerJoin(subjects, eq(midtermDates.subjectId, subjects.id))
        .where(
            and(gte(midtermDates.startsAt, new Date()),
            types ? inArray(midtermDates.type, types) : undefined,
        ))
        .orderBy(asc(midtermDates.startsAt));
});