<script setup lang="ts">
import {LogOut} from 'lucide-vue-next'
import type {Component} from 'vue'
import NavRailItem from "~/components/nav/NavRailItem.vue";

const {clear} = useUserSession()

defineProps<{
    items: { label: string; to: string; icon: Component }[]
}>()

async function logout() {
    await clear()
    await navigateTo('/login')
}
</script>

<template>
    <aside class="hidden md:flex flex-col items-center w-20 shrink-0 bg-card py-4 gap-1">

        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center justify-center w-14 h-14 mb-2 shrink-0">
            <NuxtImg src="/icons/itkapp-col.png" class="h-8 w-auto"/>
        </NuxtLink>

        <!-- Nav items -->
        <NuxtLink
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            class="w-full"
            v-slot="{ isActive }"
        >
            <NavRailItem :icon="item.icon" :label="item.label" :is-active="isActive"/>
        </NuxtLink>

        <div class="flex-1"/>

        <!-- User menu -->
        <button @click="logout">
            <NavRailItem :icon="LogOut" :label="$t('pages.logout')" :is-active="false"
                         class="cursor-pointer"/>
        </button>
    </aside>
</template>