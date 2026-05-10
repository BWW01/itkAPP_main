<script setup lang="ts">
import {Plus} from 'lucide-vue-next'

const emit = defineEmits<{ openConnectModal: [] }>()
</script>

<template>
    <div>
        <ListLabel :title="$t('calendar.sidebar.todos')"/>
        <Card class="bg-card text-primary gap-1">
            <CardHeader>
                <div class="flex items-center gap-2">
                    <div class="flex space-x-1.5">
                        <NuxtImg src="/icons/neptun.svg" class="h-5 w-auto"/>
                        <NuxtImg src="/icons/moodle.svg" class="h-5 w-auto"/>
                    </div>
                    <span class="text-[11px] font-bold text-primary">Moodle & Neptun</span>
                </div>
            </CardHeader>
            <CardContent class="space-y-3">
                <p class="text-xs text-foreground leading-relaxed">
                    {{ $t('calendar.sidebar.syncDesc') }}
                </p>
                <Button variant="outline" size="sm" class="w-full" @click="emit('openConnectModal')">
                    <Plus/>
                    {{ $t('calendar.connect.title') }}
                </Button>
            </CardContent>
        </Card>
    </div>
</template>