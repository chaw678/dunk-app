<template>
  <div class="main-menu page">
    <h1>Welcome to Dunk</h1>
    <p>This is the main landing page. Use the sidebar to navigate.</p>
    <div class="mt-4">
      <!-- <button @click="addTestCourt" :disabled="loading" class="btn btn-warning"> -->
        <!-- {{ loading ? 'Saving...' : 'Add test court' }}
      </button> -->
      <div v-if="result" class="mt-2 text-success">Saved court: {{ result.key }}</div>
      <div v-if="error" class="mt-2 text-danger">Error: {{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { saveCourtToDatabase } from '../firebase/courts.js'

const loading = ref(false)
const result = ref(null)
const error = ref('')

const testCourt = {
  courtname: 'Test Court from UI',
  courtaddress: '123 Test Ave',
  coordinates: {lat: 51.5074, lng: -0.1278},
  region: 'Test Region',
  indoor: true,
  outdoor: false,
  createdBy: 'LwERFvDs7SamHI9OfuPJ2VPZLFO2'
}

saveCourtToDatabase(testCourt);

// async function addTestCourt() {
//   error.value = ''
//   result.value = null
//   loading.value = true
//   try {

//     const payload = {
//       courtname: 'Test Court from UI',
//       courtaddress: '123 Test Ave',
//       coordinates: {lat: 51.5074, lng: -0.1278},
//       region: 'Test Region',
//       indoor: true,
//       outdoor: false,
//       createdBy: 'LwERFvDs7SamHI9OfuPJ2VPZLFO2'
//     }
//     const res = await saveCourtToDatabase(payload)
//     result.value = res
//   } catch (e) {
//     console.error(e)
//     error.value = e?.message || String(e)
//   } finally {
//     loading.value = false
//   }
// }
</script>

<style scoped>
.page { padding: 24px; color: #fff }
</style>

