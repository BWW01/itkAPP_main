import {eq} from "drizzle-orm";
import {db} from "#server/db";
import {calendarLinks} from "#server/db/schema";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    return await db
        .select({
            id: calendarLinks.id,
            name: calendarLinks.name,
            url: calendarLinks.url,
            syncInterval: calendarLinks.syncInterval,
            lastSyncedAt: calendarLinks.lastSyncedAt,
            lastError: calendarLinks.lastError,
        })
        .from(calendarLinks)
        .where(eq(calendarLinks.userId, user.id))
        .orderBy(calendarLinks.createdAt)
});