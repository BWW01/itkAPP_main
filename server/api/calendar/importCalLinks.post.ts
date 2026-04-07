import { upsertLinks } from "../../utils/mergeIcs";

export default defineEventHandler(async (event) => {
    try {
        assertMethod(event, "POST");
        const body = await readBody<{ username: string; links: string[] }>(event);

        if (!body?.username) {
            throw createError({ statusCode: 400, message: "Username is missing" });
        }

        const result = await upsertLinks(body.username, body.links || []);

        return { status: "success", data: result };
    } catch (e: any) {
        console.error("Route Error:", e);
        throw createError({
            statusCode: 500,
            statusMessage: e.message,
            data: { stack: e.stack }, // add this
        });
    }
});