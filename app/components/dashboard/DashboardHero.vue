<script setup lang="ts">
import {Clock, MapPin} from 'lucide-vue-next'
import type {CalendarEvent} from '~/utils/parseIcs'

defineProps<{ event: CalendarEvent }>()

const {eventColor} = useEventColor()
const {eventMonth, daysUntilLabel} = useEventDate()
</script>

<template>
    <Card class="overflow-hidden">
        <CardContent>
            <div class="flex items-center justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span
                            :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', eventColor(event.color, 'badge')]">
                            {{ event.type }}
                        </span>
                        <span class="text-[10px] text-muted-foreground font-medium">
                            {{ daysUntilLabel(event) }}
                        </span>
                    </div>
                    <p class="text-base font-bold text-foreground leading-snug truncate">{{ event.title }}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock class="w-3 h-3"/>
                            {{ event.time }}
                        </span>
                        <span v-if="event.location"
                              class="flex items-center gap-1 text-xs text-muted-foreground truncate">
                            <MapPin class="w-3 h-3 shrink-0"/>
                            {{ event.location }}
                        </span>
                    </div>
                </div>
                <div class="text-right shrink-0">
                    <p class="text-2xl font-bold text-foreground">{{ event.date }}</p>
                    <p class="text-xs text-muted-foreground capitalize">{{ eventMonth(event) }}</p>
                </div>
            </div>
        </CardContent>
    </Card>
</template>