
import {eq, sql} from "drizzle-orm";
import {db} from "#server/db";
import {calendarLinks, syncInterval} from "#server/db/schema";
import { z } from "zod";
import { ErrorCode } from "#shared/types/errorCodes";


const bodySchema = z.object({
    name: z.string().trim().min(1, ErrorCode.NAME_EMPTY).max(50, ErrorCode.NAME_TOO_LONG), url: z
        .string()
        .trim()
        .transform((val) => val.startsWith("webcal://") ? "https://" + val.slice(9) : val)
        .pipe(
            z.url(ErrorCode.INVALID_URL)
                .refine((val) => val.startsWith("https://"), ErrorCode.INVALID_URL)
        ),
    syncInterval: z.enum(syncInterval.enumValues).default("1d"),
});

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    // check if the user has too many links
    const [ row ] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(calendarLinks)
        .where(eq(calendarLinks.userId, user.id));
    const count = row?.count ?? 0;
    if (count >= 10) throw createError({ statusCode: 400, data: { code: ErrorCode.TOO_MANY_LINKS } });
    
    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: { code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY },
        });
    }

    const [created] = await db
        .insert(calendarLinks)
        .values({ userId: user.id, ...parsed.data })
        .onConflictDoNothing()
        .returning({
            id: calendarLinks.id,
            name: calendarLinks.name,
            url: calendarLinks.url,
            syncInterval: calendarLinks.syncInterval,
            lastSyncedAt: calendarLinks.lastSyncedAt,
            lastError: calendarLinks.lastError,
        });

    // check if dupe
    if (!created) {
        throw createError({ statusCode: 409, data: { code: ErrorCode.DUPLICATE_LINK } });
    }
    
    setResponseStatus(event, 201);
    return created;
});