<script setup lang="ts">
import type {Component} from 'vue'

defineProps<{
    icon: Component
    label: string
    isActive: boolean
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-1 w-full py-2 px-1">
        <div :class="[
            'flex items-center justify-center h-8 rounded-full transition-all duration-300 ease-in-out',
            isActive ? 'w-16 bg-primary/15' : 'w-8 hover:bg-muted'
        ]">
            <component :is="icon" :class="[
                'h-5 w-5 transition-colors duration-200 shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground'
            ]"/>
        </div>
        <span :class="[
            'text-[10px] font-semibold transition-colors duration-200',
            isActive ? 'text-primary' : 'text-muted-foreground'
        ]">{{ label }}</span>
    </div>
</template>