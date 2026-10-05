<script setup lang="ts">
import {AlertCircle, Check, Plus, RefreshCw, Trash2} from 'lucide-vue-next'
import {watchDebounced} from '@vueuse/core'
import type {AbsolutoriumProgress, SubgroupProgress, SubgroupType} from '#shared/types/absolutorium'

definePageMeta({layout: 'default'})
useHead({title: 'Abszolutórium'})

interface CurriculumOption {
  id: number
  code: string
  name: string
  major: string
  totalCreditsRequired: number
  specializations: { id: number; name: string }[]
}

interface SubjectHit {
  id: number
  code: string
  name: string
  credits: number
  requirementType: string | null
}

interface Completion {
  id: number
  subjectId: number
  code: string
  name: string
  credits: number
  requirementType: string | null
  semester: string
  grade: number | null
}

const TYPE_LABEL: Record<SubgroupType, string> = {
  MANDATORY: 'Kötelező',
  ELECTIVE: 'Köt. vál.',
  FREE_ELECTIVE: 'Szabadon vál.',
}

const errorText = (e: any): string => e?.data?.message ?? e?.statusMessage ?? 'Ismeretlen hiba.'
const isSignatureOnly = (rt: string | null) => rt?.toLowerCase().startsWith('aláírás') ?? false
const pct = (value: number, of: number) => (of > 0 ? Math.min(100, Math.round((value / of) * 100)) : 100)
const gradeLabel = (g: number | null) => (g === null ? 'aláírás' : String(g))

function currentSemester(d = new Date()): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const pair = (start: number) => `${start}/${String((start + 1) % 100).padStart(2, '0')}`
  if (m >= 8) return `${pair(y)}/1`
  if (m === 1) return `${pair(y - 1)}/1`
  return `${pair(y - 1)}/2`
}

const loading = ref(true)
const pageError = ref('')
const isAdmin = ref(false)
const curricula = ref<CurriculumOption[]>([])

async function loadCurricula() {
  curricula.value = await $fetch<CurriculumOption[]>('/api/absolutorium/curricula')
}
const progress = ref<AbsolutoriumProgress | null>(null)
const completions = ref<Completion[]>([])

async function loadProgress() {
  try {
    progress.value = await $fetch<AbsolutoriumProgress>('/api/absolutorium/progress')
  } catch (e: any) {
    if (e?.statusCode === 404) progress.value = null
    else pageError.value = errorText(e)
  }
}

async function loadCompletions() {
  completions.value = await $fetch<Completion[]>('/api/absolutorium/completions')
}

async function reload() {
  pageError.value = ''
  await Promise.all([loadProgress(), loadCompletions()])
}

// ─── Tanterv + specializáció ───
const selectedCurriculumId = ref<number | null>(null)
const selectedSpecializationId = ref<number | null>(null)
const selectedCurriculum = computed(() => curricula.value.find((c) => c.id === selectedCurriculumId.value) ?? null)
const savingCurriculum = ref(false)
const curriculumError = ref('')

watch(selectedCurriculumId, (id, old) => {
  if (old !== null && id !== old) selectedSpecializationId.value = null
})

async function saveCurriculum() {
  if (selectedCurriculumId.value === null) return
  savingCurriculum.value = true
  curriculumError.value = ''
  try {
    await $fetch('/api/absolutorium/curriculum', {
      method: 'PUT',
      body: {
        curriculumId: selectedCurriculumId.value,
        specializationGroupId: selectedSpecializationId.value,
      },
    })
    selectedSubject.value = null
    query.value = ''
    hits.value = []
    addError.value = ''
    await reload()
  } catch (e) {
    curriculumError.value = errorText(e)
  } finally {
    savingCurriculum.value = false
  }
}

// ─── Teljesítés felvitele ───
const query = ref('')
const hits = ref<SubjectHit[]>([])
const selectedSubject = ref<SubjectHit | null>(null)
const semester = ref(currentSemester())
const grade = ref<number | null>(5)
const adding = ref(false)
const addError = ref('')

const subjectLabel = (s: SubjectHit) => `${s.code} – ${s.name}`

