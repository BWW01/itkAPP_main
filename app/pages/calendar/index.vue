<script setup lang="ts">
import {ref, computed} from 'vue'
import {CalendarPlus} from 'lucide-vue-next'
import {parseIcsToEvents, type CalendarEvent} from '@/utils/parseIcs'
import type {CalView, DayCell} from "@/types/calendar";

definePageMeta({layout: "default"})
useHead({title: $t('pages.calendar')})

const {user} = useUserSession()
const username = computed(() => (user.value as any)?.login)

// --- View ---
const view = ref<CalView>('month')

// --- Navigation ---
const currentDate = ref(new Date())

const monthDays = computed<DayCell[]>(() => {
    const year = currentDate.value.getFullYear()
    const month = currentDate.value.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []
    const blankDaysBefore = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < blankDaysBefore; i++) days.push({day: null, current: false})
    for (let i = 1; i <= daysInMonth; i++) days.push({day: i, current: true})
    const remainingCells = days.length % 7
    const blankDaysAfter = remainingCells === 0 ? 0 : 7 - remainingCells
    for (let i = 0; i < blankDaysAfter; i++) days.push({day: null, current: false})
    return days
})

const weeks = computed(() => {
    const res = []
    for (let i = 0; i < monthDays.value.length; i += 7)
        res.push(monthDays.value.slice(i, i + 7))
    return res
})

function navigate(direction: 'previous' | 'next') {
    const d = new Date(currentDate.value)
    if (view.value === 'month') {
        d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view.value === 'week') {
        d.setDate(d.getDate() + (direction === 'next' ? 7 : -7))
    } else if (view.value === '3day') {
        d.setDate(d.getDate() + (direction === 'next' ? 3 : -3))
    } else {
        d.setDate(d.getDate() + (direction === 'next' ? 1 : -1))
    }
    currentDate.value = d
}

function goToToday() {
    currentDate.value = new Date()
}

// --- Events ---
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadCalendar() {
    if (!username.value) return
    loading.value = true
    error.value = null
    try {
        const icsString = await $fetch<string>(`/api/calendar`, {
            headers: {Accept: 'text/calendar'}
        })
        events.value = parseIcsToEvents(icsString)
    } catch (e: any) {
        if (e?.statusCode === 404) {
            events.value = []
        } else {
            error.value = 'Nem sikerült betölteni a naptárat.'
        }
    } finally {
        loading.value = false
    }
}

loadCalendar()

const upcomingEvents = computed(() => {
    const now = new Date()
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events.value
        .filter(e => {
            const d = new Date(e.year, e.month, e.date)
            return d >= now && d <= in7days
        })
        .sort((a, b) => new Date(a.year, a.month, a.date).getTime() - new Date(b.year, b.month, b.date).getTime())
        .slice(0, 5)
})

// --- Modal ---
const showConnectModal = ref(false)
</script>

<template>
    <div class="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">

        <CalConnectModal
            v-model:open="showConnectModal"
            :username="username"
            @saved="loadCalendar"
        />

        <CalHeader
            :current-date="currentDate"
            :loading="loading"
            :error="error"
            :view="view"
            @previous="navigate('previous')"
            @next="navigate('next')"
            @today="goToToday"
            @view-change="view = $event"
        />

        <Fab :icon="CalendarPlus" label="" @click="showConnectModal = true"/>

        <div class="flex-1 min-h-0 flex overflow-hidden p-0 py-4 md:p-4 gap-4">

            <CalMonthView
                v-if="view === 'month'"
                :weeks="weeks"
                :current-date="currentDate"
                :events="events"
            />

            <CalTimeView
                v-else-if="view === 'week'"
                :current-date="currentDate"
                :events="events"
                :days="7"
            />

            <CalTimeView
                v-else-if="view === '3day'"
                :current-date="currentDate"
                :events="events"
                :days="3"
            />

            <CalTimeView
                v-else-if="view === 'day'"
                :current-date="currentDate"
                :events="events"
                :days="1"
            />

            <CalSidebar
                :upcoming-events="upcomingEvents"
                :loading="loading"
                @open-connect-modal="showConnectModal = true"
            />
        </div>
    </div>
</template>