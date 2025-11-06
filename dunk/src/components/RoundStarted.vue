<template>
  <div class="matchroom-container">
    <!-- Normal Round View -->
    <div>
    <header>
      <button v-if="isHost" @click.stop.prevent="goBack" class="back-btn" :disabled="roundEverStarted" style="z-index: 100; position: relative;">← Back</button>
      <button v-else @click="closePlayerView" class="close-btn" aria-label="Close" :disabled="roundActive">✕</button>
      <h1 class="matchroom-title">Round #{{ displayTitle }}</h1>
      <div></div>
    </header>
    <div class="title-actions" style="text-align: center;">
      <button @click="showSummary = true" class="summary-btn">Match Summary</button>
    </div>

    <!-- Centered Timer Card (same look / behavior as MatchRoom) -->
    <div class="center-timer">
      <div class="timer-card">
        <div class="timer-header">Round Timer</div>

        <div class="timer-main">
          <div class="timer-setter-inline" v-if="isHost && !timerSet && !roundActive && !roundFinished">
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

  <div class="timer-controls" v-if="isHost">
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
          <button class="btn-end" v-if="roundActive" @click.prevent.stop="requestEndRound">End Round</button>
        </div>
      </div>
    </div>

    <!-- Teams vertical boxes (same visual style as MatchRoom) -->
    <section class="teams-grid">
  <div :class="['team-card', teamAOutlineClass, { 'pulsate-team': teamPulseActive }]" @click="isHost && roundFinished && selectWinner('A')" :aria-disabled="!roundFinished">
    <h2>Team A</h2>
    <div class="team-drop-list">
      <div v-for="p in teamA" :key="p.uid" class="player-avatar" @click.stop="openProfileModal(p.uid)" style="cursor: pointer;">
        <div class="player-left">
          <div class="avatar-block">
            <template v-if="displayAvatarFor(p)">
              <img :src="displayAvatarFor(p)" class="avatar-img" :alt="displayNameFor(p)" />
            </template>
            <template v-else>
              <div class="avatar-fallback">{{ initials(displayNameFor(p)) }}</div>
            </template>
            <div class="player-sub">Total: {{ displayTotalWinsForUid(p.uid) }}</div>
          </div>
          <div class="player-name">{{ displayNameFor(p) }}</div>
        </div>
        <div class="player-wins">🏆 {{ displayMatchWinsForUid(p.uid) }}</div>
      </div>
    </div>
  </div>

  <div :class="['team-card', teamBOutlineClass, { 'pulsate-team': teamPulseActive }]" @click="isHost && roundFinished && selectWinner('B')" :aria-disabled="!roundFinished">
    <h2>Team B</h2>
    <div class="team-drop-list">
      <div v-for="p in teamB" :key="p.uid" class="player-avatar" @click.stop="openProfileModal(p.uid)" style="cursor: pointer;">
        <div class="player-left">
          <div class="avatar-block">
            <template v-if="displayAvatarFor(p)">
              <img :src="displayAvatarFor(p)" class="avatar-img" :alt="displayNameFor(p)" />
            </template>
            <template v-else>
              <div class="avatar-fallback">{{ initials(displayNameFor(p)) }}</div>
            </template>
            <div class="player-sub">Total: {{ displayTotalWinsForUid(p.uid) }}</div>
          </div>
          <div class="player-name">{{ displayNameFor(p) }}</div>
        </div>
        <div class="player-wins">🏆 {{ displayMatchWinsForUid(p.uid) }}</div>
      </div>
    </div>
  </div>
