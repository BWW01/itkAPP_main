import { db } from "../db";
import { associations, ldapInfo } from "../db/schema";
import { eq } from "drizzle-orm";

export const upsertLinks = async (username: string, links: string[]) => {
    // Ensure ldapInfo row exists
    await db
        .insert(ldapInfo)
        .values({
            ldapUsername: username,
            familyName: "Pending",
            givenName: "Sync",
        })
        .onConflictDoNothing({ target: ldapInfo.ldapUsername });

    // Upsert associations
    return await db
        .insert(associations)
        .values({ ldapUsername: username, links })
        .onConflictDoUpdate({
            target: associations.ldapUsername,
            set: { links },
        });
};

export const getMergedCalendar = async (
    username: string
): Promise<string | null> => {
    const record = await db.query.associations.findFirst({
        where: eq(associations.ldapUsername, username),
    });

    if (!record || !record.links || record.links.length === 0) {
        return null;
    }

    const responses = await Promise.allSettled(
        record.links.map((url) => $fetch<string>(url))
    );

    const calendars = responses
        .filter(
            (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
        )
        .map((r) => r.value);

    if (calendars.length === 0) return null;

    return mergeIcsContents(calendars);
};

function mergeIcsContents(calendars: string[]): string {
    const events: string[] = [];

    for (const cal of calendars) {
        // Normalize and clean as discussed previously
        const matches = cal.replace(/\r\n/g, "\n").match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g);
        if (matches) {
            events.push(...matches.map(e => e.split("\n").filter(l => l.trim()).join("\r\n")));
        }
    }

    const content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//itkapp//merged//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        ...events,
        "END:VCALENDAR",
    ].join("\r\n");

    // Prepend the UTF-8 BOM character (\uFEFF)
    return "\uFEFF" + content;
}