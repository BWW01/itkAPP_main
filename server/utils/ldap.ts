import { authenticate } from "ldap-authentication";

const config = useRuntimeConfig();
const LDAP_URL = config.ldapUrl;
const BASE_DN = config.ldapBaseDn;

export async function ldapLogin(username: string, password: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) return null;

    try {
        return await authenticate({
            ldapOpts: { url: LDAP_URL },
            userDn: `uid=${username},ou=people,${BASE_DN}`,
            userPassword: password,
            userSearchBase: `ou=people,${BASE_DN}`,
            usernameAttribute: "uid",
            username,
            attributes: ["uid", "cn", "displayName", "givenName", "sn", "mail"],
        });
    } catch (error: any) {
        console.error("LDAP Bejelentkezési hiba:", error.message);
        return null;
    }
}