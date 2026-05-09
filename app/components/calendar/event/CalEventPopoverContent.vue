<script setup lang="ts">
import {Bell, MoreHorizontal} from "lucide-vue-next";

const props = defineProps<{
    event: CalendarEvent
}>()

const {eventColor} = useEventColor()

</script>

<template>
    <Card>
        <CardContent class="space-y-3">
            <div :class="['w-full h-0.5 rounded-full', eventColor(props.event.color, 'dot')]"/>
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{{
                            props.event.type
                        }}</span>
                    <h3 class="text-sm font-bold text-foreground mt-0.5 leading-tight">{{ props.event.title }}</h3>
                </div>
                <div class="flex gap-0.5">
                    <Button variant="ghost" size="icon-sm">
                        <Bell class="w-3.5 h-3.5"/>
                    </Button>
                    <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal class="w-3.5 h-3.5"/>
                    </Button>
                </div>
            </div>
            <p class="text-xs text-muted-foreground font-medium">{{ props.event.time }}</p>
            <div v-if="props.event.url"
                 class="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-3 py-2 rounded-lg truncate cursor-pointer hover:bg-primary/15 transition-colors">
                <ExternalLink class="w-3 h-3 shrink-0"/>
                {{ props.event.url }}
            </div>
            <div class="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">{{ $t('calendar.event.details') }}</Button>
                <Button size="sm">{{ $t('calendar.event.open') }}</Button>
            </div>
        </CardContent>
    </Card>
</template>

<style scoped>

</style>