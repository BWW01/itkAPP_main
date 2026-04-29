import { readFile } from "node:fs/promises";
import path from "node:path";
import webpush from "web-push";
import { eq } from "drizzle-orm";
import ical from "node-ical";
import { db } from "../db";
import { settings, pushSubscriptions } from "../db/schema";

const CALENDARS_DIR = process.env.CALENDARS_DIR || "/data/calendars";

export async function checkAndSendNotifications() {
    // Web-push beállítása a környezeti változók alapján
    // (Mivel ez worker, előfordulhat, hogy a useRuntimeConfig() nem elérhető,
    // így érdemes a process.env-ből beolvasni a kulcsokat)
    webpush.setVapidDetails(
        process.env.VAPID_MAILTO!,
        process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
    );

    // 1. Lekérjük azokat a felhasználókat, akiknek van beállítva értesítési ideje
    const userSettings = await db.select().from(settings);

    // A cron percenként fut, ezért egy 1 perces ablakot nézünk
    const now = new Date();
    const oneMinuteLater = new Date(now.getTime() + 60000);

    for (const userSetting of userSettings) {
        const userId = userSetting.userId;
        const notifTimeMinutes = userSetting.notificationTime;

        // Kiszámoljuk, mikor kellene kezdődnie annak az eseménynek,
        // amiről MOST kell értesítést küldeni
        const targetStartTime = new Date(now.getTime() + notifTimeMinutes * 60000);
        const targetEndTime = new Date(oneMinuteLater.getTime() + notifTimeMinutes * 60000);

        try {
            const filePath = path.join(CALENDARS_DIR, String(userId), "calendar.ics");
            const icsData = await readFile(filePath, "utf-8");
            const events = ical.sync.parseICS(icsData);

            for (const event of Object.values(events)) {
                if (event.type !== 'VEVENT') continue;

                let shouldNotify = false;

                // 1. ESET: Egyszeri esemény
                if (event.start && !event.rrule) {
                    const start = event.start as Date;
                    // Megnézzük, hogy a kezdés beleesik-e a most vizsgált 1 perces ablakba
                    if (start >= targetStartTime && start < targetEndTime) {
                        shouldNotify = true;
                    }
                }
                // 2. ESET: Ismétlődő esemény (RRULE)
                else if (event.rrule) {
                    // A node-ical .between() függvénye visszaadja az előfordulásokat az adott időablakban
                    const occurrences = event.rrule.between(targetStartTime, targetEndTime);
                    if (occurrences.length > 0) {
                        shouldNotify = true;
                    }
                }

                if (shouldNotify) {
                    const subs = await db
                        .select()
                        .from(pushSubscriptions)
                        .where(eq(pushSubscriptions.userId, userId));

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
                            )
                        )
                    );
                    console.log(`[push] Értesítés kiküldve: ${userId} - ${event.summary}`);
                }
            }
        } catch (e: any) {
            if (e.code !== 'ENOENT') {
                console.error(`[push] Hiba a ${userId} naptárának feldolgozásakor:`, e);
            }
        }
    }
}