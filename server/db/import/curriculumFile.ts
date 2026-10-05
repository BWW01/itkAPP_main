import { z } from "zod";
import { subgroupType } from "../schema";

const nonEmpty = z.string().trim().min(1);

export const subjectEntrySchema = z.object({
    code: nonEmpty,
    name: nonEmpty,
    nameEn: nonEmpty.nullable(),
    credits: z.number().int().nonnegative(),
    requirementType: nonEmpty.nullable(),
    recommendedSemester: z.number().int().min(1).max(14).nullable(),
    prerequisites: nonEmpty.nullable(),
});

export const subgroupEntrySchema = z.object({
    name: nonEmpty,
    type: z.enum(subgroupType.enumValues),
    requiredCredits: z.number().int().nonnegative(),
    requiredCount: z.number().int().positive().nullable(),
    subjects: z.array(subjectEntrySchema).min(1),
});

export const groupEntrySchema = z.object({
    name: nonEmpty,
    requiredCredits: z.number().int().nonnegative(),
    requiredSubgroupCount: z.number().int().positive(),
    isSpecialization: z.boolean(),
    subgroups: z.array(subgroupEntrySchema).min(1),
}).refine((g) => g.requiredSubgroupCount <= g.subgroups.length, {
    message: "Több elvégzendő tárgycsoport van előírva, mint ahány létezik.",
    path: ["requiredSubgroupCount"],
});

export const curriculumFileSchema = z.object({
    code: nonEmpty,
    name: nonEmpty,
    major: nonEmpty,
    totalCreditsRequired: z.number().int().positive(),
    groups: z.array(groupEntrySchema).min(1),
});

export type SubjectEntry = z.infer<typeof subjectEntrySchema>;
export type SubgroupEntry = z.infer<typeof subgroupEntrySchema>;
export type GroupEntry = z.infer<typeof groupEntrySchema>;
export type CurriculumFile = z.infer<typeof curriculumFileSchema>;
export type SubgroupTypeValue = SubgroupEntry["type"];