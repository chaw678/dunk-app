<template> 
  <div>
    <div v-if="showPopup" class="success-overlay" @click="handlePopupClose">
      <div class="success-popup">
        <div class="success-icon" v-if="popupType === 'success'">✓</div>
        <div class="success-icon" v-else style="background:#e04747">✕</div>
        <h3>{{ popupType === 'success' ? 'Success!' : 'Error' }}</h3>
        <p>{{ popupMessage }}</p>
        <button class="success-btn" @click="handlePopupClose">Close</button>
      </div>
    </div>

    <div class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content">
      <button class="modal-close" @click.prevent="closeModal" aria-label="Close modal">&times;</button>
      <h2 class="modal-title">Create a New Match</h2>
      <p class="modal-desc">Fill in the details below to organize a new game.</p>

      <form @submit.prevent="createMatch">
        <label>Match Title</label>
        <input type="text" v-model="matchTitle" placeholder="e.g., Weekend Hoops" />

        <label>Gender</label>
        <div class="gender-options">
          <label v-for="(g, i) in availableGenders" :key="i"><input type="radio" :value="g" v-model="gender"/> {{ g }}</label>
        </div>

        <label class="d-flex align-items-center">Court
          <small v-if="courtError" class="text-danger ms-2" style="font-weight:600;font-size:0.9rem;">{{ courtError }}</small>
          <div v-if="validatingCourt" class="ms-2 spinner-sm" aria-hidden="true">
            <div class="spinner-border spinner-border-sm text-warning" role="status"><span class="visually-hidden">Validating...</span></div>
          </div>
        </label>
        <div v-if="courtList && courtList.length">
          <select ref="courtSelectRef" v-model="selectedCourt">
            <option value="" disabled>Select a court</option>
            <option v-for="(c, i) in courtList" :key="i" :value="(c.id || c.key || c.name)">{{ c.name }}</option>
          </select>
        </div>
        <div v-else>
          <p class="court-display">{{ selectedCourtDisplayName }}</p>
        </div>

  <label>Date</label>
  <input type="date" v-model="matchDate" :min="minDate" />

        <label class="d-flex align-items-center">Match Timing
          <small v-if="timingError" class="text-danger ms-2" style="font-weight:600;font-size:0.9rem;">{{ timingError }}</small>
          <div v-if="checkingOverlap" class="ms-2 spinner-sm" aria-hidden="true">
            <div class="spinner-border spinner-border-sm text-warning" role="status"><span class="visually-hidden">Checking...</span></div>
          </div>
        </label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="time" v-model="startTime" @change="autoFillEnd" />
          <div style="padding:0 6px;color:#ddd">to</div>
          <input type="time" v-model="endTime" />
        </div>

        <label>Match Type (Skill Level)</label>
        <select v-model="matchType">
          <option v-for="(t, idx) in availableMatchTypes" :key="idx" :value="t">{{ t }}</option>
        </select>

        <label>Number of Players</label>
        <input type="number" v-model.number="maxPlayers" min="2" max="30" />

  <button type="submit" class="create-btn" :disabled="!canSubmit || validatingCourt || checkingOverlap" :title="!canSubmit ? 'Fill required fields before creating' : (validatingCourt || checkingOverlap ? 'Validating...' : '')">Create Match</button>
    <div v-if="submitDisabledReason && submitDisabledReason.length" style="margin-top:6px;font-size:0.92rem;color:#ffb4b4">{{ submitDisabledReason }}</div>
      </form>
    </div>
  </div>
  </div>
</template>

<script setup>
import { pushDataToFirebase, getDataFromFirebase } from '../firebase/firebase'
import { ref, computed, onMounted, watch } from 'vue'
import { onUserStateChanged } from '../firebase/auth'

const props = defineProps({
  courtName: String,
  courtList: { type: Array, default: () => [] }
})
const matchTitle = ref('')
const matchDate = ref('')
const matchTime = ref('')
const startTime = ref('')
const endTime = ref('')
const timingError = ref('')
const validatingCourt = ref(false)
const checkingOverlap = ref(false)
const maxPlayers = ref(10)
const courtError = ref('')
const courtSelectRef = ref(null)
const matchType = ref('Open')
const gender = ref('All')
const selectedCourt = ref(props.courtName || '')
const showPopup = ref(false)
const popupType = ref('success')
const popupMessage = ref('')

