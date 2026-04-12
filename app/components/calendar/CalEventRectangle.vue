<script setup lang="ts">
import type {CalendarEvent} from "~/utils/parseIcs";
import CalEventPopoverContent from "~/components/calendar/CalEventPopoverContent.vue";

const props = defineProps<{
    event: CalendarEvent
    col: number
}>()

const {eventTop, eventHeight} = useEventTime();

const {eventColor} = useEventColor();

</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Card :key="props.event.id"
                  class="absolute border-border border z-10 overflow-hidden cursor-pointer transition-opacity hover:opacity-90 p-2 gap-0"
                  :class="eventColor(event.color)"
                  :style="`
                             top: ${eventTop(props.event)}px;
                             height: ${eventHeight(props.event)}px;
                             left: calc(${props.col * 50}px + 10px);
                             right: 10px;
                         `">
                <CardHeader class="p-0">
                    <p class="text-[10px] font-bold truncate leading-tight">{{ props.event.title }}</p>
                </CardHeader>
                <CardContent class="p-0">
                    <p v-if="props.event.location" class="text-[9px] opacity-70 truncate">{{ props.event.location }}</p>
                    <p v-if="eventHeight(props.event) > 30" class="text-[9px] opacity-70 font-medium">{{
                            props.event.time
                        }}</p>
                </CardContent>
            </Card>
        </PopoverTrigger>

        <PopoverContent class="w-72 p-0" align="start">
            <CalEventPopoverContent :event="event"/>
        </PopoverContent>

    </Popover>
</template>

<style scoped>

</style>