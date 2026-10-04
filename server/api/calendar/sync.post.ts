import { syncUserCalendar } from "../../utils/mergeIcs";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const result = await syncUserCalendar(user.login, { forceAll: true });
    return { changed: result?.changed ?? false };
});