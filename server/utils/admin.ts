import type { H3Event } from "h3";

export function isAdminLogin(event: H3Event, login: string | undefined): boolean {
    const admins = String(useRuntimeConfig(event).adminUsers ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return !!login && admins.includes(login.toLowerCase());
}

export async function requireAdmin(event: H3Event) {
    const session = await requireUserSession(event);
    if (!isAdminLogin(event, session.user.login)) {
        throw createError({ statusCode: 403, message: "Ehhez admin jogosultság kell." });
    }
    return session;
}
