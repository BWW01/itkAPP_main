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
            .filter((v) => v !== null && v !== undefined)
            .map((v) => {
                if (!Buffer.isBuffer(v)) return String(v);
                if (!/;binary$/i.test(key)) {
                    console.warn(`LDAP: a(z) "${key}" értéke nem érvényes UTF-8, ezért base64-ként tárolom`);
                }
                return v.toString("base64");
            });
        if (values.length > 0) out[key] = values;
    }
    return out;
}

function reader(attrs: LdapRawAttributes) {
    const byLower = new Map(Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v]));
    const all = (name: string): string[] => byLower.get(name.toLowerCase()) ?? [];
    const one = (name: string): string | null => all(name)[0] ?? null;
    return {all, one};
}

function toInt(v: string | null): number | null {
    if (v === null || v.trim() === "") return null;
    const n = Number(v);
    return Number.isSafeInteger(n) ? n : null;
}

function toBool(v: string | null): boolean | null {
    const u = v?.toUpperCase();
    return u === "TRUE" ? true : u === "FALSE" ? false : null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toUuid(v: string | null): string | null {
    return v && UUID_RE.test(v) ? v.toLowerCase() : null;
}

export function parseGeneralizedTime(v: string | null): Date | null {
    if (!v) return null;
    const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:[.,](\d+))?(Z|[+-]\d{2}(?:\d{2})?)?$/.exec(v);
    if (!m) return null;
    const [, y, mo, d, h, mi, s = "00", frac = "", tz = "Z"] = m;
    const ms = frac ? Math.floor(Number(`0.${frac}`) * 1000) : 0;
    const offset = tz === "Z" ? "Z" : `${tz.slice(0, 3)}:${tz.slice(3) || "00"}`;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}.${String(ms).padStart(3, "0")}${offset}`);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function ldapEntryToRow(entry: LdapEntry, loginUsername: string): LdapInfoInsert {
    const raw = normalizeLdapEntry(entry);
    const {one, all} = reader(raw);

    const uid = all("uid").find((u) => u.toLowerCase() === loginUsername.toLowerCase()) ?? loginUsername;

    return {
        cn: one("cn"),
        cnEn: one("cn;lang-en"),
        createTimestamp: parseGeneralizedTime(one("createTimestamp")),
        creatorsName: one("creatorsName"),


        displayName: one("displayName"),
        dn: typeof entry.dn === "string" ? entry.dn : one("entryDN"),
        eduPersonAffiliation: all("eduPersonAffiliation"),
        eduPersonEntitlement: all("eduPersonEntitlement"),
        eduPersonOrgUnitDN: one("eduPersonOrgUnitDN"),
        email: one("mail"),
        entryCSN: one("entryCSN"),


        entryDN: one("entryDN"),
        entryUUID: toUuid(one("entryUUID")),


        familyName: one("sn") ?? "",
        familyNameEn: one("sn;lang-en"),
        gidNumber: toInt(one("gidNumber")),
        givenName: one("givenName") ?? "",
        givenNameEn: one("givenName;lang-en"),


        hasSubordinates: toBool(one("hasSubordinates")),
        homeDirectory: one("homeDirectory"),
        ldapSyncedAt: new Date(),


        ldapUsername: uid,
        loginShell: one("loginShell"),
        mailHost: one("mailHost"),
        modifiersName: one("modifiersName"),


        modifyTimestamp: parseGeneralizedTime(one("modifyTimestamp")),
        objectClass: all("objectClass"),
        ppkePersonActivityStatus: one("ppkePersonActivityStatus"),


        ppkePersonFaculty: one("ppkePersonFaculty"),
        ppkePersonMajor: one("ppkePersonMajor"),


        ppkePersonOrgID: one("ppkePersonOrgID"),
        rawAttributes: raw,
        sambaPrimaryGroupSID: one("sambaPrimaryGroupSID"),
        sambaPwdLastSet: toInt(one("sambaPwdLastSet")),
        sambaSID: one("sambaSID"),
        shadowLastChange: toInt(one("shadowLastChange")),
        structuralObjectClass: one("structuralObjectClass"),
        subschemaSubentry: one("subschemaSubentry"),


        uidNumber: toInt(one("uidNumber")),
        zimbraMailDeliveryAddress: one("zimbraMailDeliveryAddress"),
    };
}

export async function upsertLdapUser(entry: LdapEntry, loginUsername: string) {
    const row = ldapEntryToRow(entry, loginUsername);
    const {ldapUsername: _key, ...updatable} = row;

    const [saved] = await db
        .insert(ldapInfo)
        .values(row)
        .onConflictDoUpdate({
            target: ldapInfo.ldapUsername,
            set: {...updatable, updatedAt: new Date()},
        })
        .returning();

    return saved!;
}