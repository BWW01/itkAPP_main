<script setup lang="ts">
import {ref} from 'vue'
import {Link, Check, AlertCircle, RefreshCw} from "lucide-vue-next"
import type {SaveStatus} from "@/types/ui";

const props = defineProps<{ username: string }>()
const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>('open')

const moodleLink = ref('')
const neptunLink = ref('')
const saveStatus = ref<SaveStatus>('idle')
const saveError = ref('')

async function save() {
    saveStatus.value = 'saving'
    saveError.value = ''
    const links = [moodleLink.value, neptunLink.value]
        .map(l => l.trim())
        .filter(l => l !== '')
    try {
        await $fetch('/api/calendar/importCalLinks', {
            method: 'POST',
            body: {username: props.username, links}
        })
        saveStatus.value = 'success'
        emit('saved')
        setTimeout(() => {
            open.value = false
            saveStatus.value = 'idle'
        }, 1200)
    } catch (e: any) {
        saveStatus.value = 'error'
        saveError.value = e?.statusMessage || 'Ismeretlen hiba'
    }
}
</script>

<template>
    <Dialog v-model:open="open">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>{{ $t('calendar.connect.title') }}</DialogTitle>
                <DialogDescription>{{ $t('calendar.connect.description') }}</DialogDescription>
            </DialogHeader>

            <DialogDescription>
                <div class="space-y-4">
                    <!-- Moodle -->
                    <div>
                        <label class="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                            <NuxtImg src="/icons/moodle-small.png" class="h-5 w-auto"/>
                            {{ $t('calendar.connect.moodleLabel') }}
                        </label>
                        <div class="relative">
                            <Link class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
                            <input
                                v-model="moodleLink"
                                type="url"
                                placeholder="https://moodle.itk.ppke.hu/calendar/export.php?..."
                                class="w-full pl-9 pr-4 py-2.5 text-xs border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all bg-muted placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <NuxtLink class="text-xs text-blue-600 ml-1" href="https://moodle.ppke.hu/calendar/export.php?">
                            {{ $t('calendar.connect.moodleOpen') }}
                        </NuxtLink>
                    </div>

                    <!-- Neptun -->
                    <div>
                        <label class="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                            <NuxtImg src="/icons/neptun-small.png" class="h-5 w-auto"/>
                            {{ $t('calendar.connect.neptunLabel') }}
                        </label>
                        <div class="relative">
                            <Link class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
                            <input
                                v-model="neptunLink"
                                type="url"
                                placeholder="https://neptun.ppke.hu/hallgato/ical/..."
                                class="w-full pl-9 pr-4 py-2.5 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all bg-muted placeholder:text-muted-foreground/50"
                            />
                        </div>
                        <NuxtLink class="text-xs text-blue-600 ml-1"
                                  href="https://neptun3.ppke.hu/hallgato_uj/calendar">
                            {{ $t('calendar.connect.neptunOpen') }}
                        </NuxtLink>
                    </div>

                    <div v-if="saveStatus === 'error'"
                         class="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium">
                        <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
                        {{ saveError }}
                    </div>
                </div>
            </DialogDescription>

            <DialogFooter>
                <Button
                    class="w-full"
                    :disabled="saveStatus === 'saving' || saveStatus === 'success'"
                    @click="save"
                >
                    <Check v-if="saveStatus === 'success'" class="w-4 h-4"/>
                    <RefreshCw v-else-if="saveStatus === 'saving'" class="w-4 h-4 animate-spin"/>
                    {{
                        saveStatus === 'success' ? $t('calendar.saved') : saveStatus === 'saving' ? $t('calendar.saving') : $t('calendar.save')
                    }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
