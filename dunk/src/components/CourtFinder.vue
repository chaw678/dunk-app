<template>
  <div class="page-bg">
    <div class="content-wrapper">
      <!-- Main Card -->
      <div class="card container-fluid">
        <div class="header-row">
          <h1 class="card-title">Court Finder</h1>
          <button class="add-court-btn" @click="handleAddCourt">Add Court</button>
        </div>

        <p class="card-desc">
          Locate basketball courts, check availability, and see user ratings.
        </p>

        <!-- Search Bar -->
       <input
          type="text"
          ref="autocompleteInput"
          v-model="searchQuery"
          placeholder="Search courts or regions..."
          class="search-input"
        />

        <!-- Region Filter -->
        <div class="region-filter">
          <button
            v-for="region in regions"
            :key="region"
            :class="['region-btn', selectedRegion === region ? 'active' : '']"
            @click="filterByRegion(region)"
          >
            {{ region }}
          </button>
          
        </div>

        <!-- Map Section -->
        <div class="card-section">
          <h2 class="section-title">Map</h2>
          <p class="section-desc">Interactive map of basketball courts in Singapore.</p>
          <div id="map" class="map-container"></div>
        </div>

        <div class="floating-icon">N</div>
      </div>

      <!-- Selected Court Card -->
      <div v-if="selectedCourt" class="court-card">
        <h3 class="court-name">{{ selectedCourt.name }}</h3>
        <p><strong>Region:</strong> {{ selectedCourt.region }}</p>
        <p><strong>Coordinates:</strong> {{ selectedCourt.lat }}, {{ selectedCourt.lon }}</p>
        <p><strong>Availability:</strong> Coming soon</p>
        <p><strong>User Rating:</strong> ★★★★☆</p>
       <button class="add-match-btn" @click="handleAddMatch">Add Match</button>
      </div>
    </div>
  </div>
<AddMatchModal
  v-if="showAddMatchModal"
  :courtName="selectedCourt?.name"
  @close="showAddMatchModal = false"
/>

<AddCourtModal
  v-if="showAddCourtModal"
  :coordinates="newCourtCoords"
  @close="showAddCourtModal = false"
  @refreshCourts="loadCourtsFromFirebase"
/>

</template>


<script setup>
import { getDataFromFirebase } from '../firebase/firebase'
import { onMounted, ref, watch, computed } from 'vue'
import AddMatchModal from './AddMatchModal.vue'
const showAddMatchModal = ref(false)
import AddCourtModal from './AddCourtModal.vue'


const autocompleteInput = ref(null)
const isDroppingPin = ref(false)
const firebaseCourts = ref([])

const loadCourtsFromFirebase = async () => {
  const data = await getDataFromFirebase('courts')
  if (data) {
    // Convert object to array with IDs
    firebaseCourts.value = Object.entries(data).map(([id, court]) => ({
      id,
      ...court
    }))
    addMarkers(firebaseCourts.value)
  }
}

onMounted(() => {
  // ✅ Initialize map first
  map.value = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12,
    mapId: 'dunk-map'
  })

  loadCourtsFromFirebase()


  // ✅ Then attach map click listener
  map.value.addListener('click', (event) => {
    if (isDroppingPin.value) {
      const latLng = event.latLng
      newCourtCoords.value = {
        lat: latLng.lat(),
        lon: latLng.lng()
      }

      showAddCourtModal.value = true
      isDroppingPin.value = false
      map.value.setOptions({ draggableCursor: null })
    } else {
      const currentZoom = map.value.getZoom()
      const newZoom = Math.min(currentZoom + 1, 20)
      map.value.setZoom(newZoom)
      map.value.panTo(event.latLng)
    }
  })

  // ✅ Now safely initialize autocomplete
  const autocomplete = new google.maps.places.Autocomplete(autocompleteInput.value, {
    types: ['geocode'],
    componentRestrictions: { country: 'sg' }
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (place.geometry) {
      const location = place.geometry.location
      map.value.setCenter(location)
      map.value.setZoom(15)
      new google.maps.Marker({
        position: location,
        map: map.value,
        title: place.name
      })

      searchQuery.value = place.formatted_address
    }
  })
})


const handleAddMatch = () => {
  showAddMatchModal.value = true
}

const map = ref(null)
const markers = ref([])
const searchQuery = ref('')
const selectedRegion = ref('all')
const showSuggestions = ref(false)
const selectedCourt = ref(null)

const showAddCourtModal = ref(false)
const newCourtCoords = ref({ lat: null, lon: null })

const handleAddCourt = () => {
  isDroppingPin.value = true
  map.value.setOptions({ draggableCursor: 'url("https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png"), auto' })
}


const regions = ['all', 'north', 'south', 'east', 'west', 'central', 'northeast']

const courts = [
  { name: 'Singapore Sports Hub', lat: 1.3048, lon: 103.8740, region: 'central', keywords: ['kallang', 'sports hub'] },
  { name: 'Bishan Park Court', lat: 1.3622, lon: 103.8345, region: 'central', keywords: ['bishan', 'bishan park'] },
  { name: 'Tampines Street 81 Court', lat: 1.3521, lon: 103.9440, region: 'east', keywords: ['tampines'] },
  { name: 'Jurong West Court', lat: 1.3399, lon: 103.7058, region: 'west', keywords: ['jurong', 'jurong west'] },
  { name: 'Yishun Street 22 Court', lat: 1.4304, lon: 103.8358, region: 'north', keywords: ['yishun'] }
]

