<script setup lang="ts">
import {Mail, User, Calendar, Bell, BellOff, Link, RefreshCw, Check, AlertCircle} from 'lucide-vue-next'
import type {CalendarLink} from '#shared/types/calendar'

definePageMeta({layout: 'default'})
useHead({title: $t('pages.profile')})

const {t, locale} = useI18n()
const {user} = useUserSession()
const u = computed(() => user.value as any)
const username = computed(() => u.value?.login as string | undefined)

// --- Naptár linkek ---
const neptuneUrl = ref('')
const moodleUrl = ref('')
const calStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const calError = ref('')
const neptuneLastSync = ref<string | null>(null)
const moodleLastSync = ref<string | null>(null)

async function loadCalLinks() {
    if (!username.value) return
    const data = await $fetch<{
        neptuneLink: CalendarLink | null
        moodleLink: CalendarLink | null
        neptuneLastSyncedAt: string | null
        moodleLastSyncedAt: string | null
    }>(`/api/calendar/getCalLinks?username=${username.value}`)
    neptuneUrl.value = data?.neptuneLink?.url ?? ''
    moodleUrl.value = data?.moodleLink?.url ?? ''
    neptuneLastSync.value = data?.neptuneLastSyncedAt ?? null
    moodleLastSync.value = data?.moodleLastSyncedAt ?? null
}

