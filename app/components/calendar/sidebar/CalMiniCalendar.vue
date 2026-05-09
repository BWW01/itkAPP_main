<script setup lang="ts">
import {toDate, type DateValue} from 'reka-ui/date'

const emit = defineEmits<{ dateSelected: [date: Date] }>()

function onSelect(val: DateValue | undefined) {
    if (!val) return
    emit('dateSelected', toDate(val))
}
</script>

<template>
    <Calendar class="bg-card rounded-md" @update:model-value="onSelect"/>
</template>