</section>



    <!-- Winner selection after round ended (host only) -->
    <section v-if="isHost && !roundActive && roundFinished" class="winner-section">
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

    <!-- Non-host view: Show selected winner (read-only) -->
    <section v-if="!isHost && !roundActive && roundFinished && selectedWinner" class="winner-section">
      <p class="pick-txt">Host selected winning team:</p>
      <div class="winner-display">
        <div :class="['winner-indicator', { 'winner-team-a': selectedWinner === 'A', 'winner-team-b': selectedWinner === 'B' }]">
          Team {{ selectedWinner }}
        </div>
      </div>
      <p class="waiting-txt">Waiting for host to confirm...</p>
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
  <!-- Rounds History (always visible for players) -->
    <section class="rounds-history">
      <h2 class="rounds-history-header">Rounds History</h2>
      <div v-if="!rounds || rounds.length === 0" class="rounds-empty">
        No rounds played yet.
      </div>
      <div v-else class="round-list">
        <div v-for="(r, idx) in rounds" :key="r.key || idx" class="round-card">
          <div class="round-card-header">
            <span class="round-index">Round {{ rounds.length - idx }}</span>
            <span class="round-time">{{ formatDate(r.endedAt) }}</span>
            <span class="round-duration">{{ formatDuration(r.duration) }}</span>
          </div>
          <div class="round-teams">
            <div class="round-team">
              <div class="round-team-label">Team A</div>
              <div class="round-team-roster">
                <div v-for="uid in (r.teamA || [])" :key="uid" class="round-player" @click="openProfileModal(uid)" style="cursor: pointer;">
                  <div class="round-avatar">
                    <img v-if="displayAvatarFor(uid)" :src="displayAvatarFor(uid)" class="round-avatar-img" :alt="displayNameFor(uid)" />
                    <div v-else class="round-avatar-fallback">{{ initials(displayNameFor(uid)) }}</div>
                  </div>
                  <div class="round-player-name">{{ displayNameFor(uid) }}</div>
                  <div class="round-player-stats">
                    <span class="stat-total">Total: {{ displayTotalWinsForUid(uid) }}</span>
                    <span class="stat-trophy">🏆 {{ displayMatchWinsForUid(uid) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="round-team">
              <div class="round-team-label">Team B</div>
              <div class="round-team-roster">
                <div v-for="uid in (r.teamB || [])" :key="uid" class="round-player" @click="openProfileModal(uid)" style="cursor: pointer;">
                  <div class="round-avatar">
                    <img v-if="displayAvatarFor(uid)" :src="displayAvatarFor(uid)" class="round-avatar-img" :alt="displayNameFor(uid)" />
                    <div v-else class="round-avatar-fallback">{{ initials(displayNameFor(uid)) }}</div>
                  </div>
                  <div class="round-player-name">{{ displayNameFor(uid) }}</div>
                  <div class="round-player-stats">
                    <span class="stat-total">Total: {{ displayTotalWinsForUid(uid) }}</span>
                    <span class="stat-trophy">🏆 {{ displayMatchWinsForUid(uid) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="r.winningTeam" class="round-winner">
            Winner: Team {{ r.winningTeam }} ({{ winnersLabel(r) }})
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
  <!-- Teleport ConfirmModal for End Round -->
  <Teleport to="body">
    <ConfirmModal
      v-if="showEndConfirm"
      v-model="showEndConfirm"
      :title="endConfirm.title"
      :message="endConfirm.message"
      confirmLabel="YES"
      cancelLabel="Cancel"
      :primaryFirst="true"
      :destructive="false"
      @confirm="onEndConfirm"
    />
    <EndMatchSummary 
      v-if="showEndSummary" 
      :dbPath="(matchData && matchData.__dbPath) || (matchId ? `matches/${matchId}` : null)" 
      :matchData="matchData" 
      @close="onEndSummaryClose"
      @post-to-forum="onPostMatchToForum"
      @cancel-navigate="onCancelSummary"
    />
    <EndMatchSummary 
      v-if="showSummary" 
      :dbPath="(matchData && matchData.__dbPath) || (matchId ? `matches/${matchId}` : null)" 
      :matchData="matchData" 
      compact 
      @close="onCloseSummaryCompact"
      @cancel-navigate="onCancelSummaryCompact"
    />
    <ProfileModal v-if="showProfileModal" :uid="profileModalUid" :initialProfile="profileModalInitial" @close="closeProfileModal" />
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, Teleport, inject } from 'vue'
import { avatarForUser } from '../utils/avatar.js'
import { useRoute, useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, deleteChildData, onDataChange, incrementField, getUserName } from '../firebase/firebase'
import ConfirmModal from './ConfirmModal.vue'
import EndMatchSummary from './EndMatchSummary.vue'
import ProfileModal from './ProfileModal.vue'
import { onUserStateChanged } from '../firebase/auth'

const route = useRoute()
const router = useRouter()
const matchId = computed(() => route.params.id)

// Inject sidebar disable function from App.vue
const setSidebarDisabled = inject('setSidebarDisabled', null)

// detect player nested child route the same way MatchRoom does
const isPlayerView = computed(() => String(route.name) === 'PlayerRoom' || String(route.path || '').endsWith('/player'))

async function closePlayerView() {
  console.log('closePlayerView invoked - navigating to Matches list')
  try {
    await router.push({ path: '/matches', query: { tab: 'all' } })
  } catch (e) {
    console.warn('router.push to /matches failed, trying fallback', e)
    try {
      await router.push('/matches')
    } catch (e2) {
      console.warn('All navigation attempts failed', e2)
      try { router.back() } catch (_) { /* no-op */ }
    }
  }
}

const matchData = ref({})
// live users map so we can display canonical profile names
const usersMap = ref({})
let usersUnsub = null

// auth state so we can determine whether the current client is the host
const currentUser = ref(null)
onUserStateChanged((u) => { currentUser.value = u })

const isHost = computed(() => {
  try {
    if (!currentUser.value || !matchData.value) return false
    const owner = matchData.value.ownerId || matchData.value.ownerUid || matchData.value.owner || matchData.value.createdby || matchData.value.host
    if (!owner) return false
    const uid = currentUser.value.uid
    if (owner === uid) return true
    const name = currentUser.value.displayName || currentUser.value.email || ''
    if (name && (owner === name || owner === currentUser.value.email)) return true
    return false
  } catch (e) { return false }
})

const isMatchEnded = computed(() => {
  try {
    if (!matchData.value) return false
    // Only show final results if matchEnded flag is explicitly set to true
    return matchData.value.matchEnded === true
  } catch (e) {
    return false
  }
})

function subscribeUsers() {
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
  return new Promise((resolve) => {
    try {
      let firstLoad = true
      usersUnsub = onDataChange('users', (val) => { 
        usersMap.value = val || {}
        if (firstLoad) {
          firstLoad = false
          console.log('subscribeUsers: initial load complete with', Object.keys(usersMap.value).length, 'users')
          resolve()
        }
      })
    } catch (e) { 
      console.warn('subscribeUsers failed', e)
      resolve() // resolve anyway to not block
    }
  })
}
const teamA = ref([])
const teamB = ref([])
const selectedWinner = ref(null)
const roundFinished = ref(false)
// teamsLocked mirrors MatchRoom behavior: when teams are confirmed, they are locked
const teamsLocked = ref(false)
const showSummary = ref(false)

// ProfileModal state
const showProfileModal = ref(false)
const profileModalUid = ref(null)
const profileModalInitial = ref(null)

function openProfileModal(target) {
  if (!target) return
  // allow either a uid string or an enriched player object
  if (typeof target === 'string') {
    profileModalUid.value = target
    profileModalInitial.value = null
  } else if (typeof target === 'object' && target) {
    const uid = target.uid || target.id || target.key || null
    if (!uid) return
    profileModalUid.value = uid
    // keep the enriched object (name/avatar) so modal can render immediately
    profileModalInitial.value = target
  } else {
    return
  }
  showProfileModal.value = true
}

function closeProfileModal() { 
  showProfileModal.value = false
  profileModalUid.value = null
  profileModalInitial.value = null
}

// Timer state (same behavior as MatchRoom)
const timerMinutes = ref(0)
const timerSeconds = ref(0)
const timerTotal = ref(0)
const timerRemaining = ref(0)
const timerSet = ref(false)
const timerInterval = ref(null)
const timerPaused = ref(false)
const roundActive = ref(false)
const roundEverStarted = ref(false) // Track if host has ever started a round

// Watch roundEverStarted to update sidebar disabled state
// Sidebar should be disabled once round has been started
watch(roundEverStarted, (everStarted) => {
  if (setSidebarDisabled) {
    setSidebarDisabled(everStarted)
  }
}, { immediate: true })

// Watch roundActive for non-hosts to sync state when auto-navigated
// When non-host is navigated to RoundStarted with active round, sync everything
watch(roundActive, (isActive) => {
  if (!isHost.value && isActive && !roundEverStarted.value) {
    console.log('Non-host: Round is active, syncing state')
    roundEverStarted.value = true // Disable sidebar and close button for non-host
    // Timer sync will be handled by subscribeRemoteTimer
  }
}, { immediate: true })

// modal state for End Round confirmation (use the same ConfirmModal as Matches.vue)
const showEndConfirm = ref(false)
const endConfirm = ref({ title: '', message: 'Are you sure you want to end this round?' })
const showEndSummary = ref(false)

function requestEndRound() {
  // set a contextual title that includes the current round number shown in the header
  try {
    endConfirm.value.title = `End Round #${displayTitle.value} now?`
  } catch (e) {
    endConfirm.value.title = 'End Round now?'
  }
  // Pause the timer immediately so the UI freezes at the exact minute/second
  try {
    if (roundActive.value && !timerPaused.value) pauseTimer()
  } catch (e) { /* ignore pause errors */ }
  showEndConfirm.value = true
}

function onEndConfirm() {
  // user confirmed via modal — proceed to end round without another prompt
  showEndConfirm.value = false
  endRound(false)
}
// remote timer sync fields (for non-host clients)
const remoteLastStartedAt = ref(null)
const remoteRoundDuration = ref(0)
let roundActiveUnsub = null
let lastStartedUnsub = null
let roundDurationUnsub = null
let timerPausedUnsub = null
let timerRemainingUnsub = null
// periodic resync to correct client drift (non-hosts only)
const resyncInterval = ref(null)
let teamsLockedUnsub = null
let recentAllocationNav = false // debounce guard to avoid rapid re-navigation
let prevTeamsLocked = null
let teamsUnsub = null // subscription for live team updates
let matchDataUnsub = null // subscription for matchEnded flag changes
let selectedWinnerUnsub = null // subscription for selectedWinner changes

const startEnabled = computed(() => {
  // If matchData hasn't been loaded yet, allow enabling so host navigation
  // that arrives with history state can still start the round immediately.
  const mdLoaded = matchData.value && Object.keys(matchData.value).length > 0
  return timerSet.value && teamA.value.length && teamB.value.length && (!mdLoaded || isHost.value)
})
const startShouldPulse = computed(() => startEnabled.value && !roundActive.value)

// validate inputs for the inline setter (same as MatchRoom)
const validTimerInput = computed(() => {
  const m = Number(timerMinutes.value) || 0
  const s = Number(timerSeconds.value) || 0
  return (m > 0 || s > 0) && s >= 0 && s < 60
})

// pulse the Set/presets to encourage setting a timer once teams are locked
const setShouldPulse = computed(() => teamsLocked.value && !timerSet.value && !roundFinished.value && !roundActive.value)
const timerControlsDisabled = computed(() => {
  // Only disable timer controls for non-hosts after matchData is present
  const mdLoaded = matchData.value && Object.keys(matchData.value).length > 0
  return roundActive.value || roundFinished.value || (mdLoaded && !isHost.value)
})

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

const teamAOutlineClass = computed(() => {
  if (!teamA.value.length) return 'inactive-outline'
  // Both hosts and non-hosts see green outline when winner is selected (live sync)
  if (selectedWinner.value === 'A') return 'winner-outline'
  return 'active-outline'
})
const teamBOutlineClass = computed(() => {
  if (!teamB.value.length) return 'inactive-outline'
  // Both hosts and non-hosts see green outline when winner is selected (live sync)
  if (selectedWinner.value === 'B') return 'winner-outline'
  return 'active-outline'
})

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
  // Use the live usersMap subscription if available, otherwise fetch
  const users = (usersMap.value && Object.keys(usersMap.value).length) ? usersMap.value : await getUsersMap()
  console.log('enrichPlayers: usersMap has', Object.keys(users).length, 'users')
  console.log('enrichPlayers: input list', list)
  const result = list
    .map(item => {
      // allow either uid string or player object
      const p = typeof item === 'string' ? { uid: item } : (item || {})
      const uid = p.uid || p.id || p.key || ''
      if (!uid) return null

      const resolved = users[uid] || {}
      console.log('enrichPlayers: enriching uid', uid, 'resolved:', resolved)
      const name = p.name || resolved.name || resolved.displayName || resolved.username || uid

      // prefer profile image fields from the users record (match MatchRoom behavior)
      const avatar =
        p.avatar ||
        p.photoURL ||
        resolved.avatar ||
        resolved.photoURL ||
        resolved.picture ||
        resolved.photo ||
        resolved.profilepicture ||
        (resolved.profile && (resolved.profile.avatar || resolved.profile.picture)) ||
        resolved.imageURL ||
        resolved.thumbnail ||
        null

      // only generate fallback if no profile/avatar exists - use centralized helper
      let finalAvatar = avatar
      if (!finalAvatar) {
        finalAvatar = avatarForUser({ uid, name, gender: resolved.gender, photoURL: avatar })
      }

      console.log('enrichPlayers: result for', uid, ':', { uid, name, avatar: finalAvatar })
      return { uid, name, avatar: finalAvatar }
    })
    .filter(Boolean)
  console.log('enrichPlayers: final result', result)
  return result
}

// timer functions (same as MatchRoom)
function applyPreset(seconds) {
  timerMinutes.value = Math.floor(seconds / 60)
  timerSeconds.value = seconds % 60
  setTimer()
}

async function setTimer() {
  const m = Number(timerMinutes.value) || 0
  const s = Number(timerSeconds.value) || 0
  const total = m * 60 + s
  if (!total) return
  timerTotal.value = total
  timerRemaining.value = total
  timerSet.value = true
  timerPaused.value = false
  
  // Persist the set timer to Firebase so non-hosts can see it
  if (isHost.value) {
    try {
      const dbPath = await resolveMatchDbPath()
      if (dbPath) {
        await setChildData(dbPath, 'roundDuration', total)
        await setChildData(dbPath, 'timerRemaining', total)
        console.log('Host set timer to', total, 'seconds, persisted to Firebase')
      }
    } catch (e) {
      console.warn('Failed to persist timer set', e)
    }
  }
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

async function pauseTimer() { 
  timerPaused.value = true 
  // Persist pause state to Firebase so non-hosts see the pause
  if (isHost.value) {
    try {
      const dbPath = await resolveMatchDbPath()
      if (dbPath) {
        await setChildData(dbPath, 'timerPaused', true)
        // Also persist the current remaining time so non-hosts sync to exact time
        await setChildData(dbPath, 'timerRemaining', timerRemaining.value)
        console.log('Host paused timer, persisted to Firebase:', timerRemaining.value)
      }
    } catch (e) {
      console.warn('Failed to persist timer pause', e)
    }
  }
}

async function resumeTimer() { 
  if (!timerSet.value) return
  timerPaused.value = false
  // Persist resume state to Firebase so non-hosts see the resume
  if (isHost.value) {
    try {
      const dbPath = await resolveMatchDbPath()
      if (dbPath) {
        await setChildData(dbPath, 'timerPaused', false)
        // Calculate virtual start time: current time minus already elapsed time
        // This ensures syncTimerFromServer calculates the correct remaining time
        const alreadyElapsed = timerTotal.value - timerRemaining.value
        const virtualStartTime = new Date(Date.now() - (alreadyElapsed * 1000)).toISOString()
        await setChildData(dbPath, 'lastRoundStartedAt', virtualStartTime)
        // Persist current remaining time for immediate sync
        await setChildData(dbPath, 'timerRemaining', timerRemaining.value)
        console.log('Host resumed timer, remaining:', timerRemaining.value, 'virtualStart:', virtualStartTime)
      }
    } catch (e) {
      console.warn('Failed to persist timer resume', e)
    }
  }
}

async function resetTimer() {
  if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
  timerRemaining.value = 0
  timerPaused.value = false
  timerSet.value = false
  timerMinutes.value = 0
  timerSeconds.value = 0
  timerTotal.value = 0
  
  // Persist timer reset to Firebase so non-hosts see it
  if (isHost.value) {
    try {
      const dbPath = await resolveMatchDbPath()
      if (dbPath) {
        await setChildData(dbPath, 'timerRemaining', 0)
        await setChildData(dbPath, 'roundDuration', 0)
        await setChildData(dbPath, 'timerPaused', false)
        await setChildData(dbPath, 'roundActive', false)
        console.log('Host reset timer, persisted to Firebase')
      }
    } catch (e) {
      console.warn('Failed to persist timer reset', e)
    }
  }
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

  // persist that the round is no longer active AND reset timer fields so other clients reflect the restart
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      try { await setChildData(dbPath, 'roundActive', false) } catch (e) {}
      try { await setChildData(dbPath, 'timerRemaining', 0) } catch (e) {}
      try { await setChildData(dbPath, 'roundDuration', 0) } catch (e) {}
      try { await setChildData(dbPath, 'timerPaused', false) } catch (e) {}
      console.log('Host restarted round, reset timer in Firebase')
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
  roundEverStarted.value = true // Mark that a round has been started
  roundFinished.value = false
  selectedWinner.value = null // Clear previous winner selection
  // start the local timer so this view remains the active controller
  startTimer()
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', true)
      // persist duration so other clients can mirror the countdown
  try { await setChildData(dbPath, 'roundDuration', Number(timerTotal.value) || 0) } catch (e) { /* non-fatal */ }
      await setChildData(dbPath, 'lastRoundStartedAt', new Date().toISOString())
      // Clear selectedWinner in Firebase so non-hosts also reset
      await setChildData(dbPath, 'selectedWinner', null)
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

async function selectWinner(team) {
  selectedWinner.value = team
  // Persist selected winner to Firebase so non-hosts can see it
  if (isHost.value) {
    try {
      const dbPath = await resolveMatchDbPath()
      if (dbPath) {
        await setChildData(dbPath, 'selectedWinner', team)
        console.log('Host selected winner:', team, 'persisted to Firebase')
      }
    } catch (e) {
      console.warn('Failed to persist selectedWinner', e)
    }
  }
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
  // Clear roundActive and teamsLocked flags so teams are unlocked for next round
  try { await setChildData(dbPath, 'roundActive', false) } catch (e) { /* non-fatal */ }
  try { await setChildData(dbPath, 'teamsLocked', false) } catch (e) { /* non-fatal */ }
  // Reset timer fields to 0 so non-hosts see timer at 0:00 until host sets new timer
  try { 
    await setChildData(dbPath, 'timerRemaining', 0)
    await setChildData(dbPath, 'roundDuration', 0)
    await setChildData(dbPath, 'timerPaused', false)
    console.log('Timer reset to 0 for next round')
  } catch (e) { console.warn('Failed to reset timer', e) }
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

  // Clear selectedWinner locally and in Firebase before navigating
  selectedWinner.value = null
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'selectedWinner', null)
    }
  } catch (e) { /* ignore */ }

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
  
  // Directly end the match without confirmation dialog
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
      await setChildData(dbPath, 'matchEnded', true) // Add this flag for non-hosts to detect

      // update local cache so UI reacts immediately
      try { matchData.value = { ...(matchData.value || {}), started: false, roundActive: false, lastRoundEndedAt: nowIso, endedAt: nowIso, endAtISO: nowIso, status: 'ended', matchEnded: true } } catch (_) {}
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

  // Clear selectedWinner locally and in Firebase before showing end summary
  selectedWinner.value = null
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'selectedWinner', null)
    }
  } catch (e) { /* ignore */ }

  // show the end-of-match summary modal so the host can review final stats
  try {
    showEndSummary.value = true
    return
  } catch (err) {
    // fallback to matches list if modal cannot be shown
    try { await router.push({ path: '/matches' }) } catch (_) {}
  }
}

