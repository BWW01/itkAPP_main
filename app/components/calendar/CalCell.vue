<script setup lang="ts">
import type { CalendarEvent } from '@/utils/parseIcs'

defineProps<{
    day: number | null
    current: boolean
    isToday: boolean
    events: CalendarEvent[]
    isLastCol: boolean
    isLastRow: boolean
}>()
</script>

<template>
    <div :class="[
        'relative border-r border-b border-border p-2 transition-colors group overflow-hidden',
        !current ? 'bg-stripes' : 'bg-card hover:bg-muted/20',
        isLastCol ? 'border-r-0' : '',
        isLastRow ? 'border-b-0' : '',
    ]">
        <!-- Day number -->
        <span :class="[
            'w-6 h-6 inline-flex items-center justify-center text-xs font-bold rounded-full transition-colors',
            isToday
                ? 'bg-primary text-primary-foreground'
                : current
                    ? 'text-foreground'
                    : 'text-muted-foreground/40'
        ]">
            {{ day || '' }}
        </span>

        <!-- Events -->
        <div class="absolute inset-x-1.5 top-8 bottom-1.5 overflow-y-auto flex flex-col gap-1">
            <CalEventPopover v-for="event in events" :key="event.id" :event="event" />
        </div>
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar { width: 4px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }

.bg-stripes {
    background-image: linear-gradient(45deg, var(--card) 25%, var(--background) 25%, var(--background) 50%, var(--card) 50%, var(--card) 75%, var(--background) 75%, var(--background) 100%);
    background-size: 16.97px 16.97px;
}
</style>
