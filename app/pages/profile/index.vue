<script setup lang="ts">
import {Mail} from "lucide-vue-next";

definePageMeta({
    layout: "default",
});
useHead({title: $t('pages.profile')})

const {user} = useUserSession();
</script>

<template>
    <div class="h-full flex flex-col overflow-y-auto">
        <div class="p-6 border-b border-slate-200 bg-white">
            <h1 class="text-2xl font-semibold text-slate-900">Profil</h1>
        </div>

        <div class="flex-1 p-6">
            <div class="max-w-2xl space-y-6">
                <!-- Profile Card -->
                <div class="border border-slate-200 rounded-lg p-6 bg-white">
                    <div class="flex items-start gap-6">
                        <Avatar class="h-20 w-20">
                            <AvatarImage src=""/>
                            <AvatarFallback class="bg-slate-200 text-slate-700 text-lg font-semibold">
                                {{ user?.name?.[0] }}
                            </AvatarFallback>
                        </Avatar>

                        <div class="flex-1">
                            <h2 class="text-lg font-semibold text-slate-900">{{ user?.name }}</h2>
                            <p class="text-sm text-slate-600 mt-0.5">Hallgató</p>
                        </div>

                        <Button variant="outline" size="sm" @click="navigateTo('/profile/settings')">
                            Profil szerkesztése
                        </Button>
                    </div>
                </div>

                <!-- Contact Information -->
                <div class="border border-slate-200 rounded-lg p-6 bg-white space-y-4">
                    <h3 class="font-semibold text-slate-900">Kapcsolat</h3>

                    <div class="space-y-3">
                        <div class="flex items-center gap-3">
                            <Mail class="h-4 w-4 text-slate-500"/>
                            <div>
                                <p class="text-xs text-slate-600">E-mail</p>
                                <p class="text-sm font-medium text-slate-900">{{ user?.email }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>