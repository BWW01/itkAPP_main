import {
    curriculumFileSchema,
    type CurriculumFile,
    type SubjectEntry,
    type SubgroupTypeValue,
} from "./curriculumFile";

export interface ParseOptions {
    code: string;
    name?: string;
    major?: string;
    requiredCount?: Record<string, number>;
}

export interface ParseResult {
    file: CurriculumFile;
    warnings: string[];
    skippedFinalExams: string[];
}

export class CurriculumParseError extends Error {
    constructor(public readonly errors: string[]) {
        super(`A tanterv nem dolgozható fel:\n  - ${errors.join("\n  - ")}`);
        this.name = "CurriculumParseError";
    }
}

const norm = (s: string | undefined): string => (s ?? "").replace(/\s+/g, " ").trim();

const key = (s: string | undefined): string => norm(s).toLowerCase();

const toInt = (s: string | undefined): number | null => {
    const t = norm(s);
    return /^\d+$/.test(t) ? Number(t) : null;
};


const COLUMNS = {
    code:            (h: string) => h === "tárgykód",
    name:            (h: string) => h === "tárgynév",
    nameEn:          (h: string) => h === "angol tárgynév",
    prerequisites:   (h: string) => h.startsWith("el") && h.endsWith("követelmény"),
    credits:         (h: string) => h === "tárgy kredit",
    requirementType: (h: string) => h === "tárgykövetelmény",
    semester:        (h: string) => h === "félév szám",
    type:            (h: string) => h === "tárgyfelvétel típusa",
    group:           (h: string) => h === "mintatanterv csoport",
    groupCredits:    (h: string) => h.startsWith("teljesít") && h.includes("mintatanterv csoport"),
    subgroupCount:   (h: string) => h.startsWith("elvégz"),
    subgroup:        (h: string) => h.startsWith("modul, sáv"),
    subgroupCredits: (h: string) => h.startsWith("teljesít") && h.includes("tárgycsoport"),
};
type Field = keyof typeof COLUMNS;
const OPTIONAL_COLUMNS: ReadonlySet<Field> = new Set<Field>(["nameEn", "prerequisites", "semester"]);

function parseType(raw: string): SubgroupTypeValue | null {
    const k = key(raw);
    if (k.startsWith("szabadon")) return "FREE_ELECTIVE";
    if (k.startsWith("kötelez") && k.includes("választható")) return "ELECTIVE";
    if (k.startsWith("kötelez")) return "MANDATORY";
    return null;
}

interface SubgroupAcc {
    name: string;
    type: SubgroupTypeValue;
    requiredCredits: number;
    subjects: SubjectEntry[];
    codes: Set<string>;
}

interface GroupAcc {
    name: string;
    requiredCredits: number;
    requiredSubgroupCount: number;
    subgroups: Map<string, SubgroupAcc>;
}


