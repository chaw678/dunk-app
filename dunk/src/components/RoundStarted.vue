<template>
  <div class="matchroom-container">
    <header>
      <button @click="goBack" class="back-btn">← Back</button>
  <h1>Round #{{ displayTitle }}</h1>
      <div></div>
    </header>

    <!-- Centered Timer Card (same look / behavior as MatchRoom) -->
    <div class="center-timer">
      <div class="timer-card">
        <div class="timer-header">Round Timer</div>

        <div class="timer-main">
          <div class="timer-setter-inline" v-if="!timerSet && !roundActive && !roundFinished">
            <div class="setter-row">
              <div class="time-inputs-inline">
                <input class="time-input" type="number" min="0" v-model.number="timerMinutes" placeholder="Min" :disabled="timerControlsDisabled" />
                <span class="colon">:</span>
                <input class="time-input" type="number" min="0" max="59" v-model.number="timerSeconds" placeholder="Sec" :disabled="timerControlsDisabled" />
                <button class="btn-set-inline" :class="{ pulsate: setShouldPulse }" @click="setTimer" :disabled="!validTimerInput || timerControlsDisabled">Set</button>
              </div>
              <div class="preset-buttons-inline">
                <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(60)" :disabled="timerControlsDisabled">1:00</button>
                <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(120)" :disabled="timerControlsDisabled">2:00</button>
                <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(300)" :disabled="timerControlsDisabled">5:00</button>
                <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(600)" :disabled="timerControlsDisabled">10:00</button>
              </div>
            </div>
          </div>

          <div class="time-large">{{ timerDisplay }}</div>
          <div class="progress-wrap" aria-hidden="true">
            <div class="progress-bar" :style="{ width: timerTotal ? ((timerTotal - timerRemaining) / (timerTotal || 1) * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <div class="timer-controls">
          <button
            class="btn-start"
            v-if="!roundActive && !roundFinished"
            @click="startRound"
            :disabled="!startEnabled"
            :class="{ 'disabled-btn': !startEnabled, pulsate: startShouldPulse }"
          >Start Round</button>

          <button class="btn" v-if="roundActive && !timerPaused" @click="pauseTimer">Pause</button>
          <button class="btn-reset" v-if="roundActive && timerPaused" @click="resumeTimer">Resume</button>
          <button class="btn-reset" v-if="roundActive && timerPaused" @click.prevent.stop="restartRound">Restart</button>
          <button class="btn-reset" v-if="!roundActive && timerSet && !roundFinished" @click="resetTimer">Reset</button>
          <button class="btn-end" v-if="roundActive" @click.prevent.stop="endRound(true)">End Round</button>
        </div>
      </div>
    </div>

    <!-- Teams vertical boxes (same visual style as MatchRoom) -->
    <section class="teams-grid">
  <div :class="['team-card', teamAOutlineClass, { 'pulsate-team': teamPulseActive }]" @click="roundFinished && selectWinner('A')" :aria-disabled="!roundFinished">
    <h2>Team A</h2>
    <div class="team-drop-list">
      <div v-for="p in teamA" :key="p.uid" class="player-tile">
        <div class="avatar-wrap">
          <img v-if="displayAvatarFor(p)" :src="displayAvatarFor(p)" class="avatar-img" :alt="displayNameFor(p)" />
          <div v-else class="avatar-fallback">{{ initials(displayNameFor(p)) }}</div>
        </div>
        <div class="player-username">{{ displayNameFor(p) }}</div>
      </div>
    </div>
  </div>

  <div :class="['team-card', teamBOutlineClass, { 'pulsate-team': teamPulseActive }]" @click="roundFinished && selectWinner('B')" :aria-disabled="!roundFinished">
    <h2>Team B</h2>
    <div class="team-drop-list">
      <div v-for="p in teamB" :key="p.uid" class="player-tile">
        <div class="avatar-wrap">
          <img v-if="displayAvatarFor(p)" :src="displayAvatarFor(p)" class="avatar-img" :alt="displayNameFor(p)" />
          <div v-else class="avatar-fallback">{{ initials(displayNameFor(p)) }}</div>
        </div>
        <div class="player-username">{{ displayNameFor(p) }}</div>
      </div>
    </div>
  </div>
