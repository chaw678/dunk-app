<template>
  <div class="page-bg">
    <div class="content-wrapper">
      <div class="card container-fluid">
        <div class="header-row">
          <h1 class="card-title">Court Finder</h1>
          <button class="add-court-btn" @click="handleAddCourt">Add Court</button>
        </div>

        <p class="card-desc">Locate basketball courts, check availability, and see user ratings.</p>

        <input
          type="text"
          ref="autocompleteInput"
          v-model="searchQuery"
          placeholder="Search courts or regions..."
          class="search-input"
        />

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

        <div class="card-section">
          <h2 class="section-title">Map</h2>
          <p class="section-desc">Interactive map of basketball courts in Singapore.</p>
          <div id="map" class="map-container"></div>
        </div>

        <div class="floating-icon">N</div>
      </div>

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
import { ref, onMounted, watch, computed } from 'vue'
import { getDataFromFirebase } from '../firebase/firebase'
import AddMatchModal from './AddMatchModal.vue'
import AddCourtModal from './AddCourtModal.vue'

const map = ref(null)
const markers = ref([])
const searchMarker = ref(null)
const firebaseCourts = ref([])
const showAddCourtModal = ref(false)
const showAddMatchModal = ref(false)
const selectedCourt = ref(null)
const selectedRegion = ref('all')
const searchQuery = ref('')
const isDroppingPin = ref(false)
const newCourtCoords = ref({ lat: null, lon: null })
const autocompleteInput = ref(null)

const basketballIcon =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#f57c00" stroke="#666" stroke-width="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
      <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
      <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
    </svg>
  `)

const regions = ['all', 'north', 'south', 'east', 'west', 'central', 'northeast']

const courts = [
  { name: 'Singapore Sports Hub', lat: 1.3048, lon: 103.874, region: 'central', keywords: ['kallang', 'sports hub'] },
  { name: 'Bishan Park Court', lat: 1.3622, lon: 103.8345, region: 'central', keywords: ['bishan', 'bishan park'] },
  { name: 'Tampines Street 81 Court', lat: 1.3521, lon: 103.944, region: 'east', keywords: ['tampines'] },
  { name: 'Jurong West Court', lat: 1.3399, lon: 103.7058, region: 'west', keywords: ['jurong', 'jurong west'] },
  { name: 'Yishun Street 22 Court', lat: 1.4304, lon: 103.8358, region: 'north', keywords: ['yishun'] }
]

const courtNames = courts.map(court => court.name)

const filteredSuggestions = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return query ? courtNames.filter(name => name.toLowerCase().includes(query)) : []
})

const handleAddCourt = () => {
  isDroppingPin.value = true
  map.value.setOptions({
    draggableCursor: 'url("https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png"), auto'
  })
}

const handleAddMatch = () => (showAddMatchModal.value = true)

const loadCourtsFromFirebase = async () => {
  const data = await getDataFromFirebase('courts')
  if (data) {
    firebaseCourts.value = Object.entries(data).map(([id, court]) => ({ id, ...court }))
    addMarkers(firebaseCourts.value)
  }
}

const addMarkers = courtsList => {
  markers.value.forEach(m => m.setMap(null))
  markers.value = []

  courtsList.forEach(court => {
    const marker = new google.maps.Marker({
      position: { lat: court.lat, lng: court.lon },
      map: map.value,
      title: court.name,
      icon: {
        url: basketballIcon,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    })

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="font-family: Arial; font-size: 14px;">
          <strong>${court.name}</strong><br/>
          <em>Region:</em> ${court.region}<br/>
          <em>Coordinates:</em> ${court.lat.toFixed(4)}, ${court.lon.toFixed(4)}<br/>
          <em>Availability:</em> Coming soon<br/>
          <em>User Rating:</em> ★★★★☆
        </div>
      `
    })

    marker.addListener('mouseover', () => infoWindow.open(map.value, marker))
    marker.addListener('mouseout', () => infoWindow.close())
    marker.addListener('click', () => {
      infoWindow.open(map.value, marker)
      selectedCourt.value = court
    })

    markers.value.push(marker)
  })
}

const applyFilters = () => {
  const query = searchQuery.value.toLowerCase().trim()
  const region = selectedRegion.value.toLowerCase()
  if (!region || region === 'all') return addMarkers(courts)

  const filtered = courts.filter(court =>
    (court.region.toLowerCase() === region) &&
    (!query ||
      court.name.toLowerCase().includes(query) ||
      court.region.toLowerCase().includes(query) ||
      court.keywords.some(k => k.includes(query)))
  )
  addMarkers(filtered)
}

const filterByRegion = region => {
  selectedRegion.value = selectedRegion.value === region ? '' : region
  applyFilters()
}
watch(searchQuery, () => {
  if (selectedRegion.value !== 'all') applyFilters()
})

onMounted(() => {
  map.value = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 12,
    mapId: 'dunk-map'
  })

  loadCourtsFromFirebase()

  map.value.addListener('click', event => {
    if (isDroppingPin.value) {
      newCourtCoords.value = { lat: event.latLng.lat(), lon: event.latLng.lng() }
      showAddCourtModal.value = true
      isDroppingPin.value = false
      map.value.setOptions({ draggableCursor: null })
    } else {
      map.value.setZoom(Math.min(map.value.getZoom() + 1, 20))
      map.value.panTo(event.latLng)
    }
  })

  const autocomplete = new google.maps.places.Autocomplete(autocompleteInput.value, {
    types: ['geocode'],
    componentRestrictions: { country: 'sg' }
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place.geometry) return

    const location = place.geometry.location
    map.value.setCenter(location)
    map.value.setZoom(15)

    if (searchMarker.value) searchMarker.value.setMap(null)
    searchMarker.value = new google.maps.Marker({
      position: location,
      map: map.value,
      title: place.name || 'Searched Location',
      icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' }
    })

    const matchedCourt = courts.find(c =>
      c.name.toLowerCase().includes(place.name?.toLowerCase() || '') ||
      c.keywords.some(k => place.formatted_address?.toLowerCase().includes(k))
    )

    selectedCourt.value = matchedCourt || null
    if (matchedCourt) applyFilters()
    searchQuery.value = place.formatted_address
  })
})
</script>


<style scoped>
.page-bg {
  min-height: 100vh;
  background: #000000; 
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

@media (max-width: 768px) {
  .map-container { height: 300px; }
  .card-title { font-size: 1.8rem; }
  .search-input { font-size: 0.85rem; padding: 6px 10px; }
  .add-court-btn, .add-match-btn, .clear-btn { font-size: 0.8rem; padding: 5px 10px; }
}
</style>
  