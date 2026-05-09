<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import {cn} from '@/lib/utils'

const props = defineProps<{
    label: string
    href?: string
    target?: string
    class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
    <component
        :is="href ? 'a' : 'button'"
        :href="href"
        :target="target"
        :class="cn(
            'flex flex-col items-center justify-center gap-1.5 py-3 w-full bg-card rounded-[8px]',
            'hover:bg-muted/60 transition-colors duration-150 cursor-pointer',
            props.class
        )"
        @click="!href && emit('click')"
    >
        <div class="w-10 h-10 flex items-center justify-center">
            <slot/>
        </div>
        <span class="text-[10px] font-semibold text-muted-foreground leading-tight">{{ label }}</span>
    </component>
</template>