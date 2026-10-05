import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CurriculumParseError, parseCurriculumSheet } from "../../server/db/import/parseCurriculumSheet";
import { readSheetRows } from "../../server/db/import/readSheet";

const COLS = {
    code: "Tárgykód",
    name: "Tárgynév",
    nameEn: "Angol tárgynév",
    prereq: "Előkövetelmény",
    parallel: "Párhuzamos követelmény",
    credits: "Tárgy kredit",
    req: "Tárgykövetelmény",
    sem: "Félév szám",
    type: "Tárgyfelvétel típusa",
    group: "Mintatanterv csoport",
    groupCr: "Teljesítendő kreditek a mintatanterv csoportban",
    subCount: "Elvégzendő tárgycsoportok száma",
    sub: "Modul, sáv, specializáció elnevezése 1.",
    subCr: "Teljesítendő kreditek a tárgycsoportban 1.",
} as const;
type Col = keyof typeof COLS;

const HEADER: string[] = Object.values(COLS);
const row = (v: Partial<Record<Col, string>>): string[] => (Object.keys(COLS) as Col[]).map((k) => v[k] ?? "");
const sheet = (...rows: string[][]): string[][] => [
    ["TESZT SZAK TANTERV"],
    ["Érvényes a 2025/2026. tanévtől"],
    HEADER,
    ...rows,
    [],
    ["Lábjegyzet, ez már nem tárgysor"],
];

const alap = { group: "Alap", groupCr: "14", subCount: "2" };
const robot = { group: "Robot specializáció", groupCr: "5", subCount: "1" };
const masik = { group: "Másik specializáció", groupCr: "5", subCount: "1" };
const krit = { group: "Kritériumtárgyak", groupCr: "0", subCount: "1" };
const szabval = { group: "Szabadon választható tárgyak", groupCr: "4", subCount: "1" };

const ROWS = [
    row({ code: "K1", name: "Kalkulus ", credits: "6", req: "Kollokvium", sem: "1", type: "Kötelező", ...alap, sub: "Kötelező tárgyak", subCr: "6", prereq: "A vagy\nB" }),
    row({ code: "E1", name: "Választható 1", credits: "8", req: "Kollokvium", type: "Kötelezően választható", ...alap, sub: "Kötelezően választható tárgyak", subCr: "8" }),
    row({ code: "E2", name: "Választható 2", credits: "8", req: "Kollokvium", type: "Kötelezően választható", ...alap, sub: "kötelezően választható tárgyak", subCr: "8" }),
    row({ code: "S1", name: "Közös tárgy", credits: "5", req: "Kollokvium", type: "Kötelező", ...robot, sub: "Kötelező tárgyak", subCr: "5" }),
    row({ code: "ZV1", name: "Záróvizsga", credits: "0", req: "Záróvizsga", parallel: "abszolutórium", type: "Kötelező", ...robot, sub: "Kötelező tárgyak", subCr: "5" }),
    row({ code: "S1", name: "Közös tárgy", credits: "5", req: "Kollokvium", type: "Kötelezően választható", ...masik, sub: "Kötelezően választható tárgyak", subCr: "5" }),
    row({ code: "PE1", name: "Testnevelés I.", credits: "0", req: "Aláírás megszerzése", type: "Kötelezően választható", ...krit }),
    row({ code: "PE2", name: "Testnevelés II.", credits: "0", req: "Aláírás megszerzése", type: "Kötelezően választható", ...krit }),
    row({ code: "F1", name: "Szabad", credits: "2", req: "Gyakorlati jegy", type: "Szabadon választható", ...szabval }),
];

const parse = (rows = ROWS, opts: { requiredCount?: Record<string, number> } = {}) =>
    parseCurriculumSheet(sheet(...rows), { code: "TESZT", ...opts });

