import {createHash, timingSafeEqual} from "node:crypto";
import {z} from "zod";

import {ErrorCode} from "#shared/types/errorCodes";

export const KIOSK_KEY_HEADER = "x-kiosk.key";

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

export interface CLassSessionRow {
    id: string;
    room: string;
    subject: string;
    kind: string;
    startsAt: string;
    endsAt: string;
    groups: string[];
    instructors: string[];
    capacity: number | null;
}

export function toKioskClass(row: CLassSessionRow) {
    return{
        id: row.id,
        room: row.room,
        subject: row.subject,
        kind: row.kind,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
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
    generatedForm: z.string().optional(),
    timezone: z.string().optional(),
    classes: z.array(classFileItemSchema).min(1),
});