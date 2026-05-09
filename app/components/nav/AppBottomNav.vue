<script setup lang="ts">
import type {Component} from 'vue'

defineProps<{
    items: { label: string; to: string; icon: Component }[]
}>()
</script>

<template>
    <nav class="md:hidden flex items-center bg-card h-20 pb-[env(safe-area-inset-bottom)]">
        <NuxtLink
            v-for="item in items"
            :key="item.to"
            :to="item.to"
            class="flex-1"
            v-slot="{ isActive }"
        >
            <NavRailItem :icon="item.icon" :label="item.label" :is-active="isActive"/>
        </NuxtLink>
    </nav>
</template>