<template>
<div class="page-bg">
  <div class="content-wrapper">
    <div class="card container-fluid">
      <div class="header-row">
        <h1 class="card-title">Court Finder</h1>
        <button class="add-court-btn" @click="handleAddCourt">Add Court</button>
      </div>

      <p class="card-desc">Locate basketball courts, check availability, and see user ratings.</p>

      <div class="search-section">
<input
  type="text"
  v-model="searchQuery"
  placeholder="Search courts by keyword..."
  class="search-input"
/>
<ul v-if="suggestions.length" class="suggestions-list">
  <li
    v-for="court in suggestions"
    :key="court.name"
    @click="selectSuggestion(court)"
    class="suggestion-item"
  >
    {{ court.name }}
  </li>
</ul>
<button class="search-btn" @click="handleSearch">Search</button>
</div>



      <div class="region-filter">
        <!-- change 2: toggleregion function -->
        <!-- <button
          v-for="region in regions"
          :key="region"
          :class="['region-btn', selectedRegion === region ? 'active' : '']"
          @click="filterByRegion(region)"
        >
          {{ region }}
        </button> -->

        <button
            v-for="region in regions"
            :key="region"
            :class="['region-btn', selectedRegions.includes(region) ? 'active' : '']"
            @click="toggleRegion(region)"
          >
            {{ region }}
        </button>
      </div>

      

      <div class="card-section">
        <div class="card-section-header">
          <h2 class="section-title">Map</h2>
          <button class="pin-btn" @click="activatePinMode" title="Add a new court location">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" fill="#ffa733" stroke="#333" stroke-width="2"/>
              <rect x="13" y="8" width="6" height="11" rx="3" fill="#ff9500"/>
              <circle cx="16" cy="23" r="2.6" fill="#fff" stroke="#ff9100" stroke-width="1"/>
            </svg>
          </button>
        </div>
        <p class="section-desc">Interactive map of basketball courts in Singapore.</p>
        <div id="map" class="map-container"></div>
      </div>

      <div class="floating-icon">N</div>
    </div>

    <div v-if="matchEventToShow" class="match-event-card">
      <h2 class="match-event-title">{{ matchEventToShow.title }}</h2>
      <p><strong>Court:</strong> {{ matchEventToShow.court }}</p>
      <p><strong>Date:</strong> {{ matchEventToShow.date }}</p>
      <p><strong>Time:</strong> {{ matchEventToShow.time }}</p>
      <p><strong>Type:</strong> {{ matchEventToShow.type }}</p>
      <button class="add-match-btn" @click="openMatchModalFromEventCard">Add Match</button>
    </div>
  </div>
</div>


<AddMatchModal
v-if="showAddMatchModal"
:courtName="selectedCourt?.name"
@close="showAddMatchModal = false"
/>

<AddCourtModal2
v-if="showAddCourtModal2"
:coordinates="newCourtCoords"
@close="showAddCourtModal2 = false"
@refreshCourts="loadCourtsFromFirebase"
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
import AddCourtModal2 from './AddCourtModal2.vue'
import AddCourtModal from './AddCourtModal.vue'
import AddMatchModal from './AddMatchModal.vue'

const map = ref(null)
const markers = ref([])
const searchMarker = ref(null)
const firebaseCourts = ref([])
// change 5: unify court data base from firebase console and hardcoded courts:
const allCourts = ref([]);
const showAddCourtModal2 = ref(false)    // For button ("Add Court")
const showAddCourtModal = ref(false)     // For pin drop
const showAddMatchModal = ref(false)
const selectedCourt = ref(null)
//change 1: to allow more thna one filtering
const selectedRegions = ref(['all'])
const searchQuery = ref('')
const newCourtCoords = ref({ lat: null, lon: null })
const autocompleteInput = ref(null)
const isDroppingPin = ref(false)
const matchEventToShow = ref(null)
const suggestions = ref([])

watch(searchQuery, updateSuggestions)

function updateSuggestions() {
const term = searchQuery.value.toLowerCase().trim()
if (!term) {
  suggestions.value = []
  console.log('No term, suggestions cleared')
  return
}

// suggestions.value = courts.filter(court =>
//   court.name.toLowerCase().includes(term) ||
//   court.keywords.some(k => k.toLowerCase().includes(term))
// )

//change 7: allcourts
suggestions.value = allCourts.value.filter(court =>
(court.name && court.name.toLowerCase().includes(term)) ||
(court.keywords && court.keywords.some(k => k.toLowerCase().includes(term)))
)

console.log('Suggestions updated:', suggestions.value)
}

