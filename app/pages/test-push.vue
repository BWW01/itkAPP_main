<!-- pages/push-test.vue -->
<template>
  <div class="max-w-xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-bold">🔔 Push Notification Teszt</h1>

    <!-- Támogatottság -->
    <div class="rounded-lg border p-4 space-y-1">
      <h2 class="font-semibold text-sm text-gray-500 uppercase">Státusz</h2>
      <div class="flex items-center gap-2">
        <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            :class="isSupported ? 'bg-green-500' : 'bg-gray-300'"
        />
        <span>Push {{ isSupported ? "támogatott" : "nem támogatott" }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            :class="permission === 'granted' ? 'bg-green-500' : 'bg-gray-300'"
        />
        <span>Engedély: <code class="text-sm">{{ permission }}</code></span>
      </div>
      <div class="flex items-center gap-2">
        <span
            class="inline-block w-2.5 h-2.5 rounded-full"
            :class="isSubscribed ? 'bg-green-500' : 'bg-gray-300'"
        />
        <span>Feliratkozva: {{ isSubscribed ? "igen" : "nem" }}</span>
      </div>
    </div>

    <!-- Gombok -->
    <div class="flex flex-wrap gap-3">
      <button
          :disabled="!isSupported || isSubscribed || !!loading"
          class="px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="handleSubscribe"
      >
        {{ loading === "subscribe" ? "..." : "Feliratkozás" }}
      </button>
      <button
          :disabled="!isSubscribed || !!loading"
          class="px-4 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="handleUnsubscribe"
      >
        {{ loading === "unsubscribe" ? "..." : "Leiratkozás" }}
      </button>
      <button
          :disabled="!isSubscribed || !!loading"
          class="px-4 py-2 rounded-lg font-medium text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="handleSendSelf"
      >
        {{ loading === "send" ? "..." : "Küldés magamnak" }}
      </button>
    </div>

    <!-- Egyedi küldő form -->
    <div class="rounded-lg border p-4 space-y-3">
      <h2 class="font-semibold">Egyedi értesítés küldése</h2>
      <input
          v-model="form.title"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cím (pl. Hello!)"
      />
      <input
          v-model="form.body"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Szöveg"
      />
      <input
          v-model="form.url"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="URL (pl. /dashboard)"
      />
      <button
          :disabled="!isSubscribed || !!loading"
          class="w-full px-4 py-2 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="handleSendCustom"
      >
        {{ loading === "send" ? "Küldés..." : "Küldés" }}
      </button>
    </div>

    <!-- Log -->
    <div class="rounded-lg border p-4 space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Log</h2>
        <button
            class="text-xs text-gray-400 hover:text-gray-600"
            @click="logs = []"
        >
          Törlés
        </button>
      </div>
      <div v-if="logs.length === 0" class="text-sm text-gray-400 italic">
        Még nincs esemény.
      </div>
      <ul class="space-y-1">
        <li
            v-for="(log, i) in logs"
            :key="i"
            class="text-sm font-mono flex gap-2"
        >
          <span class="text-gray-400 shrink-0">{{ log.time }}</span>
          <span :class="log.type === 'error' ? 'text-red-500' : 'text-green-600'">
            {{ log.message }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isSupported, permission, subscribe, unsubscribe } =
    usePushNotifications();

const isSubscribed = ref(false);
const loading = ref<"subscribe" | "unsubscribe" | "send" | null>(null);

const form = reactive({ title: "", body: "", url: "/" });

const logs = ref<{ time: string; message: string; type: "info" | "error" }[]>(
    []
);

function addLog(message: string, type: "info" | "error" = "info") {
  logs.value.unshift({
    time: new Date().toLocaleTimeString("hu-HU"),
    message,
    type,
  });
}

onMounted(async () => {
  if (!isSupported.value) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  isSubscribed.value = !!sub;
  if (sub) addLog("Már van aktív feliratkozás.");
});

async function handleSubscribe() {
  loading.value = "subscribe";
  try {
    const sub = await subscribe();
    if (sub) {
      isSubscribed.value = true;
      addLog("Feliratkozás sikeres ✓");
    } else {
      addLog("Feliratkozás sikertelen (engedély megtagadva?)", "error");
    }
  } catch (e: any) {
    addLog(`Hiba: ${e?.message ?? e}`, "error");
  } finally {
    loading.value = null;
  }
}

async function handleUnsubscribe() {
  loading.value = "unsubscribe";
  try {
    await unsubscribe();
    isSubscribed.value = false;
    addLog("Leiratkozás sikeres ✓");
  } catch (e: any) {
    addLog(`Hiba: ${e?.message ?? e}`, "error");
  } finally {
    loading.value = null;
  }
}

async function handleSendSelf() {
  loading.value = "send";
  try {
    await $fetch("/api/push/send", {
      method: "POST",
      body: { title: "Teszt értesítés", body: "Ez egy teszt! 🎉", url: "/" },
    });
    addLog("Értesítés elküldve ✓");
  } catch (e: any) {
    addLog(`Hiba: ${e?.message ?? e}`, "error");
  } finally {
    loading.value = null;
  }
}

async function handleSendCustom() {
  loading.value = "send";
  try {
    await $fetch("/api/push/send", {
      method: "POST",
      body: {
        title: form.title || undefined,
        body: form.body || undefined,
        url: form.url || undefined,
      },
    });
    addLog(`Egyedi értesítés elküldve: "${form.title || "Hello!"}" ✓`);
  } catch (e: any) {
    addLog(`Hiba: ${e?.message ?? e}`, "error");
  } finally {
    loading.value = null;
  }
}
</script>