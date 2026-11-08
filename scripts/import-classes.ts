import {readFile} from "node:fs/promises";
import {parseArgs} from "node:util";
import {and, gte, inArray, lt, notInArray, sql} from "drizzle-orm";
import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema";
import {classSessions} from "../server/db/schema";
import {classesFileSchema} from "../server/utils/kioskClasses";

const BATCH_SIZE = 500;
async function main() {
    const {values, positionals} = parseArgs({
        allowPositionals: true,
        options: {
            "dry-run": {type: "boolean", default: false},
        },
    });

    const path = positionals[0];
    if (!path || positionals.length > 1) {
        console.error("Használat: bun scripts/import-classes.ts <classes.json> [--dry-run]");
        process.exit(1);
    }

    const parsed = classesFileSchema.safeParse(JSON.parse(await readFile(path, "utf8")));
    if (!parsed.success) {
        const issues = parsed.error.issues
            .slice(0, 20)
            .map((i) => `${i.path.join(".") || "(gyökér)"}: ${i.message}`);
        throw new Error(`Hibás órarend-fájl:\n  - ${issues.join("\n  - ")}`);
    }

    const classes = parsed.data.classes;
    const ids = classes.map((c) => c.id);
    if (new Set(ids).size !== ids.length) {
        throw new Error("Az órarend-fájlban duplikált azonosító van.");
    }

    const from = new Date(Math.min(...classes.map((c) => Date.parse(c.start))));
    const to = new Date(Math.max(...classes.map((c) => Date.parse(c.end))));
    const rooms = [...new Set(classes.map((c) => c.room))].sort();

    console.log(`${classes.length} óra, ${rooms.length} terem: ${rooms.join(", ")}`);
    console.log(`Időszak: ${from.toISOString()} – ${to.toISOString()}`);

    if (values["dry-run"]) {
        console.log("\n--dry-run: az adatbázis nem változott.");
        return;
    }

    if (!process.env.DATABASE_URL) throw new Error("Nincs beállítva a DATABASE_URL.");
    const client = postgres(process.env.DATABASE_URL);
    try {
        const db = drizzle(client, {schema});
        const rows = classes.map((c) => ({
            id: c.id,
            room: c.room,
            subject: c.subject,
            kind: c.kind,
            startsAt: new Date(c.start),
            endsAt: new Date(c.end),
            groups: c.groups,
            instructors: c.instructors,
            capacity: c.capacity ?? null,
            subjectCode: c.subjectCode ?? null,
        }));

        const removed = await db.transaction(async (tx) => {
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                await tx
                    .insert(classSessions)
                    .values(rows.slice(i, i + BATCH_SIZE))
                    .onConflictDoUpdate({
                        target: classSessions.id,
                        set: {
                            room: sql`excluded."room"`,
                            subject: sql`excluded."subject"`,
                            kind: sql`excluded."kind"`,
                            startsAt: sql`excluded."startsAt"`,
                            endsAt: sql`excluded."endsAt"`,
                            groups: sql`excluded."groups"`,
                            instructors: sql`excluded."instructors"`,
                            capacity: sql`excluded."capacity"`,
                            subjectCode: sql`excluded."subjectCode"`,
                            importedAt: sql`now()`,
                        },
                    });
            }
            return tx
                .delete(classSessions)
                .where(and(
                    inArray(classSessions.room, rooms),
                    gte(classSessions.startsAt, from),
                    lt(classSessions.startsAt, to),
                    notInArray(classSessions.id, ids),
                ))
                .returning({id: classSessions.id});
        });

        console.log(`\nImportálva: ${rows.length} óra. Törölve (már nincs a fájlban): ${removed.length}`);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});