function selectSuggestion(court) {
searchQuery.value = court.name
selectedCourt.value = court
suggestions.value = []

// Zoom map and pan to selected court coordinates
if (map.value && court.lat && court.lon) {
  const position = { lat: court.lat, lng: court.lon }
  map.value.setCenter(position)
  map.value.setZoom(16)  // Adjust zoom level as needed

  // Optional: add a marker or highlight on selected court
  if (searchMarker.value) searchMarker.value.setMap(null)
  searchMarker.value = new google.maps.Marker({
    position,
    map: map.value,
    title: court.name,
    icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' }
  })
}

// Perform search or update markers if needed
handleSearch()
}


function handleSearch() {
const term = searchQuery.value.toLowerCase().trim()
if (!term) return

// const matchedCourts = courts.filter(court =>
//   court.name.toLowerCase().includes(term) ||
//   court.region.toLowerCase().includes(term) ||
//   court.keywords.some(k => k.toLowerCase().includes(term))
// )

// change 8: allcourts
    const matchedCourts = allCourts.value.filter(court =>
    (court.name && court.name.toLowerCase().includes(term)) ||
    (court.region && court.region.toLowerCase().includes(term)) ||
    (court.keywords && court.keywords.some(k => k.toLowerCase().includes(term)))
  )



addMarkers(matchedCourts)
}

function activatePinMode() {
isDroppingPin.value = true;
map.value.setOptions({
  draggableCursor: 'url("https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png"), auto'
});
}

//UNHIDE 1
// const displayedCourts = computed(() => {
//   const query = searchQuery.value.toLowerCase().trim()
//   const region = selectedRegions.value.toLowerCase()
//   return courts.filter(court =>
//     (region === 'all' || court.region.toLowerCase() === region) &&
//     (
//       !query ||
//       court.name.toLowerCase().includes(query) ||
//       court.region.toLowerCase().includes(query) ||
//       court.keywords.some(k => k.includes(query))
//     )
//   )
// })

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
{ name: 'Yishun Street 22 Court', lat: 1.4304, lon: 103.8358, region: 'north', keywords: ['yishun'] },
{ name: 'Bishan Sports Hall Court', lat: 1.3508, lon: 103.8482, region: 'central', keywords: ['bishan', 'bishan sports hall'] 
}]

const handleAddCourt = () => {
showAddCourtModal2.value = true; // This opens AddCourtModal2.vue
}
function openMatchModalFromEventCard() {
if (matchEventToShow.value) {
  selectedCourt.value = { name: matchEventToShow.value.court }; // this is fine!
  showAddMatchModal.value = true;
}
}




const handleAddMatch = (court) => {
selectedCourt.value = court
showAddMatchModal.value = true
}



// const loadCourtsFromFirebase = async () => {
//   const data = await getDataFromFirebase('courts')
//   if (data) {
//     firebaseCourts.value = Object.entries(data).map(([id, court]) => ({ id, ...court }))
//     addMarkers(firebaseCourts.value)
//   }
// }

// change 5: unify court data base from firebase console and hardcoded courts:

// After fetching from Firebase:
// const loadCourtsFromFirebase = async () => {
//   const data = await getDataFromFirebase('courts');
//   let firebaseList = [];
//   if (data) {
//     firebaseList = Object.entries(data).map(([id, court]) => ({ id, ...court }));
//   }
//   // Combine hardcoded and Firebase courts
//   allCourts.value = [...firebaseList, ...courts];
//   applyFilters(); // Always filter using the unified array!
// };

const loadCourtsFromFirebase = async () => {
const data = await getDataFromFirebase('courts');
let firebaseList = [];
if (data) {
  firebaseList = Object.entries(data).map(([id, court]) => ({
    id,
    name: court.name ?? '',
    // keep original region raw value but also compute a normalized region string
    region: ((court.region ?? '') + '').toString().toLowerCase().trim(),
    // support comma-separated/multi-region values by creating a normalizedRegions array
    normalizedRegions: (((court.region ?? '') + '').toString().split(',').map(s => (s || '').toString().toLowerCase().trim()).filter(Boolean)),
    lat: Number(court.lat),
    lon: Number(court.lon),
    keywords: court.keywords ?? [],
    ...court
  }));
}

const localNormalized = courts.map(c => ({
  ...c,
  region: ((c.region ?? '') + '').toString().toLowerCase().trim(),
  normalizedRegions: (((c.region ?? '') + '').toString().split(',').map(s => (s || '').toString().toLowerCase().trim()).filter(Boolean)),
  lat: Number(c.lat),
  lon: Number(c.lon),
  keywords: c.keywords ?? []
}));

allCourts.value = [...firebaseList, ...localNormalized];
console.debug('[loadCourtsFromFirebase] loaded', allCourts.value.length, 'courts', allCourts.value.map(x => ({ name: x.name, region: x.region })));
applyFilters();
};

