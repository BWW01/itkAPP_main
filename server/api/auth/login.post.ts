import { db } from "../../db";
import { ldapInfo } from "../../db/schema";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const username = body?.username;
    const password = body?.password;

    if (!username || !password) {
        throw createError({
            statusCode: 400,
            message: "Kérlek add meg a felhasználónevet és a jelszót!",
        });
    }

    const user = await ldapLogin(username, password);
    console.log("LDAP result:", user);

    if (!user) {
        throw createError({
            statusCode: 401,
            message: "Hibás felhasználónév vagy jelszó!",
        });
    }

    const displayName = user.displayName || user.cn || username;
    const [familyName, ...givenNames] = displayName.split(" ");
    const givenName = givenNames.join(" ") || familyName;

    try {
        await db
            .insert(ldapInfo)
            .values({
                ldapUsername: username,
                email: user.mail || null,
                familyName,
                givenName,
            })
            .onConflictDoUpdate({
                target: ldapInfo.ldapUsername,
                set: {
                    email: user.mail || null,
                    familyName,
                    givenName,
                },
            });
    } catch (e) {
        console.error("Failed to sync user to DB:", e);
    }

    await setUserSession(event, {
        user: {
            login: user.cn || username,
            email: user.mail || null,
            name: displayName,
        },
    });

    return { ok: true };
});