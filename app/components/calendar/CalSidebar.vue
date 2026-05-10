<script setup lang="ts">
import type {CalendarEvent} from '~/utils/parseIcs'
import CalConnectCard from '~/components/calendar/sidebar/CalConnectCard.vue'

defineProps<{
    upcomingEvents: CalendarEvent[]
    loading?: boolean
}>()

defineEmits<{ openConnectModal: [] }>()
</script>

<template>
    <div
        class="w-72 bg-background shrink-0 hidden lg:flex lg:flex-col gap-4 overflow-y-auto rounded-2xl overflow-hidden">
        <CalConnectCard @open-connect-modal="$emit('openConnectModal')"/>
        <UpcomingEvents
            :events="upcomingEvents"
            :loading="loading"
            :show-see-all="false"
            :days="30"
            :limit="10"
        />
    </div>
</template>

<style scoped>
.overflow-y-auto::-webkit-scrollbar {
    width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
}
</style>