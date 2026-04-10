<script setup lang="ts">
import type { CalendarEvent } from '@/utils/parseIcs'

const props = defineProps<{
    weeks: { day: number | null, current: boolean }[][]
    currentDate: Date
    events: CalendarEvent[]
}>()

const DAY_LABELS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']

function isToday(day: number | null) {
    if (!day) return false
    const now = new Date()
    return day === now.getDate() &&
        props.currentDate.getMonth() === now.getMonth() &&
        props.currentDate.getFullYear() === now.getFullYear()
}

function getEventsForDate(day: number | null): CalendarEvent[] {
    if (!day) return []
    const year = props.currentDate.getFullYear()
    const month = props.currentDate.getMonth()
    return props.events.filter(e => e.date === day && e.month === month && e.year === year)
}
</script>

<template>

    <div class="flex-1 flex flex-col min-w-0 bg-card overflow-hidden rounded-md">
        <!-- Day headers -->
        <div class="grid grid-cols-7 shrink-0">
            <div v-for="d in DAY_LABELS" :key="d"
                 class="py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center border-r border-border last:border-0">
                {{ d }}
            </div>
        </div>

        <!-- Week rows -->
        <div
            class="flex-1 grid grid-cols-7 overflow-hidden"
            :style="`grid-template-rows: repeat(${weeks.length}, 1fr)`"
        >
            <template v-for="(week, wIdx) in weeks" :key="wIdx">
                <CalCell
                    v-for="(dayObj, dIdx) in week"
                    :key="dIdx"
                    :day="dayObj.day"
                    :current="dayObj.current"
                    :is-today="isToday(dayObj.day)"
                    :events="getEventsForDate(dayObj.day)"
                    :is-last-col="(dIdx + 1) % 7 === 0"
                    :is-last-row="wIdx === weeks.length - 1"
                />
            </template>
        </div>
    </div>
</template>
