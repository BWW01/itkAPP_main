<script setup lang="ts">
import {ChevronLeft} from 'lucide-vue-next'
import type {Component} from 'vue'

defineProps<{
    title: string
    subtitle?: string
    back?: string | boolean
    action?: {
        label: string
        icon?: Component
        onClick: () => void
    }
}>()
</script>

<template>
    <div class="flex items-center justify-between gap-3 mb-4">

        <!-- Left: back + title -->
        <div class="flex items-center gap-3 min-w-0">
            <button
                v-if="back"
                class="flex items-center justify-center w-8 h-8 rounded-full border border-border text-muted-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer"
                @click="typeof back === 'string' ? navigateTo(back) : $router.back()"
            >
                <ChevronLeft class="w-4 h-4"/>
            </button>

            <div class="min-w-0">
                <h1 class="text-2xl font-bold text-foreground truncate">{{ title }}</h1>
                <p v-if="subtitle" class="text-xs text-muted-foreground mt-0.5">{{ subtitle }}</p>
            </div>
        </div>

        <!-- Right: action slot or action prop -->
        <div class="shrink-0">
            <slot name="action">
                <Button v-if="action" variant="outline" size="sm" @click="action.onClick()">
                    <component :is="action.icon" v-if="action.icon" class="w-3.5 h-3.5"/>
                    {{ action.label }}
                </Button>
            </slot>
        </div>

    </div>
</template>