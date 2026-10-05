<script setup lang="ts">
import {AlertCircle, Check, RefreshCw, Search, Upload} from 'lucide-vue-next'

const emit = defineEmits<{ imported: [] }>()

interface ImportSummary {
    code: string
    name: string
    major: string
    totalCreditsRequired: number
    groups: {
        name: string
        requiredCredits: number
        isSpecialization: boolean
        subgroups: {
            name: string
            type: 'MANDATORY' | 'ELECTIVE' | 'FREE_ELECTIVE'
            requiredCredits: number
            requiredCount: number | null
            subjects: number
        }[]
    }[]
}

interface ImportResponse {
    dryRun: boolean
    summary: ImportSummary
    warnings: string[]
    skippedFinalExams: string[]
    result: {
        curriculumId: number
        groups: number
        subgroups: number
        subjectLinks: number
        removedGroups: string[]
        removedSubgroups: string[]
    } | null
}

const TYPE_LABEL = {MANDATORY: 'Kötelező', ELECTIVE: 'Köt. vál.', FREE_ELECTIVE: 'Szabadon vál.'} as const

const file = ref<File | null>(null)
const code = ref('')
const name = ref('')
const major = ref('')
const requiredCount = ref('{"Kritériumtárgyak": 2}')
const busy = ref(false)
const error = ref('')
const response = ref<ImportResponse | null>(null)

watch([code, name, major, requiredCount], () => {
    if (response.value?.dryRun) response.value = null
})

function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0] ?? null
    file.value = f
    response.value = null
    error.value = ''
    if (f && !code.value) {
        code.value = f.name.replace(/\.[^.]+$/, '').replace(/\(.*\)$/, '').trim()
    }
}

async function submit(dryRun: boolean) {
    if (!file.value) return
    busy.value = true
    error.value = ''

    const form = new FormData()
    form.append('file', file.value)
    form.append('code', code.value)
    if (name.value.trim()) form.append('name', name.value)
    if (major.value.trim()) form.append('major', major.value)
    if (requiredCount.value.trim()) form.append('requiredCount', requiredCount.value)
    form.append('dryRun', String(dryRun))

    try {
        response.value = await $fetch<ImportResponse>('/api/absolutorium/admin/import', {method: 'POST', body: form})
        if (!dryRun) emit('imported')
    } catch (e: any) {
        response.value = null
        error.value = e?.data?.message ?? e?.statusMessage ?? 'Ismeretlen hiba.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <List>
        <ListLabel title="Tanterv importálása" description="Csak adminoknak · XLS, XLSX vagy CSV"/>
        <ListContent class="flex flex-col gap-0.5">
            <ListItem static class="flex-col items-stretch gap-3">
                <div class="space-y-1.5">
                    <Label>Fájl</Label>
                    <input type="file" accept=".xls,.xlsx,.csv" @change="onFile"
                           class="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary/15 file:px-4 file:py-2 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20 cursor-pointer"/>
                </div>

                <div class="grid gap-3 sm:grid-cols-3">
                    <div class="space-y-1.5">
                        <Label>Kód</Label>
                        <Input v-model="code" placeholder="IANI-MI-2025"/>
                    </div>
                    <div class="space-y-1.5">
                        <Label>Név (opcionális)</Label>
                        <Input v-model="name" placeholder="Mérnökinformatikus BSc (2025/26-tól)"/>
                    </div>
                    <div class="space-y-1.5">
                        <Label>Szak (opcionális)</Label>
                        <Input v-model="major" placeholder="Mérnökinformatikus BSc"/>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <Label>Darabszám-követelmények (JSON)</Label>
                    <textarea v-model="requiredCount" rows="2"
                              class="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono"/>
                </div>

                <div v-if="error"
                     class="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium whitespace-pre-line">
                    <AlertCircle class="w-3.5 h-3.5 shrink-0 mt-0.5"/>
                    {{ error }}
                </div>

                <div class="grid gap-2 sm:grid-cols-2">
                    <Button variant="outline" :disabled="!file || !code.trim() || busy" @click="submit(true)">
                        <RefreshCw v-if="busy" class="w-4 h-4 animate-spin"/>
                        <Search v-else class="w-4 h-4"/>
                        Ellenőrzés
                    </Button>
                    <Button :disabled="response?.dryRun !== true || busy" @click="submit(false)">
                        <Upload class="w-4 h-4"/>
                        Importálás
                    </Button>
                </div>
                <p class="text-[11px] text-muted-foreground">
                    Az importálás csak sikeres ellenőrzés után engedélyezett.
                </p>

                <template v-if="response">
                    <div v-if="response.result"
                         class="flex items-center gap-2 px-3 py-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary font-medium">
                        <Check class="w-3.5 h-3.5 shrink-0"/>
                        Importálva → tanterv #{{ response.result.curriculumId }}: {{ response.result.groups }} csoport,
                        {{ response.result.subgroups }} tárgycsoport, {{ response.result.subjectLinks }} tárgybesorolás
                    </div>

                    <div class="rounded-xl border border-border p-3 space-y-2">
                        <div>
                            <p class="text-sm font-medium text-foreground">
                                {{ response.summary.code }} – {{ response.summary.name }}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                {{ response.summary.major }} · összesen {{ response.summary.totalCreditsRequired }} kredit
                            </p>
                        </div>
                        <div v-for="g in response.summary.groups" :key="g.name" class="text-xs">
                            <p class="font-medium text-foreground">
                                {{ g.name }} – {{ g.requiredCredits }} kr
                                <Badge v-if="g.isSpecialization" variant="secondary" class="ml-1">specializáció</Badge>
                            </p>
                            <p v-for="s in g.subgroups" :key="s.name" class="pl-3 text-muted-foreground">
                                {{ TYPE_LABEL[s.type] }} · {{ s.name }} – {{ s.requiredCredits }} kr ({{ s.subjects }} tárgy<span
                                v-if="s.requiredCount">, legalább {{ s.requiredCount }} tárgy</span>)
                            </p>
                        </div>
                    </div>

                    <p v-if="response.skippedFinalExams.length" class="text-[11px] text-muted-foreground">
                        Kihagyott záróvizsga-tárgyak: {{ response.skippedFinalExams.join(', ') }}
                    </p>
                    <div v-if="response.warnings.length"
                         class="px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                        <p class="font-medium">Figyelmeztetések ({{ response.warnings.length }})</p>
                        <p v-for="w in response.warnings" :key="w">– {{ w }}</p>
                    </div>
                </template>
            </ListItem>
        </ListContent>
    </List>
</template>