// load persisted teams from DB and enrich players
async function loadTeams() {
  try {
    // 1) First check if a specific path was provided via route query (from auto-navigation)
    let data = null
    let dbPath = null
    
    if (route && route.query && route.query.path) {
      dbPath = decodeURIComponent(route.query.path)
      console.log('Loading match data from query path:', dbPath)
      data = await getDataFromFirebase(dbPath)
      if (data) {
        matchData.value = { ...(data || {}), __dbPath: dbPath }
        console.log('Match data loaded from query path, roundsplayed count:', data.roundsplayed ? Object.keys(data.roundsplayed).length : 0)
      }
    }
    
    // 2) If not provided via query, try the canonical path
    if (!data) {
      const directPath = `matches/${matchId.value}`
      data = await getDataFromFirebase(directPath)
      // if direct read returned something, keep the exact dbPath for round -> match navigation
      if (data) {
        matchData.value = { ...(data || {}), __dbPath: directPath }
      }
    }

    // 3) If not found, allow teams to be provided via router history state or query (MatchRoom can push these)
    if ((!data || !data.teams)) {
      const historyState = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : null
      if (historyState && historyState.teams) {
        const teams = historyState.teams
        const rawA = Array.isArray(teams.teamA) ? teams.teamA : normalizePlayers(teams.teamA)
        const rawB = Array.isArray(teams.teamB) ? teams.teamB : normalizePlayers(teams.teamB)
        teamA.value = await enrichPlayers(rawA)
        teamB.value = await enrichPlayers(rawB)
        // preserve match path and owner if provided by MatchRoom via history state
        if (historyState.matchPath) {
          matchData.value = { __dbPath: historyState.matchPath }
          if (historyState.owner) {
            // attach owner to local matchData so isHost can compute immediately
            try { matchData.value.ownerId = historyState.owner } catch (e) {}
          }
        }
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

function formatDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch (e) { return String(iso) }
}

function formatDuration(sec) {
  if (!sec && sec !== 0) return '—'
  const s = Number(sec) || 0
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

function sanitizeUserKey(uname) {
  if (!uname) return String(uname || '').replace(/[.$#\[\]\/]/g, '_')
  return String(uname).replace(/[.$#\[\]\/]/g, '_')
}

// Return match-scoped wins for UI pills: prefer WinsByEachPlayer (username-keyed)
// then per-match playersMap.NumberOfWins. DO NOT fall back to users.wins here.
function displayMatchWinsForUid(uid) {
  if (!uid) return 0
  const u = usersMap.value && usersMap.value[uid]
  const uname = (u && (u.username || u.name || u.displayName)) || uid
  const safe = sanitizeUserKey(uname)
  if (winsByEachPlayer.value && typeof winsByEachPlayer.value[safe] !== 'undefined') return Number(winsByEachPlayer.value[safe] || 0)
  const pm = playersMap.value && playersMap.value[uid]
  if (pm && typeof pm.NumberOfWins !== 'undefined') return Number(pm.NumberOfWins || 0)
  return 0
}

// Return user's aggregate total wins (from users/<uid>/totalWins)
function displayTotalWinsForUid(uid) {
  if (!uid) return 0
  const u = usersMap.value && usersMap.value[uid]
  if (u && typeof u.totalWins !== 'undefined') return Number(u.totalWins || 0)
  return 0
}

function winnersLabel(r) {
  if (!r || !r.winningTeamMembers) return '—'
  return r.winningTeamMembers.map(uid => displayNameFor(uid)).join(', ')
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
  console.log('goBack called - roundEverStarted:', roundEverStarted.value, 'matchId:', matchId.value)
  
  if (roundEverStarted.value) {
    console.log('Cannot go back - round has been started!')
    return
  }
  
  // Preserve current allocations in history state so MatchRoom can restore
  // them immediately when the user navigates back.
  const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
  const state = {
    teams: {
      teamA: (teamA.value || []).map(p => (p && p.uid) ? p.uid : (p && p.id) ? p.id : p),
      teamB: (teamB.value || []).map(p => (p && p.uid) ? p.uid : (p && p.id) ? p.id : p)
    }
  }
  // Pass roundActive state so MatchRoom knows whether to lock teams
  state.roundActive = roundActive.value
  // indicate this is a manual restore (user pressed Back) so MatchRoom will
  // restore the visual allocations
  state.restore = true
  if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
  console.log('Navigating to MatchRoom with params:', { id: matchId.value }, 'query:', query, 'state:', state)
  
  router.push({ name: 'MatchRoom', params: { id: matchId.value }, query, state })
}

function onEndSummaryClose() {
  showEndSummary.value = false
  try {
    router.push('/matches')
  } catch (e) {
    try { router.back() } catch (_) { /* ignore */ }
  }
}

function onPostMatchToForum() {
  // Navigate to forum with prefilled data
  const courtName = matchData.value?.court || matchData.value?.venue || matchData.value?.location || 'Unknown Court'
  const matchTitle = matchData.value?.title || matchData.value?.name || 'Match'
  const matchPath = matchData.value?.__dbPath || (matchId.value ? `matches/${matchId.value}` : '')
  
  try {
    router.push({
      path: '/forum',
      query: {
        openCreate: '1',
        court: encodeURIComponent(courtName),
        tag: 'Matches',
        matchId: matchPath,
        matchTitle: encodeURIComponent(matchTitle)
      }
    })
  } catch (e) {
    console.error('Failed to navigate to forum:', e)
  }
}

function onCancelSummary() {
  console.log('RoundStarted.vue: onCancelSummary called, closing modal and navigating to matches')
  showEndSummary.value = false
  // Navigate to Past Matches section
  try {
    router.push({ path: '/matches', query: { section: 'past' } })
  } catch (e) {
    try { router.push('/matches') } catch (err) { /* ignore */ }
  }
}

function onCloseSummaryCompact() {
  console.log('RoundStarted.vue: onCloseSummaryCompact called (X button on compact modal)')
  showSummary.value = false
  // Navigate to Matches page
  try {
    router.push({ path: '/matches', query: { section: 'past' } })
  } catch (e) {
    try { router.push('/matches') } catch (err) { /* ignore */ }
  }
}

function onCancelSummaryCompact() {
  console.log('RoundStarted.vue: onCancelSummaryCompact called (Cancel button on compact modal)')
  showSummary.value = false
  // Navigate to Matches page
  try {
    router.push({ path: '/matches', query: { section: 'past' } })
  } catch (e) {
    try { router.push('/matches') } catch (err) { /* ignore */ }
  }
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

// Additional refs needed for rounds history helper functions
const winsByEachPlayer = ref({})
const playersMap = ref({})

// display title / round number shown in header (header already prints "Round — {{ displayTitle }}")
// We track the number of persisted rounds (roundsplayed) under the match node so
// the upcoming round number is (existingRounds + 1). If roundsplayed is not
// present yet, fall back to any legacy `rounds` node or default to 1.
const roundsCount = ref(0)
const roundsUnsub = ref(null)
const rounds = ref([]) // full rounds data for history display

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
        if (!val) { 
          roundsCount.value = 0
          rounds.value = []
          return 
        }
        roundsCount.value = Object.keys(val).length
        // Build full rounds array sorted by timestamp descending
        rounds.value = Object.entries(val)
          .map(([key, round]) => ({
            ...round,
            key
          }))
          .sort((a, b) => {
            const timeA = a.endedAt ? new Date(a.endedAt).getTime() : 0
            const timeB = b.endedAt ? new Date(b.endedAt).getTime() : 0
            return timeB - timeA // most recent first
          })
      } catch (err) { 
        roundsCount.value = 0
        rounds.value = []
      }
    })
  } catch (e) { console.warn('loadRounds failed', e); roundsCount.value = 0; rounds.value = [] }
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
let playersMapUnsub = null
let winsByEachPlayerUnsub = null
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
    // subscribe to playersMap so we can display per-match NumberOfWins live
    try {
      if (playersMapUnsub) { try { playersMapUnsub() } catch (e) {} ; playersMapUnsub = null }
      playersMapUnsub = onDataChange(`${dbPath}/playersMap`, (val) => {
        playersMap.value = val || {}
      })
    } catch (e) { console.warn('playersMap subscribe failed', e) }
    // subscribe to WinsByEachPlayer so we can show username-keyed match wins live
    try {
      if (winsByEachPlayerUnsub) { try { winsByEachPlayerUnsub() } catch (e) {} ; winsByEachPlayerUnsub = null }
      winsByEachPlayerUnsub = onDataChange(`${dbPath}/WinsByEachPlayer`, (val) => {
        winsByEachPlayer.value = val || {}
      })
    } catch (e) { console.warn('WinsByEachPlayer subscribe failed', e) }
  } catch (e) {
    console.warn('loadWins failed', e)
    winsA.value = 0
    winsB.value = 0
  }
}

onMounted(async () => {
  // start live users subscription first and wait for initial load
  // so enrichPlayers can resolve profile names
  await subscribeUsers()
  console.log('onMounted: subscribeUsers complete, usersMap has', Object.keys(usersMap.value || {}).length, 'users')
  // Ensure teams/matchData is resolved before subscribing to wins so we
  // subscribe to the correct (possibly nested) DB path.
  await loadTeams()
  console.log('onMounted: loadTeams complete, matchData.__dbPath:', matchData.value?.__dbPath)
  await loadWins()
  // subscribe to persisted roundsplayed so header round number reflects DB
  await loadRounds()
  console.log('onMounted: loadRounds complete, roundsCount:', roundsCount.value)
  // start remote timer subscription so non-host clients mirror host timer
  try {
    const dbPath = matchData.value && matchData.value.__dbPath ? matchData.value.__dbPath : (matchId.value ? `matches/${matchId.value}` : null)
    console.log('onMounted: Setting up subscriptions for dbPath:', dbPath, 'isHost:', isHost.value)
    if (dbPath) {
      subscribeRemoteTimer(dbPath)
      try { subscribeTeamsLocked(dbPath) } catch (e) { /* ignore */ }
      try { subscribeToTeams(dbPath) } catch (e) { /* ignore */ }
      try { subscribeMatchData(dbPath) } catch (e) { /* ignore */ }
      try { subscribeSelectedWinner(dbPath) } catch (e) { /* ignore */ }
      console.log('onMounted: All subscriptions set up successfully')
    }
  } catch (e) { console.error('onMounted: Subscription setup failed', e) }
})

// Watch for match end to show summary modal for all users
watch(() => matchData.value?.matchEnded, (newVal, oldVal) => {
  if (newVal === true && oldVal !== true) {
    console.log('Match ended detected, showing summary modal')
    showEndSummary.value = true
  }
})

onBeforeUnmount(() => {
  // Re-enable sidebar when leaving RoundStarted component
  if (setSidebarDisabled) {
    setSidebarDisabled(false)
  }
  
  if (timerInterval.value) clearInterval(timerInterval.value)
  if (winsUnsub) {
    try { winsUnsub() } catch (e) {}
    winsUnsub = null
  }
  if (playersMapUnsub) {
    try { playersMapUnsub() } catch (e) {}
    playersMapUnsub = null
  }
  if (winsByEachPlayerUnsub) {
    try { winsByEachPlayerUnsub() } catch (e) {}
    winsByEachPlayerUnsub = null
  }
  if (roundsUnsub && roundsUnsub.value) {
    try { roundsUnsub.value() } catch (e) {}
    roundsUnsub.value = null
  }
  if (usersUnsub) { try { usersUnsub() } catch (e) {} ; usersUnsub = null }
  if (roundActiveUnsub) { try { roundActiveUnsub() } catch (e) {} ; roundActiveUnsub = null }
  if (lastStartedUnsub) { try { lastStartedUnsub() } catch (e) {} ; lastStartedUnsub = null }
  if (roundDurationUnsub) { try { roundDurationUnsub() } catch (e) {} ; roundDurationUnsub = null }
  if (timerPausedUnsub) { try { timerPausedUnsub() } catch (e) {} ; timerPausedUnsub = null }
  if (timerRemainingUnsub) { try { timerRemainingUnsub() } catch (e) {} ; timerRemainingUnsub = null }
  if (resyncInterval.value) { try { clearInterval(resyncInterval.value) } catch (e) {} ; resyncInterval.value = null }
  if (teamsLockedUnsub) { try { teamsLockedUnsub() } catch (e) {} ; teamsLockedUnsub = null }
  if (teamsUnsub) { try { teamsUnsub() } catch (e) {} ; teamsUnsub = null }
  if (matchDataUnsub) { try { matchDataUnsub() } catch (e) {} ; matchDataUnsub = null }
  if (selectedWinnerUnsub) { try { selectedWinnerUnsub() } catch (e) {} ; selectedWinnerUnsub = null }
  recentAllocationNav = false
})

function subscribeRemoteTimer(dbPath) {
  try {
    if (roundActiveUnsub) { try { roundActiveUnsub() } catch (e) {} ; roundActiveUnsub = null }
    if (lastStartedUnsub) { try { lastStartedUnsub() } catch (e) {} ; lastStartedUnsub = null }
    if (roundDurationUnsub) { try { roundDurationUnsub() } catch (e) {} ; roundDurationUnsub = null }
    if (timerPausedUnsub) { try { timerPausedUnsub() } catch (e) {} ; timerPausedUnsub = null }
    if (timerRemainingUnsub) { try { timerRemainingUnsub() } catch (e) {} ; timerRemainingUnsub = null }

    roundActiveUnsub = onDataChange(`${dbPath}/roundActive`, (val) => {
      try {
        // boolean
        const wasActive = roundActive.value
        roundActive.value = !!val
        
        // For HOST: Restore timer state when returning to this component
        if (isHost.value && roundActive.value && !wasActive) {
          console.log('Host: Restoring timer state from Firebase on component mount')
          // Don't call syncTimerFromServer here - let the other subscriptions handle it
          // Just ensure we have a running interval if round is active and not paused
          setTimeout(() => {
            if (roundActive.value && !timerPaused.value && !timerInterval.value && timerRemaining.value > 0) {
              console.log('Host: Restarting timer interval from remaining:', timerRemaining.value)
              // Restart the interval without resetting the remaining time
              if (timerInterval.value) clearInterval(timerInterval.value)
              timerInterval.value = setInterval(() => {
                if (timerPaused.value) return
                if (timerRemaining.value > 0) {
                  timerRemaining.value -= 1
                } else {
                  clearInterval(timerInterval.value)
                  timerInterval.value = null
                  roundActive.value = false
                  roundFinished.value = true
                  timerSet.value = false
                }
              }, 1000)
            }
          }, 200) // Small delay to let other subscriptions sync first
        }
        
        // when round becomes active, ensure we sync timer from server
        if (roundActive.value && !isHost.value) {
          // Delay sync slightly to ensure lastRoundStartedAt and roundDuration are loaded
          setTimeout(() => {
            if (roundActive.value) {
              console.log('Non-host: Syncing timer from server after roundActive=true')
              syncTimerFromServer()
            }
          }, 200)
          // start a periodic resync every 15s to correct drift
          try {
            if (!resyncInterval.value) {
              resyncInterval.value = setInterval(() => {
                try { syncTimerFromServer() } catch (e) { /* ignore */ }
              }, 15000)
            }
          } catch (e) {}
        } else if (!roundActive.value && !isHost.value) {
          // clear local interval for non-host
          if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
          if (resyncInterval.value) { clearInterval(resyncInterval.value); resyncInterval.value = null }
        }
      } catch (e) { console.warn('roundActive handler failed', e) }
    })

    lastStartedUnsub = onDataChange(`${dbPath}/lastRoundStartedAt`, (val) => {
      remoteLastStartedAt.value = val || null
      // Only sync for non-host - host uses direct timerRemaining sync
      if (!isHost.value && remoteLastStartedAt.value && remoteRoundDuration.value) {
        syncTimerFromServer()
      }
      // ensure resync loop is active if roundActive is already true (non-host only)
      try {
        if (roundActive.value && !isHost.value && !resyncInterval.value) {
          resyncInterval.value = setInterval(() => {
            try { syncTimerFromServer() } catch (e) { /* ignore */ }
          }, 15000)
        }
      } catch (e) {}
    })

    roundDurationUnsub = onDataChange(`${dbPath}/roundDuration`, (val) => {
      remoteRoundDuration.value = Number(val) || 0
      // Sync total for host but don't recalculate remaining
      if (isHost.value) {
        if (remoteRoundDuration.value > 0 && !timerTotal.value) {
          timerTotal.value = remoteRoundDuration.value
          timerSet.value = true
        }
      } else {
        // Non-host: sync timer from server
        if (remoteLastStartedAt.value && remoteRoundDuration.value) {
          syncTimerFromServer()
        }
      }
      try {
        if (roundActive.value && !isHost.value && !resyncInterval.value) {
          resyncInterval.value = setInterval(() => {
            try { syncTimerFromServer() } catch (e) { /* ignore */ }
          }, 15000)
        }
      } catch (e) {}
    })

    // Subscribe to timerPaused state for all users (host and non-host)
    timerPausedUnsub = onDataChange(`${dbPath}/timerPaused`, (val) => {
      const isPaused = !!val
      const wasResumed = timerPaused.value === true && isPaused === false
      
      if (isHost.value) {
        // Host: Only sync pause state when remounting component
        console.log('Host: timerPaused synced to', isPaused)
        timerPaused.value = isPaused
      } else {
        // Non-host: Always sync pause state
        console.log('Non-host: timerPaused changed to', isPaused, 'wasResumed:', wasResumed)
        timerPaused.value = isPaused
        // When resuming, immediately sync from server to get the correct remaining time
        if (wasResumed) {
          console.log('Non-host: Detected resume, syncing timer from server')
          setTimeout(() => {
            try { syncTimerFromServer() } catch (e) { console.warn('Resume sync failed', e) }
          }, 100) // Small delay to ensure lastRoundStartedAt is updated
        }
      }
    })

    // Subscribe to timerRemaining for all users to sync exact time when paused/resumed
    timerRemainingUnsub = onDataChange(`${dbPath}/timerRemaining`, (val) => {
      // Update remaining time to sync exact time
      const remaining = Number(val) || 0
      
      if (isHost.value) {
        // Host: Update remaining time from Firebase
        // This is important for restoring state when returning to component
        console.log('Host: timerRemaining synced to', remaining, 'from Firebase')
        timerRemaining.value = remaining
        
        // Ensure timer is set if we have a remaining time
        if (remaining > 0 && !timerTotal.value) {
          timerTotal.value = remaining
          timerSet.value = true
        }
      } else {
        // Non-host: Always sync remaining time
        console.log('Non-host: timerRemaining synced to', remaining, 'paused:', timerPaused.value)
        timerRemaining.value = remaining
        // Ensure timer is set if we have a remaining time
        if (remaining > 0 && !timerTotal.value) {
          timerTotal.value = remaining
          timerSet.value = true
        }
      }
    })
  } catch (e) { console.warn('subscribeRemoteTimer failed', e) }
}

function subscribeTeamsLocked(dbPath) {
  try {
    if (teamsLockedUnsub) { try { teamsLockedUnsub() } catch (e) {} ; teamsLockedUnsub = null }
    teamsLockedUnsub = onDataChange(`${dbPath}/teamsLocked`, async (val) => {
      try {
        // Normalize to boolean-ish
        const newLocked = !!val
        // Only navigate when teams transitioned from locked -> unlocked
        if (!isHost.value && prevTeamsLocked === true && newLocked === false) {
          if (recentAllocationNav) return
          recentAllocationNav = true
          setTimeout(() => { recentAllocationNav = false }, 3000)
          console.log('subscribeTeamsLocked: detected teamsLocked change true->false — navigating player to MatchRoom allocation')
          try {
            const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
            await router.push({ name: 'MatchRoom', params: { id: matchId.value }, query })
          } catch (err) {
            console.warn('subscribeTeamsLocked navigation failed', err)
          }
        }
        prevTeamsLocked = newLocked
      } catch (e) { console.warn('teamsLocked handler failed', e) }
    })
  } catch (e) { console.warn('subscribeTeamsLocked failed', e) }
}

function subscribeToTeams(dbPath) {
  try {
    if (teamsUnsub) { try { teamsUnsub() } catch (e) {} ; teamsUnsub = null }
    teamsUnsub = onDataChange(`${dbPath}/teams`, async (val) => {
      try {
        if (!val || (!val.teamA && !val.teamB)) return
        console.log('RoundStarted subscribeToTeams: teams changed', val)
        
        const rawA = Array.isArray(val.teamA) ? val.teamA : (val.teamA ? Object.values(val.teamA).filter(v => v && typeof v === 'string') : [])
        const rawB = Array.isArray(val.teamB) ? val.teamB : (val.teamB ? Object.values(val.teamB).filter(v => v && typeof v === 'string') : [])
        
        const enrichedA = await enrichPlayers(rawA)
        const enrichedB = await enrichPlayers(rawB)
        
        // Update teams for all clients (host and players) so they see live changes
        teamA.value = enrichedA
        teamB.value = enrichedB
        console.log('RoundStarted: teams updated from subscription', { teamA: enrichedA.length, teamB: enrichedB.length })
      } catch (e) { console.warn('subscribeToTeams handler failed', e) }
    })
  } catch (e) { console.warn('subscribeToTeams failed', e) }
}

function subscribeMatchData(dbPath) {
  try {
    if (matchDataUnsub) { try { matchDataUnsub() } catch (e) {} ; matchDataUnsub = null }
    matchDataUnsub = onDataChange(dbPath, (val) => {
      try {
        if (!val) return
        // Update matchData so isMatchEnded computed becomes reactive
        matchData.value = { ...(matchData.value || {}), ...val, __dbPath: dbPath }
        console.log('RoundStarted subscribeMatchData: match data updated', { matchEnded: val.matchEnded })
      } catch (e) { console.warn('subscribeMatchData handler failed', e) }
    })
  } catch (e) { console.warn('subscribeMatchData failed', e) }
}

function subscribeSelectedWinner(dbPath) {
  try {
    if (selectedWinnerUnsub) { try { selectedWinnerUnsub() } catch (e) {} ; selectedWinnerUnsub = null }
    selectedWinnerUnsub = onDataChange(`${dbPath}/selectedWinner`, (val) => {
      try {
        if (!isHost.value) {
          // Non-host: sync selected winner from host
          selectedWinner.value = val || null
          console.log('Non-host: selectedWinner synced to', val)
        }
      } catch (e) { console.warn('selectedWinner subscription handler failed', e) }
    })
  } catch (e) { console.warn('subscribeSelectedWinner failed', e) }
}

function syncTimerFromServer() {
  try {
    console.log('syncTimerFromServer called', {
      isHost: isHost.value,
      remoteLastStartedAt: remoteLastStartedAt.value,
      remoteRoundDuration: remoteRoundDuration.value,
      roundActive: roundActive.value
    })
    
    if (!remoteLastStartedAt.value || !remoteRoundDuration.value) {
      console.warn('syncTimerFromServer: Missing data', {
        hasLastStartedAt: !!remoteLastStartedAt.value,
        hasRoundDuration: !!remoteRoundDuration.value
      })
      return
    }
    
    const started = Date.parse(remoteLastStartedAt.value)
    if (isNaN(started)) {
      console.warn('syncTimerFromServer: Invalid date', remoteLastStartedAt.value)
      return
    }
    
    // If timer is paused, don't recalculate based on elapsed time
    // Instead, use the persisted timerRemaining value
    if (timerPaused.value) {
      console.log('syncTimerFromServer: Timer is paused, skipping time calculation')
      // Timer values are already synced via timerRemaining subscription
      return
    }
    
    const elapsed = Math.floor((Date.now() - started) / 1000)
    const rem = Math.max(0, Number(remoteRoundDuration.value || 0) - elapsed)
    timerTotal.value = Number(remoteRoundDuration.value || 0)
    timerRemaining.value = rem
    timerSet.value = timerTotal.value > 0
    
    console.log('syncTimerFromServer: Calculated timer', {
      elapsed,
      remaining: rem,
      total: timerTotal.value,
      isHost: isHost.value
    })
    
    // DO NOT reset timerPaused here - it's controlled by Firebase subscription
    // timerPaused.value = false  <-- REMOVED
    
    // Only set roundActive to true if there's remaining time AND round was already active
    // Don't auto-start the round just because there's time remaining
    const wasActive = roundActive.value
    if (rem > 0 && wasActive) {
      roundActive.value = true
    } else if (rem <= 0) {
      roundActive.value = false
    }

    // start a local ticking interval to mirror countdown
    // ONLY if roundActive is true (round has been started by host)
    // For HOST: Only restart interval if not already running and round is active
    // For NON-HOST: Restart interval if round is active
    const shouldStartInterval = isHost.value 
      ? (!timerInterval.value && roundActive.value && !timerPaused.value) 
      : (roundActive.value && !timerPaused.value)
    
    if (shouldStartInterval) {
      if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
      timerInterval.value = setInterval(() => {
        if (timerPaused.value) return
        if (timerRemaining.value > 0) {
          timerRemaining.value -= 1
        } else {
          if (timerInterval.value) { clearInterval(timerInterval.value); timerInterval.value = null }
          roundActive.value = false
          roundFinished.value = true
          timerSet.value = false
        }
      }, 1000)
      console.log(isHost.value ? 'Host' : 'Non-host', 'timer interval started, remaining:', rem)
    } else {
      console.log('syncTimerFromServer: Not starting interval', {
        shouldStartInterval,
        hasInterval: !!timerInterval.value,
        roundActive: roundActive.value,
        timerPaused: timerPaused.value,
        isHost: isHost.value
      })
    }
  } catch (e) { console.warn('syncTimerFromServer failed', e) }
}
</script>

<style scoped>

/* Ensure Round title matches MatchRoom title exactly */
.matchroom-title {
  margin: 0;
  color: #fff;
  font-size: 48px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-actions { margin:8px 0 16px; display:flex; gap:8px; justify-content:center; width:100%; align-items:center }
.summary-btn { border:none; background:#2b6baf; color:#fff; border-radius:8px; padding:9px 14px; font-weight:700; margin:0 6px; cursor:pointer; }



.team-players-row { display:flex; gap:20px; padding-top:18px; align-items:center; flex-wrap:wrap; }
.team-player { display:flex; flex-direction:column; align-items:center; width:120px; }
.avatar-wrap { width:84px; height:84px; display:flex; align-items:center; justify-content:center; }
.avatar-img { width:84px; height:84px; border-radius:50%; border:4px solid #ffad1d; object-fit:cover; }
.player-username { margin-top:8px; color:#ffad1d; font-weight:700; text-align:center; word-break:break-word; }

/* copy of MatchRoom timer & team styles so RoundStarted visually matches */
.matchroom-container { background: #0f1418; color: #fff; min-height: 100vh; padding: 32px; border-radius: 20px; }
header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 12px; 
  position: relative;
  padding: 16px 24px;
  background: linear-gradient(180deg, rgba(255,154,60,0.08), rgba(255,154,60,0.02));
  border-radius: 16px;
  border: 1px solid rgba(255,154,60,0.15);
  margin-bottom: 20px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
header h1 {
  color: #ffd98a;
  font-size: 2rem;
  font-weight: 900;
  margin: 0;
  flex: 1;
  text-align: center;
  letter-spacing: 0.5px;
}

/* Host view: shift title left to center with timer */
header:has(.back-btn) h1 {
  margin-left: -85px;
}

/* Player view: shift title left to center it */
header:has(.close-btn) h1 {
  margin-left: -30px;
}
.back-btn { 
  border: none; 
  background: #B23B3B; 
  color: #fff; 
  border-radius: 10px; 
  padding: 10px 20px; 
  font-weight: 700; 
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}
.back-btn:hover {
  background: #c94545;
  transform: translateY(-1px);
}
.back-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
.close-btn {
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 700;
  cursor: pointer;
  font-size: 1.3rem;
  transition: all 0.2s ease;
  line-height: 1;
}
.close-btn:hover {
  background: rgba(255,255,255,0.15);
  transform: scale(1.05);
}
.close-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.players-row { display:flex; gap:18px; padding-top:12px; flex-wrap:wrap; align-items:center; }

/* Player avatar styling matching MatchRoom.vue bench */
.player-avatar { 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  gap:12px; 
  padding:8px 10px; 
  background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02)); 
  border-radius:10px; 
  border:1px solid rgba(255,255,255,0.02); 
  position:relative; 
  white-space:nowrap; 
  cursor: pointer; 
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.player-avatar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255,173,29,0.15);
}
.player-left { 
  display:flex; 
  align-items:center; 
  gap:12px; 
  min-width:0; 
  overflow:hidden;
  flex: 1;
}
.avatar-block { 
  display:flex; 
  flex-direction:column; 
  align-items:center; 
  gap:6px; 
  margin-right:8px;
  flex-shrink: 0;
}
.avatar-wrap { width:60px; height:60px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.avatar-img { 
  width:48px; 
  height:48px; 
  border-radius:50%; 
  border:3px solid #FFAD1D; 
  object-fit:cover; 
  flex-shrink:0;
}
.avatar-fallback { 
  width:48px; 
  height:48px; 
  border-radius:50%; 
  border:3px solid #FFAD1D; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  background:#1f262b; 
  color:#ffad1d; 
  font-weight:700; 
  font-size:1rem; 
  flex-shrink:0;
}
.player-username { color:#ffad1d; font-weight:700; font-size:1rem; }
.player-name { 
  color: #ffad1d; 
  font-weight: 700; 
  font-size: 0.98rem; 
  white-space:nowrap; 
  text-overflow:ellipsis; 
  overflow:hidden; 
  flex:1; 
  min-width:0;
}
.player-sub { 
  color: #cfc9b0; 
  font-weight:600; 
  font-size:0.78rem; 
  margin-top:2px; 
  white-space:nowrap; 
  text-overflow:ellipsis; 
  overflow:hidden;
}
.player-wins { 
  margin-left:12px; 
  color:#ffd98a; 
  font-weight:900; 
  font-size:1rem; 
  display:flex; 
  align-items:center; 
  gap:8px; 
  flex-shrink:0;
}
.team-drop-list { 
  display:flex; 
  flex-direction:column; 
  gap:12px; 
  align-items:stretch;
}
.team-drop-list .player-avatar { 
  width:100%;
}
.team-drop-list .player-avatar, 
.team-drop-list .player-avatar * { 
  white-space:nowrap;
}

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
.teams-grid { 
  display: flex; 
  flex-direction: row;
  gap: 20px; 
  align-items: stretch; 
  justify-content: center; 
  margin-top: 8px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}
.team-card { 
  flex: 1;
  min-width: 300px;
  border: 2.5px dashed #fff4d1; 
  transition: border 0.3s; 
  min-height: 200px; 
  padding: 18px; 
  border-radius: 18px; 
  background: #23262e; 
}
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

/* --- Rounds History Styles --- */
.rounds-history { 
  margin: 32px auto; 
  max-width: 650px; 
  background: linear-gradient(180deg,#0f1114,#15161a); 
  padding: 20px; 
  border-radius: 14px; 
  border: 1px solid rgba(255,255,255,0.04); 
  box-shadow: 0 10px 30px rgba(0,0,0,0.6); 
}
.rounds-history-header { 
  color: #ffd98a; 
  margin: 0 0 16px 0; 
  font-size: 1.8rem; 
  font-weight: 800;
  text-align: center;
}
.rounds-empty { 
  color: #cfc9b0; 
  text-align: center; 
  padding: 20px; 
  font-size: 0.95rem; 
}
.round-list { 
  display: flex; 
  flex-direction: column; 
  gap: 16px; 
}
.round-card { 
  background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02)); 
  padding: 16px; 
  border-radius: 12px; 
  border: 1px solid rgba(255,255,255,0.03); 
  transition: transform 180ms ease, box-shadow 180ms ease;
  max-width: 750px;
  margin: 0 auto;
}
.round-card:hover { 
  transform: translateY(-4px); 
  box-shadow: 0 18px 40px rgba(0,0,0,0.6); 
}
.round-card-header { 
  display: flex; 
  gap: 16px; 
  align-items: center; 
  margin-bottom: 12px; 
  flex-wrap: wrap;
}
.round-index { 
  font-weight: 900; 
  color: #fff; 
  font-size: 1.1rem; 
}
.round-time { 
  color: #d3c7a3; 
  font-size: 0.85rem; 
}
.round-duration { 
  color: #ffd98a; 
  font-weight: 800; 
  font-size: 0.85rem; 
}
.round-teams { 
  display: flex; 
  gap: 16px; 
  margin-bottom: 12px; 
}
.round-team { 
  flex: 1; 
  min-width: 280px;
  background: rgba(255,255,255,0.02); 
  padding: 12px; 
  border-radius: 10px; 
}
.round-team-label { 
  font-weight: 900; 
  color: #fff4d1; 
  margin-bottom: 10px; 
  font-size: 0.95rem;
}
.round-team-roster { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}
.round-player { 
  display: flex; 
  gap: 10px; 
  align-items: center; 
  background: linear-gradient(180deg, #0f1114, #141516); 
  padding: 8px 10px; 
  border-radius: 8px; 
  border: 1px solid rgba(255,255,255,0.03); 
  flex-wrap: wrap;
}
.round-avatar { 
  flex-shrink: 0; 
}
.round-avatar-img { 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  border: 2px solid #ffad1d; 
  object-fit: cover; 
}
.round-avatar-fallback { 
  width: 36px; 
  height: 36px; 
  border-radius: 50%; 
  border: 2px solid #ffad1d; 
  background: #1f262b; 
  color: #ffad1d; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: 700; 
  font-size: 0.85rem; 
}
.round-player-name { 
  color: #fff; 
  font-weight: 800; 
  font-size: 0.9rem; 
  flex: 1; 
  min-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.round-player-stats { 
  display: flex; 
  gap: 6px; 
  flex-shrink: 0;
}
.stat-total { 
  color: #cfc9b0; 
  font-weight: 700; 
  font-size: 0.72rem; 
}
.stat-trophy { 
  color: #ffd98a; 
  font-weight: 900; 
  font-size: 0.82rem;
}
.round-winner { 
  background: linear-gradient(90deg,#1f262b,#23272b); 
  color: #ffd98a; 
  padding: 10px 14px; 
  border-radius: 10px; 
  font-weight: 800; 
  text-align: center;
  font-size: 0.95rem;
}

/* Final Results View */
.final-results-view {
  min-height: 100vh;
  padding: 20px;
}
.final-results-header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 32px;
  position: relative;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
}
.final-results-header h1 {
  color: #ffd98a;
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
  text-align: center;
}
.final-results-header .close-btn {
  position: absolute;
  right: 10px;
}
.final-results-view .rounds-history {
  margin-top: 0;
}

/* Collapsed sidebar responsive styles */
.collapsed .matchroom-container {
  padding: 20px 15px;
}

.collapsed .teams-grid {
  max-width: 100%;
}

/* Stack vertically when collapsed and screen is narrow */
@media (max-width: 1100px) {
  .collapsed .teams-grid {
    flex-direction: column;
  }
  
  .collapsed .team-card {
    width: 100%;
    min-width: unset;
  }
}

.collapsed .rounds-history {
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
  padding: 15px;
}

/* Only stack teams vertically on smaller screens */
@media (max-width: 900px) {
  .teams-grid {
    flex-direction: column;
  }

  .team-card {
    min-width: unset;
    width: 100%;
  }
  
  .round-teams {
    flex-direction: column;
  }

  .round-team {
    min-width: unset;
  }
}

/* Mobile responsive styles */
@media (max-width: 720px) {
  .matchroom-container {
    padding: 20px 15px;
  }
  
  .teams-grid {
    gap: 15px;
    flex-direction: column;
  }
  
  .team-card {
    min-height: 180px;
    width: 100%;
  }
  
  .rounds-history {
    max-width: 100%;
    padding: 15px;
    margin: 20px 0;
  }
  
  .round-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .round-player-name {
    font-size: 0.85rem;
  }
  
  .round-player-stats {
    font-size: 0.7rem;
  }
}

@media (max-width: 420px) {
  .matchroom-container {
    padding: 15px 10px;
  }
  
  .teams-grid {
    gap: 12px;
    flex-direction: column;
  }
  
  .team-card {
    min-height: 160px;
    width: 100%;
  }
  
  .rounds-history {
    padding: 12px;
    margin: 15px 0;
  }
  
  .rounds-history-header {
    font-size: 1.5rem;
  }
  
  .round-card {
    padding: 12px;
  }
  
  .round-player {
    padding: 6px 8px;
  }
  
  .round-avatar-img,
  .round-avatar-fallback {
    width: 32px;
    height: 32px;
  }
}
</style>