import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {eq} from "drizzle-orm";
import {db} from "../db";
import {associations, calendarLinks, ldapInfo} from "../db/schema";
import type {CalendarLink} from "#shared/types/calendar";

const CALENDARS_DIR = process.env.CALENDARS_DIR || "/data/calendars";

export async function fetchIcs(url: string): Promise<string | null> {
    try {
        const res = await fetch(url, {signal: AbortSignal.timeout(30_000)});
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
        if (tzidMatch) tzMap.set(tzidMatch[1]!.trim(), tz);
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

/** Writes the merged calendar file for a user. */
async function writeMergedCalendar(userId: number, content: string): Promise<void> {
    const userDir = path.join(CALENDARS_DIR, String(userId));
    await mkdir(userDir, {recursive: true});
    await writeFile(path.join(userDir, "calendar.ics"), content, "utf-8");
}

/** Stores the merged calendar hash, creating the Associations row if the user has none yet. */
async function saveMergedHash(ldapUsername: string, hash: string): Promise<void> {
    await db
        .insert(associations)
        .values({ldapUsername, mergedCalendarHash: hash})
        .onConflictDoUpdate({
            target: associations.ldapUsername,
            set: {mergedCalendarHash: hash},
        });
}

/**
 * Sync a user's calendar: fetch every link, merge, and only write
 * to disk if the merged hash has changed.
 */
export async function syncUserCalendar(
    ldapUsername: string,
    // Not used yet: the worker will pass which links are due.
    _options: {
        forceAll?: boolean;
        syncNeptun?: boolean;
        syncMoodle?: boolean;
        syncExtraUrls?: string[];
    } = {}
): Promise<{ changed: boolean; userId: number } | null> {
    const [user] = await db
        .select()
        .from(ldapInfo)
        .where(eq(ldapInfo.ldapUsername, ldapUsername));
    if (!user) return null;

    // A user who only used the v2 endpoints may not have an Associations row yet.
    const [assoc] = await db
        .select({mergedCalendarHash: associations.mergedCalendarHash})
        .from(associations)
        .where(eq(associations.ldapUsername, ldapUsername));
    const previousHash = assoc?.mergedCalendarHash ?? null;

    const links = await db
        .select()
        .from(calendarLinks)
        .where(eq(calendarLinks.userId, user.id));

    const now = new Date();
    const sources: string[] = [];

    for (const link of links) {
        const ics = await fetchIcs(link.url);
        if (ics) {
            sources.push(ics);
            await db
                .update(calendarLinks)
                .set({lastSyncedAt: now, lastError: null})
                .where(eq(calendarLinks.id, link.id));
        } else {
            await db
                .update(calendarLinks)
                .set({lastError: "Nem sikerült letölteni a naptárat."})
                .where(eq(calendarLinks.id, link.id));
        }
    }

    // Every link failed (e.g. network down): keep the old file instead of wiping all events.
    if (links.length > 0 && sources.length === 0) {
        return {changed: false, userId: user.id};
    }

    // With no links this is an empty calendar, which clears the old events.
    const merged = mergeIcs(sources);
    const newHash = hashContent(merged);
    if (newHash === previousHash) {
        return {changed: false, userId: user.id};
    }

    await writeMergedCalendar(user.id, merged);
    await saveMergedHash(ldapUsername, newHash);
    return {changed: true, userId: user.id};
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
        await syncUserCalendar(ldapUsername, {forceAll: true});
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
        neptunLink?: CalendarLink | null;
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
                // Use undefined instead of null coalescing, so null can override existing values (for deletions).
                neptunLink: payload.neptunLink !== undefined ? payload.neptunLink : existing.neptunLink,
                moodleLink: payload.moodleLink !== undefined ? payload.moodleLink : existing.moodleLink,
                extras: payload.extras !== undefined ? payload.extras : existing.extras,
            })
            .where(eq(associations.ldapUsername, ldapUsername));
    } else {
        await db.insert(associations).values({
            ldapUsername,
            neptunLink: payload.neptunLink ?? null,
            moodleLink: payload.moodleLink ?? null,
            extras: payload.extras ?? [],
        });
    }

    // Trigger an initial sync
    await syncUserCalendar(ldapUsername, {forceAll: true});

    return {ldapUsername, synced: true};
}