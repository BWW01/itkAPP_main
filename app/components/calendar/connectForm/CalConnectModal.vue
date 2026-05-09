<script setup lang="ts">
import {computed} from 'vue'
import CalConnectForm from "~/components/calendar/connectForm/CalConnectForm.vue";

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
    <Dialog v-model:open="open">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>{{ $t('calendar.connect.title') }}</DialogTitle>
                <DialogDescription>{{ $t('calendar.connect.description') }}</DialogDescription>
            </DialogHeader>
            <CalConnectForm
                v-model:moodle-link="moodleLink"
                v-model:neptun-link="neptunLink"
                :save-status="saveStatus"
                :save-error="saveError"
                :can-save="canSave"
                @save="save"
            />
        </DialogContent>
    </Dialog>
</template>