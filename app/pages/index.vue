<script setup lang="ts">

definePageMeta({
    layout: "default",
});
useHead({title: $t('pages.dashboard')})

const {user} = useUserSession();
</script>

<template>
    <div class="h-full flex flex-col">
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