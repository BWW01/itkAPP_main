import {defineNuxtConfig} from 'nuxt/config'

export default defineNuxtConfig({
    compatibilityDate: "2025-07-15",
    devtools: {enabled: true},
    modules: [
        "@nuxt/icon",
        "@nuxt/image",
        "@nuxt/eslint",
        "@nuxtjs/tailwindcss",
        "shadcn-nuxt",
        "@vueuse/nuxt",
        "nuxt-auth-utils",
        '@nuxtjs/i18n',
        ...(!process.env.VITEST ? ["@vite-pwa/nuxt"] : []),
    ],

    typescript: {
        tsConfig: {
            include: [
                '../tests/unit/**/*',
            ],
        },
    },

    /* PWA options */
    pwa: {
        registerType: 'autoUpdate',
        strategies: 'injectManifest',
        srcDir: '.',
        filename: 'sw-push.ts',
        manifest: {
            name: 'ITKApp',
            short_name: 'ITKApp',
            description: 'PPKE ITKApp',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [
                {src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'},
                {src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'},
            ]
        },
        workbox: {
            navigateFallback: '/',
        },
        client: {
            installPrompt: true,
        },
        devOptions: {
            enabled: true,
            type: 'module',
        },
    },

    // Localization
    i18n: {
        defaultLocale: 'hu',
        locales: [
            {code: 'hu', name: 'Magyar', file: 'hu.json'},
            {code: 'en', name: 'English', file: 'en.json'}
        ],
    },

    // CSS location
    css: [
        '~/assets/css/main.css',
    ],

    // Auto importing
    imports: {
        autoImport: true,
        dirs: ["composables/", "utils/", "stores/**"],
    },

    // Env variables
    runtimeConfig: {
        ldapUrl: process.env.LDAP_URL,
        ldapBaseDn: process.env.LDAP_BASE_DN,

        vapidPrivateKey: "",   // set via NUXT_VAPID_PRIVATE_KEY
        vapidMailto: "",       // set via NUXT_VAPID_MAILTO
        public: {
            vapidPublicKey: "", // set via NUXT_PUBLIC_VAPID_PUBLIC_KEY
        },
    },

    // ESLint config
    eslint: {
        config: {
            nuxt: {
                sortConfigKeys: true
            }
        }
    },

    // ShadCN Settings
    components: [{path: "~/components", pathPrefix: false}],
    shadcn: {
        prefix: "",
        componentDir: "@/components/ui",
    },

    // Nitro Server
    nitro: {
        externals: {
            external: ["sharp", "events"],
            inline: ["ipx", "ofetch"],
        },
    },

    // Image provider
    image: {
        provider: "ipx",
    },

})