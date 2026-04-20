import cron from "node-cron";
import { db } from "../db";
import { associations, ldapInfo } from "../db/schema";
import { isDue } from "./interval";
import { syncUserCalendar } from "./mergeIcs";

const STAGGER_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Deterministic offset per user within the 30-minute window.
 */
function getUserOffset(userId: number): number {
    return (userId * 60_000) % STAGGER_WINDOW_MS;
}

async function runUserSyncIfDue(ldapUsername: string) {
    const [assoc] = await db
        .select()
        .from(associations)
        .where(eq(associations.ldapUsername, ldapUsername));
    if (!assoc) return;

    const syncNeptune =
        !!assoc.neptuneLink?.url &&
        isDue(assoc.neptuneLastSyncedAt, assoc.neptuneLink.syncInterval);

    const syncMoodle =
        !!assoc.moodleLink?.url &&
        isDue(assoc.moodleLastSyncedAt, assoc.moodleLink.syncInterval);

    const syncExtraUrls = (assoc.extras || [])
        .filter((e) => {
            const last = assoc.extrasLastSyncedAt?.[e.url]
                ? new Date(assoc.extrasLastSyncedAt[e.url])
                : null;
            return isDue(last, e.syncInterval);
        })
        .map((e) => e.url);

    if (!syncNeptune && !syncMoodle && syncExtraUrls.length === 0) return;

    console.log(
        `[sync] ${ldapUsername} neptune=${syncNeptune} moodle=${syncMoodle} extras=${syncExtraUrls.length}`
    );

    try {
        const result = await syncUserCalendar(ldapUsername, {
            syncNeptune,
            syncMoodle,
            syncExtraUrls,
        });
        if (result?.changed) {
            console.log(`[sync] ${ldapUsername} calendar updated`);
        }
    } catch (e) {
        console.error(`[sync] ${ldapUsername} failed:`, e);
    }
}

// Import eq at top
import { eq } from "drizzle-orm";

/**
 * Every 30 min, fetch all users and schedule individual timeouts within
 * that window, staggered by userId.
 */
export function startSyncWorker() {
    console.log("[sync] worker started");

    // Run once on startup (staggered)
    scheduleWindow();

    // Then every 30 minutes
    cron.schedule("*/30 * * * *", () => {
        scheduleWindow();
    });
}

async function scheduleWindow() {
    try {
        const users = await db
            .select({ id: ldapInfo.id, ldapUsername: ldapInfo.ldapUsername })
            .from(ldapInfo)
            .innerJoin(
                associations,
                eq(associations.ldapUsername, ldapInfo.ldapUsername)
            );

        for (const user of users) {
            const offset = getUserOffset(user.id);
            setTimeout(() => {
                runUserSyncIfDue(user.ldapUsername).catch((e) =>
                    console.error("[sync] user error:", e)
                );
            }, offset);
        }

        console.log(`[sync] scheduled ${users.length} users in this window`);
    } catch (e) {
        console.error("[sync] scheduling error:", e);
    }
}