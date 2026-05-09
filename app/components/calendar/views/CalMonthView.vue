<script setup lang="ts">
import type {DayCell} from "~/types/calendar"
import type {CalendarEvent} from '~/utils/parseIcs'

const {locale} = useI18n()

const props = defineProps<{
    weeks: DayCell[][]
    currentDate: Date
    events: CalendarEvent[]
}>()

const emit = defineEmits<{
    daySelected: [day: number]
}>()

const DAY_LABELS_FULL = computed(() => locale.value === 'hu'
    ? ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
)

const DAY_LABELS_SHORT = computed(() => locale.value === 'hu'
    ? ['H', 'K', 'Sz', 'Cs', 'P', 'Szo', 'V']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
)

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
    <div class="flex-1 flex flex-col min-w-0 bg-card overflow-hidden rounded-xl">

        <!-- Day headers - full on desktop, short on mobile -->
        <div class="grid grid-cols-7 shrink-0">
            <div v-for="(d, i) in DAY_LABELS_FULL" :key="d"
                 class="py-2.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center border-r border-border last:border-0">
                <span class="hidden md:inline">{{ d }}</span>
                <span class="md:hidden">{{ DAY_LABELS_SHORT[i] }}</span>
            </div>
        </div>

        <!-- Week rows -->
        <div
            class="flex-1 grid grid-cols-7 overflow-hidden"
            :style="`grid-template-rows: repeat(${weeks.length}, 1fr)`"
        >
            <template v-for="(week, wIdx) in weeks" :key="wIdx">

                <!-- Desktop: full CalCell with event pills -->
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

<style scoped>
.bg-stripes {
    background-image: linear-gradient(45deg, var(--card) 25%, var(--background) 25%, var(--background) 50%, var(--card) 50%, var(--card) 75%, var(--background) 75%, var(--background) 100%);
    background-size: 16.97px 16.97px;
}
</style>