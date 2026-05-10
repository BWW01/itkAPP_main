<script setup lang="ts">
import {X} from 'lucide-vue-next'
import type {HTMLAttributes} from 'vue'
import {cn} from "~/lib/utils";

defineProps<{
    title?: string
    description?: string
    class?: HTMLAttributes['class']
}>()

const open = defineModel<boolean>('open')
const isMobile = useMediaQuery('(max-width: 768px)')
</script>

<template>
    <Teleport to="body">
        <!-- Overlay -->
        <Transition name="overlay">
            <div
                v-if="open"
                class="fixed inset-0 z-50 bg-black/40"
                @click="open = false"
            />
        </Transition>

        <!-- Mobile: bottom sheet -->
        <Transition :name="isMobile ? 'sheet' : 'dialog'">
            <div
                v-if="open"
                :class="[
                    'fixed z-50 bg-card shadow-2xl',
                    isMobile
                        ? 'bottom-0 left-0 right-0 rounded-t-3xl pb-[env(safe-area-inset-bottom)]'
                        : 'top-1/2 left-1/2 w-full max-w-md rounded-3xl desktop-modal'
                ]"
            >
                <!-- Handle -->
                <div class="flex justify-center pt-4 pb-1">
                    <div v-if="isMobile" class="w-9 h-1 rounded-full bg-border"/>
                </div>

                <!-- Header -->
                <div v-if="title || $slots.header" class="flex items-start justify-between px-6 pt-2 pb-4">
                    <slot name="header">
                        <div class="flex-1 min-w-0">
                            <p v-if="title" class="text-sm font-semibold text-foreground">{{ title }}</p>
                            <p v-if="description" class="text-xs text-muted-foreground mt-0.5">{{ description }}</p>
                        </div>
                    </slot>
                    <button
                        class="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors shrink-0 ml-3"
                        @click="open = false"
                    >
                        <X class="w-3.5 h-3.5"/>
                    </button>
                </div>

                <!-- Content -->
                <div :class="cn('px-6 pb-6', $props.class)">
                    <slot/>
                </div>

                <!-- Footer -->
                <div v-if="$slots.footer" class="px-6 pb-6 pt-0">
                    <slot name="footer"/>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay-enter-active, .overlay-leave-active {
    transition: opacity 0.25s ease;
}

.overlay-enter-from, .overlay-leave-to {
    opacity: 0;
}

/* Mobile: slide up */
.sheet-enter-active, .sheet-leave-active {
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-enter-from, .sheet-leave-to {
    transform: translateY(100%);
}

/* Desktop: always centered via CSS, scale in */
.desktop-modal {
    transform: translate(-50%, -50%);
}

.dialog-enter-active, .dialog-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.dialog-enter-from, .dialog-leave-to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.96);
}

.dialog-enter-to, .dialog-leave-from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}
</style>