/**
 * One-off: copy Neptun and Moodle links from Associations into CalendarLinks.
 *
 *   npx tsx scripts/migrateCalendarLinks.ts --dry-run   # only prints what it would do
 *   npx tsx scripts/migrateCalendarLinks.ts             # writes
 *
 * Safe to run more than once: existing (userId, url) pairs are skipped.
 * Take a pg_dump before running it without --dry-run.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { associations, calendarLinks, ldapInfo } from "../server/db/schema";

const VALID_INTERVALS = new Set(["1h", "6h", "1d"]);
const dryRun = process.argv.includes("--dry-run");

/** The CHECK constraint only allows 1h / 6h / 1d, anything else falls back to daily. */
function normalizeInterval(value: string | undefined): string {
    return value && VALID_INTERVALS.has(value) ? value : "1d";
}

/** The url contains a private token, so only the host is logged. */
function hostOf(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return "(invalid url)";
    }
}

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

try {
    const rows = await db
        .select({
            userId: ldapInfo.id,
            ldapUsername: associations.ldapUsername,
            neptunLink: associations.neptunLink,
            moodleLink: associations.moodleLink,
            neptunLastSyncedAt: associations.neptunLastSyncedAt,
            moodleLastSyncedAt: associations.moodleLastSyncedAt,
        })
        .from(associations)
        .innerJoin(ldapInfo, eq(ldapInfo.ldapUsername, associations.ldapUsername));

    const links = rows.flatMap((row) => {
        const result: (typeof calendarLinks.$inferInsert)[] = [];
        if (row.neptunLink?.url) {
            result.push({
                userId: row.userId,
                name: "Neptun",
                url: row.neptunLink.url,
                syncInterval: normalizeInterval(row.neptunLink.syncInterval),
                lastSyncedAt: row.neptunLastSyncedAt,
            });
        }
        if (row.moodleLink?.url) {
            result.push({
                userId: row.userId,
                name: "Moodle",
                url: row.moodleLink.url,
                syncInterval: normalizeInterval(row.moodleLink.syncInterval),
                lastSyncedAt: row.moodleLastSyncedAt,
            });
        }
        return result;
    });

    console.log(`${rows.length} users, ${links.length} links to migrate`);

    if (dryRun) {
        for (const link of links) {
            console.log(`  user ${link.userId}: ${link.name} (${hostOf(link.url)}), ${link.syncInterval}`);
        }
        console.log("Dry run, nothing written.");
    } else if (links.length === 0) {
        console.log("Nothing to migrate.");
    } else {
        const inserted = await db.transaction((tx) =>
            tx
                .insert(calendarLinks)
                .values(links)
                .onConflictDoNothing()
                .returning({ id: calendarLinks.id })
        );
        console.log(`✅ ${inserted.length} inserted, ${links.length - inserted.length} already existed`);
    }
} finally {
    await client.end();
}
