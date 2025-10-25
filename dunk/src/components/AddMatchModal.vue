<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="modal-close" @click="closeModal" aria-label="Close modal">&times;</button>
      <h2 class="modal-title">Create a New Match</h2>
      <p class="modal-desc">Fill in the details below to organize a new game.</p>

      <form @submit.prevent="createMatch">
        <label>Match Title</label>
        <input type="text" v-model="matchTitle" placeholder="e.g., Weekend Hoops" />

        <label>Gender</label>
        <div class="gender-options">
          <label><input type="radio" value="All" v-model="gender"/> All</label>
          <label><input type="radio" value="Female" v-model="gender"/> Female</label>
          <label><input type="radio" value="Male" v-model="gender"/> Male</label>
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
          <option value="Open">Open</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Professional">Professional</option>
        </select>

        <label>Number of Players</label>
        <input type="number" v-model.number="maxPlayers" min="2" max="30" />

  <button type="submit" class="create-btn" :disabled="!canSubmit || validatingCourt || checkingOverlap" :title="!canSubmit ? 'Fill required fields before creating' : (validatingCourt || checkingOverlap ? 'Validating...' : '')">Create Match</button>
      </form>
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
const minDate = ref('')

onMounted(() => {
  onUserStateChanged((u) => { currentUser.value = u })
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

const emit = defineEmits(['close', 'created'])

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
  if (!selectedCourt.value || !matchDate.value || !startTime.value || !endTime.value) return false
  const newStart = parseDateTime(matchDate.value, startTime.value)
  const newEnd = parseDateTime(matchDate.value, endTime.value)
  if (!newStart || !newEnd || newEnd <= newStart) {
    timingError.value = 'Please provide a valid start and end time'
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
      } else if (m.time) {
        existStart = parseDateTime(m.date, m.time)
        existEnd = new Date(existStart.getTime())
      }
      if (existStart && existEnd) {
        if (rangesOverlap(newStart, newEnd, existStart, existEnd)) {
          timingError.value = 'There is already a match scheduled at this timing'
          return true
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch matches for overlap check', e)
    return false
  }
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

const createMatch = async () => {
  // ensure court selected
  courtError.value = ''
  if (!selectedCourt.value) {
    courtError.value = 'Please select a court'
    try { courtSelectRef.value && courtSelectRef.value.focus() } catch(e){}
    return
  }

  // server-side validate court exists in DB
  try {
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
    if (!found) {
      courtError.value = 'Selected court not found — please pick an available court'
      try { courtSelectRef.value && courtSelectRef.value.focus() } catch(e){}
      validatingCourt.value = false
      return
    }
  } catch (err) {
    console.warn('Failed to validate court list', err)
    // allow creation to proceed; it will likely fail on DB rules if invalid
  }

  checkingOverlap.value = true
  const overlap = await isTimingOverlap()
  checkingOverlap.value = false
  if (overlap) return

  const newMatch = {
    title: matchTitle.value,
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
  alert('Match created and saved to Firebase!')
  // notify parent to refresh list
  emit('created')
  closeModal()
  } catch (error) {
    alert('Failed to save match: ' + (error && error.message ? error.message : error))
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
</style>