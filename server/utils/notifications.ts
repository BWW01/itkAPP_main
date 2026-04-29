import { readFile } from "node:fs/promises";
import path from "node:path";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import ical from "node-ical";
import { db } from "../db";
import { settings, pushSubscriptions } from "../db/schema";

const CALENDARS_DIR = process.env.CALENDARS_DIR || "/data/calendars";

export async function checkAndSendNotifications() {
    console.log(`\n[push-debug] --- Értesítési ciklus indult --- ${new Date().toISOString()}`);

    if (!process.env.NUXT_VAPID_MAILTO || !process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.NUXT_VAPID_PRIVATE_KEY) {
        console.error("[push-debug] HIBA: Hiányoznak a VAPID környezeti változók!");
        return;
    }

    webpush.setVapidDetails(
        process.env.NUXT_VAPID_MAILTO,
        process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.NUXT_VAPID_PRIVATE_KEY
    );

    const userSettings = await db.select().from(settings);
    console.log(`[push-debug] Felhasználói beállítások (Settings tábla) száma: ${userSettings.length}`);

    if (userSettings.length === 0) {
        console.log("[push-debug] Nincs kinek értesítést küldeni (üres a Settings tábla).");
        return;
    }

    const now = new Date();
    const oneMinuteLater = new Date(now.getTime() + 60000);

    for (const userSetting of userSettings) {
        const userId = userSetting.userId;
        const notifTimeMinutes = userSetting.notificationTime;

        const targetStartTime = new Date(now.getTime() + notifTimeMinutes * 60000);
        const targetEndTime = new Date(oneMinuteLater.getTime() + notifTimeMinutes * 60000);

        console.log(`[push-debug] User ID: ${userId} | Kért előzetes értesítés: ${notifTimeMinutes} perc`);
        console.log(`[push-debug] User ID: ${userId} | Keresett esemény kezdés: ${targetStartTime.toISOString()} és ${targetEndTime.toISOString()} között`);

        try {
            const filePath = path.join(CALENDARS_DIR, String(userId), "calendar.ics");
            const icsData = await readFile(filePath, "utf-8");
            console.log(`[push-debug] User ID: ${userId} | Naptár fájl sikeresen beolvasva.`);

            const events = ical.sync.parseICS(icsData);
            let eventCount = 0;
            let nearbyEventFound = false;

            for (const event of Object.values(events)) {
                if (event.type !== 'VEVENT') continue;
                eventCount++;

                let shouldNotify = false;

                // Debug: Írjuk ki, ha van olyan esemény, ami a következő 3 órában kezdődik, hogy lássuk az időzónákat!
                if (event.start) {
                    const start = event.start as Date;
                    const diffHours = (start.getTime() - now.getTime()) / (1000 * 60 * 60);

                    if (diffHours >= 0 && diffHours <= 3) {
                        console.log(`[push-debug] User ID: ${userId} | Közeli esemény: "${event.summary}" | Start (Parsolt): ${start.toISOString()} | RRULE: ${!!event.rrule}`);
                        nearbyEventFound = true;
                    }
                }

                if (event.start && !event.rrule) {
                    const start = event.start as Date;
                    if (start >= targetStartTime && start < targetEndTime) {
                        shouldNotify = true;
                        console.log(`[push-debug] User ID: ${userId} | Sima esemény egyezés: ${event.summary}`);
                    }
                }
                else if (event.rrule) {
                    const occurrences = event.rrule.between(targetStartTime, targetEndTime);
                    if (occurrences.length > 0) {
                        shouldNotify = true;
                        console.log(`[push-debug] User ID: ${userId} | Ismétlődő (RRULE) esemény egyezés: ${event.summary}`);
                    }
                }

                if (shouldNotify) {
                    console.log(`[push-debug] User ID: ${userId} | !!! ÉRTESÍTÉSI FELTÉTEL TELJESÜLT !!! -> ${event.summary}`);

                    const subs = await db
                        .select()
                        .from(pushSubscriptions)
                        .where(eq(pushSubscriptions.userId, userId));

                    console.log(`[push-debug] User ID: ${userId} | Talált feliratkozások száma (eszközök): ${subs.length}`);

                    const payload = JSON.stringify({
                        title: `Hamarosan kezdődik: ${event.summary || 'Esemény'}`,
                        body: `Az esemény ${notifTimeMinutes} perc múlva megkezdődik.`,
                        url: "/",
                    });

                    await Promise.allSettled(
                        subs.map((sub) =>
                            webpush.sendNotification(
                                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                                payload
                            ).catch(e => console.error(`[push-debug] User ID: ${userId} | Küldési hiba az egyik eszközre:`, e.message))
                        )
                    );
                }
            }

            console.log(`[push-debug] User ID: ${userId} | Feldolgozott VEVENT-ek száma: ${eventCount}`);
            if (!nearbyEventFound) {
                console.log(`[push-debug] User ID: ${userId} | Nincs esemény a következő 3 órában.`);
            }

        } catch (e: any) {
            console.error(`[push-debug] User ID: ${userId} | Fájl olvasási hiba:`, e.message);
        }
    }
}