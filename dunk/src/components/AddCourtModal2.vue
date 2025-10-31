<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2 class="modal-title">Add a New Court</h2>
      <p class="modal-desc">Enter the name of the court at the selected location.</p>

      <form @submit.prevent="createCourt">
        <label>Court Address</label>
        <input
          type="text"
          ref="autocompleteInput"
          v-model="courtAddress"
          placeholder="Search for court address"
          class="search-input"
          autocomplete="off"
        />

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


import { pushDataToFirebase } from '../firebase/firebase'
import { ref, onMounted, watch } from 'vue'
import { getAuth } from 'firebase/auth'

const autocompleteInput = ref(null)
const courtAddress = ref('')
const selectedLat = ref(null)
const selectedLon = ref(null)


const regionKeywords = {
  north: ['yishun', 'woodlands', 'sembawang', 'admiralty', 'canberra', 'marsiling', 'khatib'],
  south: ['harbourfront', 'outram', 'telok blangah', 'queenstown', 'bukit merah'],
  east: ['tampines', 'bedok', 'pasir ris', 'changi', 'simei', 'kembangan', 'eunos', 'paya lebar'],
  west: ['jurong', 'bukit batok', 'bukit panjang', 'clementi', 'boon lay', 'choa chu kang'],
  central: ['bishan', 'toa payoh', 'novena', 'orchard', 'bugis', 'balestier', 'city hall', 'kallang'],
  northeast: ['hougang', 'sengkang', 'punggol', 'serangoon', 'buangkok']
}
watch(courtAddress, (val) => {
  const postalMatch = val.match(/\b(\d{6})\b/);
  if (postalMatch) {
    region.value = getRegionByPostalCode(postalMatch[1]);
  } else {
    // If not a postal code, fallback to keywords
    region.value = matchRegion(val);
  }
});

function getRegionByPostalCode(postal) {
  const first2 = postal.substring(0,2);
  const first3 = postal.substring(0,3);
  // North: 72-73, 75-78, 79, 80
  if (["72","73","75","76","77","78","79","80"].includes(first2)) return 'north';
  // Northeast: 53-57, 82
  if (["53","54","55","56","57","82"].includes(first2)) return 'northeast';
  // East: 41-52
  if (["41","42","43","44","45","46","47","48","49","50","51","52"].includes(first2)) return 'east';
  // West: 60-71
  if (parseInt(first2) >= 60 && parseInt(first2) <= 71) return 'west';
  // Central: 09-10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 58
  if (["09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","58"].includes(first2)) return 'central';
  // South: 01-08
  if (parseInt(first2) >= 1 && parseInt(first2) <= 8) return 'south';
  return '';
}


function matchRegion(address) {
  const addr = address.toLowerCase();
  for (const [regionName, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some(keyword => addr.includes(keyword))) return regionName;
  }
  return '';
}



onMounted(() => {
  // Google Autocomplete for user-typed address
  if (autocompleteInput.value) {
    const autocomplete = new google.maps.places.Autocomplete(autocompleteInput.value, {
      types: ['geocode'],
      componentRestrictions: { country: 'sg' }
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (!place.geometry) return
      courtAddress.value = place.formatted_address || ''
      region.value = matchRegion(courtAddress.value)
      if (place.geometry && place.geometry.location) {
        selectedLat.value = place.geometry.location.lat()
        selectedLon.value = place.geometry.location.lng()
        // if parent passed coordinates object, update it as well
        if (props.coordinates) {
          props.coordinates.lat = selectedLat.value
          props.coordinates.lon = selectedLon.value
        }
      }
    })
  }

  // Reverse-geocode only if coordinates exist
  if (props.coordinates?.lat && props.coordinates?.lon) {
    const geocoder = new google.maps.Geocoder()
    const latlng = { lat: props.coordinates.lat, lng: props.coordinates.lon }
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        courtAddress.value = results[0].formatted_address
        region.value = matchRegion(courtAddress.value)
      } else {
        courtAddress.value = 'Unknown address'
        region.value = ''
      }
    })
  }
})


