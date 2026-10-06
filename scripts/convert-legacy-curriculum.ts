// Régi, nyomtatható mintatanterv (pl. MI-BSc_tanterv_2023.xlsx) → Neptun-export formátum,
// amit az import-curriculum szkript és az admin-feltöltő beolvas.
//
// Használat:
//   bun scripts/convert-legacy-curriculum.ts <régi.xlsx> [--out <új.xlsx>] [--sheet <lap>]
//       [--group-credits '{"Szabadon választható tárgyak": 11}']
import { readFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { parseArgs } from "node:util";
import * as XLSX from "xlsx";

type SubgroupType = "MANDATORY" | "ELECTIVE" | "FREE_ELECTIVE";
type Flag = "MANDATORY" | "OPTIONAL" | "CRITERION";
type GroupKind = "normal" | "specialization" | "free" | "criterion";
type RowKind = "empty" | "summary" | "subject" | "heading" | "other";

interface Subject {
    code: string;
    name: string;
    credits: number;
    requirement: string | null;
    semester: number | null;
    prerequisites: string | null;
}

interface Subgroup {
    name: string | null;
    type: SubgroupType;
    requiredCredits: number;
    subjects: Subject[];
}

interface Group {
    name: string;
    requiredCredits: number;
    subgroups: Subgroup[];
}

interface ModuleAcc {
    name: string | null;
    subjects: { subject: Subject; flag: Flag }[];
    codes: Set<string>;
}

interface GroupAcc {
    name: string;
    kind: GroupKind;
    statedCredits: number | null;
    modules: Map<string, ModuleAcc>;
}

const REQUIREMENT_LABELS: Record<string, string> = {
    k: "Kollokvium",
    gy: "Gyakorlati jegy",
    a: "Aláírás megszerzése",
    zv: "Záróvizsga",
    besz3: "Beszámoló (háromfokozatú)",
    besz: "Beszámoló",
};

const FLAGS: Record<string, Flag> = { "igen": "MANDATORY", "nem": "OPTIONAL", "(igen)": "CRITERION" };
const SUMMARY_PREFIXES = ["kötelező kredit", "választható kredit", "kötelezően választható kredit", "összes "];

const TYPE_LABEL: Record<SubgroupType, string> = {
    MANDATORY: "Kötelező",
    ELECTIVE: "Kötelezően választható",
    FREE_ELECTIVE: "Szabadon választható",
};
const TYPE_TITLE: Record<SubgroupType, string> = {
    MANDATORY: "Kötelező tárgyak",
    ELECTIVE: "Kötelezően választható tárgyak",
    FREE_ELECTIVE: "Szabadon választható tárgyak",
};

const NEPTUN_HEADER = [
    "Tárgykód", "Tárgynév", "Angol tárgynév", "Előkövetelmény", "Párhuzamos követelmény", "Tárgy kredit",
    "Tárgykövetelmény", "Félév szám", "Tárgyfelvétel típusa", "Mintatanterv csoport",
    "Teljesítendő kreditek a mintatanterv csoportban", "Elvégzendő tárgycsoportok száma",
    "Modul, sáv, specializáció elnevezése 1.", "Teljesítendő kreditek a tárgycsoportban 1.", "Megjegyzés",
];

const norm = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const key = (s: string | undefined) => norm(s).toLowerCase();
const toInt = (s: string | undefined) => (/^\d+$/.test(norm(s)) ? Number(norm(s)) : null);
const creditsIn = (text: string) => {
    const m = /(\d+)\s*kredit/i.exec(text);
    return m ? Number(m[1]) : null;
};

function readRows(path: string, sheetName?: string): string[][] {
    const wb = XLSX.read(readFileSync(path), { type: "buffer" });
    const name = sheetName ?? wb.SheetNames[0];
    const sheet = name ? wb.Sheets[name] : undefined;
    if (!sheet) throw new Error(`Nincs ilyen munkalap: "${name}" (elérhető: ${wb.SheetNames.join(", ")})`);
    return XLSX.utils
        .sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false, blankrows: true })
        .map((r) => r.map((c) => String(c ?? "")));
}

