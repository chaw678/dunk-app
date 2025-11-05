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
          class="address-input"
          autocomplete="off"
          id="court-address-input"
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
const autocompleteInput = ref(null)
const selectedLat = ref(null)
const selectedLon = ref(null)

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

function matchRegionByAddress(address) {
  const regionKeywords = {
    north: ['yishun', 'woodlands', 'sembawang', 'admiralty', 'canberra', 'marsiling', 'khatib'],
    south: ['harbourfront', 'outram', 'telok blangah', 'queenstown', 'bukit merah'],
    east: ['tampines', 'bedok', 'pasir ris', 'changi', 'simei', 'kembangan', 'eunos', 'paya lebar'],
    west: ['jurong', 'bukit batok', 'bukit panjang', 'clementi', 'boon lay', 'choa chu kang'],
    central: ['bishan', 'toa payoh', 'novena', 'orchard', 'bugis', 'balestier', 'city hall', 'kallang'],
    northeast: ['hougang', 'sengkang', 'punggol', 'serangoon', 'buangkok']
  }
  
  const addr = address.toLowerCase();
  for (const [regionName, keywords] of Object.entries(regionKeywords)) {
    if (keywords.some(keyword => addr.includes(keyword))) return regionName;
  }
  return '';
}


// Initialize Google Autocomplete and reverse geocoding
onMounted(() => {
  // Wait for the DOM and Google API to be ready
  setTimeout(() => {
    const inputElement = document.getElementById('court-address-input')
    
    console.log('🔍 Attempting to initialize autocomplete...')
    console.log('Input element:', inputElement)
    console.log('Google Maps API status:', {
      google: !!window.google,
      maps: !!window.google?.maps,
      places: !!window.google?.maps?.places
    })

    if (inputElement && window.google && window.google.maps && window.google.maps.places) {
      console.log('✅ All requirements met, creating autocomplete...')
      
      try {
        // Clear any existing autocomplete
        if (inputElement._autocomplete) {
          google.maps.event.clearInstanceListeners(inputElement._autocomplete)
        }

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
          types: ['geocode'],
          componentRestrictions: { country: 'SG' },
          fields: ['formatted_address', 'geometry', 'place_id']
        })
        
        // Store reference to prevent multiple initializations
        inputElement._autocomplete = autocomplete
        
        console.log('✅ Autocomplete created successfully:', autocomplete)

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          console.log('🏠 Place selected:', place)
          
          if (place.formatted_address) {
            courtAddress.value = place.formatted_address
            console.log('📍 Address updated:', place.formatted_address)
          }
          
          if (place.geometry && place.geometry.location) {
            selectedLat.value = place.geometry.location.lat()
            selectedLon.value = place.geometry.location.lng()
            
            console.log('📍 Coordinates updated:', selectedLat.value, selectedLon.value)
            
            // Update parent coordinates if available
            if (props.coordinates) {
              props.coordinates.lat = selectedLat.value
              props.coordinates.lon = selectedLon.value
            }
            
            // Auto-detect region based on coordinates
            const detectedRegion = getRegionByLatLng(selectedLat.value, selectedLon.value) || matchRegionByAddress(courtAddress.value)
            if (detectedRegion) {
              region.value = detectedRegion
              console.log('🗺️ Region detected:', detectedRegion)
            }
          }
        })
        
        console.log('✅ Event listener attached successfully')
        
      } catch (error) {
        console.error('❌ Error creating autocomplete:', error)
      }
    } else {
      console.warn('⚠️ Requirements not met:', {
        inputElement: !!inputElement,
        google: !!window.google,
        maps: !!window.google?.maps,
        places: !!window.google?.maps?.places
      })
    }
  }, 1500) // Increased delay to ensure everything is loaded

  // If coordinates are provided from pin drop, reverse geocode to get address
  if (props.coordinates?.lat && props.coordinates?.lon) {
    selectedLat.value = props.coordinates.lat
    selectedLon.value = props.coordinates.lon
    
    // Set region automatically based on coordinates
    region.value = getRegionByLatLng(props.coordinates.lat, props.coordinates.lon);
    
    // Reverse geocode to get address
    const reverseGeocode = () => {
      if (window.google && window.google.maps) {
        const geocoder = new google.maps.Geocoder();
        const latlng = { lat: props.coordinates.lat, lng: props.coordinates.lon };
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results[0]) {
            courtAddress.value = results[0].formatted_address;
            // Update region based on address if not already set
            if (!region.value) {
              region.value = matchRegionByAddress(courtAddress.value)
            }
          } else {
            courtAddress.value = 'Unknown address';
          }
        });
      } else {
        setTimeout(reverseGeocode, 500)
      }
    }
    
    reverseGeocode()
  }
});


