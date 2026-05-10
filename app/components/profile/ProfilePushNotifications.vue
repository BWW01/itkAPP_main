<script setup lang="ts">
import {Bell, BellOff, RefreshCw, AlertCircle} from 'lucide-vue-next'

const {t} = useI18n()
const {isSupported, permission, subscribe, unsubscribe} = usePushNotifications()
const isSubscribed = ref(false)
const pushLoading = ref(false)
const pushError = ref('')

onMounted(async () => {
    if (!isSupported.value) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    isSubscribed.value = !!sub
})

async function toggle() {
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
                            <template v-else-if="permission === 'denied'">{{ $t('profile.pushDenied') }}</template>
                            <template v-else-if="isSubscribed">{{ $t('profile.pushActive') }}</template>
                            <template v-else>{{ $t('profile.pushInactive') }}</template>
                        </p>
                    </div>
                </div>
                <ClientOnly>
                    <Button :variant="isSubscribed ? 'destructive' : 'default'" size="sm"
                            :disabled="!isSupported || permission === 'denied' || pushLoading"
                            @click="toggle">
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
</template>