function groupNameOf(text: string): string {
    const firstLine = text.split(/\r?\n/)[0] ?? "";
    return norm(firstLine.replace(/\(.*?\)/g, "").replace(/:.*$/, "").replace(/^[A-ZÁÉÍÓÖŐÚÜŰ]\.\s+/, ""));
}

function kindOf(name: string): GroupKind {
    const k = key(name);
    if (k.includes("specializáció")) return "specialization";
    if (k.startsWith("szabadon")) return "free";
    if (k.startsWith("kritérium")) return "criterion";
    return "normal";
}

function convert(rows: string[][], groupCredits: Record<string, number>) {
    const errors: string[] = [];
    const warnings: string[] = [];
    const skippedFinalExams: string[] = [];

    const headerIdx = rows.findIndex((r) => {
        const k = r.map((c) => key(c));
        return k.includes("kötelező") && k.includes("tantárgy") && k.includes("kredit") && k.includes("tárgykód");
    });
    if (headerIdx < 0) throw new Error('Nem található a "kötelező / Tantárgy / Kredit / Tárgykód" fejlécsor – ez nem a régi formátum.');

    const header = rows[headerIdx]!.map((c) => key(c));
    const col = {
        flag: header.indexOf("kötelező"),
        name: header.indexOf("tantárgy"),
        requirement: header.findIndex((h) => h.startsWith("köv")),
        credits: header.indexOf("kredit"),
        code: header.indexOf("tárgykód"),
        prerequisites: header.findIndex((h) => h.startsWith("előfeltétel")),
    };
    const semesterCodeCol = col.flag + 1;
    const semesterCols = header
        .map((h, index) => ({ h, index }))
        .filter(({ h }) => /^\d+\.$/.test(h))
        .map(({ h, index }) => ({ semester: Number.parseInt(h, 10), index }));

    const raw = (row: string[], i: number) => (i >= 0 ? row[i] ?? "" : "");

    const classify = (row: string[] | undefined): RowKind => {
        if (!row || row.every((c) => norm(c) === "")) return "empty";
        const flag = key(raw(row, col.flag));
        if (flag in FLAGS && norm(raw(row, col.name))) return "subject";
        if (SUMMARY_PREFIXES.some((p) => flag.startsWith(p))) return "summary";
        if (flag && !norm(raw(row, col.name))) return "heading";
        return "other";
    };

    const nextMeaningful = (from: number): RowKind => {
        for (let j = from; j < rows.length; j++) {
            const k = classify(rows[j]);
            if (k !== "empty" && k !== "summary") return k;
        }
        return "empty";
    };

    const semesterOf = (row: string[]): number | null => {
        const m = /^n?k(\d+)$/.exec(key(raw(row, semesterCodeCol)));
        if (m) return Number(m[1]);
        for (const s of semesterCols) {
            if ([0, 1, 2].some((d) => (toInt(raw(row, s.index + d)) ?? 0) > 0)) return s.semester;
        }
        return null;
    };

    const groups: GroupAcc[] = [];
    let current: GroupAcc | null = null;
    let currentModule: string | null = null;
    let specUmbrellaCredits: number | null = null;

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]!;
        const line = i + 1;
        const kind = classify(row);
        if (kind === "empty" || kind === "summary") continue;

        if (kind === "other") {
            if (norm(raw(row, col.name))) warnings.push(`${line}. sor: ismeretlen "kötelező" érték ("${norm(raw(row, col.flag))}"), kihagyva.`);
            continue;
        }

        if (kind === "heading") {
            const text = raw(row, col.flag);
            const credits = creditsIn(text);
            if (key(text).startsWith("specializációk")) {
                specUmbrellaCredits = credits;
                continue;
            }
            if (credits === null && key(text).includes("modul")) {
                if (current) currentModule = norm(text);
                else errors.push(`${line}. sor: a "${norm(text)}" modul csoport nélkül áll.`);
                continue;
            }
            if (credits === null && nextMeaningful(i + 1) === "heading") continue;

            const name = groupNameOf(text);
            const groupKind = kindOf(name);
            current = {
                name,
                kind: groupKind,
                statedCredits: credits ?? (groupKind === "specialization" ? specUmbrellaCredits : null),
                modules: new Map(),
            };
            groups.push(current);
            currentModule = null;
            continue;
        }

        const name = norm(raw(row, col.name));
        if (!current) {
            warnings.push(`${line}. sor (${name}): tárgy csoport előtt, kihagyva.`);
            continue;
        }

        const requirement = key(raw(row, col.requirement));
        const rawCode = norm(raw(row, col.code));
        const code = rawCode.replace(/\s+/g, "");

        if (requirement === "zv") {
            skippedFinalExams.push(code || name);
            continue;
        }
        if (!code || /…|\.\.\./.test(code)) {
            warnings.push(`${line}. sor (${name}): hiányzó vagy helykitöltő tárgykód ("${rawCode}"), kihagyva.`);
            continue;
        }
        if (code !== rawCode) warnings.push(`${line}. sor: szóköz eltávolítva a tárgykódból ("${rawCode}" → "${code}").`);

        const credits = toInt(raw(row, col.credits));
        if (credits === null) {
            warnings.push(`${line}. sor (${code}): nem egész kredit ("${norm(raw(row, col.credits))}"), kihagyva.`);
            continue;
        }

        const moduleKey = currentModule ?? "";
        let module = current.modules.get(moduleKey);
        if (!module) {
            module = { name: currentModule, subjects: [], codes: new Set() };
            current.modules.set(moduleKey, module);
        }
        if (module.codes.has(code)) {
            warnings.push(`${line}. sor: ${code} kétszer szerepel a(z) "${current.name}" csoportban, a második kihagyva.`);
            continue;
        }
        module.codes.add(code);

        const prerequisites = raw(row, col.prerequisites).split(/\r?\n/).map((p) => norm(p)).filter(Boolean).join("; ");

        module.subjects.push({
            flag: FLAGS[key(raw(row, col.flag))]!,
            subject: {
                code,
                name,
                credits,
                requirement: REQUIREMENT_LABELS[requirement] ?? (norm(raw(row, col.requirement)) || null),
                semester: semesterOf(row),
                prerequisites: prerequisites || null,
            },
        });
    }

    const overrides = new Map(Object.entries(groupCredits).map(([k, v]) => [key(k), v] as const));
    const usedOverrides = new Set<string>();
    const out: Group[] = [];

    for (const g of groups) {
        const typeOf = (flag: Flag): SubgroupType =>
            g.kind === "free" ? "FREE_ELECTIVE" : flag === "MANDATORY" ? "MANDATORY" : "ELECTIVE";
        const allTypes = new Set([...g.modules.values()].flatMap((m) => m.subjects.map((s) => typeOf(s.flag))));
        const subgroups: Subgroup[] = [];

        for (const m of g.modules.values()) {
            const byType = new Map<SubgroupType, Subject[]>();
            for (const s of m.subjects) {
                const t = typeOf(s.flag);
                byType.set(t, [...(byType.get(t) ?? []), s.subject]);
            }
            for (const [type, subjects] of byType) {
                const name = m.name
                    ? (byType.size === 1 ? m.name : `${m.name} – ${TYPE_TITLE[type].toLowerCase()}`)
                    : (allTypes.size === 1 ? null : TYPE_TITLE[type]);
                subgroups.push({ name, type, requiredCredits: 0, subjects });
            }
        }

        if (subgroups.length === 0) {
            warnings.push(`"${g.name}": nincs benne átvehető tárgy, kihagyva.`);
            continue;
        }

        for (const s of subgroups) {
            if (s.type === "MANDATORY") s.requiredCredits = s.subjects.reduce((a, x) => a + x.credits, 0);
        }
        const mandatorySum = subgroups.filter((s) => s.type === "MANDATORY").reduce((a, s) => a + s.requiredCredits, 0);
        const nonMandatory = subgroups.filter((s) => s.type !== "MANDATORY");

        const override = overrides.get(key(g.name));
        if (override !== undefined) usedOverrides.add(key(g.name));
        let required = override ?? g.statedCredits;
        if (required === null) {
            if (nonMandatory.length === 0 || g.kind === "criterion") {
                required = mandatorySum;
            } else {
                errors.push(`"${g.name}": a fájlban nincs megadva a teljesítendő kredit – add meg: --group-credits '{"${g.name}": 11}'`);
                continue;
            }
        }
        if (nonMandatory.length > 1) {
            errors.push(`"${g.name}": több választható tárgycsoport is van benne, a kreditelőírásuk nem állapítható meg.`);
            continue;
        }
        if (nonMandatory.length === 1) {
            if (required < mandatorySum) {
                warnings.push(`"${g.name}": a kötelező tárgyak (${mandatorySum} kr) többet érnek, mint a csoport előírása (${required} kr).`);
            }
            nonMandatory[0]!.requiredCredits = Math.max(0, required - mandatorySum);
        }

        out.push({ name: g.name, requiredCredits: required, subgroups });
    }

    for (const k of overrides.keys()) {
        if (!usedOverrides.has(k)) errors.push(`--group-credits: nincs ilyen csoport: "${k}".`);
    }
    if (errors.length > 0) throw new Error(`Az átalakítás nem sikerült:\n  - ${errors.join("\n  - ")}`);

    return { groups: out, warnings, skippedFinalExams };
}

