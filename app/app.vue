<template>
    <VitePwaManifest/>
    <NuxtLayout>
        <NuxtPage/>
    </NuxtLayout>
</template>

<script lang="ts" setup>

useHead({
    titleTemplate: '%s | ITKApp',
    meta: [
        {name: 'description', content: 'PPKE ITKapp'},
        {name: 'viewport', content: 'width=device-width, initial-scale=1'},
        // Brave doesn't pick up the actual colors, maybe this helps
        {name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)'},
        {name: 'theme-color', content: '#09090b', media: '(prefers-color-scheme: dark)'},
        {name: 'apple-mobile-web-app-capable', content: 'yes'},
        {name: 'apple-mobile-web-app-status-bar-style', content: 'default'},
    ],
    link: [
        {rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico'},
        {rel: 'apple-touch-icon', href: '/android-chrome-192x192.png'},
    ]
})

</script>