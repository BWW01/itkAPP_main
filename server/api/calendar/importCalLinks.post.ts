import {upsertLinks} from "../../utils/mergeIcs";

import type {CalendarLink} from "#shared/types/calendar";

// Validation on the backend as well
function validateUrl(urlString: string | null | undefined): string | null {
    if (!urlString || urlString.trim() === "") return null;
    try {
        new URL(urlString.trim());
        return urlString.trim();
    } catch {
        throw createError({statusCode: 400, message: "Érvénytelen URL formátum!"});
    }
}

export default defineEventHandler(async (event) => {
    try {
        assertMethod(event, "POST");
        const body = await readBody<{
            username: string;
            neptunLink?: string | null;
            moodleLink?: string | null;
            extras?: CalendarLink[];
        }>(event);

        if (!body?.username) {
            throw createError({statusCode: 400, message: "No user"});
        }

        const safeNeptunUrl = validateUrl(body.neptunLink);
        const safeMoodleUrl = validateUrl(body.moodleLink);

        const result = await upsertLinks(body.username, {
            neptunLink: safeNeptunUrl ? {url: safeNeptunUrl, syncInterval: "1d"} as CalendarLink : null,
            moodleLink: safeMoodleUrl ? {url: safeMoodleUrl, syncInterval: "1d"} as CalendarLink : null,
            extras: body.extras || [],
        });

        return {status: "success", data: result};
    } catch (e: any) {
        console.error("Route Error:", e);
        throw createError({
            statusCode: 500,
            statusMessage: e.message,
            data: {stack: e.stack},
        });
    }
});