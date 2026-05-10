<script setup lang="ts">
import {Calendar, Settings, Mail} from 'lucide-vue-next'
import {parseIcsToEvents, type CalendarEvent} from '@/utils/parseIcs'
import {DashboardHero, DashboardUrgent} from "~/components/dashboard";
import {List, ListLabel, ListGridItem, ListContent} from "~/components/shared/list";

definePageMeta({layout: 'default'})
useHead({title: $t('pages.dashboard')})

const {t, locale} = useI18n()
const {user} = useUserSession()
const u = computed(() => user.value as any)

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

const nextEvent = computed(() => events.value[0] ?? null)

const todayEvents = computed(() => events.value.filter(e =>
    e.date === today.getDate() && e.month === today.getMonth() && e.year === today.getFullYear()
))

const urgentEvents = computed(() => {
    const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return events.value.filter(e => {
        const d = new Date(e.year, e.month, e.date)
        return d <= in7 && (e.color === 'red' || e.color === 'blue')
    }).slice(0, 5)
})
</script>

<template>
    <div class="h-full overflow-y-auto bg-background">
        <div class="max-w-6xl mx-auto px-4 py-8 space-y-4">

            <!-- Header -->
            <PageHeader :title="`${greeting}, ${u?.name?.split(' ')[0] ?? u?.login}`" :subtitle="todayStr"/>

            <!-- No calendar -->
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
                    <div class="space-y-5">
                        <div class="h-4 w-24 bg-muted rounded-full animate-pulse"/>
                        <Card class="h-28 bg-muted border-0 animate-pulse"/>
                        <Card class="h-36 bg-muted border-0 animate-pulse"/>
                        <Card class="h-48 bg-muted border-0 animate-pulse"/>
                    </div>
                    <div class="space-y-5">
                        <div class="h-4 w-32 bg-muted rounded-full animate-pulse"/>
                        <Card class="h-96 bg-muted border-0 animate-pulse"/>
                    </div>
                </div>
            </template>

            <template v-else-if="!noCalendar">
                <div class="md:grid md:grid-cols-2 md:gap-4 md:items-start space-y-5 md:space-y-0">

                    <div class="space-y-5">

                        <template v-if="nextEvent">
                            <ListLabel :title="$t('dashboard.next')" class="mb-2"/>
                            <DashboardHero :event="nextEvent"/>
                        </template>

                        <DashboardUrgent :events="urgentEvents"/>

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
                                <ListGridItem label="Neptun" href="https://neptun3.ppke.hu/hallgato_uj/login"
                                              target="_blank">
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
                                <ListGridItem label="Zimbra" href="https://mail.ppke.hu" target="_blank">
                                    <Mail class="w-6 h-6 text-red-500"/>
                                </ListGridItem>
                                <ListGridItem label="T.O." href="https://ppke.sharepoint.com/sites/itk-to"
                                              target="_blank">
                                    <NuxtImg src="/icons/sharepoint.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem label="Távoktatás" href="https://tavoktatas.ppke.hu/secure/"
                                              target="_blank">
                                    <NuxtImg src="/icons/ppke.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem class="col-span-2" label="Oktatók"
                                              href="https://ppke.hu/oktatok/?search=&sort_by=asc" target="_blank">
                                    <NuxtImg src="/icons/ppke.svg" class="h-7 w-auto"/>
                                </ListGridItem>
                                <ListGridItem class="col-span-2" :label="$t('pages.profile')"
                                              @click="navigateTo('/profile')">
                                    <Settings class="w-5 h-5 text-muted-foreground"/>
                                </ListGridItem>
                            </ListContent>
                        </List>

                    </div>

                    <UpcomingEvents :events="events" :loading="loading" :show-see-all="true" :days="30" :limit="10"/>

                </div>
            </template>
        </div>
    </div>
</template>