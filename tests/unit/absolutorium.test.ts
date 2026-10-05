import { describe, expect, it } from "vitest";
import {
    pickBestAttempts,
    summarizeProgress,
    type AttemptRow,
    type CurriculumSubjectRow,
    type GroupRow,
    type SubgroupRow,
} from "../../server/db/queries/absolutorium";
import type { AbsolutoriumProgress, SubgroupType } from "../../shared/types/absolutorium";

const curriculum = { id: 1, code: "T", name: "Teszt", major: "Teszt BSc", totalCreditsRequired: 23 };

const G = (id: number, name: string, requiredCredits: number, isSpecialization = false, requiredSubgroupCount = 1): GroupRow =>
    ({ id, name, requiredCredits, requiredSubgroupCount, isSpecialization });
const S = (id: number, groupId: number, type: SubgroupType, requiredCredits: number, requiredCount: number | null = null): SubgroupRow =>
    ({ id, groupId, name: `S${id}`, type, requiredCredits, requiredCount });
const L = (subgroupId: number, subjectId: number, credits: number, recommendedSemester: number | null = null): CurriculumSubjectRow =>
    ({ subgroupId, subjectId, code: `T${subjectId}`, name: `Tárgy ${subjectId}`, credits, recommendedSemester });
const A = (subjectId: number, grade: number | null, semester = "2025/26/1", credits = 3): AttemptRow =>
    ({ subjectId, code: `T${subjectId}`, name: `Tárgy ${subjectId}`, credits, grade, semester });

const groups = [
    G(1, "Alap", 14, false, 2),
    G(2, "A specializáció", 5, true),
    G(3, "B specializáció", 5, true, 2),
    G(4, "Kritérium", 0),
    G(5, "Szabvál", 4),
];
const subgroups = [
    S(10, 1, "MANDATORY", 6), S(11, 1, "ELECTIVE", 8),
    S(20, 2, "MANDATORY", 5),
    S(30, 3, "MANDATORY", 3), S(31, 3, "ELECTIVE", 2),
    S(40, 4, "ELECTIVE", 0, 2),
    S(50, 5, "FREE_ELECTIVE", 4),
];
const links = [
    L(10, 1, 6, 1),
    L(11, 2, 8), L(11, 3, 8),
    L(20, 4, 5),
    L(30, 5, 3), L(31, 4, 2),
    L(40, 6, 0), L(40, 7, 0), L(40, 8, 0),
    L(50, 9, 2),
];

const run = (
    attempts: AttemptRow[],
    specializationGroupId: number | null = null,
    override: { groups?: GroupRow[]; subgroups?: SubgroupRow[] } = {},
) => summarizeProgress({
    curriculum,
    groups: override.groups ?? groups,
    subgroups: override.subgroups ?? subgroups,
    curriculumSubjects: links,
    attempts,
    specializationGroupId,
});

const sub = (p: AbsolutoriumProgress, id: number) => p.groups.flatMap((g) => g.subgroups).find((s) => s.id === id)!;
const grp = (p: AbsolutoriumProgress, id: number) => p.groups.find((g) => g.id === id)!;
const codes = (list: { code: string }[]) => list.map((x) => x.code);

describe("pickBestAttempts", () => {
    it("drops failing grades but keeps signature-only completions", () => {
        expect(pickBestAttempts([A(1, 1), A(2, null)]).map((a) => a.subjectId)).toEqual([2]);
    });

    it("keeps one attempt per subject with the best grade", () => {
        const r = pickBestAttempts([A(1, 2, "2024/25/1"), A(1, 4, "2024/25/2"), A(1, 3, "2025/26/1")]);
        expect(r).toHaveLength(1);
        expect(r[0]!.grade).toBe(4);
    });

    it("prefers a graded pass over a signature, and the later semester on ties", () => {
        expect(pickBestAttempts([A(1, null, "2025/26/1"), A(1, 2, "2024/25/1")])[0]!.grade).toBe(2);
        expect(pickBestAttempts([A(1, 3, "2025/26/1"), A(1, 3, "2024/25/2")])[0]!.semester).toBe("2025/26/1");
    });
});

