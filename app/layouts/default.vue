<script setup lang="ts">
import {
    LayoutDashboard,
    Calendar,
    Map,
    GraduationCap,
    Users,
    BookOpen,
    MessageSquare,
    FileText,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
} from "lucide-vue-next";

const route = useRoute();
const { user, clear } = useUserSession();
const sidebarOpen = ref(false);

const navItems = [
    { label: "Irányítópult", to: "/", icon: LayoutDashboard },
    { label: "Naptár", to: "/calendar", icon: Calendar },
];

async function logout() {
    await clear();
    await navigateTo("/login");
}

watch(() => route.path, () => {
    sidebarOpen.value = false;
});
</script>

<template>
    <div class="min-h-screen bg-white flex flex-col">
        <!-- Header -->
        <header class="sticky top-0 z-40 border-b border-slate-200 bg-white">
            <div class="flex h-14 items-center justify-between px-6">
                <div class="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        class="lg:hidden h-9 w-9"
                        @click="sidebarOpen = !sidebarOpen"
                    >
                        <Menu v-if="!sidebarOpen" class="h-4 w-4" />
                        <X v-else class="h-4 w-4" />
                    </Button>

                    <NuxtLink to="/" class="flex items-center gap-2">
                        <div class="bg-slate-900 p-1 rounded">
                            <GraduationCap class="h-5 w-5 text-white" />
                        </div>
                        <span class="hidden sm:inline font-semibold text-sm text-slate-900">
                            ITKApp
                        </span>
                    </NuxtLink>
                </div>

                <div class="relative hidden md:flex items-center flex-1 max-w-xs mx-8">
                    <Search class="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        type="search"
                        placeholder="Keresés..."
                        class="w-full pl-8 h-8 text-sm bg-slate-50 border-slate-200 rounded focus-visible:ring-slate-400"
                    />
                </div>

                <div class="flex items-center gap-3">
                    <Button variant="ghost" size="icon" class="h-9 w-9 rounded-full">
                        <Bell class="h-4 w-4 text-slate-600" />
                    </Button>

                    <Popover>
                        <PopoverTrigger as-child>
                            <Button variant="ghost" class="h-9 w-9 rounded-full p-0 hover:bg-slate-100">
                                <Avatar class="h-8 w-8">
                                    <AvatarImage src="" />
                                    <AvatarFallback class="bg-slate-200 text-slate-700 text-xs font-semibold">
                                        {{ user?.name?.[0] || "U" }}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-48 p-0" align="end">
                            <div class="space-y-1 p-1">
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start h-8 text-sm"
                                    @click="navigateTo('/profile')"
                                >
                                    <User class="mr-2 h-3.5 w-3.5" /> Profil
                                </Button>
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start h-8 text-sm"
                                    @click="navigateTo('/profile/settings')"
                                >
                                    <Settings class="mr-2 h-3.5 w-3.5" /> Beállítások
                                </Button>
                                <Separator class="my-1" />
                                <Button
                                    variant="ghost"
                                    class="w-full justify-start h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                                    @click="logout"
                                >
                                    <LogOut class="mr-2 h-3.5 w-3.5" /> Kijelentkezés
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </header>

        <div class="flex flex-1 overflow-hidden">
            <!-- Sidebar -->
            <aside
                :class="[
                    'fixed lg:relative TOP-0 left-0 h-[calc(100vh-3.5rem)] w-56 border-r border-slate-200 bg-white transition-transform duration-300 z-30 lg:z-0 overflow-y-auto',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                ]"
            >
                <nav class="space-y-0.5 p-3">
                    <NuxtLink
                        v-for="item in navItems"
                        :key="item.to"
                        :to="item.to"
                        class="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 rounded hover:bg-slate-50"
                        active-class="bg-slate-100 text-slate-900 font-medium"
                    >
                        <component :is="item.icon" class="h-4 w-4 flex-shrink-0" />
                        {{ item.label }}
                    </NuxtLink>
                </nav>
            </aside>

            <!-- Main Content -->
            <main class="flex-1 flex flex-col overflow-hidden">
                <div class="flex-1 overflow-y-auto">
                    <slot />
                </div>
            </main>
        </div>

        <!-- Mobile Overlay -->
        <div
            v-if="sidebarOpen"
            class="fixed inset-0 bg-black/10 lg:hidden z-20"
            @click="sidebarOpen = false"
        ></div>
    </div>
</template>