// Helper: return normalized regions array for a court (always lower-case, trimmed)
function getCourtRegions(court) {
  if (!court) return []
  if (Array.isArray(court.normalizedRegions) && court.normalizedRegions.length) return court.normalizedRegions
  if (court.region) return ((court.region + '').toString().split(',').map(s => (s || '').toString().toLowerCase().trim()).filter(Boolean))
  return []
}



// const addMarkers = courtsList => {
//   markers.value.forEach(m => m.setMap(null))
//   markers.value = []

// function showMatchCard(court) {
//   matchEventToShow.value = {
//     title: 'Create a New Match',
//     court: court.name,
//     date: '',
//     time: '',
//     type: 'Open'
//   }
//   selectedCourt.value = court
// }

// // LOG: How many markers will be removed?
//   console.log('Clearing', markers.value.length, 'markers');
//   markers.value.forEach(m => m.setMap(null));
//   markers.value = [];
//   // LOG: How many markers will be re-added?
//   console.log('Adding', courtsList.length, 'markers:', courtsList);

//   courtsList.forEach(court => {
//     const marker = new google.maps.Marker({
//       position: { lat: court.lat, lng: court.lon },
//       map: map.value,
//       title: court.name,
//       icon: {
//         url: basketballIcon,
//         scaledSize: new google.maps.Size(32, 32),
//         anchor: new google.maps.Point(16, 16)
//       }
//     })

//     const infoWindow = new google.maps.InfoWindow({
//       content: `
//         <div style="font-family: Arial; font-size: 14px;">
//           <strong>${court.name}</strong><br/>
//           <em>Region:</em> ${court.region}<br/>
//           <em>Coordinates:</em> ${court.lat.toFixed(4)}, ${court.lon.toFixed(4)}<br/>
//         </div>
//       `
//     })

//     // HOVER → show info window (court info only)
//     marker.addListener('mouseover', () => {
//       infoWindow.open(map.value, marker)
//     })
//     marker.addListener('mouseout', () => {
//       infoWindow.close()
//     })

//     // CLICK → show event card at bottom, do NOT open info window here
//     marker.addListener('click', () => {
//       showMatchCard(court)
//     })

//     markers.value.push(marker)
//   })
// }


