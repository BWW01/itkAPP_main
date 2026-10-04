import { z } from "zod";
import { ErrorCode } from "#shared/types/errorCodes";

const bodySchema = z.object({
    username: z.string().trim().min(1, ErrorCode.MISSING_CREDENTIALS),
    password: z.string().min(1, ErrorCode.MISSING_CREDENTIALS),
});

export default defineEventHandler(async (event) => {
    const parsed = bodySchema.safeParse(await readBody(event));
    if (!parsed.success) {
        throw createError({ statusCode: 400, data: { code: ErrorCode.MISSING_CREDENTIALS } });
    }
    const { username, password } = parsed.data;

    const ldapEntry = await ldapLogin(username, password);
    if (!ldapEntry) {
        throw createError({ statusCode: 401, data: { code: ErrorCode.INVALID_CREDENTIALS } });
    }

    const user = await upsertLdapUser(ldapEntry, username);

    await setUserSession(event, {
        user: {
            id: user.id,
            login: user.ldapUsername,
            email: user.email,
            name: user.fullName,
            givenName: user.givenName,
            familyName: user.familyName,
        },
    });

    return null;
});