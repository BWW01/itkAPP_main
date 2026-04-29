import { syncUserCalendar } from "../../utils/mergeIcs";

export default defineEventHandler(async (event) => {
    // Sessionből is kiszedheted a usert, ha már van bejelentkezés
    const body = await readBody<{ username: string }>(event);

    if (!body?.username) {
        throw createError({ statusCode: 400, statusMessage: "Felhasználónév kötelező!" });
    }

    try {
        // A forceAll: true kikényszeríti az azonnali letöltést az összes linkről
        const result = await syncUserCalendar(body.username, { forceAll: true });

        return {
            status: "success",
            changed: result?.changed || false,
            message: result?.changed ? "Naptár sikeresen frissítve!" : "A naptár már naprakész, nem volt új esemény."
        };
    } catch (e: any) {
        console.error("Szinkronizációs hiba:", e);
        throw createError({
            statusCode: 500,
            statusMessage: "Hiba történt a naptár szinkronizálása közben.",
        });
    }
});