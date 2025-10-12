<template>
  <div class="page-bg">
    <div class="card container-fluid">
      <h1 class="card-title">Court Finder</h1>
      <p class="card-desc">Locate basketball courts, check availability, and see user ratings.</p>
      <div class="card-section">
        <h2 class="section-title">Map</h2>
        <p class="section-desc">Interactive map of basketball courts in Singapore.</p>
        <div class="map-placeholder">Map placeholder</div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { saveCourtToDatabase } from '../firebase/courts.js'

const loading = ref(false)
const result = ref(null)
const error = ref('')

// const testCourt = {
//   courtname: 'Test Court from UI',
//   courtaddress: '123 Test Ave',
//   coordinates: {lat: 51.5074, lng: -0.1278},
//   region: 'Test Region',
//   indoor: true,
//   outdoor: false,
//   createdBy: 'LwERFvDs7SamHI9OfuPJ2VPZLFO2'
// }

;(async () => {
  loading.value = true
  try {
    const res = await saveCourtToDatabase(testCourt)
    result.value = res
    console.log('Court saved:', res)
  } catch (e) {
    error.value = e && e.message ? e.message : String(e)
    console.error('Failed to save court', e)
  } finally {
    loading.value = false
  }
})()



// axios.get('https://api.openweathermap.org/data/2.5/weather',
//   {
//     params: {
//       lat: '1.3521',
//       lon: '103.8198',
//       appid: '1dde52004c554a965d0b1c8f3f67c35f'
//   }}
// )

//   .then(response => {
//     console.log(response.data);
//     // put a loaded boolean flag here to false. when loading and manipulation of data is done, set it to true and use v-if to show the div
//   })
//   .catch(error => {
//     console.error('Error fetching court data:', error);
//   });
</script>

<style>
body {
  background: #15181e;
  margin: 0;
  min-height: 100vh;
}
</style>

<style scoped>
.page-bg {
  min-height: 100vh;
  /* padding: 40px 0; */
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.card {
  background: #181c23;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.22), 0 1.5px 3px rgba(36,45,55,0.16);
  padding: 32px 38px 44px 38px;
  color: #dde3ea;
  /* max-width: 900px; */
  /* width: 90vw; */
}

.card-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: orange;
  margin-bottom: 2px;
  letter-spacing: -1px;
}

.card-desc {
  font-size: 1.18rem;
  color: #a2aec3;
  margin-bottom: 36px;
  margin-top: 4px;
  letter-spacing: 0.1px;
}

.card-section {
  margin-top: 20px;
  background: #181d22;
  border-radius: 10px;
  padding: 24px 18px;
}

.section-title {
  font-size: 1.45rem;
  color: white;
  margin-bottom: 6px;
  font-weight: 700;
}

.section-desc {
  font-size: 1rem;
  color: #b7bdc9;
  margin-bottom: 24px;
}

.map-placeholder {
  background: #2c323a;
  border-radius: 12px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.12rem;
  color: #999fa8;
  margin-top: 1px;
  margin-bottom: 1px;
  font-weight: 600;
  opacity: 0.88;
}
</style>
