export default defineNuxtRouteMiddleware(async (to) => {
    const publicRoutes = ["/login"];
    if (publicRoutes.includes(to.path)) return;

    const { loggedIn } = useUserSession();
    if (!loggedIn.value) {
        return navigateTo("/login");
    }
});