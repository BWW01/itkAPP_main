import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { associations, ldapInfo, type CalendarLink } from "../db/schema";

const CALENDARS_DIR = process.env.CALENDARS_DIR || "/data/calendars";

export async function fetchIcs(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) {
            console.error(`Failed to fetch ${url}: ${res.status}`);
            return null;
        }
        return await res.text();
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
}

/**
 * Extract VEVENT blocks from an ICS file.
 */
function extractEvents(ics: string): string[] {
    const events: string[] = [];
    const regex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
    const matches = ics.match(regex);
    if (matches) events.push(...matches);
    return events;
}

/**
 * Extract VTIMEZONE blocks (dedupe by TZID).
 */
function extractTimezones(ics: string): Map<string, string> {
    const tzMap = new Map<string, string>();
    const regex = /BEGIN:VTIMEZONE[\s\S]*?END:VTIMEZONE/g;
    const matches = ics.match(regex) || [];
    for (const tz of matches) {
        const tzidMatch = tz.match(/TZID:(.+)/);
        if (tzidMatch) tzMap.set(tzidMatch[1].trim(), tz);
    }
    return tzMap;
}

export function mergeIcs(sources: string[]): string {
    const allEvents: string[] = [];
    const timezones = new Map<string, string>();

    for (const src of sources) {
        if (!src) continue;
        allEvents.push(...extractEvents(src));
        for (const [tzid, tz] of extractTimezones(src)) {
            if (!timezones.has(tzid)) timezones.set(tzid, tz);
        }
    }

    const header = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//MergedCalendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ].join("\r\n");

    const body = [...timezones.values(), ...allEvents].join("\r\n");
    return [header, body, "END:VCALENDAR"].join("\r\n");
}

export function hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}

/**
 * Sync a user's calendar: fetch enabled sources, merge, and only write
 * to disk if the merged hash has changed.
 */
export async function syncUserCalendar(
    ldapUsername: string,
    options: {
        forceAll?: boolean;
        syncNeptune?: boolean;
        syncMoodle?: boolean;
        syncExtraUrls?: string[];
    } = {}
): Promise<{ changed: boolean; userId: number } | null> {
    const [user] = await db
        .select()
        .from(ldapInfo)
        .where(eq(ldapInfo.ldapUsername, ldapUsername));
    if (!user) return null;

    const [assoc] = await db
        .select()
        .from(associations)
        .where(eq(associations.ldapUsername, ldapUsername));
    if (!assoc) return null;

    const sources: string[] = [];
    const now = new Date();
    const updates: Partial<typeof associations.$inferInsert> = {};
    const extrasLastSynced = { ...(assoc.extrasLastSyncedAt || {}) };

    // Neptune
    if (assoc.neptuneLink?.url) {
        if (options.forceAll || options.syncNeptune) {
            const ics = await fetchIcs(assoc.neptuneLink.url);
            if (ics) {
                sources.push(ics);
                updates.neptuneLastSyncedAt = now;
            } else {
                // Fallback: use cached merged file's events? Skip this source.
            }
        }
    }

    // Moodle
    if (assoc.moodleLink?.url) {
        if (options.forceAll || options.syncMoodle) {
            const ics = await fetchIcs(assoc.moodleLink.url);
            if (ics) {
                sources.push(ics);
                updates.moodleLastSyncedAt = now;
            }
        }
    }

    // Extras
    for (const extra of assoc.extras || []) {
        const shouldSync =
            options.forceAll || options.syncExtraUrls?.includes(extra.url);
        if (!shouldSync) continue;
        const ics = await fetchIcs(extra.url);
        if (ics) {
            sources.push(ics);
            extrasLastSynced[extra.url] = now.toISOString();
        }
    }

    // If no sources were fetched this run, but file exists, nothing to do.
    if (sources.length === 0) {
        return { changed: false, userId: user.id };
    }

    // For proper merge we need *all* current sources, not just the ones we
    // just synced. Re-fetch the rest from disk cache if we can, or re-fetch.
    // Simpler approach: always fetch all configured sources when merging.
    // Override: fetch any missing sources now to ensure a complete merge.
    const allSources: string[] = [];
    if (assoc.neptuneLink?.url) {
        const ics =
            updates.neptuneLastSyncedAt
                ? sources.shift() // already fetched
                : await fetchIcs(assoc.neptuneLink.url);
        if (ics) allSources.push(ics);
    }
    if (assoc.moodleLink?.url) {
        const ics =
            updates.moodleLastSyncedAt
                ? sources.shift()
                : await fetchIcs(assoc.moodleLink.url);
        if (ics) allSources.push(ics);
    }
    for (const extra of assoc.extras || []) {
        if (extrasLastSynced[extra.url] === now.toISOString()) {
            const ics = sources.shift();
            if (ics) allSources.push(ics);
        } else {
            const ics = await fetchIcs(extra.url);
            if (ics) allSources.push(ics);
        }
    }

    const merged = mergeIcs(allSources);
    const newHash = hashContent(merged);

    let changed = false;
    if (newHash !== assoc.mergedCalendarHash) {
        const userDir = path.join(CALENDARS_DIR, String(user.id));
        await mkdir(userDir, { recursive: true });
        const filePath = path.join(userDir, "calendar.ics");
        await writeFile(filePath, merged, "utf-8");
        updates.mergedCalendarHash = newHash;
        changed = true;
    }

    updates.extrasLastSyncedAt = extrasLastSynced;

    await db
        .update(associations)
        .set(updates)
        .where(eq(associations.ldapUsername, ldapUsername));

    return { changed, userId: user.id };
}

/**
 * Read merged calendar for a user from disk.
 */
export async function getMergedCalendar(
    ldapUsername: string
): Promise<string | null> {
    const [user] = await db
        .select()
        .from(ldapInfo)
        .where(eq(ldapInfo.ldapUsername, ldapUsername));
    if (!user) return null;

    try {
        const filePath = path.join(
            CALENDARS_DIR,
            String(user.id),
            "calendar.ics"
        );
        return await readFile(filePath, "utf-8");
    } catch {
        // File not yet generated: trigger a sync
        await syncUserCalendar(ldapUsername, { forceAll: true });
        try {
            const filePath = path.join(
                CALENDARS_DIR,
                String(user.id),
                "calendar.ics"
            );
            return await readFile(filePath, "utf-8");
        } catch {
            return null;
        }
    }
}

/**
 * Upsert links (used by your existing endpoint).
 */
export async function upsertLinks(
    ldapUsername: string,
    payload: {
        neptuneLink?: CalendarLink | null;
        moodleLink?: CalendarLink | null;
        extras?: CalendarLink[];
    }
) {
    const [existing] = await db
        .select()
        .from(associations)
        .where(eq(associations.ldapUsername, ldapUsername));

    if (existing) {
        await db
            .update(associations)
            .set({
                neptuneLink: payload.neptuneLink ?? existing.neptuneLink,
                moodleLink: payload.moodleLink ?? existing.moodleLink,
                extras: payload.extras ?? existing.extras,
            })
            .where(eq(associations.ldapUsername, ldapUsername));
    } else {
        await db.insert(associations).values({
            ldapUsername,
            neptuneLink: payload.neptuneLink ?? null,
            moodleLink: payload.moodleLink ?? null,
            extras: payload.extras ?? [],
        });
    }

    // Trigger an initial sync
    await syncUserCalendar(ldapUsername, { forceAll: true });

    return { ldapUsername, synced: true };
}