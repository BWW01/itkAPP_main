import { upsertLinks } from "../../utils/mergeIcs";
import type { CalendarLink } from "../../db/schema";

export default defineEventHandler(async (event) => {
    try {
        assertMethod(event, "POST");
        const body = await readBody<{
            username: string;
            neptuneLink?: CalendarLink | null;
            moodleLink?: CalendarLink | null;
            extras?: CalendarLink[];
        }>(event);

        if (!body?.username) {
            throw createError({ statusCode: 400, message: "No user" });
        }

        const result = await upsertLinks(body.username, {
            neptuneLink: body.neptuneLink,
            moodleLink: body.moodleLink,
            extras: body.extras,
        });

        return { status: "success", data: result };
    } catch (e: any) {
        console.error("Route Error:", e);
        throw createError({
            statusCode: 500,
            statusMessage: e.message,
            data: { stack: e.stack },
        });
    }
});