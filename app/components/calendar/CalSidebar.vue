<script setup lang="ts">
import {Plus} from "lucide-vue-next"
import type {CalendarEvent} from '@/utils/parseIcs'
import {toDate, type DateValue} from "reka-ui/date";

defineProps<{
    upcomingEvents: CalendarEvent[]
}>()

const emit = defineEmits<{
    openConnectModal: []
    dateSelected: [date: Date]
}>()

function onCalendarSelect(val: DateValue | undefined) {
    if (!val) return
    emit('dateSelected', toDate(val))
}
</script>

<template>
    <div class="w-72 bg-background shrink-0 hidden xl:flex xl:flex-col gap-4 overflow-y-auto">

        <!-- Connect card -->
        <div>
            <h3 class="text-sm font-bold text-muted-foreground mb-2">{{ $t('calendar.sidebar.todos') }}</h3>
            <Card class="bg-card text-primary gap-1">
                <CardHeader>
                    <div class="flex items-center gap-2">
                        <div class="flex space-x-1.5">
                            <NuxtImg src="/icons/neptun-small.png" class="h-5 w-auto"/>
                            <NuxtImg src="/icons/moodle-small.png" class="h-5 w-auto"/>
                        </div>
                        <span class="text-[11px] font-bold text-primary">Moodle & Neptun</span>
                    </div>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-xs text-foreground leading-relaxed">
                        {{ $t('calendar.sidebar.syncDesc') }}
                    </p>
                    <Button variant="outline" size="sm" class="w-full" @click="emit('openConnectModal')">
                        <Plus/>
                        {{ $t('calendar.connect.title') }}
                    </Button>
                </CardContent>
            </Card>
        </div>

        <!-- Mini calendar -->
        <Calendar class="bg-card rounded-md" @update:model-value="onCalendarSelect"/>
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
}
</style>
