<script setup lang="ts">
import type {CalendarEvent} from "~/utils/parseIcs";

const props = defineProps<{
    event: CalendarEvent
    col: number
}>()

const open = ref(false)
const {eventTop, eventHeight} = useEventTime()
const {eventColor} = useEventColor()
const isMobile = useMediaQuery('(max-width: 768px)')

const eventStyle = computed(() => ({
    top: `${eventTop(props.event)}px`,
    height: `${eventHeight(props.event)}px`,
    left: isMobile.value
        ? `calc(${props.col * 20}px + 0px)`
        : `calc(${props.col * 50}px + 4px)`,
    right: isMobile.value ? '0px' : '4px',
}))
</script>

<template>
    <div
        :key="props.event.id"
        :class="[
            'absolute z-10 overflow-hidden cursor-pointer hover:opacity-90 p-1.5 md:p-2 gap-0 rounded-sm duration-300 transition-all hover:-translate-y-2',
            eventColor(event.color)
        ]"
        :style="eventStyle"
        @click="open = true"
    >
        <div class="flex flex-row gap-2 p-0 h-full">
            <div :class="['hidden md:flex w-1 rounded-full shrink-0', eventColor(event.color, 'dot')]"/>

            <div class="hidden md:flex flex-col truncate">
                <div v-if="eventHeight(props.event) < 40" class="flex items-center gap-1 truncate">
                    <span class="font-semibold text-xs opacity-70 shrink-0">{{ props.event.time }}</span>
                    <span class="font-bold text-xs truncate">{{ props.event.title }}</span>
                </div>
                <template v-else-if="eventHeight(props.event) < 80">
                    <span class="font-semibold text-xs truncate opacity-70">{{ props.event.time }}</span>
                    <span class="font-bold truncate text-sm">{{ props.event.title }}</span>
                </template>
                <template v-else>
                    <span class="font-semibold text-xs truncate opacity-70">{{ props.event.time }}</span>
                    <span class="font-bold truncate text-sm">{{ props.event.title }}</span>
                    <p v-if="props.event.location" class="text-[11px] truncate">{{ props.event.location }}</p>
                </template>
            </div>

            <div class="flex flex-col md:hidden gap-1 wrap-break-word min-w-0 overflow-hidden">
                <span class="font-bold text-[10px]">{{ props.event.title }}</span>
            </div>
        </div>
    </div>

    <CalEventModal v-model:open="open" :event="props.event"/>
</template>