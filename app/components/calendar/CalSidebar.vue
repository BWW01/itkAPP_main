<script setup lang="ts">
import { Plus } from "lucide-vue-next"
import type { CalendarEvent } from '@/utils/parseIcs'

defineProps<{
    upcomingEvents: CalendarEvent[]
}>()

const emit = defineEmits<{ openConnectModal: [] }>()

const eventColorClass = (color: string, type: 'dot') => {
    const map: Record<string, Record<string, string>> = {
        red:   { dot: 'bg-red-400' },
        blue:  { dot: 'bg-primary' },
        green: { dot: 'bg-emerald-400' },
    }
    return map[color]?.[type] ?? map.green[type]
}
</script>

<template>
    <div class="w-72 bg-background shrink-0 hidden xl:flex xl:flex-col gap-4 overflow-y-auto">

        <!-- Connect card -->
        <div>
            <h3 class="text-sm font-bold text-muted-foreground mb-2">Teendők</h3>
            <Card class="bg-card text-primary gap-1">
                <CardHeader>
                    <div class="flex items-center gap-2">
                        <div class="flex space-x-1.5">
                            <NuxtImg src="/icons/neptun-small.png" class="h-5 w-auto" />
                            <NuxtImg src="/icons/moodle-small.png" class="h-5 w-auto" />
                        </div>
                        <span class="text-[11px] font-bold text-primary">Moodle & Neptun</span>
                    </div>
                </CardHeader>
                <CardContent class="space-y-3">
                    <p class="text-xs text-foreground leading-relaxed">
                        Szinkronizáld az összes határidőd és eseményed egy helyre.
                    </p>
                    <Button variant="outline" size="sm" class="w-full" @click="emit('openConnectModal')">
                        <Plus /> Naptárok csatlakoztatása
                    </Button>
                </CardContent>
            </Card>
        </div>

        <!-- Mini calendar -->
        <Calendar class="bg-card rounded-md" />

        <!-- Upcoming events
        <div>
            <h3 class="text-sm font-bold text-muted-foreground mb-2">Közelgő • 7 nap</h3>

            <div v-if="upcomingEvents.length === 0"
                 class="text-[11px] text-muted-foreground font-medium text-center py-8 bg-muted/40 rounded-md">
                Nincs közelgő esemény
            </div>

            <div class="space-y-2">
                <Card v-for="event in upcomingEvents" :key="event.id"
                      class="hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group p-2">
                    <CardContent class="flex gap-2.5 items-start p-1">
                        <div :class="['w-1 h-8 rounded-full shrink-0 mt-0.5', eventColorClass(event.color, 'dot')]" />
                        <div class="min-w-0">
                            <p class="text-[11px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{{ event.title }}</p>
                            <p class="text-[10px] text-muted-foreground mt-0.5 font-medium">{{ event.time }}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
        -->
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar { width: 4px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
