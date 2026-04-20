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
    <header
        class="bg-background flex flex-col md:flex-row gap-4 items-center justify-between px-2 md:px-4 pt-4 shrink-0">
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" @click="emit('previous')">
                    <ChevronLeft class="w-3.5 h-3.5"/>
                </Button>
                <Button variant="outline" size="icon-sm" @click="emit('next')">
                    <ChevronRight class="w-3.5 h-3.5"/>
                </Button>
                <Button variant="outline" size="sm" @click="emit('goToToday')">{{ $t('calendar.today') }}</Button>
            </div>
            <h1 class="text-2xl font-bold text-foreground capitalize w-44 tracking-tight">
                {{ currentDate.getFullYear() }} {{ monthName }}
            </h1>


            <div v-if="loading" class="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <RefreshCw class="w-3 h-3 animate-spin"/>
                {{ $t('calendar.loading') }}
            </div>
            <div v-if="error" class="flex items-center gap-1.5 text-[10px] text-destructive font-medium">
                <AlertCircle class="w-3 h-3"/>
                {{ error }}
            </div>
        </div>

        <div class="flex flex-row gap-2">
            <Button
                v-for="v in views"
                :key="v.key"
                variant="outline"
                size="sm"
                :class="view === v.key ? 'bg-card shadow-sm' : ''"
                @click="emit('viewChange', v.key)"
            >
                {{ v.label }}
            </Button>
        </div>
    </header>
</template>