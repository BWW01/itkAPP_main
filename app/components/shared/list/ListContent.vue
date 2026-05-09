<script setup lang="ts">
import type {HTMLAttributes} from 'vue'
import {cn} from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
    <div :class="cn('rounded-2xl overflow-hidden', props.class)">
        <slot/>
    </div>
</template>