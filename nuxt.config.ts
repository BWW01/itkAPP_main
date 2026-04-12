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
        vapidPrivateKey: "",   // set via NUXT_VAPID_PRIVATE_KEY
        vapidMailto: "",       // set via NUXT_VAPID_MAILTO
        public: {
            vapidPublicKey: "", // set via NUXT_PUBLIC_VAPID_PUBLIC_KEY
        },
    },

    eslint: {
        config: {
            nuxt: {
                sortConfigKeys: true
            }
        }
    },

    pwa: {
        registerType: "autoUpdate",
        manifest: {
            name: "ITK App",
            short_name: "ITKApp",
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            start_url: "/",
            icons: [
                {
                    src: "/icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                },
                {
                    src: "/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                },
                {
                    src: "/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable",
                },
            ],
        },
        workbox: {
            navigateFallback: "/",
        },
        devOptions: {
            enabled: true,
        },
        strategies: "injectManifest",
        srcDir: ".",
        filename: "sw-push.ts",
    },

}satisfies NuxtConfig);