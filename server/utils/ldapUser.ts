import {ldapInfo, type LdapRawAttributes} from "../db/schema";
import {db} from "../db";

type LdapEntry = Record<string, unknown>;
export type LdapInfoInsert = typeof ldapInfo.$inferInsert;

const NON_ATTRIBUTE_KEYS = new Set(["dn", "*", "+"]);
const SECRET_ATTRIBUTE = /^(userPassword|authPassword|sambaNTPassword|sambaLMPassword|sambaPasswordHistory|unicodePwd)(;|$)/i;

export function normalizeLdapEntry(entry: LdapEntry): LdapRawAttributes {
    const out: LdapRawAttributes = {};
    for (const [key, value] of Object.entries(entry)) {
        if (NON_ATTRIBUTE_KEYS.has(key) || SECRET_ATTRIBUTE.test(key)) continue;
        const values = (Array.isArray(value) ? value : [value])
            .filter((v) => v != null)
            .map((v) => (Buffer.isBuffer(v) ? v.toString("base64") : String(v)));
        if (values.length > 0) out[key] = values;
    }
    return out;
}

export function ldapEntryToRow(entry: LdapEntry, loginUsername: string): LdapInfoInsert {
    const raw = normalizeLdapEntry(entry);
    const byLower = new Map(Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]));
    const all = (name: string) => byLower.get(name.toLowerCase()) ?? [];
    const one = (name: string) => all(name)[0] ?? null;

    const familyName = one("sn") ?? "";
    const givenName = one("givenName") ?? "";

    return {
        ldapUsername: all("uid").find((u) => u.toLowerCase() === loginUsername.toLowerCase()) ?? loginUsername,
        email: one("mail"),
        familyName,
        givenName,
        fullName: one("displayName") ?? one("cn") ?? `${familyName} ${givenName}`.trim(),
        eduPersonOrgUnitDN: one("eduPersonOrgUnitDN"),
        ldapSyncedAt: new Date(),
    };
}

export async function upsertLdapUser(entry: LdapEntry, loginUsername: string) {
    const {ldapUsername, ...rest} = ldapEntryToRow(entry, loginUsername);

    const [saved] = await db
        .insert(ldapInfo)
        .values({ldapUsername, ...rest})
        .onConflictDoUpdate({
            target: ldapInfo.ldapUsername,
            set: {...rest, updatedAt: new Date()},
        })
        .returning();

    return saved!;
}