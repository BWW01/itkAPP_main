<script setup lang="ts">
const { $pwa } = useNuxtApp();
</script>

<template>
  <div v-if="$pwa?.showInstallPrompt" class="...">
    <p>Telepítsd az alkalmazást!</p>
    <button @click="$pwa?.install()">Telepítés</button>
    <button @click="$pwa?.cancelInstall()">Mégse</button>
  </div>
</template>