function courtKeyOf(c) {
  if (!c) return ''
  return (c.id || c.key || c.name || '').toString()
}

function getDisplayNameForKey(key) {
  if (!key) return ''
  const list = props.courtList || []
  const found = list.find(c => courtKeyOf(c).toString() === key.toString())
  if (found) return found.name || found.title || key
  // fallback: if parent provided courtName as a name, return it
  if (props.courtName && props.courtName === key) return props.courtName
  return key
}

const selectedCourtDisplayName = computed(() => getDisplayNameForKey(selectedCourt.value))

// Try to prefill the selected court when a courtList and courtName are provided.
function tryPrefillCourt() {
  try {
    const wanted = (props.courtName || '').toString().trim()
    if (!wanted) return
    const list = props.courtList || []
    if (!list || !list.length) return
    const lowerWanted = wanted.toLowerCase()
    const found = list.find(c => {
      if (!c) return false
      const name = (c.name || c.title || '').toString().trim()
      if (name && name.toLowerCase() === lowerWanted) return true
      const id = (c.id || c.key || '').toString().trim()
      if (id && id.toLowerCase() === lowerWanted) return true
      return false
    })
    if (found) {
      selectedCourt.value = courtKeyOf(found)
    } else {
      // fallback: set the raw string so the UI displays something
      selectedCourt.value = props.courtName
    }
  } catch (e) {
    // ignore
  }
}

onMounted(() => tryPrefillCourt())
watch(() => props.courtList, () => tryPrefillCourt())
watch(() => props.courtName, () => tryPrefillCourt())

// listen for auth state so we can record the creating user's uid
const currentUser = ref(null)
// prefer `ranking` field; keep legacy `skill` for compatibility
const currentUserProfile = ref({ ranking: 'Open', skill: 'Open', gender: '' })
const minDate = ref('')

onMounted(() => {
  onUserStateChanged(async (u) => {
    currentUser.value = u
    try {
      if (u && u.uid) {
        // try to fetch the user's profile from Realtime DB
        const p = await getDataFromFirebase(`users/${u.uid}`)
        if (p) currentUserProfile.value = p
      } else {
        currentUserProfile.value = { skill: 'Open', gender: '' }
      }
    } catch (e) {
      // fallback to defaults
      currentUserProfile.value = { skill: 'Open', gender: '' }
    }
  })
  // compute minDate (today) for the date picker and default matchDate if empty
  try {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    minDate.value = `${y}-${m}-${day}`
    if (!matchDate.value) matchDate.value = minDate.value
  } catch (e) {}
})

const emit = defineEmits(['close'])

const handlePopupClose = () => {
  showPopup.value = false
  if (popupType.value === 'success') {
    emit('created')
    closeModal()
  }
}
// Clear timing error when relevant fields change
watch([selectedCourt, matchDate, startTime, endTime], () => {
  timingError.value = ''
  checkingOverlap.value = false
})

const handleOverlayClick = (event) => {
  // Only close if clicking the overlay itself, not its children
  if (event.target === event.currentTarget) {
    closeModal()
  }
}

const closeModal = () => {
  emit('close')
}

function autoFillEnd() {
  try {
    if (!startTime.value) return
    // parse startTime HH:MM, add 1 hour
    const [hh, mm] = startTime.value.split(':').map(Number)
    const dt = new Date()
    dt.setHours(hh || 0)
    dt.setMinutes(mm || 0)
    dt.setSeconds(0)
    dt.setMinutes(dt.getMinutes() + 60)
    const nh = String(dt.getHours()).padStart(2, '0')
    const nm = String(dt.getMinutes()).padStart(2, '0')
    endTime.value = `${nh}:${nm}`
  } catch (e) {}
}

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0)
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false
  return aStart < bEnd && bStart < aEnd
}

