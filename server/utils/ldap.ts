import {authenticate} from "ldap-authentication";

const config = useRuntimeConfig()
const LDAP_URL = config.ldapUrl
const BASE_DN = config.ldapBaseDn

export async function ldapLogin(username: string, password: string) {
    try {
        const authenticatedUser = await authenticate({
            ldapOpts: {url: LDAP_URL},
            userDn: `uid=${username},ou=people,${BASE_DN}`,
            userPassword: password,
        });

        return authenticatedUser;
    } catch (error: any) {
        console.error("LDAP Bejelentkezési hiba:", error.message, error);
        return null;
    }
}
