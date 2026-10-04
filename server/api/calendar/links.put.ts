import { z } from "zod";
import { upsertLinks } from "../../utils/mergeIcs";
import { ErrorCode } from "#shared/types/errorCodes";

const httpsUrl = z
    .string()
    .trim()
    .url(ErrorCode.INVALID_URL)
    .refine((u) => u.startsWith("https://"), ErrorCode.INVALID_URL);

const optionalLink = z
    .union([httpsUrl, z.literal(""), z.null()])
    .optional()
    .transform((u) => (u ? { url: u, syncInterval: "1d" } : null));

const bodySchema = z.object({
    neptunLink: optionalLink,
    moodleLink: optionalLink,
    extras: z
        .array(
            z.object({
                url: httpsUrl,
                syncInterval: z.string().regex(/^\d+[mhd]$/, ErrorCode.INVALID_SYNC_INTERVAL),
            })
        )
        .default([]),
});

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: { code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY },
        });
    }

    await upsertLinks(user.login, parsed.data);
    return null;
});