</section>



    <!-- Winner selection after round ended -->
    <section v-if="!roundActive && roundFinished" class="winner-section">
      <p class="pick-txt">Pick winning team:</p>
      <div class="winner-buttons">
        <button @click="selectWinner('A')" :class="{ winnerBtn: selectedWinner === 'A' }" :disabled="!roundFinished">Team A</button>
        <button @click="selectWinner('B')" :class="{ winnerBtn: selectedWinner === 'B' }" :disabled="!roundFinished">Team B</button>
      </div>
      <div v-if="selectedWinner" class="confirm-winner">
          <div style="display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;">
            <button class="btn-start" @click="confirmWinnerNextRound">Confirm Winner & Start Next Round</button>
            <button class="btn-end" @click="confirmWinnerEndMatch">Confirm Winner & End Match</button>
          </div>
      </div>
    </section>
    
    <!-- Wins bar chart (matchroom style) -->
    <section class="wins-chart">
      <h1 class="wins-title">Match Wins</h1>
      <div class="chart-row">
        <div class="chart-item">
          <div class="bar-label">Team A</div>
          <div class="bar-outer"><div :class="['bar-inner', { pop: animateA }]" :style="{ height: winsPercentA + '%' }"></div></div>
          <div class="bar-count">{{ winsA }}</div>
        </div>
        <div class="chart-item">
          <div class="bar-label">Team B</div>
          <div class="bar-outer"><div :class="['bar-inner','bar-b', { pop: animateB }]" :style="{ height: winsPercentB + '%' }"></div></div>
          <div class="bar-count">{{ winsB }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { avatarForUser } from '../utils/avatar.js'
import { useRoute, useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, deleteChildData, onDataChange, incrementField, getUserName } from '../firebase/firebase'

const route = useRoute()
const router = useRouter()
const matchId = computed(() => route.params.id)

const matchData = ref({})
// live users map so we can display canonical profile names
const usersMap = ref({})
let usersUnsub = null

function subscribeUsers() {
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
  try {
    usersUnsub = onDataChange('users', (val) => { usersMap.value = val || {} })
  } catch (e) { console.warn('subscribeUsers failed', e) }
}
const teamA = ref([])
const teamB = ref([])
const selectedWinner = ref(null)
const roundFinished = ref(false)
// teamsLocked mirrors MatchRoom behavior: when teams are confirmed, they are locked
const teamsLocked = ref(false)

// Timer state (same behavior as MatchRoom)
const timerMinutes = ref(0)
const timerSeconds = ref(0)
const timerTotal = ref(0)
const timerRemaining = ref(0)
const timerSet = ref(false)
const timerInterval = ref(null)
const timerPaused = ref(false)
const roundActive = ref(false)

const startEnabled = computed(() => timerSet.value && teamA.value.length && teamB.value.length)
const startShouldPulse = computed(() => startEnabled.value && !roundActive.value)

// validate inputs for the inline setter (same as MatchRoom)
const validTimerInput = computed(() => {
  const m = Number(timerMinutes.value) || 0
  const s = Number(timerSeconds.value) || 0
  return (m > 0 || s > 0) && s >= 0 && s < 60
})

// pulse the Set/presets to encourage setting a timer once teams are locked
const setShouldPulse = computed(() => teamsLocked.value && !timerSet.value && !roundFinished.value && !roundActive.value)
const timerControlsDisabled = computed(() => roundActive.value || roundFinished.value)

const timerDisplay = computed(() => {
  // Show the remaining time explicitly. Use nullish coalescing so 0 is
  // respected (otherwise `||` would fall back to timerTotal when remaining
  // is 0). This ensures the UI accurately reflects the stopped time when a
  // round is ended early.
  const secs = Number(timerRemaining.value ?? timerTotal.value ?? 0)
  const mm = Math.floor(secs / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})

const teamAOutlineClass = computed(() => teamA.value.length ? (selectedWinner.value === 'A' ? 'winner-outline' : 'active-outline') : 'inactive-outline')
const teamBOutlineClass = computed(() => teamB.value.length ? (selectedWinner.value === 'B' ? 'winner-outline' : 'active-outline') : 'inactive-outline')

// Pulse teams only while the timer is actively counting down (not paused)
const teamPulseActive = computed(() => {
  return roundActive.value && !timerPaused.value && (timerRemaining.value > 0)
})

// helpers to fetch/enrich players (minimal copy of MatchRoom logic)
async function getUsersMap() {
  try {
    const m = await getDataFromFirebase('users')
    return m || {}
  } catch (e) {
    return {}
  }
}

function normalizePlayers(node) {
  if (!node) return []
  if (Array.isArray(node)) {
    return node.map(p => (typeof p === 'string' ? { uid: p } : (p.uid ? p : { uid: p.id || p.key || '' })))
  }
  if (typeof node === 'object') {
    return Object.entries(node).map(([k, v]) => ({ uid: v?.uid || v?.id || k, name: v?.name || null, avatar: v?.avatar || null }))
  }
  return []
}

async function enrichPlayers(list) {
  if (!list || !list.length) return []
  const users = await getUsersMap()
  return list
    .map(item => {
      // allow either uid string or player object
      const p = typeof item === 'string' ? { uid: item } : (item || {})
      const uid = p.uid || p.id || p.key || ''
      if (!uid) return null

      const resolved = users[uid] || {}
      const name = p.name || resolved.name || resolved.displayName || resolved.username || uid

      // prefer profile image fields from the users record (match MatchRoom behavior)
      const avatar =
        p.avatar ||
        p.photoURL ||
        resolved.avatar ||
        resolved.photoURL ||
        resolved.picture ||
        resolved.photo ||
        (resolved.profile && (resolved.profile.avatar || resolved.profile.picture)) ||
        resolved.imageURL ||
        resolved.thumbnail ||
        null

      // only generate fallback if no profile/avatar exists - use centralized helper
      let finalAvatar = avatar
      if (!finalAvatar) {
        finalAvatar = avatarForUser({ uid, name, gender: resolved.gender, photoURL: avatar })
      }

      return { uid, name, avatar: finalAvatar }
    })
    .filter(Boolean)
}

// timer functions (same as MatchRoom)
function applyPreset(seconds) {
  timerMinutes.value = Math.floor(seconds / 60)
  timerSeconds.value = seconds % 60
  setTimer()
}

function setTimer() {
  const m = Number(timerMinutes.value) || 0
  const s = Number(timerSeconds.value) || 0
  const total = m * 60 + s
  if (!total) return
  timerTotal.value = total
  timerRemaining.value = total
  timerSet.value = true
  timerPaused.value = false
}

function startTimer() {
  if (!timerSet.value || timerRemaining.value <= 0) return
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerPaused.value = false
  timerInterval.value = setInterval(() => {
    if (timerPaused.value) return
    if (timerRemaining.value > 0) {
      timerRemaining.value -= 1
    } else {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      roundActive.value = false
      roundFinished.value = true
      // leave timer at 0
      timerSet.value = false
    }
  }, 1000)
}

function pauseTimer() { timerPaused.value = true }
function resumeTimer() { if (!timerSet.value) return; timerPaused.value = false }

function resetTimer() {
  if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
  timerRemaining.value = timerTotal.value
  timerPaused.value = false
  timerSet.value = false
  timerMinutes.value = 0
  timerSeconds.value = 0
  timerTotal.value = 0
}

async function restartRound() {
  // stop any running interval and clear local timer state so user can set a new timer
  if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
  timerPaused.value = false
  roundActive.value = false
  roundFinished.value = false
  // clear timer so setter UI appears
  timerSet.value = false
  timerRemaining.value = 0
  timerTotal.value = 0
  timerMinutes.value = 0
  timerSeconds.value = 0

  // persist that the round is no longer active so other clients reflect the stop
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      try { await setChildData(dbPath, 'roundActive', false) } catch (e) {}
    }
  } catch (e) { console.warn('restartRound persistence failed', e) }
}

