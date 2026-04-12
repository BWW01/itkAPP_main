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
    ],
    link: [
        {rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico'},
    ]
})

</script>