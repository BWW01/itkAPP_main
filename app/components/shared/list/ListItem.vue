<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import {cn} from '@/lib/utils'

const props = defineProps<{
    class?: HTMLAttributes['class']
    as?: string
    href?: string
    target?: string
    static?: boolean
}>()
</script>

<template>
    <component
        :is="href ? 'a' : (as ?? 'div')"
        :href="href"
        :target="target"
        :class="cn(
            'flex items-center gap-1.5 px-4 py-3 w-full bg-card rounded-[8px]',
            props.class, !props.static && 'hover:bg-muted/60 transition-colors duration-150 cursor-pointer'
        )"
    >
        <slot/>
    </component>
</template>