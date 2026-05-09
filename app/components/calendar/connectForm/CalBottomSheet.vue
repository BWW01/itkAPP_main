<script setup lang="ts">
import {computed} from 'vue'
import {X} from 'lucide-vue-next'
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
    <Teleport to="body">
        <Transition name="sheet-overlay">
            <div v-if="open" class="fixed inset-0 z-50 bg-black/40 md:hidden" @click="open = false"/>
        </Transition>

        <Transition name="sheet">
            <div v-if="open"
                 class="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card rounded-t-3xl shadow-2xl pb-[env(safe-area-inset-bottom)]">

                <!-- Handle -->
                <div class="flex justify-center pt-3 pb-1">
                    <div class="w-9 h-1 rounded-full bg-border"/>
                </div>

                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-3">
                    <div>
                        <p class="text-sm font-semibold text-foreground">{{ $t('calendar.connect.title') }}</p>
                        <p class="text-xs text-muted-foreground mt-0.5">{{ $t('calendar.connect.description') }}</p>
                    </div>
                    <button
                        class="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                        @click="open = false"
                    >
                        <X class="w-3.5 h-3.5"/>
                    </button>
                </div>

                <!-- Form -->
                <div class="px-5 pb-6">
                    <CalConnectForm
                        v-model:moodle-link="moodleLink"
                        v-model:neptun-link="neptunLink"
                        :save-status="saveStatus"
                        :save-error="saveError"
                        :can-save="canSave"
                        @save="save"
                    />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.sheet-overlay-enter-active, .sheet-overlay-leave-active {
    transition: opacity 0.25s ease;
}

.sheet-overlay-enter-from, .sheet-overlay-leave-to {
    opacity: 0;
}

.sheet-enter-active, .sheet-leave-active {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from, .sheet-leave-to {
    transform: translateY(100%);
}
</style>