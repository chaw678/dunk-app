<template>
  <div class="page-bg">
    <!-- Sign in popup -->
    <div v-if="showPopup" class="success-overlay" @click.self="handlePopupClose">
      <div class="success-popup">
        <div class="success-icon" style="background:#e04747">✕</div>
        <h3>Sign-in Required</h3>
        <p>Please sign in to add courts.</p>
        <div class="popup-buttons">
          <button class="sign-in-btn" @click.stop="handleSignIn">Sign In with Google</button>
          <button class="close-btn" @click.stop="handlePopupClose">Close</button>
        </div>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="card container-fluid">
        <div class="header-row">
          <h1 class="card-title">Court Finder</h1>
          <button class="add-court-btn" @click="handleAddCourt"
            :title="currentUser ? 'Add Court' : 'Sign in to add courts'">Add Court</button>
        </div>

        <p class="card-desc">Locate basketball courts and check their availability.</p>

        <div class="search-section">
          <input type="text" v-model="searchQuery" placeholder="Search courts by keyword..." class="search-input" @keydown.enter.prevent="handleSearch" />
          <ul v-if="suggestions && suggestions.length" class="suggestions-list">
            <li v-for="court in suggestions" :key="court.name" @click="selectSuggestion(court)" class="suggestion-item">
              {{ court.name }}
            </li>
          </ul>
          <button class="search-btn" @click="handleSearch">Search</button>
        </div>



        <!-- region filter moved below the map -->



        <div class="card-section">
          <div class="card-section-header">
            <h2 class="section-title">Map</h2>
            <button class="pin-btn" :title="currentUser ? 'Add a new court location' : 'Sign in to add courts'"
              @click="handlePinClick">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" fill="#ffa733" stroke="#333" stroke-width="2" />
                <rect x="13" y="8" width="6" height="11" rx="3" fill="#ff9500" />
                <circle cx="16" cy="23" r="2.6" fill="#fff" stroke="#ff9100" stroke-width="1" />
              </svg>
            </button>
          </div>
          <p class="section-desc">Interactive map of basketball courts in Singapore.</p>
          <div id="map" ref="mapContainer" class="map-container"></div>
          <!-- region filter inserted below the interactive map -->
          <div class="region-filter" style="margin-top:24px;">
            <button v-for="region in regions" :key="region"
              :class="['region-btn', selectedRegions.includes(region) ? 'active' : '']" @click="toggleRegion(region)">
              {{ region.charAt(0).toUpperCase() + region.slice(1) }}
              <span class="region-badge">({{ (regionCounts && regionCounts[region]) || 0 }})</span>
            </button>
          </div>
          <!-- Court list below map: collapsed cards that expand to show matches for that court -->
          <div class="court-list">
            <div v-for="(court, idx) in visibleCourts" :key="court.id || court.name" class="court-card"
              :data-court-key="courtKey(court)" :data-court-index="idx">
              <div class="court-card-row">
                <div class="court-info">
<h3 class="court-name clickable-court-name" @click="zoomToCourtMarker(court)">
                  {{ court.name }}
                  <span v-if="hasOngoingMatches(court)" class="live-indicator">LIVE</span>
                </h3>
                  <div class="court-sub">{{ court.region ? (court.region.charAt(0).toUpperCase() +
                    court.region.slice(1)) : '' }}</div>

                </div>
                <div class="court-actions">
                  <button class="view-matches-link" @click="toggleCourtExpand(court)">{{ expandedCourts[courtKey(court)] ? 'Hide Matches' : 'View Matches' }}</button>
                <button v-if="isCourtCreator(court)" class="delete-court-btn" @click="deleteCourt(court)" title="Delete this court">
                  <i class="bi bi-trash"></i>
                </button>
                </div>
              </div>

              <div v-if="expandedCourts[courtKey(court)]" class="mini-matches">
                <!-- outer header removed to avoid duplication with embedded Matches header -->
                <div class="expanded-matches">
                  <Matches :courtFilter="court.name" :embedded="true" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- floating icon removed -->
      </div>

      <div v-if="matchEventToShow" class="match-event-card">
        <h2 class="match-event-title">{{ matchEventToShow.title }}</h2>
        <p><strong>Court:</strong> {{ matchEventToShow.court }}</p>
        <p><strong>Date:</strong> {{ matchEventToShow.date }}</p>
        <p><strong>Time:</strong> {{ matchEventToShow.time }}</p>
        <p><strong>Type:</strong> {{ matchEventToShow.type }}</p>
        <button class="add-match-btn" :disabled="!currentUser"
          :title="currentUser ? 'Add Match' : 'Sign in to create matches'" @click="openMatchModalFromEventCard">Add
          Match</button>
      </div>
    </div>
  </div>


  <AddMatchModal v-if="showAddMatchModal" :courtName="selectedCourt?.name" :courtList="visibleCourts"
    @close="showAddMatchModal = false" @created="handleMatchCreated" />

  <AddCourtModal2 v-if="showAddCourtModal2" :coordinates="newCourtCoords" @close="showAddCourtModal2 = false"
    @refreshCourts="loadCourtsFromFirebase" />
  <AddCourtModal v-if="showAddCourtModal" :coordinates="newCourtCoords" @close="showAddCourtModal = false"
    @refreshCourts="loadCourtsFromFirebase" />


</template>


<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { onUserStateChanged } from '../firebase/auth'
import { getDataFromFirebase, deleteDataFromFirebase } from '../firebase/firebase'
import AddCourtModal2 from './AddCourtModal2.vue'
import AddCourtModal from './AddCourtModal.vue'
import AddMatchModal from './AddMatchModal.vue'
import Matches from './Matches.vue'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'

