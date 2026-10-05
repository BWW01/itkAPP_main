import { z, ZodError } from "zod";
import { db } from "../../../db";
import { readSheetRows } from "../../../db/import/readSheet";
import { CurriculumParseError, parseCurriculumSheet } from "../../../db/import/parseCurriculumSheet";
import { importCurriculum } from "../../../db/import/importCurriculum";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const fieldsSchema = z.object({
    code: z.string().trim().min(1, "Add meg a tanterv kódját."),
    name: z.string().trim().optional(),
    major: z.string().trim().optional(),
    requiredCount: z.string().trim().optional(),
    dryRun: z.enum(["true", "false"]).default("true"),
});

const requiredCountSchema = z.record(z.string(), z.number().int().positive());

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const parts = (await readMultipartFormData(event)) ?? [];
    const upload = parts.find((p) => p.name === "file" && p.filename);
    if (!upload?.filename) {
        throw createError({ statusCode: 400, message: "Nincs feltöltött fájl." });
    }
    if (upload.data.length > MAX_FILE_BYTES) {
        throw createError({ statusCode: 413, message: "A fájl legfeljebb 5 MB lehet." });
    }

    const rawFields = Object.fromEntries(
        parts.filter((p) => !p.filename && p.name).map((p) => [p.name!, p.data.toString("utf8")]),
    );
    const fields = fieldsSchema.safeParse(rawFields);
    if (!fields.success) {
        throw createError({ statusCode: 400, message: fields.error.issues[0]?.message ?? "Hibás adatok." });
    }
    const { code, name, major, dryRun } = fields.data;

    let requiredCount: Record<string, number> | undefined;
    if (fields.data.requiredCount) {
        try {
            requiredCount = requiredCountSchema.parse(JSON.parse(fields.data.requiredCount));
        } catch {
            throw createError({
                statusCode: 400,
                message: 'A darabszám-követelmény formátuma: {"Kritériumtárgyak": 2}',
            });
        }
    }

    try {
        const rows = readSheetRows(new Uint8Array(upload.data), upload.filename);
        const parsed = parseCurriculumSheet(rows, {
            code,
            name: name || undefined,
            major: major || undefined,
            requiredCount,
        });

        const summary = {
            code: parsed.file.code,
            name: parsed.file.name,
            major: parsed.file.major,
            totalCreditsRequired: parsed.file.totalCreditsRequired,
            groups: parsed.file.groups.map((g) => ({
                name: g.name,
                requiredCredits: g.requiredCredits,
                isSpecialization: g.isSpecialization,
                subgroups: g.subgroups.map((s) => ({
                    name: s.name,
                    type: s.type,
                    requiredCredits: s.requiredCredits,
                    requiredCount: s.requiredCount,
                    subjects: s.subjects.length,
                })),
            })),
        };

        const result = dryRun === "true" ? null : await importCurriculum(db, parsed.file);

        return {
            dryRun: dryRun === "true",
            summary,
            warnings: parsed.warnings,
            skippedFinalExams: parsed.skippedFinalExams,
            result,
        };
    } catch (e) {
        if (e instanceof CurriculumParseError) {
            throw createError({ statusCode: 422, message: e.message });
        }
        if (e instanceof ZodError) {
            const issues = e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  - ");
            throw createError({ statusCode: 422, message: `A tanterv nem felel meg a sémának:\n  - ${issues}` });
        }
        if (e instanceof Error && e.message.includes("hallgató")) {
            throw createError({ statusCode: 409, message: e.message });
        }
        throw e;
    }
});
