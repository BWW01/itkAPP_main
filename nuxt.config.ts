export default defineNuxtConfig({
    runtimeConfig: {},
    compatibilityDate: "2025-07-15",
    devtools: { enabled: true },
    modules: [
        "@nuxt/icon",
        "@nuxt/image",
        "@nuxt/eslint",
        "@nuxtjs/tailwindcss",
        "shadcn-nuxt",
        "@vueuse/nuxt",
        "nuxt-auth-utils",
    ],
    imports: {
        autoImport: true,
        dirs: ["composables/**", "utils/**", "stores/**"],
    },
    components: [{ path: "~/components", pathPrefix: false }],
    shadcn: {
        prefix: "",
        componentDir: "@/components/ui",
    },
    nitro: {
        externals: {
            external: ["sharp"],
            inline: ["ipx", "ofetch"],
        },
    },
    image: {
        provider: "ipx",
    },
});