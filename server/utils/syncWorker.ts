import { Cron } from "croner";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { associations, calendarLinks, ldapInfo } from "../db/schema";
import { isDue } from "./interval";
import { syncUserCalendar } from "./mergeIcs";
import { createHash } from "node:crypto";

const STAGGER_WINDOW_MS = 30 * 60 * 1000;

function getUserOffset(userId: number): number {
    const hash = createHash("sha256")
        .update(String(userId))
        .digest("hex");
    const numeric = parseInt(hash.slice(0, 8), 16);
    return numeric % STAGGER_WINDOW_MS;
}

async function runUserSyncIfDue(userId: number, ldapUsername: string) {
    const links = await db
        .select({ lastSyncedAt: calendarLinks.lastSyncedAt, syncInterval: calendarLinks.syncInterval })
        .from(calendarLinks)
        .where(eq(calendarLinks.userId, userId));

    const dueCount = links.filter((l) => isDue(l.lastSyncedAt, l.syncInterval)).length;
    if (dueCount === 0) return;

    console.log(`[sync] ${ldapUsername} ${dueCount}/${links.length} links due`);

    try {
        const result = await syncUserCalendar(ldapUsername);
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
            .selectDistinct({ id: ldapInfo.id, ldapUsername: ldapInfo.ldapUsername })
            .from(ldapInfo)
            .innerJoin(calendarLinks, eq(calendarLinks.userId, ldapInfo.id));

        for (const user of users) {
            const offset = getUserOffset(user.id);
            setTimeout(() => {
                runUserSyncIfDue(user.id, user.ldapUsername).catch((e) =>
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
}