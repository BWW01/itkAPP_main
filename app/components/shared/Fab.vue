<script setup lang="ts">
import type {Component} from 'vue'

defineProps<{
    icon: Component
    label?: string
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
    <button
        class="md:hidden fixed bottom-24 right-4 z-40 flex items-center gap-3 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg hover:shadow-xl hover:brightness-110 active:brightness-90 active:scale-95 transition-all duration-200 px-4"
        data-testid="fab"
        @click="emit('click')"
    >
        <component :is="icon" class="w-6 h-6 shrink-0"/>
        <span v-if="label" class="text-sm font-semibold pr-1">{{ label }}</span>
    </button>
</template>