async function startRound() {
  // Start the round locally (start timer and mark active). Also persist the
  // roundActive flag and lastRoundStartedAt to DB so other clients see the
  // round state — but DO NOT navigate away from this component so the timer
  // continues running here.
  if (!startEnabled.value) { alert('Ensure both teams present and timer set.'); return }
  roundActive.value = true
  roundFinished.value = false
  // start the local timer so this view remains the active controller
  startTimer()
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', true)
      await setChildData(dbPath, 'lastRoundStartedAt', new Date().toISOString())
    }
  } catch (e) { /* ignore write errors */ }
}

async function endRound(confirmReq = true) {
  if (confirmReq && !confirm('End this round now?')) return
  if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
  timerPaused.value = false
  roundActive.value = false
  roundFinished.value = true
  // Do NOT clear `timerSet` here — keep the timer display showing the
  // elapsed/remaining time so the user sees the moment the round was ended.
  // Clearing `timerSet` would return the UI to the timer setter which is
  // undesirable when ending a running round abruptly.
  try {
    // Persist that the round is no longer active so other clients reflect the stop.
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', false)
    }
  } catch (e) { /* ignore write errors */ }

  // Do NOT navigate away from this view when the host simply ends the round.
  // The round should only be finalized (persisted + navigation back to
  // MatchRoom) after the host explicitly confirms a winner.
  console.log('Round ended locally; awaiting explicit winner confirmation before finalizing.')
}

function selectWinner(team) {
  selectedWinner.value = team
}

async function confirmWinner() {
  if (!selectedWinner.value) return
  try {
    const dbPath = await resolveMatchDbPath()
      if (dbPath) {
      await setChildData(dbPath, 'lastRoundWinner', selectedWinner.value)
      await setChildData(`${dbPath}/rounds`, Date.now().toString(), { winner: selectedWinner.value, endedAt: new Date().toISOString(), duration: getElapsedDuration() })
    }
  } catch (e) { console.warn(e) }
  // persist a roundsplayed entry with team rosters and winner details
  try {
    const ts = Date.now().toString()
    const teamAUids = (teamA.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const teamBUids = (teamB.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const winners = (selectedWinner.value === 'A' ? teamAUids : teamBUids)
    const payload = {
      teamA: teamAUids,
      teamB: teamBUids,
      winningTeam: selectedWinner.value,
      winningTeamMembers: winners,
      endedAt: new Date().toISOString(),
      duration: getElapsedDuration()
    }
  const dbPath = await resolveMatchDbPath()
  if (dbPath) {
    await setChildData(`${dbPath}/roundsplayed`, ts, payload)
    // mark the canonical lastRoundEndedAt timestamp now that the winner is
    // explicitly confirmed and the round is finalized.
    try { await setChildData(dbPath, 'lastRoundEndedAt', new Date().toISOString()) } catch (e) { /* non-fatal */ }
    // also keep a lightweight list of winning members per round for quick access
    try {
      if ((winners || []).length) await setChildData(`${dbPath}/winningTeamMembers`, ts, winners)
    } catch (e) { console.warn('Could not persist winningTeamMembers entry', e) }
  }
  } catch (e) { console.warn('Could not persist roundsplayed entry', e) }
  // keep teams persisted — do NOT delete teams here so allocations remain available
  // (MatchRoom will continue to load teams from the canonical DB path or history state)

  // increment per-player wins for the winning team
  try {
    const winners = selectedWinner.value === 'A' ? teamA.value : teamB.value
        await Promise.all((winners || []).map(async p => {
      const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)
      if (!uid) return
      try {
        // Always maintain a generic per-user wins counter for quick lookups
        await incrementField(`users/${uid}`, 'wins', 1)
            // Also increment the user's totalWins so profile reflects sum of typed wins
            try { await incrementField(`users/${uid}`, 'totalWins', 1) } catch (e) { /* non-fatal */ }
        // If match type is present, also increment the typed counter (open/intermediate/professional)
        try {
          // attempt to resolve match type (try local cache, then DB) so typed counters update reliably
          const matchType = await resolveMatchType()
          if (matchType) {
            const field = (k => k.startsWith('open') ? 'openWins' : (k.startsWith('inter') ? 'intermediateWins' : (k.startsWith('prof') ? 'professionalWins' : 'openWins')))(String(matchType).toLowerCase())
            await incrementField(`users/${uid}`, field, 1)
          } else {
            // type unknown — skip typed increment but log for easier debugging
            console.warn('typed win increment skipped: match type unknown for', uid)
          }
        } catch (e) { console.warn('Could not increment typed user win for', uid, e) }

        // Also increment a per-match playersMap counter so the match node tracks per-player wins
        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) await incrementField(`${dbPath}/playersMap/${uid}`, 'NumberOfWins', 1)
        } catch (e) { console.warn('Could not increment playersMap NumberOfWins for', uid, e) }

        // Also increment a sibling WinsByEachPlayer keyed by username under the match node
        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) {
            const uname = (await getUserName(uid)) || uid
            const safeKey = String(uname).replace(/[.$#\[\]\/]/g, '_')
            await incrementField(`${dbPath}/WinsByEachPlayer`, safeKey, 1)
          }
        } catch (e) { console.warn('Could not increment WinsByEachPlayer for', uid, e) }
      } catch (e) { console.warn('Could not increment user win for', uid, e) }
    }))
  } catch (e) { console.warn('increment wins failed', e) }

  // navigate back to MatchRoom to confirm teams again; include DB path if available
  const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
  try {
    const state = { teams: { teamA: teamAUids, teamB: teamBUids }, confirmed: true }
    if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
    await router.push({ name: 'MatchRoom', params: { id: matchId.value }, query, state })
  } catch (err) {
    // fallback to simple push if state not supported
    router.push({ name: 'MatchRoom', params: { id: matchId.value }, query })
  }
}

