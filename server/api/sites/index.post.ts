import { z } from "zod";
import { db } from "../../db";
import { studentSites } from "../../db/schema";
import { ErrorCode } from "#shared/types/errorCodes";

const bodySchema = z.object({
    tags: z.array(z.string().trim()),
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

    const values = {
        ...parsed.data,
        name: user.name,
        url: `https://users.itk.ppke.hu/~${user.login}`,
        updatedAt: new Date(),
    };

    const [site] = await db
        .insert(studentSites)
        .values({ userId: user.id, ...values })
        .onConflictDoUpdate({ target: studentSites.userId, set: values })
        .returning({
            name: studentSites.name,
            url: studentSites.url,
            tags: studentSites.tags,
            category: studentSites.category,
        });

    return site;
});