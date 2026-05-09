<script setup lang="ts">
import type {CalendarEvent} from '~/utils/parseIcs'
import CalEventPopoverContent from "~/components/calendar/event/CalEventPopoverContent.vue";

const props = defineProps<{ event: CalendarEvent }>()

const {eventColor} = useEventColor()

</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <div :class="[
                'flex items-center gap-1 px-0.5 md:px-1.5 cursor-pointer text-[10px] font-semibold truncate shrink-0 hover:opacity-90 rounded-sm duration-300 transition-all h-4 md:h-7',
                eventColor(props.event.color, 'bg')
            ]">
                <div class="flex items-center gap-1 truncate">
                    <span class="font-bold text-[10px] md:text-xs truncate">{{ props.event.title }}</span>
                    <span class="hidden 2xl:flex font-semibold text-xs opacity-70 shrink-0">{{
                            props.event.time
                        }}</span>
                </div>
            </div>
        </PopoverTrigger>

        <PopoverContent class="w-72 p-0" align="start">
            <CalEventPopoverContent :event="props.event"/>
        </PopoverContent>
    </Popover>
</template>
