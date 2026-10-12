import {isAdminLogin} from "#server/utils/admin";

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    return { isAdmin: isAdminLogin(event, session.user.login) };
});
