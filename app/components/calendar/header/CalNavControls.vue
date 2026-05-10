<script setup lang="ts">
import {ChevronLeft, ChevronRight} from 'lucide-vue-next'

const emit = defineEmits<{
    previous: []
    today: []
    next: []
}>()
</script>

<template>
    <div class="flex items-center shrink-0 rounded-full border border-border overflow-hidden">
        <button
            class="flex items-center justify-center w-8 h-8 text-muted-foreground border-r border-border hover:bg-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
            @click="emit('previous')"
        >
            <ChevronLeft class="w-4 h-4"/>
        </button>
        <button
            class="flex items-center justify-center h-8 px-3 text-xs font-medium text-muted-foreground border-r border-border hover:bg-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
            @click="emit('today')"
        >
            {{ $t('calendar.today') }}
        </button>
        <button
            class="flex items-center justify-center w-8 h-8 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150 cursor-pointer"
            @click="emit('next')"
        >
            <ChevronRight class="w-4 h-4"/>
        </button>
    </div>
</template>