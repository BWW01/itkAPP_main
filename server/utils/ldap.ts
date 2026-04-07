import { authenticate } from "ldap-authentication";

// Ide csatlakozik a Nuxt, az SSH alagút pedig elviszi az egyetemig
//const LDAP_URL = "ldap://localhost:3890";
//const LDAP_URL = "ldap://ldap2.itk.ppke.hu";
//const BASE_DN = "dc=itk,dc=ppke,dc=hu";

const LDAP_URL="ldap://ldap2.itk.ppke.hu:389"
const BASE_DN = "dc=itk,dc=ppke,dc=hu";


export async function ldapLogin(username: string, password: string) {
    try {
        const authenticatedUser = await authenticate({
            ldapOpts: { url: LDAP_URL },
            userDn: `uid=${username},ou=people,${BASE_DN}`,
            userPassword: password,
        });

        return authenticatedUser;
    } catch (error: any) {
        console.error("LDAP Bejelentkezési hiba:", error.message, error);
        return null;
    }
}
