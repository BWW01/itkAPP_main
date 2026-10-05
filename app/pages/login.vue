<script setup lang="ts">
import {GraduationCap} from "lucide-vue-next";
import {errorMessage} from "~/utils/errorMessage";

const {fetch: refreshSession} = useUserSession();
definePageMeta({
    layout: "empty",
    auth: false,
});
useHead({title: $t('pages.login')})


const form = reactive({
    username: "",
    password: "",
});

const error = ref("");
const loading = ref(false);

async function onSubmit() {
    error.value = "";
    loading.value = true;
    try {
        await $fetch("/api/auth/login", {
            method: "POST",
            body: form,
        });
        await refreshSession();
        await navigateTo("/");
    } catch (e: any) {
      error.value = errorMessage(e);
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div class="w-full max-w-sm">
            <div class="text-center">
                <NuxtImg
                    src="/icons/itkapp-big.svg"
                    class="mx-auto mb-4 h-12 w-auto"
                />
            </div>

            <Card>
                <CardHeader>
                    <h1 class="text-xl font-semibold text-slate-900 mb-1">Bejelentkezés</h1>
                    <p class="text-sm text-slate-600 mb-6">Shibboleth azonosítóddal</p>
                </CardHeader>

                <CardContent>
                    <form class="space-y-4" @submit.prevent="onSubmit">
                        <div class="space-y-1.5">
                            <Label for="username" class="text-sm font-medium">Felhasználónév</Label>
                            <Input
                                id="username"
                                v-model="form.username"
                                type="text"
                                placeholder="naszy"
                                autocomplete="username"
                                class="h-9 text-sm"
                                required
                            />
                        </div>

                        <div class="space-y-1.5">
                            <Label for="password" class="text-sm font-medium">Jelszó</Label>
                            <Input
                                id="password"
                                v-model="form.password"
                                type="password"
                                placeholder="••••••••"
                                class="h-9 text-sm"
                                required
                            />
                        </div>

                        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            {{ error }}
                        </div>

                        <Button
                            type="submit"
                            class="w-full h-9 text-white text-sm"
                            :disabled="loading"
                        >
                            <span
                                v-if="loading"
                                class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                            />
                            {{ loading ? "Bejelentkezés…" : "Bejelentkezés" }}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <p class="text-center text-xs text-slate-500 mt-6">
                © 2026 ITKApp
            </p>
        </div>
    </div>
</template>