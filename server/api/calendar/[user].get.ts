import { getMergedCalendar } from "../../utils/mergeIcs";

export default defineEventHandler(async (event) => {
    const username = getRouterParam(event, "user");
    if (!username) {
        throw createError({ statusCode: 400, statusMessage: "Username required" });
    }

    const mergedIcal = await getMergedCalendar(username);
    if (!mergedIcal) {
        throw createError({ statusCode: 404, statusMessage: "No calendar found" });
    }

    setHeaders(event, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${username}.ics"`,
    });
    return mergedIcal;
});