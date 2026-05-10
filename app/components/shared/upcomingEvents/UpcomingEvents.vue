<script setup lang="ts">
import {BookOpen, ChevronRight} from 'lucide-vue-next'
import type {CalendarEvent} from '~/utils/parseIcs'

const props = defineProps<{
    events: CalendarEvent[]
    loading?: boolean
    days?: number
    limit?: number
    showSeeAll?: boolean
}>()

const {locale} = useI18n()
const {eventColor} = useEventColor()
const today = new Date()

const upcomingEvents = computed(() => {
    const n = props.days ?? 14
    const max = props.limit ?? 8
    const until = new Date(today.getTime() + n * 24 * 60 * 60 * 1000)
    return props.events.filter(e => {
        const d = new Date(e.year, e.month, e.date)
        return d > today && d <= until
    }).slice(0, max)
})

function eventMonth(e: CalendarEvent) {
    return new Date(e.year, e.month).toLocaleDateString(
        locale.value === 'hu' ? 'hu-HU' : 'en-US', {month: 'short'}
    )
}
</script>

<template>
    <div class="space-y-2">
        <div class="flex items-center justify-between px-1">
            <ListLabel :title="$t('dashboard.upcoming')" class="mb-0"/>
            <button v-if="showSeeAll !== false"
                    class="flex items-center gap-0.5 text-sm font-semibold text-primary cursor-pointer"
                    @click="navigateTo('/calendar')">
                {{ $t('dashboard.seeAll') }}
                <ChevronRight class="w-3 h-3"/>
            </button>
        </div>

        <List v-if="upcomingEvents.length > 0">
            <ListContent class="flex flex-col gap-0.5">
                <ListItem v-for="e in upcomingEvents" :key="e.id">
                    <div class="text-center w-8 shrink-0">
                        <p class="text-base font-bold text-foreground leading-none">{{ e.date }}</p>
                        <p class="text-[9px] text-muted-foreground capitalize">{{ eventMonth(e) }}</p>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-foreground truncate">{{ e.title }}</p>
                        <p class="text-[10px] text-muted-foreground">{{ e.time }}
                            <template v-if="e.location"> · {{ e.location }}</template>
                        </p>
                    </div>
                    <div :class="['w-1.5 h-1.5 rounded-full shrink-0', eventColor(e.color, 'dot')]"/>
                </ListItem>
            </ListContent>
        </List>

        <Card v-else-if="!loading" class="border-dashed">
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
</template>