describe("summarizeProgress – specializáció", () => {
    it("shows only the common groups until a specialization is chosen", () => {
        const p = run([]);
        expect(p.groups.map((g) => g.id)).toEqual([1, 4, 5]);
        expect(p.specialization).toEqual({
            chosenId: null,
            options: [
                { id: 2, name: "A specializáció", requiredCredits: 5 },
                { id: 3, name: "B specializáció", requiredCredits: 5 },
            ],
        });
        expect(p.isComplete).toBe(false);
    });

    it("counts a specialization subject as free elective while none is chosen", () => {
        expect(sub(run([A(4, 5, "2025/26/1", 5)]), 50).completed)
            .toMatchObject([{ code: "T4", credits: 5, countedAsFreeElective: true }]);
    });

    it("places the same subject differently depending on the chosen specialization", () => {
        expect(sub(run([A(4, 5, "2025/26/1", 5)], 2), 20).completed)
            .toMatchObject([{ code: "T4", credits: 5, countedAsFreeElective: false }]);

        const b = run([A(4, 5, "2025/26/1", 5)], 3);
        expect(sub(b, 31).completed).toMatchObject([{ code: "T4", credits: 2 }]);
        expect(codes(sub(b, 30).missing)).toEqual(["T5"]);
    });

    it("ignores a specializationGroupId that is not a specialization", () => {
        expect(run([], 1).specialization.chosenId).toBeNull();
    });
});

describe("summarizeProgress – tárgycsoportok", () => {
    it("lists missing subjects only in mandatory subgroups", () => {
        const p = run([]);
        expect(codes(sub(p, 10).missing)).toEqual(["T1"]);
        expect(sub(p, 11).missing).toEqual([]);
    });

    it("requires the manual count for criterion subjects", () => {
        expect(sub(run([A(6, null)]), 40)).toMatchObject({ completedCount: 1, isComplete: false });
        expect(sub(run([A(6, null), A(7, null)]), 40)).toMatchObject({ completedCount: 2, isComplete: true });
    });

    it("moves elective surplus into the free elective subgroup", () => {
        const p = run([A(2, 4, "2025/26/1", 8), A(3, 5, "2025/26/1", 8)]);
        expect(sub(p, 11)).toMatchObject({ earnedCredits: 16, countedCredits: 8, overflowCredits: 8, isComplete: true });
        expect(sub(p, 50)).toMatchObject({ earnedCredits: 8, receivedOverflowCredits: 8, countedCredits: 4, isComplete: true });
        expect(p.byType.ELECTIVE).toEqual({ earnedCredits: 16, requiredCredits: 8, countedCredits: 8 });
        expect(p.byType.FREE_ELECTIVE).toEqual({ earnedCredits: 0, requiredCredits: 4, countedCredits: 4 });
        expect(p.totals.earnedCredits).toBe(16);
    });

    it("does not let surplus hide a missing mandatory subject in the same group", () => {
        expect(grp(run([A(2, 4, "2025/26/1", 8), A(3, 5, "2025/26/1", 8)]), 1))
            .toMatchObject({ earnedCredits: 16, countedCredits: 8, completedSubgroupCount: 1, isComplete: false });
    });

    it("puts subjects into uncategorized when there is no free elective subgroup", () => {
        const p = run([A(99, 5)], null, {
            groups: groups.filter((g) => g.id !== 5),
            subgroups: subgroups.filter((s) => s.id !== 50),
        });
        expect(p.uncategorized).toMatchObject([{ code: "T99", countedAsFreeElective: false }]);
        expect(p.totals.earnedCredits).toBe(3);
    });
});

describe("summarizeProgress – teljes abszolutórium", () => {
    const all = [
        A(1, 4, "2024/25/1", 6), A(2, 4, "2024/25/1", 8), A(3, 3, "2024/25/2", 8),
        A(4, 5, "2025/26/1", 5), A(6, null), A(7, null), A(9, 5, "2025/26/1", 2),
    ];

    it("is complete with a chosen specialization", () => {
        const p = run(all, 2);
        expect(p.totals).toEqual({ earnedCredits: 29, requiredCredits: 23, remainingCredits: 0, percent: 100 });
        expect(p.groups.every((g) => g.isComplete)).toBe(true);
        expect(p.isComplete).toBe(true);
    });

    it("is not complete without a chosen specialization", () => {
        expect(run(all).isComplete).toBe(false);
    });
});