const gradeOptions = computed<(number | null)[]>(() => {
  const rt = selectedSubject.value?.requirementType ?? null
  if (isSignatureOnly(rt)) return [null]
  if (rt === null) return [5, 4, 3, 2, 1, null]
  return [5, 4, 3, 2, 1]
})

watchDebounced(query, async (q) => {
  if (selectedSubject.value && q === subjectLabel(selectedSubject.value)) return
  selectedSubject.value = null
  if (q.trim().length < 2) {
    hits.value = []
    return
  }
  try {
    hits.value = await $fetch<SubjectHit[]>('/api/absolutorium/subjects', {query: {q: q.trim()}})
  } catch {
    hits.value = []
  }
}, {debounce: 250})

function pickSubject(s: SubjectHit) {
  selectedSubject.value = s
  query.value = subjectLabel(s)
  hits.value = []
  grade.value = gradeOptions.value[0] ?? null
}

async function addCompletion() {
  if (!selectedSubject.value) return
  adding.value = true
  addError.value = ''
  try {
    await $fetch('/api/absolutorium/completions', {
      method: 'POST',
      body: {subjectId: selectedSubject.value.id, semester: semester.value.trim(), grade: grade.value},
    })
    selectedSubject.value = null
    query.value = ''
    await reload()
  } catch (e) {
    addError.value = errorText(e)
  } finally {
    adding.value = false
  }
}

async function removeCompletion(id: number) {
  try {
    await $fetch(`/api/absolutorium/completions/${id}`, {method: 'DELETE'})
    await reload()
  } catch (e) {
    pageError.value = errorText(e)
  }
}

function subgroupInfo(s: SubgroupProgress): string[] {
  const info: string[] = []
  if (s.requiredCount !== null) info.push(`${s.completedCount}/${s.requiredCount} tárgy`)
  if (s.overflowCredits > 0) info.push(`${s.overflowCredits} kr átszámítva szabvál.-ba`)
  if (s.receivedOverflowCredits > 0) info.push(`ebből ${s.receivedOverflowCredits} kr többlet köt. vál.-ból`)
  return info
}

