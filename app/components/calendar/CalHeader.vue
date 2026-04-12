<script setup lang="ts">
import {computed} from 'vue'
import {ChevronLeft, ChevronRight, RefreshCw, AlertCircle} from "lucide-vue-next"
import type {CalView} from "@/types/calendar";

const {locale} = useI18n()


const props = defineProps<{
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

const monthName = computed(() =>
    props.currentDate.toLocaleString(locale.value === 'hu' ? 'hu-HU' : 'en-US', {month: 'long'})
)

const views: { key: CalView, label: string }[] = [
    {key: 'month', label: $t('calendar.month')},
    {key: 'week', label: $t('calendar.week')},
    {key: '3day', label: $t('calendar.threeDay')},
    {key: 'day', label: $t('calendar.day')},
]
</script>

<template>
    <header class="h-14 bg-background flex items-center justify-between px-4 py-2 shrink-0">
        <div class="flex items-center gap-3">
            <h1 class="text-sm font-bold text-foreground capitalize w-36 tracking-tight">
                {{ monthName }} {{ currentDate.getFullYear() }}
            </h1>
            <div class="flex items-center bg-muted rounded-lg p-0.5">
                <Button variant="ghost" size="icon-sm" @click="emit('previous')">
                    <ChevronLeft class="w-3.5 h-3.5"/>
                </Button>
                <Button variant="ghost" size="sm" @click="emit('goToToday')">{{ $t('calendar.today') }}</Button>
                <Button variant="ghost" size="icon-sm" @click="emit('next')">
                    <ChevronRight class="w-3.5 h-3.5"/>
                </Button>
            </div>

            <div v-if="loading" class="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <RefreshCw class="w-3 h-3 animate-spin"/>
                {{ $t('calendar.loading') }}
            </div>
            <div v-if="error" class="flex items-center gap-1.5 text-[10px] text-destructive font-medium">
                <AlertCircle class="w-3 h-3"/>
                {{ error }}
            </div>
        </div>

        <div class="flex bg-muted rounded-md p-0.5">
            <Button
                v-for="v in views"
                :key="v.key"
                variant="ghost"
                size="sm"
                :class="view === v.key ? 'bg-card shadow-sm' : ''"
                @click="emit('viewChange', v.key)"
            >
                {{ v.label }}
            </Button>
        </div>
    </header>
</template>