function toSingaporeDateTimeISO(dateStr, timeStr) {
  // parse local date/time (YYYY-MM-DD, HH:MM) and convert to Singapore timezone ISO string
  if (!dateStr || !timeStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  // We want the ISO (UTC) that represents the given wall-time in Singapore (UTC+8).
  // To convert Singapore local time to UTC, subtract 8 hours from the local wall-time.
  // Using Date.UTC treats the input as UTC; therefore take Date.UTC(...) and subtract 8h.
  const utcMillisForSG = Date.UTC(y, m - 1, d, hh || 0, mm || 0, 0) - (8 * 60 * 60 * 1000)
  return new Date(utcMillisForSG).toISOString()
}

async function isTimingOverlap() {
  timingError.value = ''
  checkingOverlap.value = true // Set to true at start

  if (!selectedCourt.value || !matchDate.value || !startTime.value || !endTime.value) {
    checkingOverlap.value = false
    return false
  }
  
  const newStart = parseDateTime(matchDate.value, startTime.value)
  const newEnd = parseDateTime(matchDate.value, endTime.value)
  if (!newStart || !newEnd || newEnd <= newStart) {
    timingError.value = 'Please provide a valid start and end time'
    checkingOverlap.value = false
    return true
  }

  try {
    // matches reorganized by court/date: matches/{courtKey}/{YYYY-MM-DD}/{matchId}
  const raw = await getDataFromFirebase(`matches/${encodeURIComponent(selectedCourt.value)}/${matchDate.value}`)
    const data = raw
    if (!data) return false
    const matches = Object.entries(data).map(([id, v]) => ({ id, ...v }))
    for (const m of matches) {
  if (!m.court || !m.date) continue
  // m.court in DB is a display name; compare against the computed display name for the selected key
  if (m.court !== getDisplayNameForKey(selectedCourt.value)) continue
      if (m.date !== matchDate.value) continue

      let existStart = null
      let existEnd = null
      if (m.startTime && m.endTime) {
        existStart = parseDateTime(m.date, m.startTime)
        existEnd = parseDateTime(m.date, m.endTime)
        
        // If the match ended early, use the actual end time instead of scheduled end time
        if (m.endedAt) {
          try {
            const actualEnd = new Date(m.endedAt)
            if (!isNaN(actualEnd.getTime()) && actualEnd < existEnd) {
              existEnd = actualEnd
            }
          } catch (e) {
            // If parsing fails, continue with scheduled end time
          }
        }
      } else if (m.time) {
        existStart = parseDateTime(m.date, m.time)
        existEnd = new Date(existStart.getTime())
        
        // Check for early end here too
        if (m.endedAt) {
          try {
            const actualEnd = new Date(m.endedAt)
            if (!isNaN(actualEnd.getTime()) && actualEnd < existEnd) {
              existEnd = actualEnd
            }
          } catch (e) {
            // Continue with default end time
          }
        }
      }
      if (existStart && existEnd) {
        if (rangesOverlap(newStart, newEnd, existStart, existEnd)) {
          timingError.value = 'There is already a match scheduled at this timing'
          checkingOverlap.value = false
          return true
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch matches for overlap check', e)
    checkingOverlap.value = false
    return false
  }
  checkingOverlap.value = false // Make sure it's reset before returning
  return false
}

const canSubmit = computed(() => {
  if (!selectedCourt.value) return false
  if (!matchDate.value) return false
  if (minDate.value && matchDate.value < minDate.value) return false
  if (!startTime.value || !endTime.value) return false
  const s = parseDateTime(matchDate.value, startTime.value)
  const e = parseDateTime(matchDate.value, endTime.value)
  if (!s || !e) return false
  if (e <= s) return false
  return true
})

// normalize skill helpers (same logic as Matches.vue)
const skillOrder = ['Open', 'Beginner', 'Intermediate', 'Professional']
function normalizeSkill(skill) {
  if (!skill) return 'Open'
  const s = ('' + skill).trim().toLowerCase()
  if (s.startsWith('pro')) return 'Professional'
  if (s.startsWith('inter')) return 'Intermediate'
  if (s.startsWith('beg')) return 'Beginner'
  if (s.startsWith('open')) return 'Open'
  for (const v of skillOrder) if (v.toLowerCase() === s) return v
  return 'Open'
}
function skillRank(skill) {
  const normalized = normalizeSkill(skill)
  const idx = skillOrder.indexOf(normalized)
  return idx === -1 ? 0 : idx
}

// Gender options based on user's profile
const availableGenders = computed(() => {
  // Always allow all gender options for match creation
  // Users should be able to create matches for any gender preference
  return ['All', 'Female', 'Male']
})

// Canonical match types (match "levels") — include all skill levels for match creation
const canonicalMatchTypes = ['Open', 'Beginner', 'Intermediate', 'Professional']

// Match type options: allow creating matches at any skill level
const availableMatchTypes = computed(() => {
  // Users can create matches at any skill level, not just at or below their own level
  // This allows for more flexibility in organizing games
  return canonicalMatchTypes
})

// Ensure selected values remain valid when profile changes
watch([currentUserProfile, availableGenders, availableMatchTypes], () => {
  // adjust gender if not allowed
  const g = gender.value
  if (g && availableGenders.value.indexOf(g) === -1) {
    // pick the first allowed (prefer user's gender or 'All')
    gender.value = availableGenders.value.includes('All') ? 'All' : (availableGenders.value[0] || 'All')
  }
  // adjust matchType if not allowed
  if (matchType.value && availableMatchTypes.value.indexOf(matchType.value) === -1) {
    matchType.value = availableMatchTypes.value[0] || 'Open'
  }
})

// Provide a human-friendly reason why the Create button is disabled
const submitDisabledReason = computed(() => {
  if (validatingCourt.value) return 'Validating selected court...'
  if (checkingOverlap.value) return 'Checking for schedule conflicts...'
  if (!selectedCourt.value) return 'Please select a court.'
  if (!matchDate.value) return 'Please select a date.'
  if (minDate.value && matchDate.value < minDate.value) return 'Date cannot be in the past.'
  if (!startTime.value || !endTime.value) return 'Please set start and end times.'
  const s = parseDateTime(matchDate.value, startTime.value)
  const e = parseDateTime(matchDate.value, endTime.value)
  if (!s || !e) return 'Invalid start or end time.'
  if (e <= s) return 'End time must be after start time.'
  return ''
})

const createMatch = async () => {
  console.debug('[AddMatchModal] createMatch invoked', { canSubmit: canSubmit.value, validatingCourt: validatingCourt.value, checkingOverlap: checkingOverlap.value })
  try {
    // Reset all error states
    courtError.value = ''
    timingError.value = ''
    
    // ensure court selected
    if (!selectedCourt.value) {
      courtError.value = 'Please select a court'
      try { courtSelectRef.value && courtSelectRef.value.focus() } catch(e){}
      return
    }

    // server-side validate court exists in DB
    validatingCourt.value = true
    const rawCourts = await getDataFromFirebase('courts')
    let found = false
    if (rawCourts) {
      if (Array.isArray(rawCourts)) {
        found = rawCourts.some(c => (c && (c.name || c.title) === selectedCourt.value))
      } else {
        // object map
        for (const [k, v] of Object.entries(rawCourts)) {
          if (!v) continue
          if ((v.name === selectedCourt.value) || (v.title === selectedCourt.value) || (k === selectedCourt.value)) { found = true; break }
        }
      }
    }
    validatingCourt.value = false
    
    if (!found) {
      courtError.value = 'Selected court not found — please pick an available court'
      try { courtSelectRef.value && courtSelectRef.value.focus() } catch(e){}
      return
    }

    // Check for time overlap
    const overlap = await isTimingOverlap()
    if (overlap) {
      return
    }

    const newMatch = {
      title: matchTitle.value || 'Match at ' + selectedCourt.value,
      // persist human-friendly display name in the match record
    court: getDisplayNameForKey(selectedCourt.value),
      date: matchDate.value,
      time: startTime.value || matchTime.value,
      startTime: startTime.value,
      endTime: endTime.value,
      startAtISO: toSingaporeDateTimeISO(matchDate.value, startTime.value),
      endAtISO: toSingaporeDateTimeISO(matchDate.value, endTime.value),
      type: matchType.value,
      gender: gender.value,
      maxPlayers: maxPlayers.value || 10,
      players: [],
      joinedBy: {},
      createdAt: new Date().toISOString()
    }
  
  try {
    // attach creating user's uid as createdby/ownerId and persist host as joined
    try {
      const u = currentUser && currentUser.value
      if (u && u.uid) {
        const uid = u.uid
        const displayName = (u.displayName) || uid
        newMatch.createdby = uid
        newMatch.ownerId = uid
        // persist host as joined by default
        newMatch.joinedBy = { [uid]: true }
        newMatch.playersMap = { [uid]: displayName }
      }
    } catch (e) {
      // ignore
    }

  // push under matches/{courtKey}/{YYYY-MM-DD}
  // guard against double-encoding: decode then encode once
  const courtKey = encodeURIComponent(decodeURIComponent(selectedCourt.value || ''))
  // log intended DB path and payload for easier debugging
  try {
    console.debug('[AddMatchModal] Saving match to path:', `matches/${courtKey}/${matchDate.value}`)
    console.debug('[AddMatchModal] Payload:', newMatch)
  } catch (e) {}

  const newKey = await pushDataToFirebase(`matches/${courtKey}/${matchDate.value}`, newMatch)
  // optionally expose the DB path on the created object for consumers
  try {
    newMatch.__dbPath = `matches/${courtKey}/${matchDate.value}/${newKey}`
  } catch (e) {}
  console.log('Created match key:', newKey, 'path:', newMatch.__dbPath)
  // Use non-blocking log instead of alert (UI shows popup in parent)
  console.log('Match created and saved to Firebase')
  // notify parent to refresh list
  emit('created')
  closeModal()
  } catch (error) {
    console.error('Failed to save match:', error)
    popupType.value = 'error'
    popupMessage.value = 'Failed to save match: ' + (error && error.message ? error.message : String(error))
    showPopup.value = true
    // Reset loading states in case of error
    validatingCourt.value = false
    checkingOverlap.value = false
  }
}catch (e) {
    console.error('Error during match creation:', e)
    popupType.value = 'error'
    popupMessage.value = 'Error during match creation: ' + (e && e.message ? e.message : String(e))
    showPopup.value = true
    validatingCourt.value = false
    checkingOverlap.value = false
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
  /* allow overlay to scroll when content is taller than viewport */
  overflow-y: auto;
  padding: 20px 12px;
  z-index: 1000;
}

.modal-content {
  background-color: #2c323a;
  padding: 28px;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  color: #dde3ea;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
  /* ensure modal content never exceeds viewport height; make it scroll internally */
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 18px;
  background: transparent;
  border: none;
  color: #cbd6df;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover { color: #fff }

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

.gender-options {
  display: flex;
  gap: 16px;
  align-items: center;
}
.gender-options label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.02);
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  color: #dde3ea;
}
.gender-options input[type="radio"] {
  width: 16px;
  height: 16px;
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
  z-index: 1100;
}

.success-popup {
  background-color: #2c323a;
  padding: 28px;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  /* Make sure popup never exceeds viewport height and becomes scrollable instead */
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
  color: white;
}

.success-popup h3 {
  color: orange;
  font-size: 24px;
  margin-bottom: 12px;
}

.success-popup p {
  color: #dde3ea;
  margin-bottom: 24px;
}

.success-btn {
  background-color: orange;
  color: #181c23;
  font-weight: bold;
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.success-btn:hover {
  background-color: #ffa733;
}

/* Responsive tweaks so popup is usable on small screens */
@media (max-width: 520px) {
  .success-popup {
    padding: 16px;
    max-width: 92vw;
    max-height: calc(100vh - 32px);
  }
  .success-icon { width: 48px; height:48px; font-size:22px; margin-bottom:12px }
  .success-popup p { margin-bottom: 16px }
  .success-btn { display:block; width:100%; padding:10px 12px }
}
</style>