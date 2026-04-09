import type { NuxtConfig } from "@vite-pwa/nuxt";
export default defineNuxtConfig({
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
        "@vite-pwa/nuxt",
    ],
    imports: {
        autoImport: true,
        dirs: ["composables/**", "utils/**", "stores/**"],
    },
    runtimeConfig: {
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
        vapidMailto: process.env.VAPID_MAILTO,
        public: {
            vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        },
    },



    pwa: {
        registerType: "autoUpdate",
        manifest: {
            name: "My PWA",
            short_name: "PWA",
            theme_color: "#ffffff",
        },
        workbox: {
            navigateFallback: "/",
        },
        devOptions: {
            enabled: true, // enables PWA in dev mode
        },
        strategies: "injectManifest",
        srcDir: ".",
        filename: "sw-push.ts",
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

}satisfies NuxtConfig);