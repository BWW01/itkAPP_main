import { Cron } from "croner";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { associations, ldapInfo } from "../db/schema";
import { isDue } from "./interval";
import { syncUserCalendar } from "./mergeIcs";
import { checkAndSendNotifications } from "./notifications";
import { createHash } from "node:crypto";

const STAGGER_WINDOW_MS = 30 * 60 * 1000;

function getUserOffset(userId: number): number {
    const hash = createHash("sha256")
        .update(String(userId))
        .digest("hex");
    const numeric = parseInt(hash.slice(0, 8), 16);
    return numeric % STAGGER_WINDOW_MS;
}

async function runUserSyncIfDue(ldapUsername: string) {
    const [assoc] = await db
        .select()
        .from(associations)
        .where(eq(associations.ldapUsername, ldapUsername));
    if (!assoc) return;

    const syncNeptun =
        !!assoc.neptunLink?.url &&
        isDue(assoc.neptunLastSyncedAt, assoc.neptunLink.syncInterval);

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

    if (!syncNeptun && !syncMoodle && syncExtraUrls.length === 0) return;

    console.log(
        `[sync] ${ldapUsername} neptun=${syncNeptun} moodle=${syncMoodle} extras=${syncExtraUrls.length}`
    );

    try {
        const result = await syncUserCalendar(ldapUsername, {
            syncNeptun,
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

        console.log(`[sync] scheduled ${users.length} users`);
    } catch (e) {
        console.error("[sync] scheduling error:", e);
    }
}

export function startSyncWorker() {
    console.log("[sync] worker started");

    scheduleWindow();

    new Cron("*/30 * * * *", () => {
        scheduleWindow();
    });

    new Cron("* * * * *", () => {
        checkAndSendNotifications().catch((e) =>
            console.error("[push] Értesítés küldési hiba:", e)
        );
    });
}