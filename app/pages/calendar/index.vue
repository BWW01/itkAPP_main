<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, MoreHorizontal, Bell, ExternalLink, X } from "lucide-vue-next"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { parseIcsToEvents, type CalendarEvent } from '@/utils/parseIcs'


definePageMeta({ layout: "default" })

const { user } = useUserSession()

// --- Naptár navigáció ---
const currentDate = ref(new Date())

const monthName = computed(() =>
    currentDate.value.toLocaleString('hu-HU', { month: 'long' })
)

const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  const blankDaysBefore = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < blankDaysBefore; i++) days.push({ day: null, current: false })
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, current: true })
  const remainingCells = days.length % 7
  const blankDaysAfter = remainingCells === 0 ? 0 : 7 - remainingCells
  for (let i = 0; i < blankDaysAfter; i++) days.push({ day: null, current: false })

  return days
})

const weeks = computed(() => {
  const res = []
  for (let i = 0; i < monthDays.value.length; i += 7)
    res.push(monthDays.value.slice(i, i + 7))
  return res
})

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}
function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
function goToToday() {
  currentDate.value = new Date()
}

// --- iCal betöltés ---
const events = ref<CalendarEvent[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadCalendar() {
  if (!user.value?.name) return
  loading.value = true
  error.value = null

  try {
    const icsString = await $fetch<string>(`/api/calendar/${user.value.name}`, {
      headers: { Accept: 'text/calendar' }
    })
    events.value = parseIcsToEvents(icsString)
  } catch (e: any) {
    // 404 azt jelenti, még nincsenek mentett linkek
    if (e?.statusCode === 404) {
      events.value = []
    } else {
      error.value = 'Nem sikerült betölteni a naptárat.'
    }
  } finally {
    loading.value = false
  }
}

// Oldal betöltésekor automatikusan lekérjük
loadCalendar()

// --- Esemény szűrés ---
function getEventsForDate(day: number | null): CalendarEvent[] {
  if (!day) return []
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  return events.value.filter(e => e.date === day && e.month === month && e.year === year)
}

// Közelgő események (következő 7 nap)
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
</script>

<template>
    <div class="h-full flex flex-col bg-[#F9F9FB] overflow-hidden font-sans">
        <header class="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
            <div class="flex items-center gap-4">
                <h1 class="text-lg font-bold text-slate-900 capitalize w-40">
                    {{ monthName }} {{ currentDate.getFullYear() }}
                </h1>
                <div class="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button @click="previousMonth" class="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 hover:text-slate-900"><ChevronLeft class="w-4 h-4" /></button>
                    <button @click="goToToday" class="px-3 py-1 text-xs font-semibold hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 hover:text-slate-900">Ma</button>
                    <button @click="nextMonth" class="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 hover:text-slate-900"><ChevronRight class="w-4 h-4" /></button>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div class="flex bg-slate-100 rounded-lg p-0.5">
                    <button class="px-3 py-1 text-xs font-medium bg-white shadow-sm rounded-md">Hónap</button>
                    <button class="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-900 rounded-md transition-all">Hét</button>
                    <button class="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-900 rounded-md transition-all">Nap</button>
                </div>
                <Button size="sm" class="bg-primary text-white hover:bg-primary/90 rounded-lg px-4 h-8 text-xs font-bold">Új esemény</Button>
            </div>
        </header>

      <div v-if="loading" class="text-center text-xs text-slate-400 py-4">Naptár betöltése...</div>
      <div v-if="error" class="text-center text-xs text-red-400 py-4">{{ error }}</div>

        <div class="flex-1 flex overflow-hidden">
            <div class="flex-1 flex flex-col min-w-0 bg-white">
                <div class="grid grid-cols-7 border-b border-slate-200">
                    <div v-for="d in ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap']" :key="d"
                         class="py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-r border-slate-100 last:border-0">
                        {{ d }}
                    </div>
                </div>

                <div class="flex-1 grid grid-cols-7 auto-rows-fr overflow-hidden">
                    <template v-for="(week, wIdx) in weeks" :key="wIdx">
                        <div v-for="(dayObj, dIdx) in week" :key="dIdx"
                             :class="[
                                'relative border-r border-b border-slate-100 p-2 transition-colors',
                                !dayObj.current ? 'bg-stripes bg-slate-50/50' : 'bg-white hover:bg-slate-50/30'
                             ]">

                            <div class="flex justify-between items-start mb-1">
                                <span :class="['text-xs font-bold', dayObj.current ? 'text-slate-900' : 'text-slate-300']">
                                    {{ dayObj.day || '' }}
                                </span>
                            </div>

                            <div class="space-y-1 overflow-y-auto max-h-[calc(100%-1.5rem)] absolute inset-x-1 top-6 bottom-1">
                                <template v-for="event in getEventsForDate(dayObj.day)" :key="event.id">
                                    <Popover>
                                        <PopoverTrigger as-child>
                                            <div :class="[
                                                'group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm',
                                                'bg-white text-[11px] font-bold text-slate-700'
                                            ]">
                                                <div class="w-1 h-3 rounded-full shrink-0" :class="[
                                                    event.color === 'red' ? 'bg-red-500' :
                                                    event.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                                                ]"></div>
                                                <span class="truncate">{{ event.title }}</span>
                                            </div>
                                        </PopoverTrigger>

                                        <PopoverContent class="w-80 p-0 shadow-2xl border-slate-200 rounded-xl overflow-hidden" align="start">
                                            <div class="p-5 bg-white">
                                                <div class="flex justify-between items-start mb-5">
                                                    <div>
                                                        <span class="text-[10px] font-black uppercase text-slate-400 tracking-wider">{{ event.type }}</span>
                                                        <h3 class="text-base font-black text-slate-900 mt-1">{{ event.time }}</h3>
                                                    </div>
                                                    <div class="flex gap-1">
                                                        <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400"><Bell class="w-4 h-4" /></Button>
                                                        <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400"><MoreHorizontal class="w-4 h-4" /></Button>
                                                    </div>
                                                </div>

                                                <div class="space-y-4 mb-6">
                                                    <div class="flex items-center gap-3">
                                                        <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">ITK</div>
                                                        <span class="text-sm font-bold text-slate-900">{{ event.title }}</span>
                                                    </div>
                                                    <div class="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50/50 border border-blue-100/50 px-3 py-2 rounded-lg truncate cursor-pointer hover:bg-blue-50 transition-colors">
                                                        <ExternalLink class="w-3.5 h-3.5 shrink-0" />
                                                        https://moodle.itk.ppke.hu/...
                                                    </div>
                                                </div>

                                                <div class="grid grid-cols-2 gap-3">
                                                    <Button variant="outline" class="text-xs font-bold rounded-xl border-slate-200">Részletek</Button>
                                                    <Button class="text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800">Megnyitás</Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <div class="w-80 border-l border-slate-200 bg-white p-6 shrink-0 hidden xl:block">
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 relative">
                    <button class="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X class="w-4 h-4" /></button>
                    <h4 class="text-sm font-black text-slate-900 mb-1">Külső naptárak</h4>
                    <p class="text-[11px] text-slate-500 mb-4 leading-relaxed font-medium">Szinkronizáld a Neptun és Moodle eseményeidet egy helyre.</p>
                    <div class="flex items-center justify-between">
                        <div class="flex -space-x-2">
                            <div class="w-7 h-7 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[10px] font-black text-blue-600">N</div>
                            <div class="w-7 h-7 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center text-[10px] font-black text-orange-500">M</div>
                        </div>
                        <button class="text-xs font-bold text-slate-900 hover:text-primary flex items-center gap-1 transition-colors">
                            Kapcsolás <ChevronRight class="w-3.5 h-3.5"/>
                        </button>
                    </div>
                </div>

                <h3 class="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Közelgő</h3>
                <div class="space-y-3">
                    <div v-for="event in upcomingEvents" :key="event.id" class="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all cursor-pointer group">
                        <div class="flex gap-3 items-start">
                            <div class="w-1 h-10 rounded-full shrink-0" :class="[
                                event.color === 'red' ? 'bg-red-500' :
                                event.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                            ]"></div>
                            <div>
                                <p class="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{{ event.title }}</p>
                                <p class="text-[10px] font-bold text-slate-400 mt-1">{{ event.time }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bg-stripes {
    background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color-slate-100) 10px, var(--color-slate-100) 11px);
}

.overflow-y-auto::-webkit-scrollbar {
    width: 2px;
}
.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}
</style>