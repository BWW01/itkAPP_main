<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import {cn} from '@/lib/utils'

const props = defineProps<{
    title: string
    description?: string
    class?: HTMLAttributes['class']
}>()
</script>

<template>
    <div :class="cn('px-1 mb-2', props.class)">
        <h1 class="text-base font-bold text-foreground">{{ title }}</h1>
        <h2 v-if="description" class="text-xs text-muted-foreground mt-0.5">{{ description }}</h2>
    </div>
</template>