// confirm winner and start next round (keep teams)
async function confirmWinnerNextRound() {
  if (!selectedWinner.value) return
  try {
    const dbPath = await resolveMatchDbPath()
  if (dbPath) {
  await setChildData(dbPath, 'lastRoundWinner', selectedWinner.value)
  await setChildData(`${dbPath}/rounds`, Date.now().toString(), { winner: selectedWinner.value, endedAt: new Date().toISOString(), duration: getElapsedDuration() })
  // increment wins (non-transactional existing behavior)
      const currentWins = await getDataFromFirebase(`${dbPath}/wins`) || { A: 0, B: 0 }
      const newWins = { A: Number(currentWins.A || 0), B: Number(currentWins.B || 0) }
      if (selectedWinner.value === 'A') newWins.A += 1
      if (selectedWinner.value === 'B') newWins.B += 1
      await setChildData(dbPath, 'wins', newWins)
      winsA.value = newWins.A
      winsB.value = newWins.B
    }
  } catch (e) { console.warn('confirmWinnerNextRound error', e) }
  // persist roundsplayed entry with roster + winner details
  try {
    const ts = Date.now().toString()
    const teamAUids = (teamA.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const teamBUids = (teamB.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const winners = (selectedWinner.value === 'A' ? teamAUids : teamBUids)
  const payload = { teamA: teamAUids, teamB: teamBUids, winningTeam: selectedWinner.value, winningTeamMembers: winners, endedAt: new Date().toISOString(), duration: getElapsedDuration() }
  const dbPath = await resolveMatchDbPath()
  if (dbPath) {
    await setChildData(`${dbPath}/roundsplayed`, ts, payload)
    try {
      if ((winners || []).length) await setChildData(`${dbPath}/winningTeamMembers`, ts, winners)
    } catch (err) { console.warn('Could not persist winningTeamMembers entry', err) }
    // mark the canonical lastRoundEndedAt now that the round is finalized
    try { await setChildData(dbPath, 'lastRoundEndedAt', new Date().toISOString()) } catch (e) { /* non-fatal */ }
  }
  } catch (err) { console.warn('Could not persist roundsplayed entry', err) }
  // increment each winning player's counters (always increment generic wins and per-match counters)
  try {
    const winners = selectedWinner.value === 'A' ? teamA.value : teamB.value
    await Promise.all((winners || []).map(async p => {
      const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)
      if (!uid) return
      try {
        // Always increment generic wins
        await incrementField(`users/${uid}`, 'wins', 1)
            // Also increment totalWins for profile aggregation
            try { await incrementField(`users/${uid}`, 'totalWins', 1) } catch (err) { /* ignore */ }
        // If match type exists, increment typed counter as well
        try {
          const matchType = await resolveMatchType()
          if (matchType) {
            const field = (k => k.startsWith('open') ? 'openWins' : (k.startsWith('inter') ? 'intermediateWins' : (k.startsWith('prof') ? 'professionalWins' : 'openWins')))(String(matchType).toLowerCase())
            await incrementField(`users/${uid}`, field, 1)
          } else {
            console.warn('typed win increment skipped: match type unknown for', uid)
          }
        } catch (err) { console.warn('Could not increment typed user win for', uid, err) }

        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) await incrementField(`${dbPath}/playersMap/${uid}`, 'NumberOfWins', 1)
        } catch (err) { console.warn('Could not increment playersMap NumberOfWins for', uid, err) }

        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) {
            const uname = (await getUserName(uid)) || uid
            const safeKey = String(uname).replace(/[.$#\[\]\/]/g, '_')
            await incrementField(`${dbPath}/WinsByEachPlayer`, safeKey, 1)
          }
        } catch (err) { console.warn('Could not increment WinsByEachPlayer for', uid, err) }
      } catch (err) { console.warn('Could not increment user win for', uid, err) }
    }))
  } catch (e) { console.warn('increment wins failed', e) }

  // navigate back to MatchRoom to start the next round; keep teams intact
  const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
  try {
    const state = { teams: { teamA: teamAUids, teamB: teamBUids }, confirmed: true }
    if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
    await router.push({ name: 'MatchRoom', params: { id: matchId.value }, query, state })
  } catch (err) {
    await router.push({ name: 'MatchRoom', params: { id: matchId.value }, query })
  }
}

