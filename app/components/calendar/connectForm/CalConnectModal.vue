<script setup lang="ts">
import {computed} from 'vue'

const props = defineProps<{ username: string }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open')

const usernameRef = computed(() => props.username)
const {moodleLink, neptunLink, saveStatus, saveError, canSave, save} =
    useCalConnect(usernameRef, () => open.value, () => emit('saved'), () => {
        open.value = false
    })
</script>

<template>
    <AppModal
        v-model:open="open"
        :title="$t('calendar.connect.title')"
        :description="$t('calendar.connect.description')"
    >
        <CalConnectForm
            v-model:moodle-link="moodleLink"
            v-model:neptun-link="neptunLink"
            :save-status="saveStatus"
            :save-error="saveError"
            :can-save="canSave"
            @save="save"
        />
    </AppModal>
</template>