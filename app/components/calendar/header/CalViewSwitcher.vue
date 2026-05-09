<script setup lang="ts">
import {Check} from 'lucide-vue-next'
import type {CalView} from '@/types/calendar'

defineProps<{ view: CalView; fullWidth?: boolean }>()
const emit = defineEmits<{ change: [view: CalView] }>()

const views: { key: CalView; label: string }[] = [
    {key: 'month', label: $t('calendar.month')},
    {key: 'week', label: $t('calendar.week')},
    {key: '3day', label: $t('calendar.threeDay')},
    {key: 'day', label: $t('calendar.day')},
]
</script>

<template>
    <div
        :class="['flex items-center rounded-full border border-border overflow-hidden', fullWidth ? 'w-full' : 'shrink-0']">
        <button
            v-for="v in views"
            :key="v.key"
            :class="[
                'relative flex items-center justify-center gap-1.5 h-8 text-xs font-medium transition-all duration-200',
                'border-r border-border last:border-r-0',
                fullWidth ? 'flex-1' : 'px-4',
                view === v.key
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            ]"
            @click="emit('change', v.key)"
        >
            <Check v-if="view === v.key" class="w-3 h-3 shrink-0"/>
            {{ v.label }}
        </button>
    </div>
</template>