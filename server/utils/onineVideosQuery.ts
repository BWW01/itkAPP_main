import {z} from "zod";
import {and, eq, ilike, or, type SQL} from "drizzle-orm";
import {onlineVideos} from "../db/schema";

const optionalText = (max: number) =>
    z
        .string()
        .trim()
        .max(max, `Legfeljebb ${max} karakter lehet.`)
        .optional()
        .transform((v) => (v ? v : undefined));

export const videoFilterSchema = z.object({
    semester: optionalText(32),
    subject: optionalText(200),
    q: optionalText(100),
});

export const videoListQuerySchema = videoFilterSchema.extend({
    limit: z.coerce
        .number({message: "A limit csak szám lehet."})
        .int("A limit csak egész szám lehet.")
        .min(1, "A limit legalább 1.")
        .max(200, "A limit legfeljebb 200.")
        .default(50),
    offset: z.coerce
        .number({message: "Az offset csak szám lehet."})
        .int("Az offset csak egész szám lehet.")
        .min(0, "Az offset nem lehet negatív.")
        .default(0),
});

export type VideoFilter = z.infer<typeof videoFilterSchema>;

export function parseVideoQuery<T extends z.ZodTypeAny>(schema: T, query: unknown): z.infer<T> {
    const parsed = schema.safeParse(query);
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            message: parsed.error.issues[0]?.message ?? "Hibás lekérdezési paraméter.",
        });
    }
    return parsed.data;
}

export function escapeLike(s: string): string {
    return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export function videoWhere(filter: VideoFilter, omit?: keyof VideoFilter): SQL | undefined {
    const parts: (SQL | undefined)[] = [];
    if (filter.semester && omit !== "semester") parts.push(eq(onlineVideos.semester, filter.semester));
    if (filter.subject && omit !== "subject") parts.push(eq(onlineVideos.subject, filter.subject));
    if (filter.q && omit !== "q") {
        const pattern = `%${escapeLike(filter.q)}%`;
        parts.push(
            or(
                ilike(onlineVideos.title, pattern),
                ilike(onlineVideos.subject, pattern),
                ilike(onlineVideos.uploader, pattern),
            ),
        );
    }
    return parts.length ? and(...parts) : undefined;
}