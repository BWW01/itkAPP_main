<script setup lang="ts">
import {Link, Check, AlertCircle, RefreshCw} from 'lucide-vue-next'
import type {SaveStatus} from '@/types/ui'

defineProps<{
    moodleLink: string
    neptunLink: string
    saveStatus: SaveStatus
    saveError: string
    canSave: boolean
}>()

const emit = defineEmits<{
    'update:moodleLink': [value: string]
    'update:neptunLink': [value: string]
    save: []
}>()
</script>

<template>
    <div class="space-y-4">

        <!-- Moodle -->
        <div>
            <label class="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                <NuxtImg src="/icons/moodle.svg" class="h-5 w-auto"/>
                {{ $t('calendar.connect.moodleLabel') }}
            </label>
            <div class="relative">
                <Link class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
                <input
                    :value="moodleLink"
                    type="url"
                    placeholder="https://moodle.itk.ppke.hu/calendar/export.php?..."
                    class="w-full pl-9 pr-4 py-2.5 text-xs border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all bg-muted placeholder:text-muted-foreground/50"
                    @input="emit('update:moodleLink', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <NuxtLink class="text-xs text-blue-600 ml-1" href="https://moodle.ppke.hu/calendar/export.php?">
                {{ $t('calendar.connect.moodleOpen') }}
            </NuxtLink>
        </div>

        <!-- Neptun -->
        <div>
            <label class="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                <NuxtImg src="/icons/neptun.svg" class="h-5 w-auto"/>
                {{ $t('calendar.connect.neptunLabel') }}
            </label>
            <div class="relative">
                <Link class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
                <input
                    :value="neptunLink"
                    type="url"
                    placeholder="https://neptun.ppke.hu/hallgato/ical/..."
                    class="w-full pl-9 pr-4 py-2.5 text-xs border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all bg-muted placeholder:text-muted-foreground/50"
                    @input="emit('update:neptunLink', ($event.target as HTMLInputElement).value)"
                />
            </div>
            <NuxtLink class="text-xs text-blue-600 ml-1" href="https://neptun3.ppke.hu/hallgato_uj/calendar">
                {{ $t('calendar.connect.neptunOpen') }}
            </NuxtLink>
        </div>

        <!-- Error -->
        <div v-if="saveStatus === 'error'"
             class="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
            <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
            {{ saveError }}
        </div>

        <!-- Save button -->
        <button
            :disabled="!canSave"
            class="w-full flex items-center justify-center gap-2 h-11 rounded-full text-sm font-semibold transition-all duration-300 bg-primary text-primary-foreground disabled:opacity-38 disabled:cursor-not-allowed"
            @click="emit('save')"
        >
            <Check v-if="saveStatus === 'success'" class="w-4 h-4"/>
            <RefreshCw v-else-if="saveStatus === 'saving'" class="w-4 h-4 animate-spin"/>
            {{
                saveStatus === 'success' ? $t('calendar.saved') : saveStatus === 'saving' ? $t('calendar.saving') : $t('calendar.save')
            }}
        </button>
    </div>
</template>