<script setup lang="ts">
import CalConnectCard from "~/components/calendar/sidebar/CalConnectCard.vue";

defineEmits<{
    openConnectModal: []
    dateSelected: [date: Date]
}>()
</script>

<template>
    <div class="w-72 bg-background shrink-0 hidden lg:flex lg:flex-col gap-4 overflow-y-auto">
        <CalConnectCard @open-connect-modal="$emit('openConnectModal')"/>
        <CalMiniCalendar @date-selected="$emit('dateSelected', $event)"/>
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