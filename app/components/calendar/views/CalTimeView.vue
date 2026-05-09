<script setup lang="ts">
import type {CalendarEvent} from '~/utils/parseIcs'
import CalEventRectangle from "~/components/calendar/event/CalEventRectangle.vue";

const {locale} = useI18n()

const props = defineProps<{
    currentDate: Date
    events: CalendarEvent[]
    days: 1 | 3 | 7
}>()

const HOUR_HEIGHT = 64

const DAY_LABELS_FULL = computed(() => locale.value === 'hu'
    ? ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
)

const DAY_LABELS_SHORT = computed(() => locale.value === 'hu'
    ? ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
    : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
)
const hours = Array.from({length: 24}, (_, i) => i)

const gridStyle = computed(() => `grid-template-columns: 45px repeat(${props.days}, 1fr)`)

const visibleDays = computed(() => {
    const date = new Date(props.currentDate)
    if (props.days === 1) return [new Date(date)]
    if (props.days === 3) {
        return Array.from({length: 3}, (_, i) => {
            const d = new Date(date)
            d.setDate(date.getDate() - 1 + i)
            return d
        })
    }
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        return d
    })
})

function isToday(date: Date): boolean {
    const now = new Date()
    return date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
}

function getEvents(date: Date, allDay: boolean): CalendarEvent[] {
    return props.events.filter(e =>
        e.date === date.getDate() &&
        e.month === date.getMonth() &&
        e.year === date.getFullYear() &&
        e.allDay === allDay
    )
}

const currentTimeTop = computed(() => {
    const n = new Date()
    return (n.getHours() + n.getMinutes() / 60) * HOUR_HEIGHT
})

const {eventColor} = useEventColor();

function overlaps(a: CalendarEvent, b: CalendarEvent): boolean {
    const aStart = a.startHour * 60 + a.startMinute
    const aEnd = Math.max(a.endHour * 60 + a.endMinute, aStart + 30)
    const bStart = b.startHour * 60 + b.startMinute
    const bEnd = Math.max(b.endHour * 60 + b.endMinute, bStart + 30)
    return aStart < bEnd && aEnd > bStart
}

// For each event, count how many earlier events overlap with it.
// That number becomes the left offset
function getLayoutedEvents(date: Date) {
    const events = getEvents(date, false)
    const sorted = [...events].sort((a, b) =>
        (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
    )
    return sorted.map((event, i) => {
        const col = sorted.slice(0, i).filter(e => overlaps(e, event)).length
        return {event, col}
    })
}

</script>

<template>
    <div class="flex-1 bg-card overflow-hidden rounded-xl relative">
        <div class="h-full overflow-y-auto">

            <!-- Sticky header -->
            <div class="grid sticky top-0 z-30 bg-card border-b border-border shadow-sm" :style="gridStyle">
                <div class="border-r border-border"/>
                <div v-for="(date, i) in visibleDays" :key="i"
                     class="border-r border-border last:border-r-0 px-2 py-1.5 flex flex-col items-center gap-1">
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {{
                            days === 1
                                ? DAY_LABELS_FULL[date.getDay() === 0 ? 6 : date.getDay() - 1]
                                : DAY_LABELS_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1]
                        }}
                    </span>
                    <span :class="[
                        'w-5 md:w-8 h-5 inline-flex items-center justify-center text-xs font-bold rounded-full',
                        isToday(date) ? 'bg-primary text-primary-foreground' : 'text-foreground'
                    ]">
                        {{ date.getDate() }}
                    </span>
                    <div class="w-full space-y-0.5 min-h-4">
                        <div v-for="event in getEvents(date, true)" :key="event.id"
                             :class="['text-[9px] font-bold px-1.5 py-0.5 rounded truncate border', eventColor(event.color)]">
                            {{ event.title }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Time grid -->
            <div class="grid" :style="gridStyle">

                <!-- Hour labels -->
                <div class="border-r border-border w-[45px]">
                    <div v-for="hour in hours" :key="hour"
                         :style="`height: ${HOUR_HEIGHT}px`"
                         class="border-b border-border/40 flex items-start justify-end pr-2 pt-0.5">
                        <span class="text-xs md:text-sm text-muted-foreground font-medium">
                            {{ hour === 0 ? '' : `${hour}:00` }}
                        </span>
                    </div>
                </div>

                <!-- Day columns -->
                <div v-for="(date, colIdx) in visibleDays" :key="colIdx"
                     class="relative border-r border-border last:border-r-0">

                    <!-- Hour lines -->
                    <div v-for="hour in hours" :key="hour"
                         :style="`height: ${HOUR_HEIGHT}px`"
                         class="border-b border-border/40"/>

                    <!-- Current time indicator -->
                    <div v-if="isToday(date)"
                         class="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                         :style="`top: ${currentTimeTop}px`">
                        <div class="w-2 h-2 rounded-full bg-primary -ml-1 shrink-0"/>
                        <div class="flex-1 h-px bg-primary"/>
                    </div>

                    <!-- Events -->
                    <CalEventRectangle v-for="{ event, col } in getLayoutedEvents(date)" :event="event" :col="col"/>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
}
</style>