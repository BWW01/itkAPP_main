import {createHash, timingSafeEqual} from "node:crypto";
import {z} from "zod";

import {ErrorCode} from "../../shared/types/errorCodes";

export const KIOSK_KEY_HEADER = "x-kiosk-key";

export const MAX_KIOSK_QUERY_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

export const kioskClassesQuerySchema = z
    .object({
        from: z.iso.datetime({offset: true, error: ErrorCode.INVALID_DATETIME}),
        to: z.iso.datetime({offset: true, error: ErrorCode.INVALID_DATETIME}),
    })
    .refine((q) => Date.parse(q.to) > Date.parse(q.from), {
        error: ErrorCode.INVALID_DATE_RANGE,
        path: ["to"],
    })
    .refine((q) => Date.parse(q.to) - Date.parse(q.from) <= MAX_KIOSK_QUERY_RANGE_MS, {
        error: ErrorCode.DATE_RANGE_TOO_LARGE,
        path: ["to"],
    });

export function kioskKeyMatches(provided: string | undefined, expected: string): boolean {
    if (!expected || !provided) return false;
    const a = createHash("sha256").update(provided).digest();
    const b = createHash("sha256").update(expected).digest();
    return timingSafeEqual(a, b);
}

export type ClasKindCode = "lab" | "parctice" | "lecture" | "other";

export interface ClassSessionRow {
    id: string;
    room: string;
    subject: string;
    kind: ClassKindCode;
    startsAt: Date;
    endsAt: Date;
    groups: string[];
    instructors: string[];
    capacity: number | null;
    subjectCode: string | null;
}

export interface KioskMajor {
    code: string; // "MI-BSc", ugyanaz az alak, mint a csoportnévben
    name: string; // "Mérnökinformatikus BSc"
}

export interface KioskSubjectInfo {
    nameEn: string | null;
    majors: KioskMajor[];
}

export interface SubjectCurriculumRow {
    code: string;
    nameEn: string | null;
    curriculumCode: string | null;
    curriculumName: string | null;
    major: string | null;
}

const MAJOR_KEY = /^([A-Za-z]+)-(BSC|MSC)(?=$|[-_ ])/i;

function normalizeLevel(text: string): string {
    return text.replace(/\bBSC\b/gi, "BSc").replace(/\bMSC\b/gi, "MSc");
}

export function majorKey(
    curriculumName: string | null,
    curriculumCode: string | null,
    major: string | null,
): string {
    for (const candidate of [curriculumName, curriculumCode]) {
        const m = candidate?.trim().match(MAJOR_KEY);
        if (m) return `${m[1]!.toUpperCase()}-${m[2]!.toUpperCase() === "BSC" ? "BSc" : "MSc"}`;
    }
    return normalizeLevel(major?.trim() || curriculumName?.trim() || curriculumCode?.trim() || "");
}

export function subjectCodeCandidates(code: string | null | undefined): string[] {
    const trimmed = code?.trim();
    if (!trimmed) return [];
    const base = trimmed.split("/")[0]!.trim();
    return base && base !== trimmed ? [trimmed, base] : [trimmed];
}

export function buildSubjectIndex(rows: SubjectCurriculumRow[]): Map<string, KioskSubjectInfo> {
    const index = new Map<string, KioskSubjectInfo>();
    for (const row of rows) {
        let info = index.get(row.code);
        if (!info) {
            info = {nameEn: row.nameEn, majors: []};
            index.set(row.code, info);
        }
        if (!info.nameEn && row.nameEn) info.nameEn = row.nameEn;
        if (!row.major && !row.curriculumName && !row.curriculumCode) continue;

        const code = majorKey(row.curriculumName, row.curriculumCode, row.major);
        if (code && !info.majors.some((m) => m.code === code)) {
            info.majors.push({code, name: normalizeLevel(row.major?.trim() || code)});
        }
    }
    for (const info of index.values()) info.majors.sort((a, b) => a.code.localeCompare(b.code));
    return index;
}

export function lookupSubject(
    index: Map<string, KioskSubjectInfo>,
    code: string | null,
): KioskSubjectInfo | undefined {
    for (const candidate of subjectCodeCandidates(code)) {
        const info = index.get(candidate);
        if (info) return info;
    }
    return undefined;
}

export function toKioskClass(row: ClassSessionRow, subject?: KioskSubjectInfo) {
    return {
        id: row.id,
        room: row.room,
        subject: row.subject,
        subjectCode: row.subjectCode,
        subjectEn: subject?.nameEn ?? null,
        majors: subject?.majors ?? [],
        kind: row.kind,
        start: row.startsAt.toISOString(),
        end: row.endsAt.toISOString(),
        groups: row.groups,
        instructors: row.instructors,
        capacity: row.capacity,
    };
}

const classFileItemSchema = z
    .object({
        id: z.string().min(1),
        room: z.string().min(1),
        subject: z.string(),
        subjectCode: z.string().trim().min(1).nullable().optional(),
        kind: z.enum(["lab", "practice", "lecture", "other"]),
        start : z.iso.datetime({offset: true}),
        end : z.iso.datetime({offset: true}),
        groups: z.array(z.string()).default([]),
        instructors: z.array(z.string()).default([]),
        capacity: z.number().int().nullable().optional(),
    })
    .refine((c) => Date.parse(c.end) > Date.parse(c.start), {
        error: ErrorCode.INVALID_DATE_RANGE,
        path: ["end"],
    })
export const classesFileSchema = z.object({
    generatedForm: z.union([z.string(), z.array(z.string())]).optional(),
    timezone: z.string().optional(),
    classes: z.array(classFileItemSchema).min(1),
});