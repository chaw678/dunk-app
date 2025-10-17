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
        <div class="search-bar">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search courts or regions..."
            class="search-input"
            @focus="showSuggestions = true"
            @blur="hideSuggestions"
          />
          <ul v-if="filteredSuggestions.length && showSuggestions" class="suggestion-list">
            <li
              v-for="(suggestion, index) in filteredSuggestions"
              :key="index"
              @mousedown.prevent="selectSuggestion(suggestion)"
              class="suggestion-item"
            >
              {{ suggestion }}
            </li>
          </ul>
        </div>

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

</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import AddMatchModal from './AddMatchModal.vue'

// sample courts; you can replace with a DB call in onMounted
const courts = ref([
  { name: 'Singapore Sports Hub', region: 'Central', lat: 1.2986, lon: 103.8636 },
  { name: 'Bishan ActiveSG Court', region: 'Central', lat: 1.3521, lon: 103.8519 },
  { name: 'Tampines Street 81 Court', region: 'East', lat: 1.3500, lon: 103.9540 },
  { name: 'Jurong West Court', region: 'West', lat: 1.3470, lon: 103.7060 },
  { name: 'Yishun Street 22 Court', region: 'North', lat: 1.4290, lon: 103.8350 }
])

const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedRegion = ref('')
const selectedCourt = ref(null)
const showAddMatchModal = ref(false)

const regions = computed(() => {
  const s = new Set(courts.value.map(c => c.region || ''))
  return Array.from(s)
})

const filteredSuggestions = computed(() => {
  const q = (searchQuery.value || '').trim().toLowerCase()
  if (!q) return []
  return courts.value
    .filter(c => (c.name || '').toLowerCase().includes(q) || (c.region || '').toLowerCase().includes(q))
    .map(c => c.name)
})

function hideSuggestions() {
  // small delay to allow click handlers on suggestions to run
  setTimeout(() => (showSuggestions.value = false), 120)
}

function selectSuggestion(suggestion) {
  searchQuery.value = suggestion
  const c = courts.value.find(x => x.name === suggestion)
  selectedCourt.value = c || null
  showSuggestions.value = false
}

function filterByRegion(region) {
  if (selectedRegion.value === region) selectedRegion.value = ''
  else selectedRegion.value = region
}

function handleAddMatch() {
  if (!selectedCourt.value) {
    alert('Please select a court first')
    return
  }
  showAddMatchModal.value = true
}

function handleAddCourt() {
  const name = prompt('Enter new court name')
  if (!name) return
  courts.value.unshift({ name, region: '', lat: 0, lon: 0 })
  alert('Court added locally — persist to DB as needed')
}


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