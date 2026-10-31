import { getMergedCalendar, mergeIcs } from "../../utils/mergeIcs";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const mergedIcal = (await getMergedCalendar(user.login)) ?? mergeIcs([]);

    setHeaders(event, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${user.login}.ics"`,
    });
    return mergedIcal;
});