const props = defineProps({
  coordinates: Object
})
const emit = defineEmits(['close', 'refreshCourts'])

const courtName = ref('')
const isIndoor = ref(false)
const region = ref('')
const autocompleteSearchInput = ref(null)

// Close modal function remains
const closeModal = () => emit('close')

// Reverse-geocode and Google Autocomplete setup
onMounted(() => {
  // Google Autocomplete
  if (autocompleteSearchInput.value) {
    const autocomplete = new google.maps.places.Autocomplete(autocompleteSearchInput.value, {
      types: ['establishment','geocode'],
      componentRestrictions: { country: 'sg' }
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
          courtAddress.value = place.formatted_address
          // Optionally set coordinates based on place
          if (place.geometry && place.geometry.location) {
            selectedLat.value = place.geometry.location.lat()
            selectedLon.value = place.geometry.location.lng()
            if (!props.coordinates) {
              // no parent coordinates object; keep selectedLat/selectedLon locally
            } else {
              props.coordinates.lat = selectedLat.value
              props.coordinates.lon = selectedLon.value
            }
          }
        }
    })
  }

  // Reverse geocode as before
  if (props.coordinates?.lat && props.coordinates?.lon) {
    selectedLat.value = props.coordinates.lat
    selectedLon.value = props.coordinates.lon
    const geocoder = new google.maps.Geocoder()
    const latlng = { lat: props.coordinates.lat, lng: props.coordinates.lon }
    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        courtAddress.value = results[0].formatted_address
      } else {
        courtAddress.value = 'Unknown address'
      }
    })
  }
})


onMounted(() => {
  if (props.coordinates?.lat && props.coordinates?.lon) {
    // ensure selected coords are set if parent supplied them
    selectedLat.value = props.coordinates.lat
    selectedLon.value = props.coordinates.lon
    const geocoder = new google.maps.Geocoder()
    const latlng = { lat: props.coordinates.lat, lng: props.coordinates.lon }

    geocoder.geocode({ location: latlng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        courtAddress.value = results[0].formatted_address
      } else {
        courtAddress.value = 'Unknown address'
      }
    })
  }
})

const createCourt = async () => {
  if (!courtName.value.trim() || !region.value) {
    alert('Please enter a court name and select a region.')
    return
  }

  const latToSave = (selectedLat.value != null) ? Number(selectedLat.value) : (props.coordinates?.lat != null ? Number(props.coordinates.lat) : null)
  const lonToSave = (selectedLon.value != null) ? Number(selectedLon.value) : (props.coordinates?.lon != null ? Number(props.coordinates.lon) : null)

  // Get current user from Firebase Auth
  const auth = getAuth()
  const currentUser = auth.currentUser

  const newCourt = {
    name: courtName.value,
    lat: latToSave,
    lon: lonToSave,
    address: courtAddress.value,
    indoor: isIndoor.value,
    region: region.value,
    keywords: [],
    createdAt: new Date().toISOString(),
    createdBy: currentUser ? currentUser.uid : null
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
.indoor-row {
  display: flex;
  align-items: center;
  gap: 14px; /* more space between label and checkbox */
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

.search-input {
  display: block;
  width: 100%;
  max-width: 390px;
  /* Change margin to align left */
  margin: 0 0 16px 0;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px solid #3b4252;
  background: #22262d;
  color: #e6eef8;
  font-size: 1.08rem;
  box-shadow: 0 1px 3px rgba(80,80,100,0.07);
  transition: border-color 0.2s;
  /* Optionally, add align-self to ensure it floats left in Flexbox parent */
  align-self: flex-start;
}

.search-input::placeholder {
  color: #7e8899;
  opacity: 0.72;
}
.search-input:focus {
  outline: none;
  border-color: #ffa733;
  background: #262b33;
}

.search-input-inline {
  max-width: 340px;
  margin-top: 0;
  margin-bottom: 8px;
  border: 2px solid #fff;
  background-color: #232830;
  color: #ffe0b3;
}
.search-input-inline:focus {
  border-color: #ffa733;
  outline: none;
}

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
</style>