const createCourt = async () => {
  if (!courtName.value.trim() || !region.value) {
    alert('Please enter a court name and select a region.')
    return
  }

  // Use coordinates from autocomplete selection if available, otherwise use pin drop coordinates
  const latToSave = selectedLat.value !== null ? selectedLat.value : props.coordinates?.lat
  const lonToSave = selectedLon.value !== null ? selectedLon.value : props.coordinates?.lon

  if (!latToSave || !lonToSave) {
    alert('Please select a valid location or drop a pin on the map.')
    return
  }

  const newCourt = {
    name: courtName.value,
    lat: Number(latToSave),
    lon: Number(lonToSave),
    address: courtAddress.value || 'Unknown address',
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
  position: relative;
  overflow: visible;
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
  position: relative;
  overflow: visible;
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

.address-input {
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  background-color: #3a404a;
  color: #dde3ea;
  font-size: 1rem;
  font-weight: 500;
  width: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.address-input::placeholder {
  color: #8b92a3;
  font-weight: 400;
}

.address-input:hover {
  background-color: #404651;
  border-color: rgba(255, 167, 51, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.address-input:focus {
  outline: none;
  background-color: #404651;
  border-color: #ffa733;
  box-shadow: 0 0 0 3px rgba(255, 167, 51, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4);
  transform: translateY(-1px);
}

/* Style for Google autocomplete dropdown - Global styles */
:global(.pac-container) {
  background-color: #ffffff !important;
  border-radius: 6px !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
  z-index: 99999 !important;
  margin-top: 2px !important;
  font-family: inherit !important;
  overflow: hidden !important;
  min-width: 300px !important;
}

:global(.pac-container::after) {
  display: none !important;
}

:global(.pac-item) {
  background-color: #ffffff !important;
  color: #333333 !important;
  border-top: none !important;
  border-bottom: none !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: all 0.1s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  line-height: 1.4 !important;
}

:global(.pac-item:first-child) {
  border-top: none !important;
}

:global(.pac-item:last-child) {
  border-bottom: none !important;
  border-radius: 0 0 6px 6px !important;
}

:global(.pac-item:hover) {
  background-color: #f5f5f5 !important;
  color: #333 !important;
}

:global(.pac-item-selected),
:global(.pac-item-query) {
  background-color: #f0f0f0 !important;
  color: #333333 !important;
  font-weight: 400 !important;
}

:global(.pac-matched) {
  font-weight: 600 !important;
  color: #333333 !important;
  text-shadow: none !important;
}

:global(.pac-item-selected .pac-matched) {
  color: #333333 !important;
  font-weight: 600 !important;
}

:global(.pac-icon) {
  background-image: none !important;
  background-color: transparent !important;
  border-radius: 0 !important;
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

:global(.pac-icon::before) {
  content: "📍" !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  font-size: 12px !important;
  line-height: 1 !important;
}

:global(.pac-icon::before) {
  content: "📍" !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  font-size: 10px !important;
  line-height: 1 !important;
}

:global(.pac-item-query .pac-icon) {
  background-color: #181c23 !important;
}

:global(.pac-item-query .pac-icon::before) {
  content: "🔍" !important;
}

/* Custom scrollbar for autocomplete */
:global(.pac-container::-webkit-scrollbar) {
  width: 6px !important;
}

:global(.pac-container::-webkit-scrollbar-track) {
  background: #2c323a !important;
}

:global(.pac-container::-webkit-scrollbar-thumb) {
  background: #ffa733 !important;
  border-radius: 3px !important;
}

:global(.pac-container::-webkit-scrollbar-thumb:hover) {
  background: #ff9500 !important;
}

/* Ensure the input is properly positioned for autocomplete */
.address-input {
  position: relative !important;
  z-index: 1 !important;
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