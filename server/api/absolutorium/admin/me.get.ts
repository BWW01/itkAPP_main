export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);
    return { isAdmin: isAdminLogin(event, session.user.login) };
});