describe("parseCurriculumSheet", () => {
    it("builds the group / subgroup tree", () => {
        const { file, warnings, skippedFinalExams } = parse();
        expect(warnings).toEqual([]);
        expect(skippedFinalExams).toEqual(["ZV1"]);
        expect(file).toMatchObject({
            code: "TESZT",
            name: "TESZT SZAK TANTERV (Érvényes a 2025/2026. tanévtől)",
            major: "TESZT SZAK",
            totalCreditsRequired: 23,
        });
        expect(file.groups.map((g) => [
            g.name,
            g.isSpecialization,
            g.subgroups.map((s) => [s.name, s.type, s.requiredCredits, s.subjects.map((x) => x.code)]),
        ])).toEqual([
            ["Alap", false, [
                ["Kötelező tárgyak", "MANDATORY", 6, ["K1"]],
                ["Kötelezően választható tárgyak", "ELECTIVE", 8, ["E1", "E2"]],
            ]],
            ["Robot specializáció", true, [["Kötelező tárgyak", "MANDATORY", 5, ["S1"]]]],
            ["Másik specializáció", true, [["Kötelezően választható tárgyak", "ELECTIVE", 5, ["S1"]]]],
            ["Kritériumtárgyak", false, [["Kritériumtárgyak", "ELECTIVE", 0, ["PE1", "PE2"]]]],
            ["Szabadon választható tárgyak", false, [["Szabadon választható tárgyak", "FREE_ELECTIVE", 4, ["F1"]]]],
        ]);
    });

    it("normalizes cell text", () => {
        expect(parse().file.groups[0]!.subgroups[0]!.subjects[0]).toEqual({
            code: "K1",
            name: "Kalkulus",
            nameEn: null,
            credits: 6,
            requirementType: "Kollokvium",
            recommendedSemester: 1,
            prerequisites: "A vagy B",
        });
    });

    it("does not depend on column order", () => {
        const reversed = sheet(...ROWS).map((r) => [...r].reverse());
        expect(parseCurriculumSheet(reversed, { code: "TESZT" }).file).toEqual(parse().file);
    });

    it("applies manual requiredCount overrides and rejects unknown keys", () => {
        expect(parse(ROWS, { requiredCount: { "Kritériumtárgyak": 2 } }).file.groups[3]!.subgroups[0]!.requiredCount).toBe(2);
        expect(() => parse(ROWS, { requiredCount: { "Kritérium": 2 } })).toThrow(CurriculumParseError);
    });

    it("reports row errors with Excel line numbers", () => {
        const rows = [...ROWS];
        rows[0] = row({ code: "K1", credits: "x", type: "Kötelező", ...alap, sub: "Kötelező tárgyak", subCr: "6" });
        expect(() => parse(rows)).toThrow(/4\. sor \(K1\): érvénytelen kredit/);
    });

    it("rejects inconsistent group credits", () => {
        const rows = [...ROWS, row({ code: "K2", name: "X", credits: "1", req: "Kollokvium", type: "Kötelező", ...alap, groupCr: "15", sub: "Kötelező tárgyak", subCr: "6" })];
        expect(() => parse(rows)).toThrow(/csoport kreditje eltér/);
    });

    it("fails clearly when the header row is missing", () => {
        expect(() => parseCurriculumSheet([["valami"]], { code: "X" })).toThrow(/Tárgykód/);
    });
});

describe("parseCurriculumSheet – IANI-MI-2025", () => {
    const path = "tests/fixtures/IANI-MI-2025.csv";
    const { file, warnings, skippedFinalExams } = parseCurriculumSheet(
        readSheetRows(new Uint8Array(readFileSync(path)), path),
        { code: "IANI-MI-2025", requiredCount: { "Kritériumtárgyak": 2 } },
    );
    const group = (prefix: string) => file.groups.find((g) => g.name.startsWith(prefix))!;

    it("matches the official totals", () => {
        expect(warnings).toEqual([]);
        expect(file.totalCreditsRequired).toBe(210);
        expect(file.groups).toHaveLength(10);
        expect(file.groups.filter((g) => g.isSpecialization)).toHaveLength(3);
        expect(file.groups.flatMap((g) => g.subgroups).flatMap((s) => s.subjects)).toHaveLength(140);
    });

    it("drops the final exams", () => {
        expect([...skippedFinalExams].sort()).toEqual([
            "P-SZDV-IANI-MI", "P-ZV-IANI-MI-0001", "P-ZV-IANI-MI-0002", "P-ZV-IANI-MI-0003",
        ]);
        expect(file.groups.some((g) => g.name === "Záróvizsga")).toBe(false);
    });

    it("reads the two-level structure", () => {
        expect(group("Természettudományi").subgroups.map((s) => s.requiredCredits)).toEqual([26, 8, 7]);
        expect(group("Gazdasági").subgroups[1]!.subjects).toHaveLength(11);
        expect(group("Kritérium").subgroups[0]!.requiredCount).toBe(2);
    });
});