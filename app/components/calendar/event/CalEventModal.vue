<script setup lang="ts">
import {ExternalLink, MapPin, Clock} from 'lucide-vue-next'

const props = defineProps<{ event: CalendarEvent }>()
const open = defineModel<boolean>('open')
const {eventColor} = useEventColor()
</script>

<template>
    <AppModal v-model:open="open">
        <template #header>
            <div class="flex-1 min-w-0">
                <div :class="['w-full h-1 rounded-full mb-3', eventColor(props.event.color, 'dot')]"/>
                <span class="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    {{ props.event.type }}
                </span>
                <h3 class="text-base font-bold text-foreground mt-0.5 leading-tight">
                    {{ props.event.title }}
                </h3>
                <div class="mt-2 space-y-1.5">
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock class="w-3.5 h-3.5 shrink-0"/>
                        {{ props.event.time }}
                    </div>
                    <div v-if="props.event.location" class="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin class="w-3.5 h-3.5 shrink-0"/>
                        {{ props.event.location }}
                    </div>
                </div>
            </div>
        </template>

        <div class="space-y-3 -mt-2">
            <a v-if="props.event.url"
               :href="props.event.url"
               target="_blank"
               class="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/10 px-3 py-2 rounded-xl truncate hover:bg-primary/15 transition-colors">
                <ExternalLink class="w-3 h-3 shrink-0"/>
                {{ props.event.url }}
            </a>
            <div class="grid grid-cols-2 gap-2">
                <Button variant="outline" class="rounded-full" @click="open = false">
                    {{ $t('calendar.event.details') }}
                </Button>
                <Button
                    class="rounded-full"
                    :disabled="!props.event.url"
                    @click="props.event.url && navigateTo(props.event.url, {external: true})"
                >
                    {{ $t('calendar.event.open') }}
                </Button>
            </div>
        </div>
    </AppModal>
</template>