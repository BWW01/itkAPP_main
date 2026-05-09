<script setup lang="ts">
import {LayoutDashboard, Calendar, User2} from "lucide-vue-next";

const {user} = useUserSession();

const navItems = [
    {label: $t('pages.dashboard'), to: "/", icon: LayoutDashboard},
    {label: $t('pages.calendar'), to: "/calendar", icon: Calendar},
    {label: $t('pages.profile'), to: "/profile", icon: User2},
];
</script>

<template>
    <div class="h-screen bg-background flex flex-col md:flex-row">

        <AppNavRail :items="navItems"/>

        <div class="flex-1 flex flex-col overflow-hidden">
            <main class="flex-1 flex flex-col overflow-hidden">
                <slot/>
            </main>
            <AppBottomNav :items="navItems"/>
        </div>

    </div>
</template>