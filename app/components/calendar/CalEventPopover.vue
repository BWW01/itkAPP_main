<script setup lang="ts">
import type {CalendarEvent} from '@/utils/parseIcs'
import CalEventPopoverContent from "~/components/calendar/CalEventPopoverContent.vue";

const props = defineProps<{ event: CalendarEvent }>()

const {eventColor} = useEventColor()

</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <div :class="[
                'flex items-center gap-1 px-1.5 py-1 rounded-lg cursor-pointer transition-all text-[10px] font-semibold truncate shrink-0',
                eventColor(props.event.color, 'bg')
            ]">
                <div :class="['w-1.5 h-1.5 rounded-full shrink-0', eventColor(props.event.color, 'dot')]"/>
                <span class="truncate">{{ props.event.title }}</span>
            </div>
        </PopoverTrigger>

        <PopoverContent class="w-72 p-0" align="start">
            <CalEventPopoverContent :event="props.event"/>
        </PopoverContent>
    </Popover>
</template>