onMounted(async () => {
  try {
    const [, admin] = await Promise.all([
      loadCurricula(),
      $fetch<{ isAdmin: boolean }>('/api/absolutorium/admin/me'),
    ])
    isAdmin.value = admin.isAdmin
    await reload()
    if (progress.value) {
      selectedCurriculumId.value = progress.value.curriculum.id
      selectedSpecializationId.value = progress.value.specialization.chosenId
    }
  } catch (e) {
    pageError.value = errorText(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-full overflow-y-auto bg-background">
    <div class="max-w-3xl mx-auto px-4 py-8 space-y-4">

      <PageHeader title="Abszolutórium" subtitle="Teszt felület" :back="true">
        <template #action>
          <Button variant="outline" size="sm" :disabled="loading" @click="reload">
            <RefreshCw class="w-3.5 h-3.5"/>
            Frissítés
          </Button>
        </template>
      </PageHeader>

      <div v-if="pageError"
           class="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium">
        <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
        {{ pageError }}
      </div>

      <p v-if="loading" class="text-sm text-muted-foreground">Betöltés…</p>

      <template v-else>
        <AbsolutoriumImportCard v-if="isAdmin" @imported="loadCurricula"/>

        <!-- Tanterv -->
        <List>
          <ListLabel title="Tanterv" description="Tanterv és specializáció kiválasztása"/>
          <ListContent class="flex flex-col gap-0.5">
            <ListItem static class="flex-col items-stretch gap-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <Label>Tanterv</Label>
                  <select v-model="selectedCurriculumId"
                          class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm">
                    <option :value="null" disabled>Válassz…</option>
                    <option v-for="c in curricula" :key="c.id" :value="c.id">
                      {{ c.name }} ({{ c.totalCreditsRequired }} kr)
                    </option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <Label>Specializáció</Label>
                  <select v-model="selectedSpecializationId"
                          :disabled="!selectedCurriculum?.specializations.length"
                          class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50">
                    <option :value="null">Még nincs kiválasztva</option>
                    <option v-for="s in selectedCurriculum?.specializations ?? []" :key="s.id"
                            :value="s.id">
                      {{ s.name }}
                    </option>
                  </select>
                </div>
              </div>
              <p v-if="!curricula.length" class="text-xs text-muted-foreground">
                Nincs importált tanterv. {{ isAdmin ? 'Tölts fel egyet fent.' : 'Kérd meg egy admint, hogy töltsön fel egyet.' }}
              </p>
              <p v-if="curriculumError" class="text-xs text-destructive">{{ curriculumError }}</p>
              <Button :disabled="selectedCurriculumId === null || savingCurriculum" @click="saveCurriculum">
                <RefreshCw v-if="savingCurriculum" class="w-4 h-4 animate-spin"/>
                <Check v-else class="w-4 h-4"/>
                Mentés
              </Button>
            </ListItem>
          </ListContent>
        </List>

        <p v-if="!progress" class="text-sm text-muted-foreground">
          Válassz tantervet az állás megjelenítéséhez.
        </p>

        <template v-else>
          <!-- Összesítés -->
          <List>
            <ListLabel title="Összesítés" :description="progress.curriculum.name"/>
            <ListContent class="flex flex-col gap-0.5">
              <ListItem static class="flex-col items-stretch gap-3">
                <div class="flex items-end justify-between gap-3">
                  <div>
                    <p class="text-3xl font-bold text-foreground">
                      {{ progress.totals.earnedCredits }}
                      <span class="text-base font-medium text-muted-foreground">
                                                / {{ progress.totals.requiredCredits }} kr
                                            </span>
                    </p>
                    <p class="text-xs text-muted-foreground">
                      még {{ progress.totals.remainingCredits }} kredit
                    </p>
                  </div>
                  <Badge :variant="progress.isComplete ? 'default' : 'outline'">
                    {{ progress.isComplete ? 'Abszolutórium teljesítve' : `${progress.totals.percent}%` }}
                  </Badge>
                </div>
                <div class="h-2 rounded-full bg-muted overflow-hidden">
                  <div class="h-full bg-primary transition-all"
                       :style="{width: `${progress.totals.percent}%`}"/>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div v-for="(t, type) in progress.byType" :key="type"
                       class="rounded-xl border border-border p-3">
                    <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      {{ TYPE_LABEL[type] }}
                    </p>
                    <p class="text-sm font-medium text-foreground mt-1">
                      {{ t.countedCredits }} / {{ t.requiredCredits }} kr
                    </p>
                    <p v-if="t.earnedCredits !== t.countedCredits"
                       class="text-[10px] text-muted-foreground">
                      teljesítve: {{ t.earnedCredits }} kr
                    </p>
                  </div>
                </div>
                <div v-if="progress.specialization.chosenId === null && progress.specialization.options.length"
                     class="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle class="w-3.5 h-3.5 shrink-0"/>
                  Még nincs specializáció kiválasztva – a specializációs tárgyak addig szabadon
                  választhatóként számítanak.
                </div>
              </ListItem>
            </ListContent>
          </List>

          <!-- Csoportok -->
          <List v-for="g in progress.groups" :key="g.id">
            <ListLabel
                :title="`${g.isComplete ? '✓ ' : ''}${g.name}`"
                :description="`${g.countedCredits} / ${g.requiredCredits} kr · ${g.completedSubgroupCount} / ${g.requiredSubgroupCount} tárgycsoport${g.isSpecialization ? ' · specializáció' : ''}`"
            />
            <ListContent class="flex flex-col gap-0.5">
              <ListItem v-for="s in g.subgroups" :key="s.id" static class="flex-col items-stretch gap-2">
                <div class="flex items-center gap-2">
                  <Badge variant="secondary">{{ TYPE_LABEL[s.type] }}</Badge>
                  <span class="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
                                        {{ s.name }}
                                    </span>
                  <span class="text-xs text-muted-foreground shrink-0">
                                        {{ s.countedCredits }} / {{ s.requiredCredits }} kr
                                    </span>
                  <Check v-if="s.isComplete" class="w-4 h-4 text-primary shrink-0"/>
                </div>
                <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div class="h-full bg-primary transition-all"
                       :style="{width: `${pct(s.countedCredits, s.requiredCredits)}%`}"/>
                </div>
                <p v-if="subgroupInfo(s).length" class="text-[11px] text-muted-foreground">
                  {{ subgroupInfo(s).join(' · ') }}
                </p>
                <div v-if="s.completed.length" class="flex flex-wrap gap-1">
                  <Badge v-for="c in s.completed" :key="c.subjectId" variant="outline"
                         :title="`${c.code} · ${c.semester}`">
                    {{ c.name }} · {{ c.credits }} kr · {{ gradeLabel(c.grade) }}
                    <span v-if="c.countedAsFreeElective">(máshonnan)</span>
                  </Badge>
                </div>
                <div v-if="s.missing.length" class="space-y-0.5">
                  <p class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    Hiányzik
                  </p>
                  <p v-for="m in s.missing" :key="m.subjectId" class="text-xs text-destructive">
                    {{ m.code }} – {{ m.name }} ({{ m.credits }} kr<span
                      v-if="m.recommendedSemester">, {{ m.recommendedSemester }}. félév</span>)
                  </p>
                </div>
              </ListItem>
            </ListContent>
          </List>

          <List v-if="progress.uncategorized.length">
            <ListLabel title="Besorolatlan tárgyak" description="Nincs szabadon választható tárgycsoport"/>
            <ListContent class="flex flex-wrap gap-1 p-3 bg-card">
              <Badge v-for="c in progress.uncategorized" :key="c.subjectId" variant="outline">
                {{ c.name }} · {{ c.credits }} kr
              </Badge>
            </ListContent>
          </List>

          <!-- Teljesítés felvitele -->
          <List>
            <ListLabel title="Teljesítés felvitele"/>
            <ListContent class="flex flex-col gap-0.5">
              <ListItem static class="flex-col items-stretch gap-3">
                <div class="space-y-1.5">
                  <Label>Tárgy (név vagy kód)</Label>
                  <Input v-model="query" placeholder="pl. analízis vagy P-ITMAT"/>
                  <div v-if="hits.length"
                       class="max-h-64 overflow-y-auto rounded-xl border border-border">
                    <button v-for="h in hits" :key="h.id" type="button"
                            class="w-full text-left px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                            @click="pickSubject(h)">
                      <span class="font-medium">{{ h.name }}</span>
                      <span class="text-xs text-muted-foreground">
                                            · {{ h.code }} · {{ h.credits }} kr<span v-if="h.requirementType"> · {{ h.requirementType }}</span>
                                        </span>
                    </button>
                  </div>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="space-y-1.5">
                    <Label>Félév</Label>
                    <Input v-model="semester" placeholder="2025/26/1"/>
                  </div>
                  <div class="space-y-1.5">
                    <Label>Jegy</Label>
                    <select v-model="grade" :disabled="!selectedSubject"
                            class="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm disabled:opacity-50">
                      <option v-for="g in gradeOptions" :key="String(g)" :value="g">
                        {{ g === null ? 'Aláírás (jegy nélkül)' : g }}
                      </option>
                    </select>
                  </div>
                </div>
                <p v-if="addError" class="text-xs text-destructive">{{ addError }}</p>
                <Button :disabled="!selectedSubject || adding" @click="addCompletion">
                  <RefreshCw v-if="adding" class="w-4 h-4 animate-spin"/>
                  <Plus v-else class="w-4 h-4"/>
                  Hozzáadás
                </Button>
              </ListItem>
            </ListContent>
          </List>

          <!-- Rögzített teljesítések -->
          <List>
            <ListLabel title="Rögzített teljesítések"
                       :description="`${progress.curriculum.code} · ${completions.length} bejegyzés`"/>
            <ListContent class="flex flex-col gap-0.5">
              <ListItem v-if="!completions.length" static>
                <span class="text-sm text-muted-foreground">Még nincs rögzített teljesítés.</span>
              </ListItem>
              <ListItem v-for="c in completions" :key="c.id" static>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">{{ c.name }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ c.code }} · {{ c.semester }} · {{ c.credits }} kr
                  </p>
                </div>
                <Badge :variant="c.grade === 1 ? 'destructive' : 'secondary'">{{ gradeLabel(c.grade) }}</Badge>
                <Button variant="ghost" size="icon-sm" title="Törlés" @click="removeCompletion(c.id)">
                  <Trash2 class="w-4 h-4"/>
                </Button>
              </ListItem>
            </ListContent>
          </List>
        </template>
      </template>

    </div>
  </div>
</template>