function toNeptunRows(groups: Group[], title: string): (string | number)[][] {
    const rows: (string | number)[][] = [[title], [], NEPTUN_HEADER];
    for (const g of groups) {
        for (const s of g.subgroups) {
            for (const subj of s.subjects) {
                rows.push([
                    subj.code,
                    subj.name,
                    "",
                    subj.prerequisites ?? "",
                    "",
                    subj.credits,
                    subj.requirement ?? "",
                    subj.semester ?? "",
                    TYPE_LABEL[s.type],
                    g.name,
                    g.requiredCredits,
                    g.subgroups.length,
                    s.name ?? "",
                    s.name ? s.requiredCredits : "",
                    "",
                ]);
            }
        }
    }
    return rows;
}

function main() {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            out: { type: "string" },
            sheet: { type: "string" },
            "group-credits": { type: "string" },
        },
    });

    const input = positionals[0];
    if (!input || positionals.length > 1) {
        console.error("Használat: bun scripts/convert-legacy-curriculum.ts <régi.xlsx> [--out <új.xlsx>] [--group-credits '{\"Szabadon választható tárgyak\": 11}']");
        process.exit(1);
    }

    let groupCredits: Record<string, number> = {};
    if (values["group-credits"]) {
        try {
            groupCredits = JSON.parse(values["group-credits"]);
        } catch {
            throw new Error(`A --group-credits nem érvényes JSON: ${values["group-credits"]}`);
        }
    }

    const stem = basename(input, extname(input));
    const output = values.out ?? join(dirname(input), `${stem}.neptun.xlsx`);

    const { groups, warnings, skippedFinalExams } = convert(readRows(input, values.sheet), groupCredits);

    const sheet = XLSX.utils.aoa_to_sheet(toNeptunRows(groups, stem));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Munka1");
    XLSX.writeFile(book, output);

    const specs = groups.filter((g) => key(g.name).includes("specializáció"));
    const total = groups.filter((g) => !specs.includes(g)).reduce((a, g) => a + g.requiredCredits, 0)
        + (specs.length ? Math.min(...specs.map((g) => g.requiredCredits)) : 0);

    console.log(`\n${input} → ${output}\n`);
    for (const g of groups) {
        console.log(`  ${g.name} – ${g.requiredCredits} kr`);
        for (const s of g.subgroups) {
            console.log(`      ${TYPE_LABEL[s.type].padEnd(23)} ${s.name ?? "(névtelen)"} – ${s.requiredCredits} kr (${s.subjects.length} tárgy)`);
        }
    }
    console.log(`\n  Összesen: ${total} kredit (egy specializációval)`);
    if (skippedFinalExams.length) console.log(`  Kihagyott záróvizsgák: ${skippedFinalExams.join(", ")}`);
    if (warnings.length) {
        console.log(`\n⚠️  Figyelmeztetések (${warnings.length}):`);
        for (const w of warnings) console.log(`   - ${w}`);
    }
}

try {
    main();
} catch (e) {
    console.error(`❌ ${(e as Error).message}`);
    process.exit(1);
}