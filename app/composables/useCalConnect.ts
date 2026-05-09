import {ref, computed, watch, type Ref, type ComputedRef} from 'vue'
import type {SaveStatus} from '@/types/ui'
import type {CalendarLink} from '#shared/types/calendar'

export function useCalConnect(
    username: Ref<string | undefined> | ComputedRef<string | undefined>,
    isOpen: () => boolean | undefined,
    onSaved: () => void,
    onClose: () => void,
) {
    const moodleLink = ref('')
    const neptunLink = ref('')
    const saveStatus = ref<SaveStatus>('idle')
    const saveError = ref('')

    const isValidUrl = (url: string) =>
        !url || url.startsWith('http://') || url.startsWith('https://')

    const canSave = computed(() =>
        isValidUrl(moodleLink.value.trim()) &&
        isValidUrl(neptunLink.value.trim()) &&
        saveStatus.value === 'idle'
    )

    watch(isOpen, async (val) => {
        if (!val || !username.value) return
        saveStatus.value = 'idle'
        saveError.value = ''
        try {
            const data = await $fetch<{ moodleLink: CalendarLink | null, neptuneLink: CalendarLink | null }>(
                `/api/calendar/getCalLinks?username=${username.value}`
            )
            moodleLink.value = data?.moodleLink?.url || ''
            neptunLink.value = data?.neptuneLink?.url || ''
        } catch (e) {
            console.error('Nem sikerült betölteni a meglévő linkeket:', e)
        }
    })

    async function save() {
        if (!username.value) return
        saveStatus.value = 'saving'
        saveError.value = ''
        try {
            await $fetch('/api/calendar/importCalLinks', {
                method: 'POST',
                body: {
                    username: username.value,
                    neptuneLink: neptunLink.value.trim() || null,
                    moodleLink: moodleLink.value.trim() || null,
                    extras: [],
                },
            })
            saveStatus.value = 'success'
            onSaved()
            setTimeout(() => {
                onClose()
                saveStatus.value = 'idle'
            }, 1200)
        } catch (e: any) {
            saveStatus.value = 'error'
            saveError.value = e?.statusMessage || 'Ismeretlen hiba'
        }
    }

    return {moodleLink, neptunLink, saveStatus, saveError, canSave, save}
}