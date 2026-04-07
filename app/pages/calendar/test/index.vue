<template>
  <div class="container">
    <h1>📅1234412341233244231</h1>

    <section class="card">
      <h2>1. Linkek mentése vagy frissítése</h2>
      <div class="form-group">
        <label>Felhasználónév:</label>
        <input v-model="postData.username" placeholder="pl. janos88" />
      </div>
      <div class="form-group">
        <label>iCal Linkek (soronként egy):</label>
        <textarea v-model="linkInput" rows="4" placeholder="https://example.com/cal1.ics"></textarea>
      </div>
      <button @click="saveLinks" :disabled="loading.save">
        {{ loading.save ? 'Mentés...' : 'Linkek Mentése' }}
      </button>
      <p v-if="postStatus" :class="postStatus.type">{{ postStatus.message }}</p>
    </section>

    <hr />

    <section class="card">
      <h2>2. Összevont naptár lekérése</h2>
      <div class="form-group">
        <label>Felhasználónév:</label>
        <div class="input-group">
          <input v-model="getUsername" placeholder="pl. janos88" />
          <button @click="fetchCalendar" class="secondary">Letöltés Tesztelése</button>
        </div>
      </div>
      <p class="info">Közvetlen link: <code>/api/calendar/{{ getUsername || '{user}' }}</code></p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// POST adatok
const postData = ref({ username: '', links: [] })
const linkInput = ref('')
const postStatus = ref(null)

// GET adatok
const getUsername = ref('')

const loading = ref({ save: false })

// Mentés funkció
async function saveLinks() {
  loading.value.save = true;
  postStatus.value = null;

  // Linkek tömbbé alakítása
  const links = linkInput.value.split('\n').map(l => l.trim()).filter(l => l !== '');

  try {
    const response = await $fetch('/api/calendar/importCalLinks', {
      method: 'POST',
      body: { username: postData.value.username, links }
    });
    postStatus.value = { type: 'success', message: 'Sikeresen mentve!' };
  } catch (e) {
    postStatus.value = { type: 'error', message: 'Hiba: ' + (e.statusMessage || 'Ismeretlen hiba') };
  } finally {
    loading.value.save = false;
  }
}

// Letöltés funkció (új ablakban megnyitja az iCal-t)
function fetchCalendar() {
  if (!getUsername.value) return alert('Adj meg egy felhasználónevet!');
  window.open(`/api/calendar/${getUsername.value}`, '_blank');
}
</script>

<style scoped>
.container { max-width: 600px; margin: 40px auto; font-family: sans-serif; line-height: 1.6; }
.card { background: #f9f9f9; padding: 20px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; }
label { font-weight: bold; margin-bottom: 5px; }
input, textarea { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
button:disabled { background: #ccc; }
button.secondary { background: #2196F3; margin-left: 10px; }
.input-group { display: flex; }
.success { color: green; font-weight: bold; }
.error { color: red; font-weight: bold; }
.info { font-size: 0.85em; color: #666; }
code { background: #eee; padding: 2px 4px; }
</style>