// confirm winner and end match (persist winner and rounds, mark match ended and go to Matches list)
async function confirmWinnerEndMatch() {
  if (!selectedWinner.value) return
  if (!confirm('Are you sure you want to end this match? This will move it to past matches.')) return
  const nowIso = new Date().toISOString()
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
  // persist final round + winner
  await setChildData(dbPath, 'lastRoundWinner', selectedWinner.value)
  await setChildData(`${dbPath}/rounds`, Date.now().toString(), { winner: selectedWinner.value, endedAt: nowIso, duration: getElapsedDuration() })

      // update wins counters
      const currentWins = await getDataFromFirebase(`${dbPath}/wins`) || { A: 0, B: 0 }
      const newWins = { A: Number(currentWins.A || 0), B: Number(currentWins.B || 0) }
      if (selectedWinner.value === 'A') newWins.A += 1
      if (selectedWinner.value === 'B') newWins.B += 1
      await setChildData(dbPath, 'wins', newWins)

      // mark match ended and clear active flags so Matches.vue treats it as past
      await setChildData(dbPath, 'started', false)
      await setChildData(dbPath, 'roundActive', false)
      await setChildData(dbPath, 'lastRoundEndedAt', nowIso)
      await setChildData(dbPath, 'endedAt', nowIso)
      await setChildData(dbPath, 'endAtISO', nowIso)
      await setChildData(dbPath, 'status', 'ended')

      // update local cache so UI reacts immediately
      try { matchData.value = { ...(matchData.value || {}), started: false, roundActive: false, lastRoundEndedAt: nowIso, endedAt: nowIso, endAtISO: nowIso, status: 'ended' } } catch (_) {}
    }
  } catch (e) { console.warn('confirmWinnerEndMatch error', e) }

  // increment each winning player's per-type win counter and auxiliary counters
  try {
    const matchType = await resolveMatchType()
    const typedField = matchType ? (k => k.startsWith('open') ? 'openWins' : (k.startsWith('inter') ? 'intermediateWins' : (k.startsWith('prof') ? 'professionalWins' : 'openWins')))(String(matchType).toLowerCase()) : null
    const winners = selectedWinner.value === 'A' ? teamA.value : teamB.value
    await Promise.all((winners || []).map(async p => {
      const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)
      if (!uid) return
      try {
        await incrementField(`users/${uid}`, 'wins', 1)
        try { await incrementField(`users/${uid}`, 'totalWins', 1) } catch (err) {}
        if (typedField) {
          try { await incrementField(`users/${uid}`, typedField, 1) } catch (err) { console.warn('Could not increment typed user win for', uid, err) }
        }

        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) await incrementField(`${dbPath}/playersMap/${uid}`, 'NumberOfWins', 1)
        } catch (err) { console.warn('Could not increment playersMap NumberOfWins for', uid, err) }

        try {
          const dbPath = await resolveMatchDbPath()
          if (dbPath) {
            const uname = (await getUserName(uid)) || uid
            const safeKey = String(uname).replace(/[.$#\[\]\/]/g, '_')
            await incrementField(`${dbPath}/WinsByEachPlayer`, safeKey, 1)
          }
        } catch (err) { console.warn('Could not increment WinsByEachPlayer for', uid, err) }
      } catch (err) { console.warn('Could not increment user win for', uid, err) }
    }))
  } catch (e) { console.warn('increment wins failed', e) }

  // persist roundsplayed entry for this final round
  try {
    const ts = Date.now().toString()
    const teamAUids = (teamA.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const teamBUids = (teamB.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const winners = (selectedWinner.value === 'A' ? teamAUids : teamBUids)
  const payload = { teamA: teamAUids, teamB: teamBUids, winningTeam: selectedWinner.value, winningTeamMembers: winners, endedAt: nowIso, duration: getElapsedDuration() }
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
  await setChildData(`${dbPath}/roundsplayed`, ts, payload)
      try {
        if ((winners || []).length) await setChildData(`${dbPath}/winningTeamMembers`, ts, winners)
      } catch (err) { console.warn('Could not persist winningTeamMembers entry', err) }
    }
  } catch (err) { console.warn('Could not persist roundsplayed entry', err) }

  // navigate back to MatchRoom so the final round's team allocations are visible there
  try {
    const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
    const teamAUids = (teamA.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const teamBUids = (teamB.value || []).map(p => (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)).filter(Boolean)
    const state = { teams: { teamA: teamAUids, teamB: teamBUids }, confirmed: true }
    if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
    await router.push({ name: 'MatchRoom', params: { id: matchId.value }, query, state })
  } catch (err) {
    // fallback to matches list if navigation to matchroom fails
    await router.push({ path: '/matches' })
  }
}

// load persisted teams from DB and enrich players
async function loadTeams() {
  try {
    // 1) Try the canonical path first
    const directPath = `matches/${matchId.value}`
    let data = await getDataFromFirebase(directPath)

    // if direct read returned something, keep the exact dbPath for round -> match navigation
    if (data) {
      matchData.value = { ...(data || {}), __dbPath: directPath }
    }

    // 2) If not found, allow teams to be provided via router history state or query (MatchRoom can push these)
    if ((!data || !data.teams)) {
      const historyState = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : null
      if (historyState && historyState.teams) {
        const teams = historyState.teams
        const rawA = Array.isArray(teams.teamA) ? teams.teamA : normalizePlayers(teams.teamA)
        const rawB = Array.isArray(teams.teamB) ? teams.teamB : normalizePlayers(teams.teamB)
        teamA.value = await enrichPlayers(rawA)
        teamB.value = await enrichPlayers(rawB)
        // preserve match path if provided by MatchRoom via history state
        if (historyState.matchPath) matchData.value = { __dbPath: historyState.matchPath }
        teamsLocked.value = true
        return
      }

      if (route && route.query && route.query.teams) {
        try {
          const teams = JSON.parse(decodeURIComponent(route.query.teams))
          const rawA = Array.isArray(teams.teamA) ? teams.teamA : normalizePlayers(teams.teamA)
          const rawB = Array.isArray(teams.teamB) ? teams.teamB : normalizePlayers(teams.teamB)
          teamA.value = await enrichPlayers(rawA)
          teamB.value = await enrichPlayers(rawB)
          // preserve match path if provided in the query
          if (route.query && route.query.path) matchData.value = { __dbPath: decodeURIComponent(route.query.path) }
          teamsLocked.value = true
          return
        } catch (e) {
          /* ignore parse errors */
        }
      }
    }

    // 3) If still not found, search the matches tree for the match id (handles nested DB paths)
    if (!data || !data.teams) {
      const all = await getDataFromFirebase('matches')
      const found = findMatchInTree(all, matchId.value)
      data = found || {}
    }

    // if we discovered the match object via tree-search, keep it locally (we may not have a __dbPath)
    if (data) matchData.value = { ...(data || {}), __dbPath: matchData.value && matchData.value.__dbPath ? matchData.value.__dbPath : matchData.value?.__dbPath }

    const teams = (data && data.teams) || {}
    const rawA = Array.isArray(teams.teamA) ? teams.teamA : normalizePlayers(teams.teamA)
    const rawB = Array.isArray(teams.teamB) ? teams.teamB : normalizePlayers(teams.teamB)
    const enrichedA = await enrichPlayers(rawA)
    const enrichedB = await enrichPlayers(rawB)
    teamA.value = enrichedA
    teamB.value = enrichedB
    if ((enrichedA && enrichedA.length) || (enrichedB && enrichedB.length)) teamsLocked.value = true
    console.log('RoundStarted.loadTeams -> loaded teams', { matchId: matchId.value, matchDataPath: matchData.value && matchData.value.__dbPath, teamA: teamA.value, teamB: teamB.value })
  } catch (e) {
    console.warn('failed to load teams', e)
  }
}

function findMatchInTree(node, id) {
  if (!node) return null
  if (typeof node !== 'object') return null

  // direct keyed entry
  if (node[id] && typeof node[id] === 'object') return node[id]

  for (const k of Object.keys(node)) {
    const v = node[k]
    if (!v || typeof v !== 'object') continue

    // match by explicit id field
    if (v.id && String(v.id) === String(id)) return v

    // if node contains teams and key matches id, assume it's the match
    if (v.teams && (v.teams.teamA || v.teams.teamB) && (k === String(id) || (v.id && String(v.id) === String(id)))) return v

    const found = findMatchInTree(v, id)
    if (found) return found
  }
  return null
}

function initials(name) {
  if (!name) return 'U'
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Friendly display name helper for player elements (handles uid strings or enriched objects)
function displayNameFor(element) {
  if (!element) return ''
  // if element is a plain uid string
  if (typeof element === 'string') {
    const uid = element
    const resolved = usersMap.value && usersMap.value[uid]
    return (resolved && (resolved.name || resolved.displayName || resolved.username)) || uid
  }
  // element is an object
  const uid = element.uid || element.id || element.key || null
  const resolved = uid && usersMap.value ? usersMap.value[uid] : null
  // Prefer explicit element name, then resolved user name, then uid.
  // Always return a non-empty fallback so the UI shows something.
  const resolvedName = (resolved && (resolved.name || resolved.displayName || resolved.username)) || null
  const fallback = uid || (element && element.name) || 'Player'
  return element.name || resolvedName || fallback
}

// Prefer canonical avatar from the users map when available, otherwise fall
// back to any avatar provided on the local player object.
function displayAvatarFor(element) {
  if (!element) return null
  const uid = (typeof element === 'string') ? element : (element.uid || element.id || element.key || null)
  const resolved = uid && usersMap.value ? usersMap.value[uid] : null
  if (resolved) {
    // prefer profilepicture when present (new canonical key), then other profile image fields
    return resolved.profilepicture || resolved.avatar || resolved.photoURL || resolved.picture || resolved.photo || resolved.imageURL || resolved.thumbnail || null
  }
  // fallback to element.avatar if provided
  if (typeof element === 'object' && element.avatar) return element.avatar
  return null
}

function goBack() {
  // Preserve current allocations in history state so MatchRoom can restore
  // them immediately when the user navigates back, but do NOT force-lock
  // them there — allow re-randomization.
  const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
  const state = {
    teams: {
      teamA: (teamA.value || []).map(p => (p && p.uid) ? p.uid : (p && p.id) ? p.id : p),
      teamB: (teamB.value || []).map(p => (p && p.uid) ? p.uid : (p && p.id) ? p.id : p)
    }
  }
  // indicate this is a manual restore (user pressed Back) so MatchRoom will
  // restore the visual allocations even though the round was not confirmed
  // by selecting a winner.
  state.restore = true
  if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
  router.push({ name: 'MatchRoom', params: { id: matchId.value }, query, state })
}

async function resolveMatchDbPath() {
  if (matchData.value && matchData.value.__dbPath) return matchData.value.__dbPath
  if (matchId.value) return `matches/${matchId.value}`
  return null
}

// Resolve the match type, trying local cache first then falling back to a DB read
async function resolveMatchType() {
  try {
    let mt = (matchData.value && matchData.value.type) ? String(matchData.value.type) : null
    if (mt) return mt
    const dbPath = await resolveMatchDbPath()
    if (!dbPath) return null
    // fetch the match node in case this view was navigated with partial state
    const remote = await getDataFromFirebase(dbPath)
    if (remote && remote.type) {
      // keep local cache in sync
      matchData.value = { ...(matchData.value || {}), ...(remote || {}) }
      return String(remote.type)
    }
  } catch (e) {
    console.warn('resolveMatchType failed', e)
  }
  return null
}

// Compute the elapsed duration (in seconds) for the current round. If a
// timer was set, elapsed = timerTotal - timerRemaining. If no timer was set,
// return 0 as a safe default.
function getElapsedDuration() {
  const total = Number(timerTotal.value || 0)
  const remaining = Number(timerRemaining.value ?? 0)
  if (total > 0) return Math.max(0, total - remaining)
  return 0
}

// wins tracking (subscribe for realtime updates so both MatchRoom and RoundStarted show the same live stats)
const winsA = ref(0)
const winsB = ref(0)
const winsTotal = computed(() => (Number(winsA.value) || 0) + (Number(winsB.value) || 0))
const winsPercentA = computed(() => {
  const t = winsTotal.value
  return t ? Math.round((winsA.value / t) * 100) : 0
})
const winsPercentB = computed(() => {
  const t = winsTotal.value
  return t ? Math.round((winsB.value / t) * 100) : 0
})

// animation flags for bars (brief pop when counts change)
const animateA = ref(false)
const animateB = ref(false)

// display title / round number shown in header (header already prints "Round — {{ displayTitle }}")
// We track the number of persisted rounds (roundsplayed) under the match node so
// the upcoming round number is (existingRounds + 1). If roundsplayed is not
// present yet, fall back to any legacy `rounds` node or default to 1.
const roundsCount = ref(0)
const roundsUnsub = ref(null)

const displayTitle = computed(() => {
  try {
    const count = Number(roundsCount.value || 0)
    return String(count > 0 ? count + 1 : 1)
  } catch (e) {
    return '1'
  }
})

async function loadRounds() {
  try {
    const dbPath = matchData.value && matchData.value.__dbPath ? matchData.value.__dbPath : (matchId.value ? `matches/${matchId.value}` : null)
    if (!dbPath) return
    if (roundsUnsub.value) {
      try { roundsUnsub.value() } catch (e) {}
      roundsUnsub.value = null
    }
    roundsUnsub.value = onDataChange(`${dbPath}/roundsplayed`, (val) => {
      try {
        if (!val) { roundsCount.value = 0; return }
        roundsCount.value = Object.keys(val).length
      } catch (err) { roundsCount.value = 0 }
    })
  } catch (e) { console.warn('loadRounds failed', e); roundsCount.value = 0 }
}

// trigger pop animation when wins change
watch(winsA, (nv, ov) => {
  if (nv !== ov) {
    animateA.value = true
    setTimeout(() => (animateA.value = false), 650)
  }
})
watch(winsB, (nv, ov) => {
  if (nv !== ov) {
    animateB.value = true
    setTimeout(() => (animateB.value = false), 650)
  }
})

let winsUnsub = null
async function loadWins() {
  try {
    const dbPath = (matchData.value && matchData.value.__dbPath) ? matchData.value.__dbPath : `matches/${matchId.value}`
    if (!dbPath) return
    if (winsUnsub) {
      try { winsUnsub() } catch (e) {}
      winsUnsub = null
    }
    winsUnsub = onDataChange(`${dbPath}/wins`, (val) => {
      winsA.value = (val && val.A) ? Number(val.A) : 0
      winsB.value = (val && val.B) ? Number(val.B) : 0
    })
  } catch (e) {
    console.warn('loadWins failed', e)
    winsA.value = 0
    winsB.value = 0
  }
}

onMounted(async () => {
  // start live users subscription first so enrichPlayers can resolve profile names
  subscribeUsers()
  // Ensure teams/matchData is resolved before subscribing to wins so we
  // subscribe to the correct (possibly nested) DB path.
  await loadTeams()
  await loadWins()
  // subscribe to persisted roundsplayed so header round number reflects DB
  await loadRounds()
})
onBeforeUnmount(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
  if (winsUnsub) {
    try { winsUnsub() } catch (e) {}
    winsUnsub = null
  }
  if (roundsUnsub && roundsUnsub.value) {
    try { roundsUnsub.value() } catch (e) {}
    roundsUnsub.value = null
  }
  if (usersUnsub) { try { usersUnsub() } catch (e) {} ; usersUnsub = null }
})
</script>

<style scoped>


.team-players-row { display:flex; gap:20px; padding-top:18px; align-items:center; flex-wrap:wrap; }
.team-player { display:flex; flex-direction:column; align-items:center; width:120px; }
.avatar-wrap { width:84px; height:84px; display:flex; align-items:center; justify-content:center; }
.avatar-img { width:84px; height:84px; border-radius:50%; border:4px solid #ffad1d; object-fit:cover; }
.player-username { margin-top:8px; color:#ffad1d; font-weight:700; text-align:center; word-break:break-word; }

/* copy of MatchRoom timer & team styles so RoundStarted visually matches */
.matchroom-container { background: #10121A; color: #fff; min-height: 100vh; padding: 32px; }
header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.back-btn { border:none; background:#B23B3B; color:#fff; border-radius:8px; padding:9px 18px; font-weight:700; }

.players-row { display:flex; gap:18px; padding-top:12px; flex-wrap:wrap; align-items:center; }
.player-tile { display:flex; align-items:center; gap:14px; padding:10px 0; }
.avatar-wrap { width:60px; height:60px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.avatar-img { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; object-fit:cover; }
.avatar-fallback { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#ffad1d; font-weight:700; font-size:1rem; }
.player-username { color:#ffad1d; font-weight:700; font-size:1rem; }
.player-name { margin-top:8px; color: #ffad1d; font-weight:700; font-size:0.95rem; text-align:center; }

/* Timer card */
.center-timer { display:flex; justify-content:center; margin: 18px 0 26px; }
.timer-card {
  width: 560px;
  background: linear-gradient(180deg, rgba(255,173,29,0.06), rgba(0,0,0,0.08));
  border: 1px solid rgba(255,173,29,0.12);
  padding: 16px 20px;
  border-radius: 12px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
}
.timer-header { color:#ffda99; font-weight:700; letter-spacing:0.6px; }
.timer-main { display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; }
.time-large { font-size:2.4rem; color:#ffad1d; font-weight:800; font-family: 'Helvetica Neue', Arial, sans-serif; text-align:center; }
.progress-wrap { width:90%; height:8px; background: rgba(255,255,255,0.06); border-radius:6px; overflow:hidden; }
.progress-bar { height:100%; background: linear-gradient(90deg,#ffad1d,#ffda99); width:0%; transition: width 0.4s linear; }
.timer-controls { display:flex; gap:8px; justify-content:center; width:100%; margin-top:4px; }

.btn, .btn-start, .btn-reset, .btn-end { padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-weight:700; }
.btn { background:#ffffff12; color:#fff; }
.btn-start { background:linear-gradient(90deg,#ffad1d,#ffda99); color:#0b0b0b; box-shadow:0 6px 18px rgba(255,173,29,0.12); }
.btn-reset { background:#3a3f45; color:#fff; }
.btn-end { background:#b23b3b; color:#fff; }

/* Timer setter */
.timer-setter-inline .setter-row { display:flex; flex-direction:column; gap:10px; width:100%; align-items:center; }
.time-inputs-inline { display:flex; align-items:center; gap:10px; }
.time-input { width:84px; padding:10px 12px; border-radius:8px; background:#16181c; color:#fff; border:1px solid rgba(255,255,255,0.06); font-size:1rem; text-align:center; }
.colon { color:#cfcfcf; font-weight:700; margin:0 4px; }
.btn-set-inline { padding:8px 14px; border-radius:10px; background:linear-gradient(90deg,#2b2f33,#23272b); color:#fff; border:1px solid rgba(255,255,255,0.04); font-weight:700; cursor:pointer; }
.preset-buttons-inline { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:6px; }
.preset { background:#111318; color:#fff; border:1px solid rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; }

/* Teams layout */
.teams-grid { display:flex; gap:34px; align-items:flex-start; justify-content:center; margin-top:8px; }
.team-card { min-width: 330px; flex: 1; border: 2.5px dashed #fff4d1; transition: border 0.3s; min-height: 260px; padding:18px; border-radius:18px; background:#23262e; }
.active-outline { border: 2.5px solid #ffad1d !important; }
.inactive-outline { border: 2.5px dashed #ededed !important; }
.winner-outline { border: 2.5px solid #2eb872 !important; box-shadow: 0 0 24px 8px rgba(46,184,114,0.12); }

.vertical-list { list-style:none; padding:12px 0 0 0; margin:0; display:flex; flex-direction:column; gap:14px; }
.vertical-player { display:flex; align-items:center; gap:14px; }
.avatar-img { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; object-fit:cover; }
.avatar-fallback { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#ffad1d; font-weight:700; font-size:1rem; }
.vertical-name { color:#ffad1d; font-weight:700; }

/* Winner UI */
.winner-buttons { display:flex; gap:12px; margin:12px 0; justify-content:center; }
.winnerBtn { background: #2eb872; color:#fff; padding:8px 12px; border-radius:8px; border:none; font-weight:700; }
.pick-txt { text-align:center; color:#f3e6c2; font-weight:700; margin-top:18px; }

.pulsate { animation: pulse-glow 1.1s ease-in-out infinite; transform-origin: center; }
@keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: scale(1); } 50% { box-shadow: 0 0 24px 6px rgba(255,173,29,0.20); transform: scale(1.02); } 100% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: scale(1); } }

/* Pulsing effect for the team cards while a round is active */
.pulsate-team { animation: team-pulse 1.2s ease-in-out infinite; transform-origin: center; }
@keyframes team-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: translateZ(0) scale(1); }
  40% { box-shadow: 0 0 28px 8px rgba(255,173,29,0.18); transform: translateZ(0) scale(1.01); }
  70% { box-shadow: 0 0 18px 4px rgba(255,173,29,0.12); transform: translateZ(0) scale(1.002); }
  100% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: translateZ(0) scale(1); }
}

.disabled-btn { background: linear-gradient(90deg,#4a4d52,#3b3d40) !important; color: #cfcfcf !important; opacity: 0.7; box-shadow: none !important; cursor: not-allowed !important; }

/* Wins chart (matchroom style) */
.wins-chart { max-width:700px; margin: 18px auto; }
.chart-row { display:flex; gap:28px; justify-content:center; align-items:end; }
.chart-item { display:flex; flex-direction:column; align-items:center; gap:8px; }
.bar-outer { width:120px; height:180px; background:rgba(255,255,255,0.03); border-radius:8px; display:flex; align-items:flex-end; overflow:hidden; border:1px solid rgba(255,255,255,0.03); }
.bar-inner { width:100%; background:linear-gradient(180deg,#ffad1d,#ffda99); transition:height 400ms ease; }
.bar-inner.bar-b { background:linear-gradient(180deg,#ff8a8a,#ff5a5a); }
.bar-inner.pop {
  animation: bar-pop 620ms cubic-bezier(.2,.9,.2,1);
  transform-origin: bottom center;
  box-shadow: 0 8px 24px rgba(255,173,29,0.10);
}
@keyframes bar-pop {
  0% { transform: scaleY(0.9); filter: blur(0px); }
  45% { transform: scaleY(1.06); }
  70% { transform: scaleY(0.98); }
  100% { transform: scaleY(1); filter: blur(0px); }
}
.bar-label { color:#f3e6c2; font-weight:700; }
.wins-title { text-align:center; margin-top:8px; color:#ffda99; font-size:2.6rem; font-weight:800; }
.bar-count { color:#fff; font-weight:900; font-size:2rem; margin-top:10px; }
</style>