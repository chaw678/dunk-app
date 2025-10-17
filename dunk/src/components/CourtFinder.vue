


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
  if (!region || region === 'all') {
    markers.value.forEach(marker => marker.setMap(null))
    markers.value = []
    return
  }

  let filtered = courts.filter(court =>
    court.region.toLowerCase() === region
  )

  if (query) {
    filtered = filtered.filter(court =>
      court.name.toLowerCase().includes(query) ||
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

        <div class="floating-icon" title="New court">+</div>

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
  </div>
</template>


<script setup>
axios.get('https://api.openweathermap.org/data/2.5/weather',
  {
    params: {
      lat: '1.3521',
      lon: '103.8198',
      appid: '1dde52004c554a965d0b1c8f3f67c35f'
  }}
)

  .then(response => {
    console.log(response.data);
    // put a loaded boolean flag here to false. when loading and manipulation of data is done, set it to true and use v-if to show the div
  })
  .catch(error => {
    console.error('Error fetching court data:', error);
  });
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  background: #000000; /* flat, dark-neutral background */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: "Segoe UI", Arial, Helvetica, sans-serif;
  color: #e6eef8;
  padding: 48px 8px 24px 8px;
}

.content-wrapper {
  width: 100%;
  max-width: 1200px;
  padding: 0;
}

.card,
.main-card {
  background: #20242b;
  border-radius: 14px;
  border: 1.5px solid rgba(60, 66, 82, 0.47);
  box-shadow: 0 2px 8px rgba(20, 20, 20, 0.1);
  padding: 36px 40px;
  margin-bottom: 30px;
  position: relative;
}

.header-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(120,130,140,0.14);
}

.card-title {
  font-size: 2.5rem;
  font-weight: 900;
  color: #ffa733;
  letter-spacing: -1px;
  margin: 0;
}

.add-court-btn {
  background: #ffa733;
  color: #181c23;
  font-weight: 700;
  font-size: 1rem;
  padding: 11px 22px;
  border: none;
  border-radius: 7px;
  margin-left: 16px;
  cursor: pointer;
  box-shadow: 0 2px 14px rgba(255, 167, 51, 0.14);
  transition: background 0.3s, box-shadow 0.3s;
}
.add-court-btn:hover,
.add-court-btn:focus {
  background: #ffb751;
  box-shadow: 0 4px 18px rgba(255, 183, 81, 0.32);
}

.card-desc {
  font-size: 1.16rem;
  color: #a7adba;
  margin: 18px 0 20px 0;
  font-weight: 500;
}

.search-input {
  display: block;
  width: 100%;
  max-width: 390px;
  margin: 0 auto 26px auto;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px solid #3b4252;
  background: #22262d;
  color: #e6eef8;
  font-size: 1.08rem;
  box-shadow: 0 1px 3px rgba(80,80,100,0.07);
  transition: border-color 0.2s;
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

.region-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 14px;
}
.region-btn {
  background: #252a31;
  color: #e6eef8;
  border: none;
  border-radius: 20px;
  font-size: 0.97rem;
  font-weight: 600;
  padding: 8px 18px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  box-shadow: 0 1px 4px rgba(40,45,50,0.04);
}
.region-btn:hover {
  background: #353b44;
}
.region-btn.active {
  background: #ff9a3c;
  color: #181c23;
  box-shadow: 0 2.5px 14px rgba(255,154,60,0.26);
}

.card-section {
  margin-top: 32px;
  background: #232830;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 5px rgba(30,30,40,0.14);
}

.section-title {
  font-size: 1.38rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: #ffd59a;
  letter-spacing: -0.6px;
}

.section-desc {
  font-size: 1.03rem;
  color: #b1b6c9;
  margin-bottom: 20px;
}

.map-container {
  height: 370px;
  width: 100%;
  border-radius: 8px;
  background: #38414c;
  box-shadow: 0 4px 13px rgba(0,0,0,0.09);
  display: flex;
  align-items: center;
  justify-content: center;
}
.map-container > div,
.map-container iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.floating-icon {
  position: absolute;
  bottom: 36px;
  right: 36px;
  background: #22262d;
  color: #fff;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  box-shadow: 0 1.5px 6px rgba(30,30,50,0.19);
  cursor: pointer;
  transition: background 0.2s;
  z-index: 1;
}
.floating-icon:hover {
  background: #ff9a3c;
  color: #181c23;
}

/* Selected Court Card - keeps content cleanly separated below the map */
.court-card {
  background-color: #232830;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.23);
  color: #dde3ea;
  font-weight: 600;
  padding: 22px 32px;
  margin-top: 38px;
}

.court-name {
  font-size: 1.22rem;
  color: #ff9a3c;
  margin-bottom: 8px;
}

.add-match-btn {
  margin-top: 14px;
  background-color: #ffa733;
  color: #181c23;
  border: none;
  padding: 7px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  transition: background-color 0.21s;
}
.add-match-btn:hover {
  background-color: #ffd59a;
  color: #232830;
}

/* Responsive */
@media (max-width: 900px) {
  .card, .main-card {
    padding: 20px 10px 60px 10px;
  }
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding-bottom: 8px;
  }
  .add-court-btn {
    margin-left: 0;
    align-self: flex-end;
  }
  .section-title {
    font-size: 1.12rem;
  }
  .court-card {
    padding: 16px;
  }
}

@media (max-width: 600px) {
  .card, .main-card {
    padding: 10px 2px 50px 2px;
  }
  .card-title {
    font-size: 2rem;
  }
  .map-container {
    height: 230px;
  }
}


</style>
