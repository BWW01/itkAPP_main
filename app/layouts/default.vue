<script setup lang="ts">
import {
    LayoutDashboard,
    Calendar,
    Settings,
    LogOut,
    User2,
    Bell,
    Search,
    User,
} from "lucide-vue-next";

const route = useRoute();
const {user, clear} = useUserSession();

const navItems = [
    {label: $t('pages.dashboard'), to: "/", icon: LayoutDashboard},
    {label: $t('pages.calendar'), to: "/calendar", icon: Calendar},
    {label: $t('pages.profile'), to: "/profile", icon: User2},
];

async function logout() {
    await clear();
    await navigateTo("/login");
}
</script>

<template>
    <!-- NO MIN-H-SCREEN -->
    <div class="h-screen bg-background flex flex-col">
        <!-- Top Bar -->
        <header class="hidden md:flex sticky top-0 z-40 border-b border-border bg-card">
            <div class="flex h-14 items-center gap-6 px-6">

                <!-- Logo -->
                <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0">
                    <NuxtImg src="/icons/itkapp-big.svg" class="h-7 w-auto"/>
                </NuxtLink>

                <!-- Nav links -->
                <nav class="flex items-center gap-1">
                    <NuxtLink
                        v-for="item in navItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors"
                        active-class="bg-muted text-foreground"
                    >
                        <component :is="item.icon" class="h-3.5 w-3.5 shrink-0"/>
                        {{ item.label }}
                    </NuxtLink>
                </nav>

                <!-- Spacer -->
                <div class="flex-1"/>

                <!-- Search -->
                <div class="relative hidden md:flex items-center w-48">
                    <Search class="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground"/>
                    <Input
                        type="search"
                        placeholder="Keresés..."
                        class="w-full pl-8 h-8 text-xs bg-muted border-0"
                    />
                </div>

                <!-- Notifications -->
                <Button variant="ghost" size="icon-sm">
                    <Bell class="h-4 w-4"/>
                </Button>

                <!-- User menu -->
                <Popover>
                    <PopoverTrigger as-child>
                        <Button variant="ghost" size="icon-sm" class="rounded-full p-0">
                            <Avatar class="h-8 w-8">
                                <AvatarImage src=""/>
                                <AvatarFallback class="text-xs font-bold">
                                    {{ (user as any)?.login?.[0]?.toUpperCase() || 'U' }}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-48 p-1" align="end">
                        <div class="px-2 py-1.5 mb-1">
                            <p class="text-xs font-bold text-foreground">{{ (user as any)?.login }}</p>
                            <p class="text-[10px] text-muted-foreground">{{ (user as any)?.email }}</p>
                        </div>
                        <Separator class="mb-1"/>
                        <Button variant="ghost" size="sm" class="w-full justify-start" @click="navigateTo('/profile')">
                            <User class="h-3.5 w-3.5"/>
                            Profil
                        </Button>
                        <Button variant="ghost" size="sm" class="w-full justify-start"
                                @click="navigateTo('/profile/settings')">
                            <Settings class="h-3.5 w-3.5"/>
                            Beállítások
                        </Button>
                        <Separator class="my-1"/>
                        <Button variant="ghost" size="sm"
                                class="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                @click="logout">
                            <LogOut class="h-3.5 w-3.5"/>
                            Kijelentkezés
                        </Button>
                    </PopoverContent>
                </Popover>
            </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
            <slot/>
        </main>

        <!-- Mobile bottom nav — show only on mobile -->
        <nav class="md:hidden flex bg-card">
            <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-semibold text-muted-foreground"
                active-class="text-primary"
            >
                <component :is="item.icon" class="h-5 w-5"/>
                {{ item.label }}
            </NuxtLink>
        </nav>
    </div>
</template>