async function saveCalLinks() {
    if (!username.value) return
    calStatus.value = 'saving'
    calError.value = ''
    try {
        await $fetch('/api/calendar/importCalLinks', {
            method: 'POST',
            body: {
                username: username.value,
                neptuneLink: neptuneUrl.value.trim() || null,
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

// --- Push ---
const {isSupported, permission, subscribe, unsubscribe} = usePushNotifications()
const isSubscribed = ref(false)
const pushLoading = ref(false)
const pushError = ref('')

onMounted(async () => {
    await loadCalLinks()
    if (!isSupported.value) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    isSubscribed.value = !!sub
})

async function toggleSubscription() {
    pushLoading.value = true
    pushError.value = ''
    try {
        if (isSubscribed.value) {
            await unsubscribe()
            isSubscribed.value = false
        } else {
            const sub = await subscribe()
            isSubscribed.value = !!sub
            if (!sub) pushError.value = t('profile.pushError')
        }
    } catch (e: any) {
        pushError.value = e?.message ?? t('calendar.connect.unknownError')
    } finally {
        pushLoading.value = false
    }
}
</script>

<template>
    <div class="h-full overflow-y-auto bg-background">
        <div class="max-w-2xl mx-auto px-4 py-8 space-y-4">

            <!-- Header -->
            <Card class="p-6">
                <div class="flex items-center gap-5">
                    <Avatar class="h-16 w-16 shrink-0">
                        <AvatarImage src=""/>
                        <AvatarFallback class="text-xl font-bold bg-primary/15 text-primary">
                            {{ u?.login?.[0]?.toUpperCase() || 'U' }}
                        </AvatarFallback>
                    </Avatar>
                    <div class="flex-1 min-w-0">
                        <h1 class="text-lg font-bold text-foreground truncate">{{ u?.name }}</h1>
                        <p class="text-xs text-muted-foreground mt-0.5">{{ u?.login }}</p>
                    </div>
                </div>
            </Card>

            <!-- Fiók adatok -->
            <List>
                <ListLabel :title="$t('profile.account')"/>
                <ListContent class="flex flex-col gap-0.5">
                    <ListItem static>
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                            <User class="w-4 h-4 text-primary"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                {{ $t('profile.username') }}</p>
                            <p class="text-sm font-medium text-foreground mt-0.5">{{ u?.login }}</p>
                        </div>
                    </ListItem>
                    <ListItem static>
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                            <Mail class="w-4 h-4 text-primary"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                {{ $t('profile.email') }}</p>
                            <p class="text-sm font-medium text-foreground mt-0.5">{{ u?.email ?? '—' }}</p>
                        </div>
                    </ListItem>
                    <ListItem static>
                        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                            <Calendar class="w-4 h-4 text-primary"/>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                {{ $t('profile.login') }}</p>
                            <p class="text-sm font-medium text-foreground mt-0.5">{{ $t('profile.loginMethod') }}</p>
                        </div>
                    </ListItem>
                </ListContent>
            </List>

            <!-- Naptár linkek -->
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
                            <Input v-model="neptuneUrl" type="url"
                                   :placeholder="$t('calendar.connect.neptunPlaceholder')" class="pl-9"/>
                        </div>
                        <p class="text-[10px] text-muted-foreground">{{ formatSync(neptuneLastSync) }}</p>
                    </ListItem>
                    <ListItem static class="flex-col items-start gap-1.5">
                        <Label class="flex items-center gap-2">
                            <NuxtImg src="/icons/moodle.svg" class="h-4 w-auto"/>
                            {{ $t('profile.moodleLabel') }}
                        </Label>
                        <div class="relative w-full">
                            <Link
                                class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"/>
                            <Input v-model="moodleUrl" type="url"
                                   :placeholder="$t('calendar.connect.moodlePlaceholder')" class="pl-9"/>
                        </div>
                        <p class="text-[10px] text-muted-foreground">{{ formatSync(moodleLastSync) }}</p>
                    </ListItem>
                </ListContent>

                <div v-if="calStatus === 'error'"
                     class="flex items-center gap-2 mt-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
                    <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
                    {{ calError }}
                </div>
                <Button class="w-full mt-2" :disabled="calStatus === 'saving'" @click="saveCalLinks">
                    <Check v-if="calStatus === 'saved'" class="w-4 h-4"/>
                    <RefreshCw v-else-if="calStatus === 'saving'" class="w-4 h-4 animate-spin"/>
                    {{
                        calStatus === 'saved' ? $t('calendar.saved') : calStatus === 'saving' ? $t('calendar.saving') : $t('calendar.save')
                    }}
                </Button>
            </List>

            <!-- Push értesítések -->
            <List>
                <ListLabel :title="$t('profile.push')" :description="$t('profile.pushDesc')"/>
                <ListContent class="flex flex-col gap-0.5">
                    <ListItem static class="justify-between">
                        <div class="flex items-center gap-3">
                            <div
                                :class="['flex items-center justify-center w-9 h-9 rounded-full shrink-0', isSubscribed ? 'bg-primary/15' : 'bg-muted']">
                                <Bell v-if="isSubscribed" class="w-4 h-4 text-primary"/>
                                <BellOff v-else class="w-4 h-4 text-muted-foreground"/>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-foreground">
                                    {{ isSubscribed ? $t('profile.subscribed') : $t('profile.notSubscribed') }}
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    <template v-if="!isSupported">{{ $t('profile.pushNotSupported') }}</template>
                                    <template v-else-if="permission === 'denied'">{{
                                            $t('profile.pushDenied')
                                        }}
                                    </template>
                                    <template v-else-if="isSubscribed">{{ $t('profile.pushActive') }}</template>
                                    <template v-else>{{ $t('profile.pushInactive') }}</template>
                                </p>
                            </div>
                        </div>
                        <ClientOnly>
                            <Button
                                :variant="isSubscribed ? 'destructive' : 'default'"
                                size="sm"
                                :disabled="!isSupported || permission === 'denied' || pushLoading"
                                @click="toggleSubscription"
                            >
                                <RefreshCw v-if="pushLoading" class="w-3.5 h-3.5 animate-spin"/>
                                <Bell v-else-if="!isSubscribed" class="w-3.5 h-3.5"/>
                                <BellOff v-else class="w-3.5 h-3.5"/>
                                {{ isSubscribed ? $t('profile.unsubscribe') : $t('profile.subscribe') }}
                            </Button>
                        </ClientOnly>
                    </ListItem>
                </ListContent>
                <div v-if="pushError"
                     class="flex items-center gap-2 mt-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
                    <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
                    {{ pushError }}
                </div>
            </List>

            <button @click="locale = locale === 'hu' ? 'en' : 'hu'">
                {{ locale }}
            </button>

        </div>
    </div>
</template>