const map = ref(null)
const mapContainer = ref(null)
// reactive store for marker DATA if needed elsewhere; not used to store google marker objects
const markers = ref([])
// non-reactive array that holds the actual google.maps.Marker instances
let markerInstances = []
// interval handle used by animateZoomTo to avoid concurrent animations
let _zoomAnimIv = null
const searchMarker = ref(null)
const firebaseCourts = ref([])
// change 5: unify court data base from firebase console and hardcoded courts:
const allCourts = ref([]);
const visibleCourts = ref([])
const showAddCourtModal2 = ref(false)    // For button ("Add Court")
const showAddCourtModal = ref(false)     // For pin drop
const showAddMatchModal = ref(false)
const selectedCourt = ref(null)
const currentUser = ref(null)
const expandedCourts = ref({})
const matchesCache = ref({})
const showPopup = ref(false)
const isSigningIn = ref(false)
//change 1: to allow more thna one filtering
const selectedRegions = ref(['all'])
const searchQuery = ref('')
const newCourtCoords = ref({ lat: null, lon: null })
const autocompleteInput = ref(null)
const isDroppingPin = ref(false)
const matchEventToShow = ref(null)
const suggestions = ref([])
const allMatches = ref([])
const courtsWithOngoingMatches = ref(new Set())
const matchesRefreshKey = ref(0) // Key to force Matches component refresh
let ongoingMatchesInterval = null

const courts = ref([]);
// When true, temporarily prevent suggestions from being repopulated
const suppressSuggestions = ref(false)

/**
 * Smoothly animate the map zoom from current zoom to targetZoom.
 * Steps by integer zoom levels (Google Maps typically uses integer zooms) and
 * spaces them across `duration` ms. If map or zoom API isn't available, falls
 * back to a direct setZoom call.
 */
function animateZoomTo(targetZoom, duration = 400) {
  if (!map.value || typeof map.value.getZoom !== 'function' || typeof map.value.setZoom !== 'function') {
    try { if (map.value && typeof map.value.setZoom === 'function') map.value.setZoom(targetZoom) } catch (e) { }
    return
  }

  // clear any existing animation
  if (_zoomAnimIv) {
    clearInterval(_zoomAnimIv)
    _zoomAnimIv = null
  }

  const start = Number(map.value.getZoom()) || 0
  const end = Number(targetZoom)
  const diff = end - start
  if (!diff) return

  const steps = Math.max(1, Math.abs(Math.round(diff)))
  const interval = Math.max(30, Math.floor(duration / steps))
  let step = 0

  _zoomAnimIv = setInterval(() => {
    step += 1
    const next = start + Math.sign(diff) * step
    try {
      map.value.setZoom(next)
    } catch (e) {
      // If setZoom fails, try direct assignment fallback and stop
      try { map.value.setZoom(end) } catch (err) { }
      clearInterval(_zoomAnimIv)
      _zoomAnimIv = null
      return
    }
    if (step >= steps) {
      clearInterval(_zoomAnimIv)
      _zoomAnimIv = null
    }
  }, interval)
}

/**
 * Set selectedRegions based on a court object. Normalizes region strings and
 * attempts to find a matching known region. If no match is found, leaves
 * selection as ['all'] to avoid hiding results.
 */
function setRegionForCourt(court) {
  try {
    if (!court) return
    const raw = ((court.region || '') + '').toString().toLowerCase().trim()
    if (!raw) {
      console.debug('[setRegionForCourt] court has no region:', court)
      selectedRegions.value = ['all']
      return
    }

    // Normalize common separators (spaces, underscores, hyphens)
    const compact = raw.replace(/[ _\-]+/g, '')

    // Try exact or contains matching against known regions
    let match = null
    for (const r of regions) {
      if (r === 'all') continue
      if (compact === r || raw.includes(r) || compact.includes(r)) {
        match = r
        break
      }
    }

    if (!match) {
      // As a last resort, try to find any region token inside the raw region
      for (const r of regions) {
        if (r === 'all') continue
        if (raw.indexOf(r) !== -1) {
          match = r
          break
        }
      }
    }

    if (match) selectedRegions.value = [match]
    else selectedRegions.value = ['all']

    console.debug('[setRegionForCourt] resolved region', raw, '->', selectedRegions.value)
  } catch (err) {
    console.warn('[setRegionForCourt] failed to set region for court', err, court)
  }
}

// onMounted(async () => {
//   const response = await fetch('/courts.json');
//   const data = await response.json();
//   courts.value = data;
// });



const auth = getAuth()

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    const result = await signInWithPopup(auth, provider)
    currentUser.value = result.user
    showPopup.value = false   // Hide popup after successful sign-in
    return result.user
  } catch (error) {
    console.error('[CourtFinder] Google sign-in error:', error)
    showPopup.value = true    // Show popup if sign-in failed
    throw error
  }
}






const handlePopupClose = (event) => {
  // If called programmatically (no event) just close
  if (!event) {
    showPopup.value = false
    return
  }

  const el = event.target || event.currentTarget

  // Close when clicking the overlay itself
  if (el.classList && el.classList.contains('success-overlay')) {
    showPopup.value = false
    return
  }

  // Direct sign-in if clicking the sign-in button
  if (el.classList && el.classList.contains('sign-in-btn')) {
    handleSignIn()
    showPopup.value = false // Hide after sign-in triggered
    return
  }

  // Close when clicking a button we expect (handles clicks on inner text nodes too)
  if (el.classList && (el.classList.contains('success-btn') || el.classList.contains('close-btn') || el.classList.contains('sign-in-btn'))) {
    showPopup.value = false
    return
  }

  // If the actual clicked node is a child (e.g. text node), check ancestors
  if (el.closest) {
    if (el.closest('.close-btn') || el.closest('.success-btn') || el.closest('.sign-in-btn')) {
      showPopup.value = false
      return
    }
  }
}

watch(searchQuery, updateSuggestions)

