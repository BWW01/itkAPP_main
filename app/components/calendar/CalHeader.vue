<script setup lang="ts">
import {computed} from 'vue'
import {ChevronLeft, ChevronRight, RefreshCw, AlertCircle} from "lucide-vue-next"
import type {CalView} from "@/types/calendar"

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
    <header class="bg-background border-b border-border shrink-0">
        <div class="flex items-center justify-between gap-3 px-3 md:px-5 h-14">

            <!-- Left: nav + title -->
            <div class="flex items-center gap-2 min-w-0">

                <!-- Prev / Next -->
                <div class="flex items-center bg-muted rounded-lg p-0.5 shrink-0">
                    <Button variant="ghost" size="icon-sm" @click="emit('previous')">
                        <ChevronLeft class="w-3.5 h-3.5"/>
                    </Button>
                    <Button variant="ghost" size="icon-sm" @click="emit('next')">
                        <ChevronRight class="w-3.5 h-3.5"/>
                    </Button>
                </div>

                <!-- Today -->
                <Button variant="outline" size="sm" class="shrink-0 hidden sm:flex" @click="emit('today')">
                    {{ $t('calendar.today') }}
                </Button>

                <!-- Month + Year -->
                <h1 class="text-base font-bold text-foreground capitalize tracking-tight truncate">
                    <span>{{ monthName }}</span>
                    <span class="text-muted-foreground font-medium ml-1.5">{{ currentDate.getFullYear() }}</span>
                </h1>

                <!-- Loading / Error -->
                <div v-if="loading"
                     class="flex items-center gap-1 text-[10px] text-muted-foreground font-medium shrink-0">
                    <RefreshCw class="w-3 h-3 animate-spin"/>
                    <span class="hidden sm:inline">{{ $t('calendar.loading') }}</span>
                </div>
                <div v-if="error" class="flex items-center gap-1 text-[10px] text-destructive font-medium shrink-0">
                    <AlertCircle class="w-3 h-3"/>
                    <span class="hidden sm:inline">{{ error }}</span>
                </div>
            </div>

            <!-- Right: view switcher -->
            <div class="flex items-center bg-muted rounded-lg p-0.5 shrink-0">
                <Button
                    v-for="v in views"
                    :key="v.key"
                    variant="ghost"
                    size="sm"
                    :class="[
                        'transition-all duration-150 text-xs',
                        view === v.key
                            ? 'bg-background shadow-sm text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                    ]"
                    @click="emit('viewChange', v.key)"
                >
                    <span class="sm:hidden">{{ v.key === '3day' ? '3' : v.label[0].toUpperCase() }}</span>
                    <span class="hidden sm:inline">{{ v.label }}</span>
                </Button>
            </div>
        </div>
    </header>
</template>