export function parseCurriculumSheet(rows: string[][], options: ParseOptions): ParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const skippedFinalExams: string[] = [];

    const headerIdx = rows.findIndex((r) => key(r[0]) === "tárgykód");
    if (headerIdx < 0) {
        throw new CurriculumParseError(['Nem található a "Tárgykód" kezdetű fejlécsor.']);
    }
    const header = rows[headerIdx]!.map(key);

    const col = {} as Record<Field, number>;
    for (const field of Object.keys(COLUMNS) as Field[]) {
        const idx = header.findIndex(COLUMNS[field]);
        if (idx < 0 && !OPTIONAL_COLUMNS.has(field)) errors.push(`Hiányzó oszlop: ${field}`);
        col[field] = idx;
    }
    if (errors.length > 0) throw new CurriculumParseError(errors);

    const cell = (row: string[], field: Field): string => (col[field] >= 0 ? norm(row[col[field]]) : "");

    const preamble = rows.slice(0, headerIdx).map((r) => norm(r[0])).filter(Boolean);
    const title = preamble[0] ?? options.code;
    const validity = preamble.find((line) => key(line).startsWith("érvényes"));

    const groups = new Map<string, GroupAcc>();

    for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i]!;
        const line = i + 1;
        if (row.every((c) => norm(c) === "")) break;

        const code = cell(row, "code");
        if (!code) {
            warnings.push(`${line}. sor: nincs tárgykód, kihagyva.`);
            continue;
        }

        if (key(cell(row, "requirementType")) === "záróvizsga") {
            skippedFinalExams.push(code);
            continue;
        }

        const credits = toInt(cell(row, "credits"));
        const type = parseType(cell(row, "type"));
        const groupName = cell(row, "group");
        const groupCredits = toInt(cell(row, "groupCredits"));

        if (credits === null) errors.push(`${line}. sor (${code}): érvénytelen kredit: "${cell(row, "credits")}".`);
        if (type === null) errors.push(`${line}. sor (${code}): ismeretlen tárgyfelvétel-típus: "${cell(row, "type")}".`);
        if (!groupName || groupCredits === null) {
            errors.push(`${line}. sor (${code}): hiányzó mintatanterv-csoport vagy csoportkredit.`);
        }
        if (credits === null || type === null || !groupName || groupCredits === null) continue;

        let group = groups.get(key(groupName));
        if (!group) {
            group = {
                name: groupName,
                requiredCredits: groupCredits,
                requiredSubgroupCount: toInt(cell(row, "subgroupCount")) ?? 1,
                subgroups: new Map(),
            };
            groups.set(key(groupName), group);
        } else if (group.requiredCredits !== groupCredits) {
            errors.push(`${line}. sor (${code}): a(z) "${group.name}" csoport kreditje eltér a korábbi soroktól (${groupCredits} ≠ ${group.requiredCredits}).`);
        }

        const subgroupRaw = cell(row, "subgroup");
        const subgroupName = subgroupRaw || group.name;
        const subgroupCredits = subgroupRaw ? toInt(cell(row, "subgroupCredits")) : group.requiredCredits;
        if (subgroupCredits === null) {
            errors.push(`${line}. sor (${code}): a(z) "${subgroupName}" tárgycsoportnak nincs kreditelőírása.`);
            continue;
        }

        let subgroup = group.subgroups.get(key(subgroupName));
        if (!subgroup) {
            subgroup = { name: subgroupName, type, requiredCredits: subgroupCredits, subjects: [], codes: new Set() };
            group.subgroups.set(key(subgroupName), subgroup);
        } else {
            if (subgroup.type !== type) {
                errors.push(`${line}. sor (${code}): a(z) "${group.name} / ${subgroup.name}" tárgycsoportban vegyes a tárgyfelvétel típusa.`);
            }
            if (subgroup.requiredCredits !== subgroupCredits) {
                errors.push(`${line}. sor (${code}): a(z) "${group.name} / ${subgroup.name}" kreditelőírása eltér a korábbi soroktól.`);
            }
        }

        if (subgroup.codes.has(code)) {
            warnings.push(`${line}. sor: ${code} kétszer szerepel a(z) "${subgroup.name}" tárgycsoportban, a második kihagyva.`);
            continue;
        }
        subgroup.codes.add(code);

        const semesterRaw = cell(row, "semester");
        const semester = toInt(semesterRaw);
        if (semesterRaw && semester === null) {
            warnings.push(`${line}. sor (${code}): értelmezhetetlen félévszám: "${semesterRaw}", üresként kezelve.`);
        }

        subgroup.subjects.push({
            code,
            name: cell(row, "name") || code,
            nameEn: cell(row, "nameEn") || null,
            credits,
            requirementType: cell(row, "requirementType") || null,
            recommendedSemester: semester,
            prerequisites: cell(row, "prerequisites") || null,
        });
    }
    if (errors.length > 0) throw new CurriculumParseError(errors);

    const countOverrides = new Map(
        Object.entries(options.requiredCount ?? {}).map(([k, v]) => [key(k), v] as const),
    );
    const usedOverrides = new Set<string>();

    const outGroups = [...groups.values()].map((g) => ({
        name: g.name,
        requiredCredits: g.requiredCredits,
        requiredSubgroupCount: g.requiredSubgroupCount,
        isSpecialization: key(g.name).endsWith("specializáció"),
        subgroups: [...g.subgroups.values()].map((s) => {
            const label = key(s.name) === key(g.name) ? key(g.name) : key(`${g.name} / ${s.name}`);
            const requiredCount = countOverrides.get(label) ?? null;
            if (requiredCount !== null) usedOverrides.add(label);
            return {
                name: s.name,
                type: s.type,
                requiredCredits: s.requiredCredits,
                requiredCount,
                subjects: s.subjects,
            };
        }),
    }));

    for (const label of countOverrides.keys()) {
        if (!usedOverrides.has(label)) errors.push(`requiredCount: nincs ilyen tárgycsoport: "${label}".`);
    }
    if (errors.length > 0) throw new CurriculumParseError(errors);

    for (const g of outGroups) {
        const subgroupSum = g.subgroups.reduce((sum, s) => sum + s.requiredCredits, 0);
        if (g.requiredSubgroupCount >= g.subgroups.length && subgroupSum !== g.requiredCredits) {
            warnings.push(`"${g.name}": a tárgycsoportok előírásainak összege ${subgroupSum}, a csoporté ${g.requiredCredits}.`);
        }
        for (const s of g.subgroups) {
            if (s.type !== "MANDATORY") continue;
            const subjectSum = s.subjects.reduce((sum, x) => sum + x.credits, 0);
            if (subjectSum !== s.requiredCredits) {
                warnings.push(`"${g.name} / ${s.name}": a kötelező tárgyak összege ${subjectSum}, az előírás ${s.requiredCredits}.`);
            }
        }
    }

    const specs = outGroups.filter((g) => g.isSpecialization);
    const baseCredits = outGroups.filter((g) => !g.isSpecialization).reduce((sum, g) => sum + g.requiredCredits, 0);
    const specCredits = specs.map((g) => g.requiredCredits);
    if (new Set(specCredits).size > 1) {
        warnings.push(`A specializációk kreditje eltér (${specCredits.join(", ")}), a legkisebbel számolok.`);
    }
    const totalCreditsRequired = baseCredits + (specs.length > 0 ? Math.min(...specCredits) : 0);

    for (const spec of specs.length > 0 ? specs : [null]) {
        const seen = new Map<string, string>();
        for (const g of outGroups) {
            if (g.isSpecialization && g !== spec) continue;
            for (const s of g.subgroups) {
                for (const subj of s.subjects) {
                    const where = `${g.name} / ${s.name}`;
                    const prev = seen.get(subj.code);
                    if (prev) {
                        warnings.push(`${subj.code} két helyre is számítana${spec ? ` (${spec.name})` : ""}: "${prev}" és "${where}" – az elsőbe kerül.`);
                    } else {
                        seen.set(subj.code, where);
                    }
                }
            }
        }
    }

    const file = curriculumFileSchema.parse({
        code: options.code,
        name: options.name ?? (validity ? `${title} (${validity})` : title),
        major: options.major ?? title.replace(/\s*tanterv\s*$/i, ""),
        totalCreditsRequired,
        groups: outGroups,
    });

    return { file, warnings, skippedFinalExams };
}