import { z } from "zod";
import { db } from "../../db";
import { siteColors, studentSites } from "../../db/schema";
import { ErrorCode } from "#shared/types/errorCodes";

const bodySchema = z.object({
    tags: z.array(z.string().trim()),
    isPublic: z.boolean().optional(),
    isPhpEnabled: z.boolean().optional(),
    color: z.enum(siteColors).optional(),
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

    const [site] = await db
        .insert(studentSites)
        .values({ 
            login: user.login,
            userId: user.id,
            tags: parsed.data.tags,
            isPublic: parsed.data.isPublic ?? true,
            isPhpEnabled: parsed.data.isPhpEnabled ?? false,
            url: `https://users.itk.ppke.hu/~${user.login}`,
            color: parsed.data.color,
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({ target: studentSites.login, set: {
            userId: user.id,
            tags: parsed.data.tags,
            isPublic: parsed.data.isPublic ?? true,
            isPhpEnabled: parsed.data.isPhpEnabled ?? false,
            color: parsed.data.color,
            updatedAt: new Date(),
        }})
        .returning({
            login: studentSites.login,
            url: studentSites.url,
            tags: studentSites.tags,
            isPublic: studentSites.isPublic,
            isPhpEnabled: studentSites.isPhpEnabled,
            color: studentSites.color,
        });

    return {...site, name: user.name};
});