<script setup lang="ts">
import type { CalendarEvent } from '@/utils/parseIcs'
import { Bell, MoreHorizontal } from 'lucide-vue-next'

defineProps<{ event: CalendarEvent }>()

const eventColorClass = (color: string, type: 'bg' | 'dot') => {
    const map: Record<string, Record<string, string>> = {
        red:   { bg: 'bg-red-50 text-red-700 hover:bg-red-100',             dot: 'bg-red-400' },
        blue:  { bg: 'bg-primary/10 text-primary hover:bg-primary/20',      dot: 'bg-primary' },
        green: { bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-400' },
    }
    return map[color]?.[type] ?? map.green[type]
}
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <div :class="[
                'flex items-center gap-1 px-1.5 py-1 rounded-lg cursor-pointer transition-all text-[10px] font-semibold truncate shrink-0',
                eventColorClass(event.color, 'bg')
            ]">
                <div :class="['w-1.5 h-1.5 rounded-full shrink-0', eventColorClass(event.color, 'dot')]" />
                <span class="truncate">{{ event.title }}</span>
            </div>
        </PopoverTrigger>

        <PopoverContent class="w-72 p-0" align="start">
            <Card>
                <CardContent class="space-y-3">
                    <div :class="['w-full h-0.5 rounded-full', eventColorClass(event.color, 'dot')]" />
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{{ event.type }}</span>
                            <h3 class="text-sm font-bold text-foreground mt-0.5 leading-tight">{{ event.title }}</h3>
                        </div>
                        <div class="flex gap-0.5">
                            <Button variant="ghost" size="icon-sm"><Bell class="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal class="w-3.5 h-3.5" /></Button>
                        </div>
                    </div>
                    <p class="text-xs text-muted-foreground font-medium">{{ event.time }}</p>
                    <div v-if="event.url"
                         class="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-3 py-2 rounded-lg truncate cursor-pointer hover:bg-primary/15 transition-colors">
                        <ExternalLink class="w-3 h-3 shrink-0" />
                        {{ event.url }}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">Részletek</Button>
                        <Button size="sm">Megnyitás</Button>
                    </div>
                </CardContent>
            </Card>
        </PopoverContent>
    </Popover>
</template>
