<template>
  <div class="flex flex-col items-start gap-2">
    <button
        @click="syncCalendar"
        :disabled="isLoading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <span v-if="isLoading">Frissítés folyamatban...</span>
      <span v-else>Naptár frissítése most</span>
    </button>

    <!-- Visszajelzés a felhasználónak (siker vagy hiba) -->
    <p v-if="message" :class="{'text-green-600': isSuccess, 'text-red-600': !isSuccess}" class="text-sm font-medium">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Lekérjük a bejelentkezett felhasználó adatait a nuxt-auth-utils segítségével
const { user } = useUserSession()

const isLoading = ref(false)
const message = ref('')
const isSuccess = ref(true)

async function syncCalendar() {
  // Ha valamiért nincs bejelentkezve a felhasználó, ne csináljunk semmit
  if (!user.value?.login) {
    message.value = 'Nem vagy bejelentkezve!'
    isSuccess.value = false
    return
  }

  isLoading.value = true
  message.value = ''

  try {
    // Meghívjuk az új API végpontot
    const response = await $fetch('/api/calendar/sync', {
      method: 'POST',
      body: {
        username: user.value.login // A login.post.ts-ben így mentetted el a sessionbe
      }
    })

    // Siker esetén kiírjuk a backendről kapott üzenetet
    isSuccess.value = true
    message.value = response.message

  } catch (error: any) {
    console.error('Hiba a szinkronizáláskor:', error)
    isSuccess.value = false
    message.value = error.data?.statusMessage || 'Hiba történt a naptár frissítésekor.'
  } finally {
    isLoading.value = false
  }
}
</script>