const courtNames = courts.map(court => court.name)

const filteredSuggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return []
  return courtNames.filter(name => name.toLowerCase().includes(query))
})

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  selectedCourt.value = courts.find(court => court.name === suggestion)
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 100)
}


const addMarkers = (filteredCourts) => {
  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []

  filteredCourts.forEach(court => {
    const marker = new google.maps.Marker({
      position: { lat: court.lat, lng: court.lon },
      map: map.value,
      title: court.name
    })

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: Arial; font-size: 14px;">
          <strong>${court.name}</strong><br/>
          <em>Region:</em> ${court.region}<br/>
          <em>Coordinates:</em> ${court.lat?.toFixed(4) ?? 'N/A'}, ${court.lon?.toFixed(4) ?? 'N/A'}<br/>
          <em>Availability:</em> Coming soon<br/>
          <em>User Rating:</em> ★★★★☆
        </div>
      `
    })


    // Show info on hover
    marker.addListener('mouseover', () => {
      infoWindow.open(map.value, marker)
    })

    // Optional: close info when mouse leaves
    marker.addListener('mouseout', () => {
      infoWindow.close()
    })

    // Also show info on click
    marker.addListener('click', () => {
      infoWindow.open(map.value, marker)
      selectedCourt.value = court
    })

    markers.value.push(marker)
  })
}

const applyFilters = () => {
  const query = searchQuery.value.toLowerCase().trim()
  const region = selectedRegion.value.toLowerCase().trim()

  // Only proceed if a specific region is selected
  if (!region === 'all') {
    markers.value.forEach(marker => marker.setMap(null))
    markers.value = []
    return
  }

  let filtered = courts.filter(court =>
    court.region.toLowerCase() === region
  )

  if (query) {
    filtered = filtered.filter(court =>
      court.name.toLowerCase().includes(query) ,
      court.region.toLowerCase().includes(query) ||
      (court.keywords && court.keywords.some(k => k.includes(query)))
    )
  }

  addMarkers(filtered)
}

const filterByRegion = (region) => {
  if (selectedRegion.value === region) {
    // Deselect region
    selectedRegion.value = ''
  } else {
    // Select new region
    selectedRegion.value = region
  }

  // Always apply filters after region change
  applyFilters()
}
watch(searchQuery, () => {
  if (selectedRegion.value !== 'all') {
    applyFilters()
  } else {
    // Clear markers if no region is selected
    markers.value.forEach(marker => marker.setMap(null))
    markers.value = []
  }
})

onMounted(() => {
  map.value = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12,
    mapId: 'dunk-map'
  })

  // ✅ Add listener only after map is initialized
  map.value.addListener('click', (event) => {
    if (isDroppingPin.value) {
      const latLng = event.latLng
      newCourtCoords.value = {
        lat: latLng.lat(),
        lon: latLng.lng()
      }

      showAddCourtModal.value = true
      isDroppingPin.value = false
      map.value.setOptions({ draggableCursor: null })
    } else {
      const currentZoom = map.value.getZoom()
      const newZoom = Math.min(currentZoom + 1, 20)
      map.value.setZoom(newZoom)
      map.value.panTo(event.latLng)
    }
  })
})


</script>

<style scoped>

.court-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background-color: #2c323a;
  padding: 24px 32px;
  border-radius: 0;
  color: #dde3ea;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  margin-top: 24px;
}

.court-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: orange;
}


.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.clear-btn {
  margin-top: 10px;
  background-color: #ffa733;
  color: #181c23;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.page-bg {
  min-height: 100vh;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.card {
  background: #181c23;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.22), 0 1.5px 3px rgba(36, 45, 55, 0.16);
  padding: 32px 38px 44px 38px;
  color: #dde3ea;
  position: relative;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: orange;
  letter-spacing: -1px;
  margin: 0;
}

.add-court-btn {
  background-color: orange;
  color: #181c23;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.add-court-btn:hover {
  background-color: #ffa733;
}

.card-desc {
  font-size: 1.18rem;
  color: #a2aec3;
  margin-bottom: 16px;
  margin-top: 4px;
  letter-spacing: 0.1px;
}

.search-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 300px;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background-color: #2c323a;
  color: #dde3ea;
  font-size: 0.95rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.search-input::placeholder {
  color: #999fa8;
}

.region-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.region-btn {
  background-color: #2c323a;
  color: #dde3ea;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.region-btn:hover {
  background-color: #3a404a;
}

.region-btn.active {
  background-color: orange;
  color: #181c23;
  font-weight: bold;
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

.map-container {
  height: 400px;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.floating-icon {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background-color: #2c323a;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  border-radius: 50%;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.suggestion-list {
  position: absolute;
  background-color: #2c323a;
  color: #dde3ea;
  list-style: none;
  margin: 0;
  padding: 0;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  width: 100%;
  z-index: 10;
  top: 100%;
  left: 0;
}

.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
}

.suggestion-item:hover {
  background-color: #3a404a;
}

@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }

  .card-title {
    font-size: 1.8rem;
  }

  .add-court-btn {
    font-size: 0.8rem;
    padding: 5px 10px;
  }

  .search-input {
    font-size: 0.85rem;
    padding: 6px 10px;
  }
}

.add-match-btn {
  margin-top: 10px;
  background-color: #ffa733;
  color: #181c23;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
</style>

  