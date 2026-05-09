<script setup lang="ts">
import {RefreshCw, AlertCircle} from 'lucide-vue-next'

const {locale} = useI18n()

const props = defineProps<{
    currentDate: Date
    loading?: boolean
    error?: string | null
}>()

const monthName = computed(() =>
    props.currentDate.toLocaleString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {month: 'long'})
)
</script>

<template>
    <div class="flex items-center gap-2 min-w-0">
        <h1 class="text-2xl font-bold text-foreground capitalize tracking-tight truncate">
            {{ monthName }}
            <span class="text-muted-foreground font-normal">{{ currentDate.getFullYear() }}</span>
        </h1>
        <RefreshCw v-if="loading" class="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0"/>
        <AlertCircle v-if="error" class="w-3.5 h-3.5 text-destructive shrink-0"/>
    </div>
</template>