function updateSuggestions() {
  if (suppressSuggestions.value) {
    // keep suggestions hidden briefly after an explicit search action
    suggestions.value = []
    return
  }
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

function selectAllText(event) {
  // Select all text in the input when clicked
  if (event.target && event.target.select) {
    event.target.select()
  }
}

function selectSuggestion(court) {
  searchQuery.value = court.name
  selectedCourt.value = court
  // hide and suppress suggestions (avoid watcher immediately repopulating)
  suggestions.value = []
  suppressSuggestions.value = true
  setTimeout(() => { suppressSuggestions.value = false }, 300)

  // Zoom map and pan to selected court coordinates
  if (map.value && court.lat && court.lon) {
    const position = { lat: court.lat, lng: court.lon }
    // smooth pan + animated zoom
    try {
      if (typeof map.value.panTo === 'function') map.value.panTo(position)
      else map.value.setCenter(position)
    } catch (e) {
      try { map.value.setCenter(position) } catch (err) { /* ignore */ }
    }
    try { animateZoomTo(16, 450) } catch (e) { try { map.value.setZoom(16) } catch (err) { } }

    // Optional: add a marker or highlight on selected court
    if (searchMarker.value) searchMarker.value.setMap(null)
    searchMarker.value = new google.maps.Marker({
      position,
      map: map.value,
      title: court.name,
      icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' }
    })
    // Expand and scroll to the matching court card
    try {
      const key = courtKey(court)
      setTimeout(() => {
        const idx = markerInstances.findIndex(m => m.getTitle() === (court.name || ''))
        let el = null
        if (idx !== -1) el = document.querySelector(`[data-court-index="${idx}"]`)
        if (!el) el = document.querySelector(`[data-court-key="${key}"]`)
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 180)
    } catch (e) {
      /* ignore scroll errors */
    }
  }
}

const applyFilters = () => {
  if (!map.value) {
    // If map not ready, just skip (markers will be added after map initialises)
    return;
  };

  const query = (searchQuery.value || '').toLowerCase().trim();

  const activeRegions = (selectedRegions.value || []).map(r => (r || '').toString().toLowerCase().trim());

  let filtered = (allCourts.value || []).slice();

  if (!activeRegions.includes('all')) {
    const set = new Set(activeRegions.filter(Boolean));
    filtered = filtered.filter(c => {
      const r = ((c.region ?? '') + '').toString().toLowerCase().trim();
      return r && set.has(r);
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
  visibleCourts.value = filtered
  addMarkers(filtered);
};

const loadCourtsFromFirebase = async () => {
  const data = await getDataFromFirebase('courts');
  let firebaseList = [];
  if (data) {
    firebaseList = Object.entries(data).map(([id, court]) => ({
      id,
      name: court.name ?? '',
      region: ((court.region ?? '') + '').toString().toLowerCase().trim(),
      lat: Number(court.lat),
      lon: Number(court.lon),
      keywords: court.keywords ?? [],
      ...court
    }));
  }

  // const localNormalized = Array.isArray(courts.value)
  //   ? courts.value.map(c => ({
  //     ...c,
  //     region: ((c.region ?? '') + '').toString().toLowerCase().trim(),
  //     lat: Number(c.lat),
  //     lon: Number(c.lon),
  //     keywords: c.keywords ?? []
  //   }))
  //   : [];

  // Combine and deduplicate courts based on name and coordinates
  // const combined = [...firebaseList, ...localNormalized];
  // const combined = [...firebaseList];
  // const uniqueCourts = [];
  // const seen = new Set();

  // for (const court of combined) {
  //   // Create a unique key based on name and coordinates
  //   const key = `${(court.name || '').toLowerCase().trim()}_${court.lat}_${court.lon}`;
  //   if (!seen.has(key)) {
  //     seen.add(key);
  //     uniqueCourts.push(court);
  //   }
  // }

  allCourts.value = firebaseList;
  console.debug('[loadCourtsFromFirebase] loaded', allCourts.value.length, 'courts (after deduplication)', allCourts.value.map(x => ({ name: x.name, region: x.region })));
  applyFilters();
};

// onMounted(() => {
//   onUserStateChanged((user) => {
//     currentUser.value = user;
//     if (user) {
//       // Hide popup if user is signed in
//       showPopup.value = false;
//     }
//   })

//   loadCourtsFromFirebase()
// })

// --- Mini-match helpers (lightweight, local copies from Matches.vue) ---
const maxAvatarsSmall = 4
function courtSeededAvatar(name) {
  const username = name || 'anon'
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
}

function courtInitials(name) {
  if (!name) return ''
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

function getMatchStartEnd(match) {
  if (!match) return { start: null, end: null }
  try {
    if (match.startAtISO) {
      const s = new Date(match.startAtISO)
      let e = match.endAtISO ? new Date(match.endAtISO) : null
      if (!e || isNaN(e.getTime())) e = new Date(s.getTime() + 90 * 60 * 1000)
      return { start: s, end: e }
    }
    if (match.startAt) {
      const s = new Date(match.startAt)
      let e = match.endAt ? new Date(match.endAt) : null
      if (!e || isNaN(e.getTime())) e = new Date(s.getTime() + 90 * 60 * 1000)
      return { start: s, end: e }
    }
    if (match.date && match.startTime) {
      let base = new Date(match.date)
      if (isNaN(base.getTime())) base = new Date()
      const t = ('' + match.startTime).trim()
      const m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || []
      if (m.length) {
        base.setHours(Number(m[1]), Number(m[2]) || 0, Number(m[3]) || 0, 0)
        const s = base
        let e = null
        if (match.endTime) {
          const mbe = ('' + match.endTime).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || []
          if (mbe.length) {
            const be = new Date(base)
            be.setHours(Number(mbe[1]), Number(mbe[2]) || 0, Number(mbe[3]) || 0, 0)
            e = be
          }
        }
        if (!e) e = new Date(s.getTime() + 90 * 60 * 1000)
        return { start: s, end: e }
      }
    }
  } catch (err) {
    // ignore
  }
  return { start: null, end: null }
}

function courtFormatDate(match) {
  if (!match) return ''
  const iso = match.startAtISO || match.startAt || match.date
  if (iso) {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
    } catch (err) { }
  }
  if (match.time) return match.time
  return ''
}

function courtFormatTimeRange(match) {
  if (!match) return ''
  const opts = { hour: 'numeric', minute: '2-digit', hour12: true }
  if (match.startTime && match.endTime) {
    try {
      const s = match.startTime
      const e = match.endTime
      return `${s} — ${e}`
    } catch (e) { }
  }
  if (match.startAtISO && match.endAtISO) {
    try {
      const s = new Date(match.startAtISO)
      const e = new Date(match.endAtISO)
      return `${s.toLocaleTimeString([], opts)} — ${e.toLocaleTimeString([], opts)}`
    } catch (err) { }
  }
  if (match.time) return match.time
  return ''
}

function courtDisplayedPlayers(match) {
  const out = []
  if (!match) return out
  if (match.joinedBy && typeof match.joinedBy === 'object') {
    for (const uid of Object.keys(match.joinedBy)) {
      let name = (match.playersMap && match.playersMap[uid])
      if (!name) name = uid
      const avatar = (match.playersMap && match.playersMap[uid] && '') || courtSeededAvatar(name)
      out.push({ uid, name, avatar })
    }
  } else if (Array.isArray(match.players)) {
    for (const name of match.players) out.push({ name, avatar: courtSeededAvatar(name) })
  }
  return out
}

function courtVisiblePlayers(arr) {
  if (!arr) return []
  return arr.slice(0, maxAvatarsSmall)
}

// Function to load all matches and determine ongoing matches by court
async function loadAllMatchesAndDetermineOngoing() {
  try {
    const data = await getDataFromFirebase('matches')
    const matches = []
    if (data && typeof data === 'object') {
      for (const [k1, v1] of Object.entries(data)) {
        if (!v1) continue
        if (typeof v1 === 'object') {
          for (const [k2, v2] of Object.entries(v1)) {
            if (!v2) continue
            if (typeof v2 === 'object') {
              for (const [mid, mv] of Object.entries(v2)) {
                const copy = { id: mid, __dbPath: `matches/${k1}/${k2}/${mid}`, ...mv }
                matches.push(copy)
              }
            }
          }
        }
      }
    }
    
    allMatches.value = matches
    updateCourtsWithOngoingMatches()
  } catch (e) {
    console.error('Failed to load all matches', e)
  }
}

// Function to determine which courts have ongoing matches
function updateCourtsWithOngoingMatches() {
  const ongoingCourts = new Set()
  
  console.log('=== Checking all matches for live status ===')
  
  allMatches.value.forEach((match, index) => {
    // Check if match was manually ended
    if (match.endedAt || match.endedAtISO) {
      console.log(`Match ${index} ended:`, match.court)
      return
    }
    
    // Only show LIVE if the match has been explicitly started by the host
    // Check for actual status indicators that show the match is active
    let isActuallyLive = false
    let reason = ''
    
    if (match.status === 'live' || match.status === 'active' || match.status === 'ongoing') {
        isActuallyLive = true
        reason = `status: ${match.status}`
        console.log('🔴 Match is live by status:', match.court, match.status)
    }
    
    // Check if match has been manually started by host
    if (match.started === true || match.isStarted === true || match.matchStarted === true) {
        isActuallyLive = true
        reason += (reason ? ', ' : '') + `started flags: started=${match.started}, isStarted=${match.isStarted}, matchStarted=${match.matchStarted}`
        console.log('🔴 Match is live by started flag:', match.court, { started: match.started, isStarted: match.isStarted, matchStarted: match.matchStarted })
    }
    
    // Check if match has a start timestamp indicating it was actually begun
    if (match.startedAt || match.actualStartTime) {
        isActuallyLive = true
        reason += (reason ? ', ' : '') + `timestamps: startedAt=${match.startedAt}, actualStartTime=${match.actualStartTime}`
        console.log('🔴 Match is live by timestamp:', match.court, { startedAt: match.startedAt, actualStartTime: match.actualStartTime })
    }
    
    // Debug: Log all matches for problematic courts
    const courtName = (match.court || '').toString().toLowerCase()
    if (courtName.includes('pasir ris') || courtName.includes('punggol') || courtName.includes('firefly')) {
        console.log(`🔍 ${match.court} match data:`, {
            court: match.court,
            status: match.status,
            started: match.started,
            isStarted: match.isStarted,
            matchStarted: match.matchStarted,
            startedAt: match.startedAt,
            actualStartTime: match.actualStartTime,
            endedAt: match.endedAt,
            endedAtISO: match.endedAtISO,
            isActuallyLive: isActuallyLive,
            reason: reason || 'not live'
        })
    }
    
    // Only add to ongoing courts if match is actually live (not just scheduled)
    if (isActuallyLive) {
      if (courtName) {
        ongoingCourts.add(courtName)
        console.log(`✅ Added to ongoing courts: "${courtName}" (reason: ${reason})`)
      }
    }
  })
  
  courtsWithOngoingMatches.value = ongoingCourts
  console.log('🎯 Final courts with ongoing matches:', Array.from(ongoingCourts))
}

// Function to check if a court has ongoing matches
function hasOngoingMatches(court) {
  const courtName = (court.name || '').toString().toLowerCase()
  return courtsWithOngoingMatches.value.has(courtName)
}

// Function to check if current user is the creator of the court
function isCourtCreator(court) {
  if (!currentUser.value || !court.createdBy) return false
  return currentUser.value.uid === court.createdBy
}

// Function to delete a court
async function deleteCourt(court) {
  if (!currentUser.value) {
    alert('Please sign in to delete courts.')
    return
  }
  
  if (!isCourtCreator(court)) {
    alert('You can only delete courts that you created.')
    return
  }
  
  if (!confirm(`Are you sure you want to delete "${court.name}"? This action cannot be undone.`)) {
    return
  }
  
  try {
    // Find the court in Firebase by matching the court data
    const courtsData = await getDataFromFirebase('courts')
    let courtKey = null
    
    if (courtsData && typeof courtsData === 'object') {
      for (const [key, courtData] of Object.entries(courtsData)) {
        if (courtData && 
            courtData.name === court.name && 
            courtData.lat === court.lat && 
            courtData.lon === court.lon &&
            courtData.createdBy === court.createdBy) {
          courtKey = key
          break
        }
      }
    }
    
    if (!courtKey) {
      alert('Court not found in database.')
      return
    }
    
    // Delete the court from Firebase
    const success = await deleteDataFromFirebase(`courts/${courtKey}`)
    
    if (success) {
      alert('Court deleted successfully!')
      // Refresh the courts list
      await loadCourtsFromFirebase()
    } else {
      alert('Failed to delete court. Please try again.')
    }
  } catch (error) {
    console.error('Error deleting court:', error)
    alert('Failed to delete court: ' + error.message)
  }
}

// Perform search or update markers if needed
handleSearch()


function handleSearch() {
  // Clear any visible suggestions when a search is triggered (user pressed Search or Enter)
  suggestions.value = []
  // briefly suppress suggestions from being repopulated by the input watcher
  suppressSuggestions.value = true
  setTimeout(() => { suppressSuggestions.value = false }, 300)

  // If the search query matches a known court name, jump to that court's region and center on it.
  const term = (searchQuery.value || '').toString().toLowerCase().trim()
  if (term) {
    const found = allCourts.value.find(c => (c.name || '').toString().toLowerCase().includes(term) || (c.keywords || []).some(k => (k || '').toString().toLowerCase().includes(term)))
    if (found) {
      setRegionForCourt(found)
      // set selected court so UI reflects the searched court
      selectedCourt.value = found
      // center + animated zoom to matched court if coords available
      if (map.value && isFinite(Number(found.lat)) && isFinite(Number(found.lon))) {
        const pos = { lat: Number(found.lat), lng: Number(found.lon) }
        try {
          if (typeof map.value.panTo === 'function') map.value.panTo(pos)
          else map.value.setCenter(pos)
        } catch (e) {
          try { map.value.setCenter(pos) } catch (err) { /* ignore */ }
        }
        try { animateZoomTo(16, 450) } catch (e) { try { map.value.setZoom(16) } catch (err) { } }
      }
      // ensure a visible search marker and expand the court card
      try {
        const position = { lat: Number(found.lat), lng: Number(found.lon) }
        if (searchMarker.value) searchMarker.value.setMap(null)
        searchMarker.value = new google.maps.Marker({ position, map: map.value, title: found.name, icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' } })
        const key = courtKey(found)
        setTimeout(() => {
          const idx = markerInstances.findIndex(m => m.getTitle() === (found.name || ''))
          let el = null
          if (idx !== -1) el = document.querySelector(`[data-court-index="${idx}"]`)
          if (!el) el = document.querySelector(`[data-court-key="${key}"]`)
          if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 180)
      } catch (e) { /* ignore marker/scroll errors */ }
    }
  }

  // Trigger filter application which will update both visibleCourts and markers
  applyFilters()
}

function activatePinMode() {
  isDroppingPin.value = true;
  map.value.setOptions({
    draggableCursor: 'url("https://maps.gstatic.com/mapfiles/ms2/micons/red-pushpin.png"), auto'
  });
}

function handlePinClick() {
  if (!currentUser.value) {
    showPopup.value = true  // Only show popup if not signed in
    return
  }
  activatePinMode()
}

async function handleSignIn() {
  console.debug('[CourtFinder] handleSignIn: start')
  if (isSigningIn.value) return
  isSigningIn.value = true
  try {
    await loginWithGoogle()     // Let loginWithGoogle manage popup on success/failure
    // OPTIONAL: you can set showPopup.value = false here, but better to do it inside loginWithGoogle
    console.debug('[CourtFinder] loginWithGoogle resolved')
  } catch (err) {
    // If sign-in failed, reopen the popup so user can retry or close
    console.error('[CourtFinder] Google sign-in failed', err)
    showPopup.value = true
  } finally {
    isSigningIn.value = false
  }
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

// Map of region → marker color (fallbacks included)
const regionColors = {
  all: '#f57c00',
  north: '#0b84ff',
  south: '#00c853',
  east: '#ff5252',
  west: '#8e24aa',
  central: '#ff9a3c',
  northeast: '#ffd600'
}

// Returns a basketball SVG data-URI with the requested fill color.
// Keeps the same visual shape as `basketballIcon` but allows colorization per region.
function getBasketballIcon(color = '#f57c00') {
  try {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="${color}" stroke="#666" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
        <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
        <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
      </svg>
    `
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
  } catch (err) {
    return basketballIcon
  }
}
fetch('/courts.json')
  .then(response => response.json())
  .then(data => {
    const courts = data;
    console.log(courts);
  });
const regions = ['all', 'north', 'south', 'east', 'west', 'central', 'northeast']

// const courts = [
// { name: 'Singapore Sports Hub', lat: 1.3048, lon: 103.874, region: 'central', keywords: ['kallang', 'sports hub'] },
// { name: 'Bishan Park Court', lat: 1.3622, lon: 103.8345, region: 'central', keywords: ['bishan', 'bishan park'] },
// { name: 'Tampines Street 81 Court', lat: 1.3521, lon: 103.944, region: 'east', keywords: ['tampines'] },
// { name: 'Jurong West Court', lat: 1.3399, lon: 103.7058, region: 'west', keywords: ['jurong', 'jurong west'] },
// { name: 'Yishun Street 22 Court', lat: 1.4304, lon: 103.8358, region: 'north', keywords: ['yishun'] },
// { name: 'Bishan Sports Hall Court', lat: 1.3508, lon: 103.8482, region: 'central', keywords: ['bishan', 'bishan sports hall'] 
// }]

watch(currentUser, (newUser) => {
  if (newUser) {
    showPopup.value = false
  }
})

function handleAddCourt() {
  if (!currentUser.value) {
    showPopup.value = true  // Only show popup if not signed in
    return
  }
  showAddCourtModal2.value = true
}


function openMatchModalFromEventCard() {
  if (matchEventToShow.value) {
    selectedCourt.value = { name: matchEventToShow.value.court };
    showAddMatchModal.value = true;
  }
}




const handleAddMatch = (court) => {
  selectedCourt.value = court
  showAddMatchModal.value = true
}

// compute counts of courts per region (based on the unified allCourts array)
const regionCounts = computed(() => {
  const out = {}
  // initialize counts for known regions
  for (const r of regions) out[r] = 0
  const list = allCourts.value || []
  out['all'] = list.length
  for (const c of list) {
    const k = ((c.region || '') + '').toString().toLowerCase().trim() || 'all'
    if (out[k] === undefined) out[k] = 0
    out[k] = (out[k] || 0) + 1
  }
  return out
})

function regionCount(region) {
  return (regionCounts.value && regionCounts.value[region]) || 0
}



// const loadCourtsFromFirebase = async () => {
//   const data = await getDataFromFirebase('courts')
//   if (data) {
//     firebaseCourts.value = Object.entries(data).map(([id, court]) => ({ id, ...court }))
//     addMarkers(firebaseCourts.value)
//   }
// }

// change 5: unify court data base from firebase console and
//  hardcoded courts:

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

// Called when AddMatchModal emits 'created' — refresh matches for the selected court so embedded lists update
async function handleMatchCreated() {
  try {
    // Clear all cache to ensure fresh data is loaded
    matchesCache.value = {}
    
    // Refresh all matches to ensure global state is updated
    await loadAllMatchesAndDetermineOngoing()
    
    // Force embedded Matches component to refresh
    matchesRefreshKey.value++
    
    if (selectedCourt.value) {
      await loadMatchesForCourt(selectedCourt.value)
      // ensure the court's expanded matches view is visible
      expandedCourts.value = { [courtKey(selectedCourt.value)]: true }
    }
  } catch (e) {
    console.warn('handleMatchCreated failed', e)
  } finally {
    showAddMatchModal.value = false
  }
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
  // Clear existing marker instances exactly once
  markerInstances.forEach(m => m.setMap(null));
  markerInstances = [];

  if (!courtsList || !courtsList.length) {
    console.log('No courts to show for current filters.');
    return;
  }

  // allCourts.value = courtsList;
  courtsList.forEach(court => {
    const lat = Number(court.lat);
    const lon = Number(court.lon);
    if (!isFinite(lat) || !isFinite(lon)) return;

    const marker = new google.maps.Marker({
      position: { lat, lng: lon },
      map: map.value,
      title: court.name || '',
      icon: {
        url: getBasketballIcon(regionColors[(court.region || '').toString().toLowerCase().trim()] || '#f57c00'),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16)
      }
    });
    // attach numeric index (position in the filtered courtsList) so we can find the DOM card reliably
    // when marker is clicked. Use a non-enumerable property to avoid accidental exposure.
    Object.defineProperty(marker, '__courtIndex', { value: courtsList.indexOf(court), writable: true, enumerable: false })

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
      // When marker is clicked, expand only the corresponding court card and scroll it into view.
      // Do NOT open the create-match modal here.
      try {
        selectedCourt.value = court
        const key = courtKey(court)
        // collapse others and expand this one
        expandedCourts.value = { [key]: true }
        // allow DOM to update, then scroll the card into view
        setTimeout(() => {
          // prefer numeric index lookup if available
          const idx = marker.__courtIndex
          let el = null
          if (typeof idx !== 'undefined' && idx !== null) {
            el = document.querySelector(`[data-court-index="${idx}"]`)
          }
          if (!el) {
            el = document.querySelector(`[data-court-key="${key}"]`)
          }
          if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 160)
      } catch (e) {
        console.warn('Marker click handler failed to expand/scroll court card', e)
      }
    });
    
    markerInstances.push(marker);
  });

  console.log('Current markers:', markerInstances.length, markerInstances.map(m => m.getTitle()));
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

//change 6: watchers for allcourts, searchQuery, and selectedRegions:
watch(allCourts, () => {
  applyFilters();
});

watch(searchQuery, () => {
  applyFilters();
});

watch(selectedRegions, () => {
  applyFilters();
});

function courtKey(court) {
  return encodeURIComponent((court.id || court.name || '').toString())
}

async function loadMatchesForCourt(court) {
  const key = courtKey(court)
  if (matchesCache.value[key]) return matchesCache.value[key]
  try {
    const data = await getDataFromFirebase('matches')
    const out = []
    if (data && typeof data === 'object') {
      for (const [k1, v1] of Object.entries(data)) {
        if (!v1) continue
        if (typeof v1 === 'object') {
          for (const [k2, v2] of Object.entries(v1)) {
            if (!v2) continue
            if (typeof v2 === 'object') {
              for (const [mid, mv] of Object.entries(v2)) {
                const copy = { id: mid, __dbPath: `matches/${k1}/${k2}/${mid}`, ...mv }
                out.push(copy)
              }
            }
          }
        }
      }
    }
    // filter by court name (loose match on court or location)
    const name = (court.name || '').toString().toLowerCase()
    const filtered = out.filter(m => ((m.court || '') + '').toString().toLowerCase().includes(name) || ((m.location || '') + '').toString().toLowerCase().includes(name))
    // sort upcoming first
    filtered.sort((a, b) => {
      const sa = getMatchStartEnd(a).start
      const sb = getMatchStartEnd(b).start
      if (!sa && !sb) return 0
      if (!sa) return 1
      if (!sb) return -1
      return sa - sb
    })
    matchesCache.value[key] = filtered
    return filtered
  } catch (e) {
    console.error('Failed to load matches for court', e)
    matchesCache.value[key] = []
    return []
  }
}

async function toggleCourtExpand(court) {
  const key = courtKey(court)
  if (!expandedCourts.value[key]) {
    // expand: load matches
    expandedCourts.value = { ...expandedCourts.value, [key]: true }
    await loadMatchesForCourt(court)
  } else {
    expandedCourts.value = { ...expandedCourts.value, [key]: false }
  }
}

/**
 * Zoom / focus the map and UI on the provided court.
 * Used by the template when a court name is clicked.
 */
function zoomToCourtMarker(court) {
  if (!court) return
  try {
    selectedCourt.value = court

    // center + animated zoom to matched court if coords available
    if (map.value && isFinite(Number(court.lat)) && isFinite(Number(court.lon))) {
      const pos = { lat: Number(court.lat), lng: Number(court.lon) }
      try {
        if (typeof map.value.panTo === 'function') map.value.panTo(pos)
        else map.value.setCenter(pos)
      } catch (e) {
        try { map.value.setCenter(pos) } catch (err) { /* ignore */ }
      }
      try { animateZoomTo(15, 400) } catch (e) { try { map.value.setZoom(15) } catch (err) { } }
    }

    // place a temporary search marker
    try {
      if (searchMarker.value) { try { searchMarker.value.setMap(null) } catch (e) { } }
      if (isFinite(Number(court.lat)) && isFinite(Number(court.lon))) {
        searchMarker.value = new google.maps.Marker({
          position: { lat: Number(court.lat), lng: Number(court.lon) },
          map: map.value,
          title: court.name || '',
          icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' }
        })
      }
    } catch (e) { /* ignore marker errors */ }

    // Intentionally do NOT expand or scroll the court card into view.
    // This keeps the list position unchanged when a court name is clicked.
  } catch (err) {
    console.warn('[zoomToCourtMarker] failed', err, court)
  }
}

function openCreateMatchForCourt(court) {
  try {
    selectedCourt.value = court
    showAddMatchModal.value = true
  } catch (e) {
    // fallback
    selectedCourt = court
    showAddMatchModal = true
  }
}


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
  console.log('testing', region, selectedRegions.value)
  if (r === 'all') {
    selectedRegions.value = ['all'];
    // Clear search and suggestions when user explicitly selects 'All'
    try {
      searchQuery.value = ''
      suggestions.value = []
      selectedCourt.value = null
      if (searchMarker.value) {
        try { searchMarker.value.setMap(null) } catch (e) { }
        searchMarker.value = null
      }
    } catch (e) { /* ignore */ }
    applyFilters();

    // Zoom back out to default overview center
    try {
      const defaultCenter = { lat: 1.3521, lng: 103.8198 }
      if (map.value) {
        try {
          if (typeof map.value.panTo === 'function') map.value.panTo(defaultCenter)
          else map.value.setCenter(defaultCenter)
        } catch (e) { try { map.value.setCenter(defaultCenter) } catch (err) { } }
        try { animateZoomTo(12, 450) } catch (e) { try { map.value.setZoom(12) } catch (err) { } }
      }
    } catch (err) { /* ignore */ }
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
  // Clear any active search/suggestion state when user toggles regions
  searchQuery.value = ''
  suggestions.value = []
  selectedCourt.value = null
  if (searchMarker.value) {
    try { searchMarker.value.setMap(null) } catch (e) { }
    searchMarker.value = null
  }

  applyFilters();

  // Zoom back out to default view (Singapore center) so user sees all region markers
  try {
    const defaultCenter = { lat: 1.3521, lng: 103.8198 }
    if (map.value) {
      try {
        if (typeof map.value.panTo === 'function') map.value.panTo(defaultCenter)
        else map.value.setCenter(defaultCenter)
      } catch (e) {
        try { map.value.setCenter(defaultCenter) } catch (err) { }
      }
      try { animateZoomTo(12, 450) } catch (e) { try { map.value.setZoom(12) } catch (err) { } }
    }
  } catch (err) {
    // ignore
  }
}

// ensure changes to selectedRegions trigger filtering (catch template changes)
watch(selectedRegions, () => applyFilters(), { deep: true });

//UNHIDE 2
// const filterByRegion = region => {
//   selectedRegions.value = selectedRegions.value === region ? '' : region
//   applyFilters()
onMounted(() => {




  onUserStateChanged((user) => {
    currentUser.value = user
    if (user) {
      showPopup.value = false // Always hide when user is present
    }
  })


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
    // pan then animate zoom for smoother effect
    try {
      if (typeof map.value.panTo === 'function') map.value.panTo(location)
      else map.value.setCenter(location)
    } catch (e) {
      try { map.value.setCenter(location) } catch (err) { /* ignore */ }
    }
    try { animateZoomTo(15, 400) } catch (e) { try { map.value.setZoom(15) } catch (err) { } }

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
      // hide suggestions once a place is selected from autocomplete and suppress watcher
      suggestions.value = []
      suppressSuggestions.value = true
      setTimeout(() => { suppressSuggestions.value = false }, 300)
      if (matchedCourt) {
        // ensure marker, expand and scroll into view
        try {
          const pos = { lat: Number(matchedCourt.lat), lng: Number(matchedCourt.lon) }
          if (searchMarker.value) searchMarker.value.setMap(null)
          searchMarker.value = new google.maps.Marker({ position: pos, map: map.value, title: matchedCourt.name, icon: { url: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png' } })
          const key = courtKey(matchedCourt)
          setTimeout(() => {
            const idx = markerInstances.findIndex(m => m.getTitle() === (matchedCourt.name || ''))
            let el = null
            if (idx !== -1) el = document.querySelector(`[data-court-index="${idx}"]`)
            if (!el) el = document.querySelector(`[data-court-key="${key}"]`)
            if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 180)
        } catch (e) { /* ignore marker/scroll errors */ }
        applyFilters()
      }
      searchQuery.value = place.formatted_address
  })
})
</script>



<style scoped>
.suggestions-list {
  position: absolute;
  top: 100%;
  /* directly below input */
  left: 0;
  width: 100%;
  background: #262b33;
  border-radius: 0 0 8px 8px;
  /* rounded bottom corners */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  padding: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: 0;
  /* no extra margin needed */
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
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
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
  border-bottom: 1px solid rgba(120, 130, 140, 0.14);
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
  transition: all 0.3s ease;
}

.add-court-btn:not(:disabled):hover,
.add-court-btn:not(:disabled):focus {
  background: #ffb751;
  box-shadow: 0 4px 18px rgba(255, 183, 81, 0.32);
}

.add-court-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-desc {
  font-size: 1.16rem;
  color: #a7adba;
  margin: 18px 0 20px 0;
  font-weight: 500;
}

.search-input {
}
.search-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px 0 0 10px;
  /* rounded left corners */
  border: 1.5px solid #3b4252;
  border-right: none;
  /* remove right border for seamless button */
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
  box-shadow: 0 1px 4px rgba(40, 45, 50, 0.04);
}

.region-btn:hover {
  background: #353b44;
}

.region-btn.active {
  background: #ff9a3c;
  color: #181c23;
  box-shadow: 0 2.5px 14px rgba(255, 154, 60, 0.26);
}

.card-section {
  margin-top: 32px;
  background: #232830;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 5px rgba(30, 30, 40, 0.14);
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

.pin-btn:hover,
.pin-btn:focus {
  background: #ffd59a3c;
  outline: none;
}

.map-container {
  height: 370px;
  width: 100%;
  border-radius: 8px;
  background: #38414c;
  box-shadow: 0 4px 13px rgba(0, 0, 0, 0.09);
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-container>div,
.map-container iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

/* floating icon removed */

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

.clickable-court-name {
cursor: pointer;
transition: color 0.2s ease, text-shadow 0.2s ease;
}

.clickable-court-name:hover {
color: #ffad1d;
text-shadow: 0 0 8px rgba(255, 173, 29, 0.4);
text-decoration: underline;
}

.live-indicator {
    display: inline-block;
    background: linear-gradient(180deg, #a83a3a 0%, #c84b4b 100%);
    color: rgba(255, 210, 210, 0.95);
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1px solid rgba(0,0,0,0.4);
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.03), 0 6px 18px rgba(200,50,50,0.12);
    animation: live-blink 2.6s ease-in-out infinite;
    margin-left: 8px;
    text-shadow: none;
}

@keyframes live-blink {
    0% { opacity: 1; transform: translateZ(0) scale(1); }
    45% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
    55% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
    100% { opacity: 1; transform: translateZ(0) scale(1); }
}

/* Court list and mini matches */
.court-list {
  margin-top: 18px
}

.court-card {
  padding: 16px;
  margin-bottom: 12px
}

.court-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center
}

.court-info {
  display: flex;
  flex-direction: column
}

.court-sub {
  color: #9fb0bf;
  font-size: 0.95rem
}

.view-matches-link {
  background: transparent;
  border: none;
  color: #ffb14d;
  font-weight: 700;
  cursor: pointer
}

.mini-matches {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(255, 255, 255, 0.03)
}

.mini-match {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02)
}

.mini-left {
  flex: 1
}

.mini-title {
  font-weight: 700;
  color: #fff
}

.mini-meta {
  color: #9fb0bf;
  font-size: 0.9rem;
  margin-top: 6px
}

.mini-badges .badge {
  background: rgba(255, 255, 255, 0.03);
  color: #cbd6df;
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 6px;
  font-size: 0.75rem
}

.avatar-stack-small {
  display: flex;
  align-items: center
}

.avatar-img-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  margin-left: -8px;
  border: 2px solid rgba(0, 0, 0, 0.5)
}

.avatar-initial-small {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #1f262b;
  color: #fff;
  margin-left: -8px;
  font-size: 0.8rem
}

.mini-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-left: 12px
}

.mini-empty {
  color: #9fb0bf;
  padding: 8px 0
}

.create-match-top {
  background: #ff9a3c;
  color: #111;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
}

.create-match-top:hover {
  background: #ffb14d
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
}
.search-btn {
  padding: 12px 20px;
  background-color: #ff9500;
  color: white;
  border: none;
  border-radius: 0 10px 10px 0;
  /* rounded right corners */
  cursor: pointer;
  font-weight: 700;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.search-btn:hover {
  background-color: #ffb751;
}

/* Region filter badge (small rounded count) */
.region-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px
}

.region-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: #dbe9f2;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700
}

.region-btn.active {
  background: rgba(255, 154, 60, 0.12);
  border-color: rgba(255, 154, 60, 0.18);
  color: #fff
}

.region-badge {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  font-weight: 700;
  font-size: 0.78rem;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle
}

/* Popup styles */
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(24, 28, 35, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.success-popup {
  background-color: #000000;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 400px;
  margin: 0 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.success-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
  background-color: #EF4444;
}

.success-popup h3 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.75rem;
}

.success-popup p {
  color: #747d89;
  margin-bottom: 1.5rem;
  font-size: 1rem;
}

.popup-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.sign-in-btn {
  background-color: #FFAD1D;
  color: #181C23;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
  text-decoration: none;
}

.sign-in-btn:hover {
  background-color: #FFB751;
  text-decoration: none;
}

.close-btn {
  background-color: #374151;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.875rem;
}

.close-btn:hover {
  background-color: #4B5563;
}

/* Responsive */
@media (max-width: 900px) {

  .card,
  .main-card {
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

  .card,
  .main-card {
    padding: 10px 2px 50px 2px;
  }

  .card-title {
    font-size: 2rem;
  }

  .map-container {
    height: 230px;
  }
}

/* Embedded Matches tweaks: make Matches component compact inside the expanded court card */
.expanded-matches .large-card {
  padding: 8px 6px;
  border: none;
  background: transparent;
  box-shadow: none;
}

.expanded-matches .matches-header {
  display: none
}

.expanded-matches .matches-grid {
  margin-top: 8px
}

.expanded-matches .match-card {
  min-height: 220px
}

@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }

  .card-title {
    font-size: 1.8rem;
  }

  .search-input {
    font-size: 0.85rem;
    padding: 6px 10px;
  }

  .add-court-btn,
  .add-match-btn,
  .clear-btn {
    font-size: 0.8rem;
    padding: 5px 10px;
  }
}
</style>
