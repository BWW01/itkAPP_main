import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema";
import { readSheetRows } from "../server/db/import/readSheet";
import { CurriculumParseError, parseCurriculumSheet } from "../server/db/import/parseCurriculumSheet";
import { importCurriculum } from "../server/db/import/importCurriculum";
import type { CurriculumFile } from "../server/db/import/curriculumFile";

const overridesSchema = z.object({
    code: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    major: z.string().trim().min(1).optional(),
    sheet: z.string().trim().min(1).optional(),
    requiredCount: z.record(z.string(), z.number().int().positive()).optional(),
}).strict();
type Overrides = z.infer<typeof overridesSchema>;

const TYPE_LABEL = { MANDATORY: "Kötelező", ELECTIVE: "Köt. vál.", FREE_ELECTIVE: "Szabadon vál." } as const;

async function readOverrides(path: string): Promise<Overrides> {
    let text: string;
    try {
        text = await readFile(path, "utf8");
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
        throw e;
    }
    const parsed = overridesSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "(gyökér)"}: ${i.message}`);
        throw new Error(`Hibás ${path}:\n  - ${issues.join("\n  - ")}`);
    }
    return parsed.data;
}

function printSummary(file: CurriculumFile) {
    console.log(`\n${file.code} – ${file.name}`);
    console.log(`Szak: ${file.major} | összesen ${file.totalCreditsRequired} kredit\n`);
    for (const g of file.groups) {
        const spec = g.isSpecialization ? "  [specializáció]" : "";
        console.log(`  ${g.name} – ${g.requiredCredits} kr${spec}`);
        for (const s of g.subgroups) {
            const count = s.requiredCount ? `, legalább ${s.requiredCount} tárgy` : "";
            console.log(`      ${TYPE_LABEL[s.type].padEnd(13)} ${s.name} – ${s.requiredCredits} kr (${s.subjects.length} tárgy${count})`);
        }
    }
}

async function main() {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            code: { type: "string" },
            sheet: { type: "string" },
            "dry-run": { type: "boolean", default: false },
        },
    });

    const path = positionals[0];
    if (!path || positionals.length > 1) {
        console.error("Használat: bun scripts/import-curriculum.ts <tanterv.xls> [--code KÓD] [--sheet LAP] [--dry-run]");
        process.exit(1);
    }

    const stem = basename(path, extname(path));
    const overridesPath = join(dirname(path), `${stem}.overrides.json`);
    const overrides = await readOverrides(overridesPath);

    const rows = readSheetRows(new Uint8Array(await readFile(path)), path, values.sheet ?? overrides.sheet);
    const { file, warnings, skippedFinalExams } = parseCurriculumSheet(rows, {
        code: values.code ?? overrides.code ?? stem,
        name: overrides.name,
        major: overrides.major,
        requiredCount: overrides.requiredCount,
    });

    printSummary(file);
    if (skippedFinalExams.length > 0) {
        console.log(`\nKihagyott záróvizsga-tárgyak (nem feltételei az abszolutóriumnak): ${skippedFinalExams.join(", ")}`);
    }
    if (warnings.length > 0) {
        console.log(`\nFigyelmeztetések (${warnings.length}):`);
        for (const w of warnings) console.log(`   - ${w}`);
    }

    if (values["dry-run"]) {
        console.log("\n--dry-run: az adatbázis nem változott.");
        return;
    }

    if (!process.env.DATABASE_URL) throw new Error("Nincs beállítva a DATABASE_URL.");
    const client = postgres(process.env.DATABASE_URL);
    try {
        const db = drizzle(client, { schema });
        const r = await importCurriculum(db, file);
        console.log(`\n Importálva ${r.curriculumId}: ${r.groups} csoport, ${r.subgroups} tárgycsoport, ${r.subjectLinks} tárgybesorolás`);
        if (r.removedGroups.length > 0) console.log(`   Törölt csoportok: ${r.removedGroups.join(", ")}`);
        if (r.removedSubgroups.length > 0) console.log(`   Törölt tárgycsoportok: ${r.removedSubgroups.join(", ")}`);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e instanceof CurriculumParseError ? ` ${e.message}` : e);
    process.exit(1);
});