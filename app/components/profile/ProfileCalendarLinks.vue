<script setup lang="ts">
import {Link, RefreshCw, Check, AlertCircle} from 'lucide-vue-next'
import type {CalendarLink} from '#shared/types/calendar'

const {t, locale} = useI18n()
const {user} = useUserSession()
const username = computed(() => (user.value as any)?.login as string | undefined)

const neptunUrl = ref('')
const moodleUrl = ref('')
const calStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const calError = ref('')
const neptunLastSync = ref<string | null>(null)
const moodleLastSync = ref<string | null>(null)

async function load() {
    if (!username.value) return
    const data = await $fetch<{
        neptunLink: CalendarLink | null
        moodleLink: CalendarLink | null
        neptunLastSyncedAt: string | null
        moodleLastSyncedAt: string | null
    }>(`/api/calendar/links`)
    neptunUrl.value = data?.neptunLink?.url ?? ''
    moodleUrl.value = data?.moodleLink?.url ?? ''
    neptunLastSync.value = data?.neptunLastSyncedAt ?? null
    moodleLastSync.value = data?.moodleLastSyncedAt ?? null
}

async function save() {
    if (!username.value) return
    calStatus.value = 'saving'
    calError.value = ''
    try {
        await $fetch('/api/calendar/links', {
            method: 'PUT',
            body: {
                username: username.value,
                neptunLink: neptunUrl.value.trim() || null,
                moodleLink: moodleUrl.value.trim() || null,
                extras: [],
            },
        })
        calStatus.value = 'saved'
        setTimeout(() => {
            calStatus.value = 'idle'
        }, 2000)
    } catch (e: any) {
        calStatus.value = 'error'
        calError.value = e?.statusMessage ?? t('calendar.connect.unknownError')
    }
}

function formatSync(dateStr: string | null): string {
    if (!dateStr) return t('profile.neverSynced')
    const date = new Date(dateStr).toLocaleString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    return t('profile.lastSync', {date})
}

onMounted(load)
</script>

<template>
    <List>
        <ListLabel :title="$t('profile.calendarLinks')" :description="$t('profile.calendarLinksDesc')"/>
        <ListContent class="flex flex-col gap-0.5">
            <ListItem static class="flex-col items-start gap-1.5">
                <Label class="flex items-center gap-2">
                    <NuxtImg src="/icons/neptun.svg" class="h-4 w-auto"/>
                    {{ $t('profile.neptunLabel') }}
                </Label>
                <div class="relative w-full">
                    <Link
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
                    <Input v-model="neptunUrl" type="url" :placeholder="$t('calendar.connect.neptunPlaceholder')"
                           class="pl-9"/>
                </div>
                <p class="text-[10px] text-muted-foreground">{{ formatSync(neptunLastSync) }}</p>
            </ListItem>
            <ListItem static class="flex-col items-start gap-1.5">
                <Label class="flex items-center gap-2">
                    <NuxtImg src="/icons/moodle.svg" class="h-4 w-auto"/>
                    {{ $t('profile.moodleLabel') }}
                </Label>
                <div class="relative w-full">
                    <Link
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
                    <Input v-model="moodleUrl" type="url" :placeholder="$t('calendar.connect.moodlePlaceholder')"
                           class="pl-9"/>
                </div>
                <p class="text-[10px] text-muted-foreground">{{ formatSync(moodleLastSync) }}</p>
            </ListItem>
        </ListContent>
        <div v-if="calStatus === 'error'"
             class="flex items-center gap-2 mt-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
            <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
            {{ calError }}
        </div>
        <Button class="w-full mt-2" :disabled="calStatus === 'saving'" @click="save">
            <Check v-if="calStatus === 'saved'" class="w-4 h-4"/>
            <RefreshCw v-else-if="calStatus === 'saving'" class="w-4 h-4 animate-spin"/>
            {{
                calStatus === 'saved' ? $t('calendar.saved') : calStatus === 'saving' ? $t('calendar.saving') : $t('calendar.save')
            }}
        </Button>
    </List>
</template>