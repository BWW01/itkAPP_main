<script setup lang="ts">
import type {CalView} from '@/types/calendar'
import CalNavControls from "~/components/calendar/header/CalNavControls.vue";
import CalViewSwitcher from "~/components/calendar/header/CalViewSwitcher.vue";
import CalDateTitle from "~/components/calendar/header/CalDateTitle.vue";

defineProps<{
    currentDate: Date
    loading: boolean
    error: string | null
    view: CalView
}>()

const emit = defineEmits<{
    previous: []
    next: []
    today: []
    viewChange: [view: CalView]
}>()
</script>

<template>
    <header class="bg-background shrink-0">
        <!-- Desktop: single row -->
        <div class="hidden md:flex items-center justify-between gap-4 px-4 pt-4">
            <div class="flex items-center gap-4 min-w-0">
                <CalNavControls
                    @previous="emit('previous')"
                    @today="emit('today')"
                    @next="emit('next')"
                />
                <CalDateTitle :current-date="currentDate" :loading="loading" :error="error"/>
            </div>
            <CalViewSwitcher :view="view" @change="emit('viewChange', $event)"/>
        </div>

        <!-- Mobile: two rows -->
        <div class="md:hidden flex flex-col gap-4 pt-4">
            <div class="flex items-center gap-4 px-4 justify-between">
                <CalDateTitle :current-date="currentDate" :loading="loading" :error="error"/>
                <CalNavControls
                    @previous="emit('previous')"
                    @today="emit('today')"
                    @next="emit('next')"
                />
            </div>
            <div class="px-3">
                <CalViewSwitcher :view="view" full-width @change="emit('viewChange', $event)"/>
            </div>
        </div>
    </header>
</template>