const addMarkers = courtsList => {
// Clear existing markers exactly once
markers.value.forEach(m => m.setMap(null));
markers.value = [];

if (!courtsList || !courtsList.length) {
  console.log('No courts to show for current filters.');
  return;
}

courtsList.forEach(court => {
  const lat = Number(court.lat);
  const lon = Number(court.lon);
  if (!isFinite(lat) || !isFinite(lon)) return;

  const marker = new google.maps.Marker({
    position: { lat, lng: lon },
    map: map.value,
    title: court.name || '',
    icon: {
      url: basketballIcon,
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 16)
    }
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="font-family: Arial; font-size: 14px;">
        <strong>${court.name}</strong><br/>
        <em>Region:</em> ${court.region}<br/>
        <em>Coordinates:</em> ${isFinite(lat) ? lat.toFixed(4) : 'N/A'}, ${isFinite(lon) ? lon.toFixed(4) : 'N/A'}
      </div>
    `
  });

  marker.addListener('mouseover', () => infoWindow.open(map.value, marker));
  marker.addListener('mouseout', () => infoWindow.close());
  marker.addListener('click', () => {
    matchEventToShow.value = {
      title: 'Create a New Match',
      court: court.name,
      date: '',
      time: '',
      type: 'Open'
    };
    selectedCourt.value = court;
  });

  markers.value.push(marker);
});

console.log('Current markers:', markers.value.length, markers.value.map(m => m.getTitle()));
};



// const applyFilters = () => {
//   const query = searchQuery.value.toLowerCase().trim()
//   const region = selectedRegion.value.toLowerCase()
//   if (!region || region === 'all') return addMarkers(courts)

//   const filtered = courts.filter(court =>
//     (court.region.toLowerCase() === region) &&
//     (!query ||
//       court.name.toLowerCase().includes(query) ||
//       court.region.toLowerCase().includes(query) ||
//       court.keywords.some(k => k.includes(query)))
//   )
//   addMarkers(filtered)
// }


//change 4: changed filtering logic
// const applyFilters = () => {
//   const query = searchQuery.value.toLowerCase().trim();
//   let activeRegions = selectedRegions.value;
//   const courtSet = allCourts.value;
//   if (activeRegions.includes('all')) {
//     addMarkers(courtSet);
//     return;
//   }
//   const filtered = courtSet.filter(court =>
//     activeRegions.map(r => r.toLowerCase()).includes((court.region || '').toLowerCase()) &&
//     (
//       !query ||
//       (court.name && court.name.toLowerCase().includes(query)) ||
//       (court.region && court.region.toLowerCase().includes(query)) ||
//       (court.keywords && court.keywords.some(k => k.toLowerCase().includes(query)))
//     )
//   );
//   addMarkers(filtered);
// };

// const applyFilters = () => {
//   if (!map.value) {
//     // If map not ready, just skip (markers will be added after map initialises)
//     return;
//   }

//   const query = (searchQuery.value || '').toLowerCase().trim();
//   const activeRegions = (selectedRegions.value || []).map(r => (r || '').toString().toLowerCase().trim());

//   let filtered = (allCourts.value || []).slice();

//   if (!activeRegions.includes('all')) {
//     const set = new Set(activeRegions.filter(Boolean));
//     filtered = filtered.filter(c => {
//       const r = ((c.region ?? '') + '').toString().toLowerCase().trim();
//       return r && set.has(r);
//     });
//   }

//   if (query) {
//     filtered = filtered.filter(c => {
//       const name = (c.name ?? '').toString().toLowerCase();
//       const region = (c.region ?? '').toString().toLowerCase();
//       const keywords = (c.keywords ?? []).map(k => (k || '').toString().toLowerCase());
//       return name.includes(query) || region.includes(query) || keywords.some(k => k.includes(query));
//     });
//   }

//   console.debug('[applyFilters] regions=', selectedRegions.value, 'query=', searchQuery.value, 'matches=', filtered.length, filtered.map(c => ({ name: c.name, region: c.region })));
//   addMarkers(filtered);
// };

const applyFilters = () => {
if (!map.value) {
  // If map not ready, just skip (markers will be added after map initialises)
  return;
}

const query = (searchQuery.value || '').toLowerCase().trim();
const activeRegions = (selectedRegions.value || []).map(r => (r || '').toString().toLowerCase().trim());

let filtered = (allCourts.value || []).slice();

if (!activeRegions.includes('all')) {
  const set = new Set(activeRegions.filter(Boolean));
  filtered = filtered.filter(c => {
    const regions = getCourtRegions(c);
    if (!regions || !regions.length) return false;
    return regions.some(rr => set.has(rr));
  });
}

if (query) {
  filtered = filtered.filter(c => {
    const name = (c.name ?? '').toString().toLowerCase();
    const region = (c.region ?? '').toString().toLowerCase();
    const keywords = (c.keywords ?? []).map(k => (k || '').toString().toLowerCase());
    return name.includes(query) || region.includes(query) || keywords.some(k => k.includes(query));
  });
}

console.debug('[applyFilters] regions=', selectedRegions.value, 'query=', searchQuery.value, 'matches=', filtered.length, filtered.map(c => ({ name: c.name, region: c.region })));
addMarkers(filtered);
};





//change 6: wather for allcourts:
watch(allCourts, () => {
applyFilters();
});


//change 3: toggleregion function
// function toggleRegion(region) {
//   if (region === 'all') {
//     selectedRegions.value = ['all']
//   } else {
//     // Remove 'all' if any specific region chosen
//     selectedRegions.value = selectedRegions.value.filter(r => r !== 'all')
//     // Toggle the region: add if missing, remove if present
//     if (selectedRegions.value.includes(region)) {
//       selectedRegions.value = selectedRegions.value.filter(r => r !== region)
//       if (selectedRegions.value.length === 0) selectedRegions.value = ['all'] // revert to 'all' if nothing selected
//     } else {
//       selectedRegions.value.push(region)
//     }
//   }
//   applyFilters()
// }

function toggleRegion(region) {
const r = (region || '').toString().toLowerCase().trim();
if (r === 'all') {
  selectedRegions.value = ['all'];
  applyFilters();
  return;
}

// start from current (drop 'all' if present)
let next = selectedRegions.value.includes('all') ? [] : [...selectedRegions.value.map(x => (x || '').toString().toLowerCase().trim())];

if (next.includes(r)) {
  next = next.filter(x => x !== r);
} else {
  next.push(r);
}

if (next.length === 0) next = ['all'];
selectedRegions.value = next;
applyFilters();
}

// ensure changes to selectedRegions trigger filtering (catch template changes)
watch(selectedRegions, () => applyFilters(), { deep: true });

//UNHIDE 2
// const filterByRegion = region => {
//   selectedRegions.value = selectedRegions.value === region ? '' : region
//   applyFilters()
// }
// watch(searchQuery, () => {
//   if (selectedRegions.value !== 'all') applyFilters()
// })

watch(searchQuery, () => {
applyFilters();
});

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
  matchEventToShow.value = null // ✅ Clear match card
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

  // const matchedCourt = courts.find(c =>
  //   c.name.toLowerCase().includes(place.name?.toLowerCase() || '') ||
  //   c.keywords.some(k => place.formatted_address?.toLowerCase().includes(k))
  // )

  // change 9: allcourts
  // const matchedCourt = allCourts.value.find(c =>
  //   (c.name && place.name && c.name.toLowerCase().includes(place.name.toLowerCase())) ||
  //   (c.keywords && place.formatted_address && c.keywords.some(k => place.formatted_address.toLowerCase().includes(k.toLowerCase())))
  // )

        const matchedCourt = allCourts.value.find(c =>
      (c.name && c.name.toLowerCase().includes(place.name?.toLowerCase() || '')) ||
      (c.keywords && c.keywords.some(k => place.formatted_address?.toLowerCase().includes(k)))
    )


  selectedCourt.value = matchedCourt || null
  if (matchedCourt) applyFilters()
  searchQuery.value = place.formatted_address
})
})
</script>



<style scoped>

.suggestions-list {
position: absolute;
top: 100%;  /* directly below input */
left: 0;
width: 100%;
background: #262b33;
border-radius: 0 0 8px 8px; /* rounded bottom corners */
box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
padding: 0;
list-style: none;
max-height: 200px;
overflow-y: auto;
z-index: 10;
margin-top: 0; /* no extra margin needed */
}


.suggestion-item {
padding: 10px 15px;
cursor: pointer;
color: #ddd;
}

.suggestion-item:hover {
background-color: #ffa733;
color: #181c23;
}


.match-event-card {
margin: 48px auto 0 auto;
max-width: 600px;
background: #232830;
border-radius: 12px;
box-shadow: 0 3px 12px rgba(0,0,0,0.25);
color: #fff;
padding: 28px 36px;
font-size: 1.15rem;
border: 2px solid #ffa733;
}
.match-event-title {
color: orange;
font-size: 1.5rem;
margin-bottom: 12px;
}

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
flex: 1;
padding: 12px 16px;
border-radius: 10px 0 0 10px; /* rounded left corners */
border: 1.5px solid #3b4252;
border-right: none; /* remove right border for seamless button */
background: #22262d;
color: #e6eef8;
font-size: 1.08rem;
box-shadow: 0 1px 3px rgba(80, 80, 100, 0.07);
transition: border-color 0.2s;
outline: none;
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
.card-section-header {
display: flex;
align-items: center;
gap: 12px;
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

.pin-btn {
background: none;
border: none;
cursor: pointer;
padding: 2px;
margin-left: 6px;
border-radius: 50%;
transition: background 0.15s;
display: flex;
align-items: center;
}
.pin-btn:hover, .pin-btn:focus {
background: #ffd59a3c;
outline: none;
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

/* Selected Court Card */
.court-card {
background-color: #232830;
border-radius: 10px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.23);
color: #dde3ea;
font-weight: 600;
padding: 22px 32px;
margin-top: 38px;
width: 100%;
max-width: 100%;
box-sizing: border-box;
}
.court-name {
font-size: 1.22rem;
font-weight: bold;
margin-bottom: 8px;
color: orange;
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
.search-section {
position: relative;
display: flex;
align-items: center;
max-width: 390px;
margin: 0 auto 26px auto;
}


.search-dropdown {
flex: 1;
padding: 8px;
font-size: 16px;
}

.search-btn {
padding: 12px 20px;
background-color: #ff9500;
color: white;
border: none;
border-radius: 0 10px 10px 0; /* rounded right corners */
cursor: pointer;
font-weight: 700;
font-size: 1rem;
transition: background-color 0.3s;
}
.search-btn:hover {
background-color: #ffb751;
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

@media (max-width: 768px) {
.map-container { height: 300px; }
.card-title { font-size: 1.8rem; }
.search-input { font-size: 0.85rem; padding: 6px 10px; }
.add-court-btn, .add-match-btn, .clear-btn { font-size: 0.8rem; padding: 5px 10px; }
}
</style>

