<script setup lang="ts">
import { Plus, Calendar, BookOpen, Users, X } from "lucide-vue-next";

definePageMeta({
    layout: "default",
});

const { user } = useUserSession();

const showOnboarding = ref(true);

const onboardingSteps = [
    {
        id: "calendar",
        title: "Naptár csatlakoztatása",
        description: "Szinkronizáld a Moodle és Neptun naptáraidat, hogy egyesítve láthasd az eseményeket",
        icon: Calendar,
        action: "Naptár csatlakoztatása",
        route: "/calendar",
    },
    {
        id: "profile",
        title: "Profil befejezése",
        description: "Add meg tanulási preferenciáidat és értesítési beállításaidat",
        icon: Users,
        action: "Profil kitöltése",
        route: "/profile",
    },
    {
        id: "materials",
        title: "Tanulási anyagok böngészése",
        description: "Közösségi jegyzeteket, útmutatókat és erőforrásokat érhetsz el",
        icon: BookOpen,
        action: "Anyagok böngészése",
        route: "/materials",
    },
];

const completedSteps = ref<string[]>([]);

function completeStep(stepId: string) {
    completedSteps.value.push(stepId);
    if (completedSteps.value.length === onboardingSteps.length) {
        showOnboarding.value = false;
    }
}

function closeOnboarding() {
    showOnboarding.value = false;
}

const upcomingDeadlines = [
    { title: "Calculus II HF#3", dueDate: "Holnap, 23:59", color: "border-red-500" },
    { title: "Fizika Laboratóriumi Jelentés", dueDate: "Augusztus 25, 23:59", color: "border-blue-500" },
    { title: "Web Dev Projekt", dueDate: "Augusztus 28, 23:59", color: "border-green-500" },
];
</script>

<template>
    <div class="h-full flex flex-col">
        <!-- Onboarding Modal -->
        <Teleport to="body">
            <div v-if="showOnboarding" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                <Card class="w-full max-w-2xl">
                    <CardHeader class="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Üdvözöllek az ITKApp-ban! 👋</CardTitle>
                            <CardDescription>Kezdjük el 3 lépésben</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" @click="closeOnboarding">
                            <X class="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent class="space-y-4">
                        <div
                            v-for="(step, idx) in onboardingSteps"
                            :key="step.id"
                            :class="[
                                'flex items-start gap-4 p-4 border rounded-lg',
                                completedSteps.includes(step.id) ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200',
                            ]"
                        >
                            <div class="flex-shrink-0">
                                <div
                                    :class="[
                                        'flex h-8 w-8 items-center justify-center rounded-full',
                                        completedSteps.includes(step.id)
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-200 text-slate-600',
                                    ]"
                                >
                                    <component v-if="!completedSteps.includes(step.id)" :is="step.icon" class="h-4 w-4" />
                                    <span v-else class="text-sm font-semibold">✓</span>
                                </div>
                            </div>

                            <div class="flex-1">
                                <h3 class="font-medium text-sm text-slate-900">{{ step.title }}</h3>
                                <p class="text-xs text-slate-600 mt-0.5">{{ step.description }}</p>
                            </div>

                            <Button
                                v-if="!completedSteps.includes(step.id)"
                                size="sm"
                                variant="outline"
                                class="text-xs"
                                @click="
                                    completeStep(step.id);
                                    navigateTo(step.route);
                                "
                            >
                                {{ step.action }}
                            </Button>
                            <div v-else class="text-xs text-green-600 font-medium">Kész</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Teleport>

        <!-- Main Content -->
        <div class="flex-1 overflow-y-auto p-6">
            <div class="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900">Üdvözöllek, {{ user?.name }}!</h1>
                </div>
            </div>
        </div>
    </div>
</template>