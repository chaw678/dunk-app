<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-title">Add a New Court</h2>
      <p class="modal-desc">Enter the name of the court at the selected location.</p>

      <form @submit.prevent="createCourt">
        <label>Court Name</label>
        <input type="text" v-model="courtName" placeholder="e.g., Sunset Park Court" />

        <div class="indoor-row">
          <label class="indoor-label" for="indoor-checkbox">Indoor Court</label>
          <input
            id="indoor-checkbox"
            type="checkbox"
            v-model="isIndoor"
            class="indoor-checkbox"
          />
        </div>


        <label>Region</label>
        <select v-model="region">
          <option disabled value="">Select a region</option>
          <option value="north">North</option>
          <option value="south">South</option>
          <option value="east">East</option>
          <option value="west">West</option>
          <option value="central">Central</option>
          <option value="northeast">Northeast</option>
        </select>

        <button type="submit" class="create-btn">Add Court</button>
      </form>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { pushDataToFirebase } from '../firebase/firebase'

const props = defineProps({
  coordinates: Object
})
const emit = defineEmits(['close'])

const courtName = ref('')
const isIndoor = ref(false)
const region = ref('')
const courtAddress = ref('')

const closeModal = () => {
  emit('close')
}

function getRegionByLatLng(lat, lng) {
  // Based on Singapore region clusters; adjust boundaries if needed
  if (lat > 1.433 && lng < 103.92) return 'north';         // Yishun/Woodlands area
  if (lat < 1.300 && lng > 103.84) return 'south';         // Sentosa/Harbourfront, Southern islands
  if (lat < 1.370 && lng > 103.90) return 'east';          // Tampines/Bedok/Changi
  if (lat < 1.390 && lng < 103.78) return 'west';          // Jurong/Bukit Batok
  if (lat > 1.350 && lat < 1.39 && lng > 103.80 && lng < 103.90) return 'central'; // Bishan/Novena/Orchard/Toa Payoh
  if (lat >= 1.36 && lat <= 1.438 && lng >= 103.85 && lng <= 104.0) return 'northeast'; // Hougang, Sengkang, Punggol
  return '';
}


// Reverse geocode to get address from coordinates
onMounted(() => {
  if (props.coordinates?.lat && props.coordinates?.lon) {
    const lat = props.coordinates.lat;
    const lng = props.coordinates.lon;
    // Set region automatically!
    region.value = getRegionByLatLng(lat, lng);
    // ... existing reverse geocode logic ...
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        courtAddress.value = results[0].formatted_address;
      } else {
        courtAddress.value = 'Unknown address';
      }
    });
  }
});


const createCourt = async () => {
  if (!courtName.value.trim() || !region.value) {
    alert('Please enter a court name and select a region.')
    return
  }

  const newCourt = {
    name: courtName.value,
    lat: props.coordinates.lat,
    lon: props.coordinates.lon,
    address: courtAddress.value,
    indoor: isIndoor.value,
    region: region.value,
    keywords: [],
    createdAt: new Date().toISOString()
  }

  try {
    await pushDataToFirebase('courts', newCourt)
    alert('Court added to Firebase!')
    emit('refreshCourts')
    closeModal()
  } catch (error) {
    alert('Failed to add court: ' + error.message)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 28, 35, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #2c323a;
  padding: 32px;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  color: #dde3ea;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
}

.modal-title {
  font-size: 1.8rem;
  color: orange;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 1rem;
  color: #a2aec3;
  margin-bottom: 24px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

label {
  font-weight: bold;
  font-size: 0.95rem;
}

input,
select {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #3a404a;
  color: #dde3ea;
  font-size: 0.95rem;
}

.create-btn {
  background-color: orange;
  color: #181c23;
  font-weight: bold;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.create-btn:hover {
  background-color: #ffa733;
}

.indoor-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.indoor-label {
  font-weight: bold;
  font-size: 0.97rem;
  margin-bottom: 0;
}

.indoor-checkbox {
  width: 22px;
  height: 22px;
  accent-color: orange;
  cursor: pointer;
}

.indoor-checkbox:focus {
  outline: 2px solid #ffa733;
}

</style>