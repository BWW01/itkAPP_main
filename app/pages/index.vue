<script setup lang="ts">
import {Calendar, Settings, ChevronRight, MapPin, Clock, AlertTriangle, BookOpen, Sparkles, Mail} from 'lucide-vue-next'
import {parseIcsToEvents, type CalendarEvent} from '@/utils/parseIcs'
import {ListItem, ListLabel} from "~/components/shared/list";

definePageMeta({layout: 'default'})
useHead({title: $t('pages.dashboard')})

const {t, locale} = useI18n()
const {user} = useUserSession()
const u = computed(() => user.value as any)

// --- Greeting ---
const greeting = computed(() => {
    const h = new Date().getHours()
    if (h < 5) return t('greeting.night')
    if (h < 12) return t('greeting.morning')
    if (h < 18) return t('greeting.afternoon')
    return t('greeting.evening')
})

const today = new Date()
const todayStr = computed(() =>
    today.toLocaleDateString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    })
)

// --- Events ---
const events = ref<CalendarEvent[]>([])
const loading = ref(true)
const noCalendar = ref(false)

onMounted(async () => {
    if (!u.value?.login) return
    try {
        const ics = await $fetch<string>(`/api/calendar/${u.value.login}`, {
            headers: {Accept: 'text/calendar'}
        })
        events.value = parseIcsToEvents(ics)
    } catch (e: any) {
        if (e?.statusCode === 404) noCalendar.value = true
    } finally {
        loading.value = false
    }
})

// Következő esemény
const nextEvent = computed(() => events.value[0] ?? null)

// Mai események
const todayEvents = computed(() => events.value.filter(e =>
    e.date === today.getDate() && e.month === today.getMonth() && e.year === today.getFullYear()
))

// Következő 7 nap — vizsgák + határidők
const urgentEvents = computed(() => {
    const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events.value.filter(e => {
        const d = new Date(e.year, e.month, e.date)
        return d <= in7 && (e.color === 'red' || e.color === 'blue')
    }).slice(0, 5)
})

// Összes közelgő — következő 14 nap
const upcomingEvents = computed(() => {
    const in14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    return events.value.filter(e => {
        const d = new Date(e.year, e.month, e.date)
        return d > today && d <= in14
    }).slice(0, 8)
})

function eventDate(e: CalendarEvent) {
    return new Date(e.year, e.month, e.date).toLocaleDateString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {
        month: 'short', day: 'numeric', weekday: 'short'
    })
}

function eventMonth(e: CalendarEvent) {
    return new Date(e.year, e.month).toLocaleDateString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {month: 'short'})
}

