import {readFileSync, writeFileSync} from "node:fs";
import {
    collapseWhitespace,
    extractYoutubeId,
    normalizeSubject,
    parseSemester,
    repairHungarian,
} from "../server/utils/onlineVideos";

export interface VideoRow {
    legacyId: number;
    semester: string;
    semesterOrder: number;
    subject: string;
    title: string;
    uploader: string | null;
    url: string;
    youtubeId: string | null;
}

export function decodeCsv(buf: Uint8Array): string {
    const utf8 = new TextDecoder("utf-8", {fatal: false}).decode(buf);
    if (!utf8.includes("\uFFFD")) return utf8.replace(/^\uFEFF/, "");
    return new TextDecoder("windows-1252").decode(buf);
}

export function parseDelimited(text: string, delimiter = ";"): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i]!;
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else quoted = false;
            } else field += c;
        } else if (c === '"' && field === "") quoted = true;
        else if (c === delimiter) {
            row.push(field);
            field = "";
        } else if (c === "\n" || c === "\r") {
            if (c === "\r" && text[i + 1] === "\n") i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else field += c;
    }
    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

function isHttpUrl(url: string): boolean {
    if (/\s/.test(url)) return false;
    try {
        return ["http:", "https:"].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

export function toVideoRows(table: string[][]): {rows: VideoRow[]; skipped: string[]} {
    const rows: VideoRow[] = [];
    const skipped: string[] = [];
    const seen = new Set<number>();
    const hasHeader = !/^\d+$/.test(table[0]?.[0]?.trim() ?? "");
    const body = hasHeader ? table.slice(1) : table;

    body.forEach((cols, i) => {
        const line = i + (hasHeader ? 2 : 1);
        const [idRaw, semRaw, subjRaw, titleRaw, uploaderRaw, urlRaw] = cols.map((c) => c ?? "");
        const legacyId = Number.parseInt(idRaw!.trim(), 10);
        const sem = parseSemester(repairHungarian(semRaw!.trim()));
        const url = urlRaw!.trim();
        const title = collapseWhitespace(repairHungarian(titleRaw!));
        const subject = normalizeSubject(subjRaw!);

        if (!Number.isInteger(legacyId)) return skipped.push(`${line}. sor: hibás azonosító "${idRaw}"`);
        if (seen.has(legacyId)) return skipped.push(`${line}. sor: duplikált azonosító ${legacyId}`);
        if (!sem) return skipped.push(`${line}. sor: ismeretlen félév "${semRaw}"`);
        if (!subject || !title) return skipped.push(`${line}. sor: hiányzó tárgy vagy cím`);
        if (!isHttpUrl(url)) return skipped.push(`${line}. sor: hibás URL "${url}"`);

        seen.add(legacyId);
        const uploader = collapseWhitespace(repairHungarian(uploaderRaw!));
        rows.push({
            legacyId,
            semester: sem.key,
            semesterOrder: sem.order,
            subject,
            title,
            uploader: uploader || null,
            url,
            youtubeId: extractYoutubeId(url),
        });
    });
    return {rows, skipped};
}


function sqlString(v: string | null): string {
    return v === null ? "NULL" : `'${v.replace(/'/g, "''")}'`;
}

export function toInsertSql(rows: VideoRow[], chunk = 200): string {
    const cols = `"legacyId", "semester", "semesterOrder", "subject", "title", "uploader", "url", "youtubeId"`;
    const parts: string[] = [];
    for (let i = 0; i < rows.length; i += chunk) {
        const values = rows
            .slice(i, i + chunk)
            .map((r) =>
                `(${r.legacyId}, ${sqlString(r.semester)}, ${r.semesterOrder}, ${sqlString(r.subject)}, ` +
                `${sqlString(r.title)}, ${sqlString(r.uploader)}, ${sqlString(r.url)}, ${sqlString(r.youtubeId)})`
            )
            .join(",\n");
        parts.push(
            `INSERT INTO "OnlineVideos" (${cols}) VALUES\n${values}\n` +
            `ON CONFLICT ("legacyId") DO UPDATE SET "semester" = EXCLUDED."semester", ` +
            `"semesterOrder" = EXCLUDED."semesterOrder", "subject" = EXCLUDED."subject", ` +
            `"title" = EXCLUDED."title", "uploader" = EXCLUDED."uploader", "url" = EXCLUDED."url", ` +
            `"youtubeId" = EXCLUDED."youtubeId", "updatedAt" = now();`
        );
    }
    return parts.join("\n--> statement-breakpoint\n");
}


async function upsert(rows: VideoRow[]) {
    const {drizzle} = await import("drizzle-orm/postgres-js");
    const {sql} = await import("drizzle-orm");
    const postgres = (await import("postgres")).default;
    const {onlineVideos} = await import("../server/db/schema");

    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nincs beállítva.");
    const client = postgres(process.env.DATABASE_URL, {max: 1});
    const db = drizzle(client);
    try {
        for (let i = 0; i < rows.length; i += 500) {
            await db
                .insert(onlineVideos)
                .values(rows.slice(i, i + 500))
                .onConflictDoUpdate({
                    target: onlineVideos.legacyId,
                    set: {
                        semester: sql`excluded."semester"`,
                        semesterOrder: sql`excluded."semesterOrder"`,
                        subject: sql`excluded."subject"`,
                        title: sql`excluded."title"`,
                        uploader: sql`excluded."uploader"`,
                        url: sql`excluded."url"`,
                        youtubeId: sql`excluded."youtubeId"`,
                        updatedAt: sql`now()`,
                    },
                });
        }
    } finally {
        await client.end();
    }
}

async function main() {
    const args = process.argv.slice(2);
    const file = args.find((a) => !a.startsWith("--"));
    if (!file) {
        console.error("Használat: bun scripts/import-online-videos.ts <file.csv> [--dry-run | --sql <out.sql>]");
        process.exit(1);
    }
    const sqlIdx = args.indexOf("--sql");
    const sqlOut = sqlIdx !== -1 ? args[sqlIdx + 1] : undefined;

    const {rows, skipped} = toVideoRows(parseDelimited(decodeCsv(readFileSync(file))));
    skipped.forEach((s) => console.warn(`⚠️  ${s}`));

    const semesters = new Set(rows.map((r) => r.semester));
    const subjects = new Set(rows.map((r) => r.subject));
    console.log(`${rows.length} videó, ${semesters.size} félév, ${subjects.size} tárgy (${skipped.length} sor kihagyva)`);

    if (args.includes("--dry-run")) return;
    if (sqlOut) {
        writeFileSync(sqlOut, toInsertSql(rows) + "\n");
        console.log(`✅ SQL kiírva: ${sqlOut}`);
        return;
    }
    await upsert(rows);
    console.log("✅ Import kész");
}

if (import.meta.main ?? process.argv[1]?.endsWith("import-online-videos.ts")) {
    await main();
}