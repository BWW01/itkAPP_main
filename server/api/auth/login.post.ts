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
    const pick = (name: string): string | undefined => {
        const key = Object.keys(user).find((k) => k.toLowerCase() === name.toLowerCase());
        if (!key) return undefined;
        const raw = (user as Record<string, unknown>)[key];
        const v = Array.isArray(raw) ? raw[0] : raw;
        if (v == null) return undefined;
        const s = Buffer.isBuffer(v) ? v.toString("utf8") : String(v);
        return s.trim() || undefined;
    };

    const familyName = pick("sn") ?? username;
    const givenName = pick("givenName") ?? "";
    const displayName = pick("displayName") ?? (`${familyName} ${givenName}`.trim() || username);
    const email = pick("mail") ?? null;

    const [dbUser] = await db
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
        })
        .returning({ id: ldapInfo.id }); // ← get the DB id back

    await setUserSession(event, {
        user: {
            id: dbUser.id,
            login: username,
            email,
            name: displayName,
        },
    });

    return { ok: true };
});