function daysUntil(e: CalendarEvent): number {
    const d = new Date(e.year, e.month, e.date)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function daysUntilLabel(e: CalendarEvent, short = false): string {
    const n = daysUntil(e)
    if (n === 0) return t('dashboard.today')
    if (n === 1) return t('dashboard.tomorrow')
    return short ? t('dashboard.daysUntilShort', {n}) : t('dashboard.daysUntil', {n})
}

const colorMap: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
    red: {bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', badge: 'bg-red-100 text-red-700'},
    blue: {bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700'},
    green: {bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', badge: 'bg-green-100 text-green-700'},
}

function cc(color: string) {
    return colorMap[color] ?? colorMap.green
}
</script>

<template>
    <div class="h-full overflow-y-auto bg-background">
        <div class="max-w-6xl mx-auto px-4 py-8 space-y-4">

            <!-- Header -->
            <div class="flex items-start justify-between gap-4">
                <div>
                    <p class="text-xs font-semibold text-muted-foreground capitalize">{{ todayStr }}</p>
                    <h1 class="text-2xl font-bold text-foreground mt-0.5">
                        {{ greeting }}, {{ u?.name?.split(' ')[0] ?? u?.login }}
                    </h1>
                </div>
                <Avatar class="h-10 w-10 shrink-0">
                    <AvatarFallback class="bg-primary/15 text-primary font-bold">
                        {{ u?.login?.[0]?.toUpperCase() || 'U' }}
                    </AvatarFallback>
                </Avatar>
            </div>

            <!-- No calendars -->
            <Card v-if="!loading && noCalendar" class="border-dashed">
                <CardContent class="flex flex-col items-center gap-3 py-8 text-center">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar class="w-6 h-6 text-primary"/>
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-foreground">{{ $t('dashboard.noCalendar') }}</p>
                        <p class="text-xs text-muted-foreground mt-1">{{ $t('dashboard.noCalendarDesc') }}</p>
                    </div>
                    <Button size="sm" @click="navigateTo('/calendar')">
                        <Calendar class="w-3.5 h-3.5"/>
                        {{ $t('dashboard.connectCalendar') }}
                    </Button>
                </CardContent>
            </Card>

            <!-- Loading skeleton -->
            <template v-if="loading">
                <div class="md:grid md:grid-cols-2 md:gap-4 md:items-start space-y-5 md:space-y-0">
                    <!-- Left col -->
                    <div class="space-y-5">
                        <div class="h-4 w-24 bg-muted rounded-full animate-pulse"/>
                        <Card class="h-28 bg-muted border-0 animate-pulse"/>
                        <Card class="h-36 bg-muted border-0 animate-pulse"/>
                        <Card class="h-48 bg-muted border-0 animate-pulse"/>
                    </div>
                    <!-- Right col -->
                    <div class="space-y-5">
                        <div class="h-4 w-32 bg-muted rounded-full animate-pulse"/>
                        <Card class="h-96 bg-muted border-0 animate-pulse"/>
                    </div>
                </div>
            </template>

            <template v-else-if="!noCalendar">
                <div class="md:grid md:grid-cols-2 md:gap-4 md:items-start space-y-5 md:space-y-0">

                    <div class="space-y-5">

                        <!-- Hero -->
                        <ListLabel :title="$t('dashboard.next')" class="mb-2"/>
                        <Card v-if="nextEvent" class="overflow-hidden">
                            <CardContent>
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span
                                                :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', cc(nextEvent.color)!.badge]">
                                                {{ nextEvent.type }}
                                            </span>
                                            <span class="text-[10px] text-muted-foreground font-medium">
                                                {{ daysUntilLabel(nextEvent) }}
                                            </span>
                                        </div>
                                        <p class="text-base font-bold text-foreground leading-snug truncate">
                                            {{ nextEvent.title }}</p>
                                        <div class="flex items-center gap-3 mt-2">
                                            <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock class="w-3 h-3"/>
                                                {{ nextEvent.time }}
                                            </span>
                                            <span v-if="nextEvent.location"
                                                  class="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                                <MapPin class="w-3 h-3 shrink-0"/>
                                                {{ nextEvent.location }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <p class="text-2xl font-bold text-foreground">{{ nextEvent.date }}</p>
                                        <p class="text-xs text-muted-foreground capitalize">{{
                                                eventMonth(nextEvent)
                                            }}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <!-- Important -->
                        <List v-if="urgentEvents.length > 0">
                            <div class="flex items-center gap-2 mb-2 px-1">
                                <AlertTriangle class="w-3.5 h-3.5 text-red-500"/>
                                <ListLabel :title="$t('dashboard.urgent')" class="mb-0"/>
                            </div>
                            <ListContent class="flex flex-col gap-0.5">
                                <ListItem v-for="e in urgentEvents" :key="e.id">
                                    <div :class="['w-1.5 h-1.5 rounded-full shrink-0', cc(e.color)!.dot]"/>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-semibold text-foreground truncate">{{ e.title }}</p>
                                        <p class="text-[10px] text-muted-foreground">{{ eventDate(e) }} · {{
                                                e.time
                                            }}</p>
                                    </div>
                                    <Badge :class="cc(e.color)!.badge" class="shrink-0 border-0 text-[10px]">
                                        {{ daysUntilLabel(e, true) }}
                                    </Badge>
                                </ListItem>
                            </ListContent>
                        </List>

                        <!-- Quick links -->
                        <List>
                            <ListLabel :title="$t('dashboard.quickLinks')"/>
                            <ListContent class="grid grid-cols-4 gap-0.5">
                                <ListGridItem class="col-span-2 row-span-2" label="Naptár"
                                              @click="navigateTo('/calendar')">
                                    <Calendar class="w-5 h-5 text-primary"/>
                                </ListGridItem>
                                <ListGridItem label="Moodle" href="https://moodle.ppke.hu" target="_blank">
                                    <NuxtImg src="/icons/moodle.svg" class="h-6 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="Neptun" href="https://neptun3.ppke.hu" target="_blank">
                                    <NuxtImg src="/icons/neptun.svg" class="h-6 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="Teams" href="https://teams.microsoft.com" target="_blank">
                                    <NuxtImg src="/icons/teams.svg" class="h-6 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="ITK Space" href="https://space.itk.ppke.hu" target="_blank">
                                    <NuxtImg src="/icons/itk-big.png" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="ITK Wiki" href="https://users.itk.ppke.hu/~perpa4" target="_blank">
                                    <NuxtImg src="/icons/itk-wiki.png" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="Zimbra" href="https://zimbra.ppke.hu" target="_blank">
                                    <Mail class="w-6 h-6 text-red-500"/>
                                </ListGridItem>
                                <ListGridItem label="T.O." href="https://zimbra.ppke.hu" target="_blank">
                                    <NuxtImg src="/icons/sharepoint.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="Távoktatás" href="https://zimbra.ppke.hu" target="_blank">
                                    <NuxtImg src="/icons/ppke.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem class="col-span-2" label="Oktatók" href="https://zimbra.ppke.hu"
                                              target="_blank">
                                    <NuxtImg src="/icons/ppke.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem class="col-span-2" :label="$t('pages.profile')"
                                              @click="navigateTo('/profile')">
                                    <Settings class="w-5 h-5 text-muted-foreground"/>
                                </ListGridItem>
                            </ListContent>
                        </List>

                    </div>

                    <div class="space-y-5">

                        <!-- Upcoming -->
                        <List v-if="upcomingEvents.length > 0">
                            <div class="flex items-center justify-between mb-2 px-1">
                                <ListLabel :title="$t('dashboard.upcoming')" class="mb-0"/>
                                <button class="flex items-center gap-0.5 text-[10px] font-semibold text-primary"
                                        @click="navigateTo('/calendar')">
                                    {{ $t('dashboard.seeAll') }}
                                    <ChevronRight class="w-3 h-3"/>
                                </button>
                            </div>
                            <ListContent class="flex flex-col gap-0.5">
                                <ListItem v-for="e in upcomingEvents" :key="e.id">
                                    <div class="text-center w-8 shrink-0">
                                        <p class="text-base font-bold text-foreground leading-none">{{ e.date }}</p>
                                        <p class="text-[9px] text-muted-foreground capitalize">{{ eventMonth(e) }}</p>
                                    </div>
                                    <Separator orientation="vertical" class="h-8"/>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-semibold text-foreground truncate">{{ e.title }}</p>
                                        <p class="text-[10px] text-muted-foreground">{{ e.time }}
                                            <template v-if="e.location"> · {{ e.location }}</template>
                                        </p>
                                    </div>
                                    <div :class="['w-1.5 h-1.5 rounded-full shrink-0', cc(e.color)!.dot]"/>
                                </ListItem>
                            </ListContent>
                        </List>

                        <!-- Empty -->
                        <Card v-if="!loading && events.length === 0" class="border-dashed">
                            <CardContent class="flex flex-col items-center gap-2 py-8 text-center">
                                <BookOpen class="w-8 h-8 text-muted-foreground"/>
                                <p class="text-sm font-semibold text-foreground">{{ $t('dashboard.noEvents') }}</p>
                                <p class="text-xs text-muted-foreground">{{ $t('dashboard.noEventsDesc') }}</p>
                                <Button variant="outline" size="sm" @click="navigateTo('/calendar')">
                                    {{ $t('dashboard.openCalendar') }}
                                </Button>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </template>
        </div>
    </div>
</template>