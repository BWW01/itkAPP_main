<script setup lang="ts">
import {User, Calendar} from 'lucide-vue-next'

definePageMeta({layout: 'default'})
useHead({title: $t('pages.profile')})

const {user} = useUserSession()
const u = computed(() => user.value as any)

console.log('user:', JSON.stringify(user.value, null, 2))
</script>

<template>
    <div class="h-full overflow-y-auto bg-background">
        <div class="max-w-2xl mx-auto px-4 py-8 space-y-4">

            <PageHeader :title="$t('pages.profile')" :back="true"/>

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

            <ProfileCalendarLinks/>
            <ProfilePushNotifications/>

        </div>
    </div>
</template>