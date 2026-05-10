<script setup lang="ts">
import {AlertTriangle} from 'lucide-vue-next'
import type {CalendarEvent} from '~/utils/parseIcs'

defineProps<{ events: CalendarEvent[] }>()

const {eventColor} = useEventColor()
const {eventDateStr, daysUntilLabel} = useEventDate()
</script>

<template>
    <List v-if="events.length > 0">
        <div class="flex items-center gap-2 mb-2 px-1">
            <AlertTriangle class="w-3.5 h-3.5 text-red-500"/>
            <ListLabel :title="$t('dashboard.urgent')" class="mb-0"/>
        </div>
        <ListContent class="flex flex-col gap-0.5">
            <ListItem v-for="e in events" :key="e.id">
                <div :class="['w-1.5 h-1.5 rounded-full shrink-0', eventColor(e.color, 'dot')]"/>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-foreground truncate">{{ e.title }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ eventDateStr(e) }} · {{ e.time }}</p>
                </div>
                <Badge :class="eventColor(e.color, 'badge')" class="shrink-0 border-0 text-[10px]">
                    {{ daysUntilLabel(e, true) }}
                </Badge>
            </ListItem>
        </ListContent>
    </List>
</template>