<template>
  <div class="matchroom-container">
    <header>
      <button @click="goBack" class="back-btn">← Back</button>
      <h1>{{ displayTitle }}</h1>
      <button @click="onEndMatch" class="end-match-btn">End Match</button>
    </header>

    <!-- Bench Section -->
    <section class="bench-section">
      <h2>Bench</h2>
      <p>Players who are ready to play. Drag them to a team.</p>
      <draggable
        v-model="bench"
        :group="'players'"
        :disabled="teamsLocked"
        class="bench-list"
        item-key="uid"
      >

        <template #item="{ element }">
            <div class="player-avatar">
                <template v-if="element?.avatar">
                <img :src="element.avatar" class="avatar-img" :alt="element.name || element.uid" />
                </template>
                <template v-else>
                <div class="avatar-fallback">{{ initials(element?.name || element?.uid) }}</div>
                </template>
                <span class="player-name">{{ element.name || element.uid }}</span>
            </div>
            </template>
      </draggable>
    </section>


    <div class="center-timer">
      <div class="timer-card">
        <div class="timer-header">Round Timer</div>

        <div class="timer-main">
          <!-- Inline setter inside the card when timer not set -->
          <div class="timer-setter-inline" v-if="!timerSet && !roundActive">
      <div class="setter-row">
        <div class="time-inputs-inline">
          <input class="time-input" type="number" min="0" v-model.number="timerMinutes" placeholder="Min" />
          <span class="colon">:</span>
          <input class="time-input" type="number" min="0" max="59" v-model.number="timerSeconds" placeholder="Sec" />
          <!-- Set button pulses when teamsLocked but timer not set -->
          <button
            class="btn-set-inline"
            :class="{ pulsate: setShouldPulse }"
            @click="setTimer"
            :disabled="!validTimerInput"
          >Set</button>
        </div>
        <div class="preset-buttons-inline">
          <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(60)">1:00</button>
          <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(120)">2:00</button>
          <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(300)">5:00</button>
          <button class="preset" :class="{ pulsate: setShouldPulse }" @click="applyPreset(600)">10:00</button>
        </div>
      </div>
    </div>

          <!-- Large display + progress bar -->
          <div class="time-large">{{ timerDisplay }}</div>
          <div class="progress-wrap" aria-hidden="true">
            <div class="progress-bar" :style="{ width: timerTotal.value ? ((timerTotal.value - timerRemaining.value) / timerTotal.value * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <div class="timer-controls">
          <!-- <button class="btn-start" v-if="!roundActive" @click="startRound" :disabled="!(teamsLocked && timerSet)">Start Match</button> -->
           <button
            class="btn-start"
            v-if="!roundActive"
            @click="startRound"
            :disabled="!startEnabled"
            :class="{ 'disabled-btn': !startEnabled, pulsate: startShouldPulse }"
          >Start Match</button>
          <button class="btn" v-if="roundActive && !timerPaused" @click="pauseTimer">Pause</button>
          <button class="btn" v-if="roundActive && timerPaused" @click="resumeTimer">Resume</button>
          <button class="btn-reset" v-if="!roundActive && timerSet" @click="resetTimer">Reset</button>
          <button class="btn-end" v-if="roundActive" @click.prevent.stop="endRound(true)">End Round</button>
        </div>
      </div>
    </div>

    <!-- <div class="timer-state">
      <div class="state-row">
        <div class="state-item"><strong>Set:</strong> {{ timerSet ? 'Yes' : 'No' }}</div>
        <div class="state-item"><strong>Status:</strong> {{ roundActive ? (timerPaused ? 'Paused' : 'Running') : (timerSet ? 'Ready' : 'Not set') }}</div>
        <div class="state-item"><strong>Remaining:</strong> {{ timerSet ? timerDisplay : '--:--' }}</div>
        <div class="state-item" v-if="timerTotal && !roundActive"><strong>Length:</strong> {{ timerTotal ? (Math.floor(timerTotal/60).toString().padStart(2,'0') + ':' + (timerTotal%60).toString().padStart(2,'0')) : '--:--' }}</div>
      </div>
    </div> -->

    <!-- <div class="timer-panel">
        <div class="timer-setter" v-if="!timerSet && !roundActive">
          <label>Set Round Time</label>
          <div class="time-inputs">
            <input type="number" min="0" v-model.number="timerMinutes" placeholder="Min" /> :
           <input type="number" min="0" max="59" v-model.number="timerSeconds" placeholder="Sec" />
            <button @click="setTimer" :disabled="!validTimerInput">Set</button>
        </div>
          <div class="preset-buttons">
            <button @click="applyPreset(60)">1:00</button>
            <button @click="applyPreset(120)">2:00</button>
            <button @click="applyPreset(300)">5:00</button>
            <button @click="applyPreset(600)">10:00</button>
          </div>
        </div>

        <div class="timer-display">
          <div class="time-large">{{ timerDisplay }}</div>
          <div class="timer-actions">
            <button v-if="!roundActive" @click="startRound" :disabled="!(teamsLocked && timerSet)">Start Round</button>
            <button v-if="roundActive && !timerPaused" @click="pauseTimer">Pause</button>
            <button v-if="roundActive && timerPaused" @click="resumeTimer">Resume</button>
            <button v-if="!roundActive && timerSet" @click="resetTimer">Reset</button>
            <button v-if="roundActive" @click="endRound">End Round</button>
          </div>
        </div>
      </div> -->

    <!-- Teams Grid -->
    <section class="teams-grid">
      <div :class="['team-card', teamAOutlineClass]" @click="!teamsLocked && selectWinner('A')">
        <h2>Team A</h2>
        <draggable v-model="teamA" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
          <template #item="{ element }">
            <div class="player-avatar">
                <template v-if="element?.avatar">
                <img :src="element.avatar" class="avatar-img" :alt="element.name || element.uid" />
                </template>
                <template v-else>
                <div class="avatar-fallback">{{ initials(element?.name || element?.uid) }}</div>
                </template>
                <span class="player-name">{{ element.name || element.uid }}</span>
            </div>
            </template>
        </draggable>
      </div>
      <div :class="['team-card', teamBOutlineClass]" @click="!teamsLocked && selectWinner('B')">
        <h2>Team B</h2>
        <draggable v-model="teamB" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
          <template #item="{ element }">
            <div class="player-avatar">
                <template v-if="element?.avatar">
                <img :src="element.avatar" class="avatar-img" :alt="element.name || element.uid" />
                </template>
                <template v-else>
                <div class="avatar-fallback">{{ initials(element?.name || element?.uid) }}</div>
                </template>
                <span class="player-name">{{ element.name || element.uid }}</span>
            </div>
            </template>
        </draggable>
      </div>
    </section>

    <!-- Match Controls -->
<footer class="actions-row">
      <div class="controls-left">
        <!-- <button @click="randomizeTeams" :disabled="teamsLocked">Randomize Teams</button>
        <button @click="confirmTeams" :disabled="teamsLocked || !(teamA.length && teamB.length)">Confirm Teams</button> -->
         <button @click="randomizeTeams" :disabled="teamsLocked">Randomize Teams</button>
        <button
          @click="confirmTeams"
          :disabled="teamsLocked || !(teamA.length && teamB.length)"
          :class="{ pulsate: confirmShouldPulse }"
        >Confirm Teams</button>
        <button @click="addRound" :disabled="roundActive">Add Round</button>
      </div>

    
    </footer>

    <!-- Stats Modal -->
    <StatisticsModal v-if="showStats" :stats="computedStats" @close="showStats=false" />
  </div>
  
</template>



<script setup>

import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
 import draggable from 'vuedraggable'
 import { useRoute, useRouter } from 'vue-router'
 import { getDataFromFirebase, setChildData } from '../firebase/firebase'
// import your StatisticsModal if you want fancy end-of-match stats

const route = useRoute()
const router = useRouter()
const matchId = computed(() => route.params.id)

// /** Initial player data */
// const allPlayers = [
//   // Example: { uid: 'p1', name: 'Wei_Ken', avatar: '/avatars/wei_ken.jpg' }
//   // Populate from your match info/Firebase
// ]



const allPlayers = []
const matchData = ref({})
const bench = ref([]) 

function normalizePlayers(playersNode) {
  if (!playersNode) return []
  if (Array.isArray(playersNode)) {
    return playersNode.map(p => ({
      uid: p?.uid || p?.id || p?.key || '',
      name: p?.name || p?.displayName || p?.username || null,
      avatar: p?.avatar || p?.photoURL || null
    }))
  }
  if (typeof playersNode === 'object') {
    return Object.entries(playersNode).map(([k, v]) => ({
      uid: v?.uid || v?.id || v?.key || k,
      name: v?.name || v?.displayName || v?.username || null,
      avatar: v?.avatar || v?.photoURL || null
    }))
  }
  return []
}

function initials(name) {
  if (!name) return 'U'
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

let usersCache = null
async function getUsersMap() {
  if (usersCache) return usersCache
  try {
    usersCache = await getDataFromFirebase('users')
    return usersCache
  } catch (e) {
    console.warn('Failed to load users map', e)
    usersCache = {}
    return usersCache
  }
}

async function enrichPlayers(list) {
  if (!list || !list.length) return []
  const users = await getUsersMap()
//   return list.map(p => {
//     const uid = p.uid || p.id || p.key || ''
//     const resolved = (users && users[uid]) || null
//     return {
//       uid: uid || (p.name ? `${p.name}` : ''),
//       name: p.name || (resolved && (resolved.name || resolved.displayName || resolved.username)) || p.uid || 'Player',
//       avatar: p.avatar || (resolved && (resolved.avatar || resolved.photoURL)) || null
//     }
//   })

const out = list.map(p => {
    const uid = p.uid || p.id || p.key || ''
    const resolved = (users && users[uid]) || null

    // prefer explicit fields
    let avatar = p.avatar || (resolved && (resolved.avatar || resolved.photoURL || resolved.photo)) || null

    // if no avatar, use gender-seeded service if gender present, otherwise UI Avatars fallback
    if (!avatar) {
      const nameForSeed = encodeURIComponent(((p.name || (resolved && (resolved.name || resolved.displayName || resolved.username)) || uid) + '').split(' ')[0])
      if (resolved && resolved.gender) {
        avatar = (String(resolved.gender).toLowerCase() === 'female')
          ? `https://avatar.iran.liara.run/public/girl?username=${nameForSeed}`
          : `https://avatar.iran.liara.run/public/boy?username=${nameForSeed}`
      } else {
        // ui-avatars gives a consistent image even without gender
        const nameFull = encodeURIComponent((p.name || (resolved && (resolved.name || resolved.displayName)) || uid).trim())
        avatar = `https://ui-avatars.com/api/?name=${nameFull}&background=1f262b&color=ffad1d&format=png&size=128`
      }
    }

    const name = p.name || (resolved && (resolved.name || resolved.displayName || resolved.username)) || uid || 'Player'
    return { uid, name, avatar }
  })
  console.log('enrichPlayers -> resolved avatars:', out)
  return out
}

async function populateBenchFromMatch(md) {
  if (!md || typeof md !== 'object') {
    bench.value = [...allPlayers]
    return
  }
  // common fields to check
  const fields = ['players', 'joined', 'participants', 'playersList', 'roster', 'members', 'playersMap', 'attendees']
  let raw = null
  for (const f of fields) {
    if (md[f]) { raw = md[f]; break }
  }
  // sometimes players live at match.players.<uid> or deeper nested
  if (!raw && md.players && typeof md.players === 'object' && Object.keys(md.players).length && !Array.isArray(md.players)) {
    raw = md.players
  }
  let normalized = normalizePlayers(raw)
  if (!normalized.length) {
    // fallback: if matchData has a simple array of uids in 'uids'
    if (Array.isArray(md.uids) && md.uids.length) {
      normalized = md.uids.map(u => ({ uid: u, name: null, avatar: null }))
    }
  }
  if (!normalized.length) {
    bench.value = [...allPlayers]
    return
  }
  bench.value = await enrichPlayers(normalized)
  console.log('populateBenchFromMatch -> bench entries:', bench.value)
}

watch(matchData, (next) => {
  populateBenchFromMatch(next)
}, { immediate: true, deep: true })


// populate bench when matchData changes (after load)
// watch(matchData, (next) => {
//   const p = next && next.players ? normalizePlayers(next.players) : []
//   // if players not found, fallback to any 'joined' or 'playersList' fields
//   if (!p.length) {
//     const alt = next && (next.joined || next.playersList || next.participants)
//     if (alt) {
//       bench.value = normalizePlayers(alt)
//       return
//     }
//   }
//   bench.value = p.length ? p : [...allPlayers]
// }, { immediate: true, deep: true })


console.log('matchId from route:', matchId) 

const displayTitle = computed(() => {
  const t = (matchData.value && (matchData.value.title || matchData.value.name)) ? String(matchData.value.title || matchData.value.name).trim() : ''
  return t || 'Untitled Match'
})


onMounted(async () => {
  if (!matchId.value && !route.query.path) return
  try {
    let data = null
    const pathQuery = route.query.path
    if (pathQuery) {
      data = await getDataFromFirebase(pathQuery)
      if (data) { matchData.value = { ...(data || {}), __dbPath: String(pathQuery) }; return }
    }
    data = await getDataFromFirebase(`matches/${matchId.value}`)
    if (data) {
      matchData.value = { ...(data || {}), __dbPath: `matches/${matchId.value}` }
    } else {
      const all = await getDataFromFirebase('matches')
      if (all && typeof all === 'object') {
        outer:
        for (const [k1, v1] of Object.entries(all)) {
          if (!v1 || typeof v1 !== 'object') continue
          for (const [k2, v2] of Object.entries(v1)) {
            if (!v2 || typeof v2 !== 'object') continue
            if (v2[matchId.value]) {
              matchData.value = { ...(v2[matchId.value] || {}), __dbPath: `matches/${k1}/${k2}/${matchId.value}` }
              break outer
            }
            for (const [mid, mv] of Object.entries(v2)) {
              if (String(mid) === String(matchId.value) || (mv && (String(mv.id) === String(matchId.value) || String(mv.key) === String(matchId.value)))) {
                matchData.value = { ...(mv || {}), __dbPath: `matches/${k1}/${k2}/${mid}` }
                break outer
              }
            }
          }
        }
      }
    }
    // ensure bench populates after matchData set
    await populateBenchFromMatch(matchData.value)
  } catch (e) {
    console.error('Failed to load match data', e)
  }
})

const teamA = ref([])
const teamB = ref([])

const teamsLocked = ref(false)
const roundActive = ref(false)
const showStats = ref(false)

const teamReady = computed(() => (teamA.value.length > 0 && teamB.value.length > 0))
const confirmShouldPulse = computed(() => teamReady.value && !teamsLocked.value)
const setShouldPulse = computed(() => teamsLocked.value && !timerSet.value)
const startEnabled = computed(() => teamsLocked.value && timerSet.value)
const startShouldPulse = computed(() => startEnabled.value && !roundActive.value)

// Timer state
const timerMinutes = ref(0)
const timerSeconds = ref(0)
const timerTotal = ref(0)        // total seconds set for round
const timerRemaining = ref(0)    // seconds left
const timerSet = ref(false)
const timerInterval = ref(null)
const timerPaused = ref(false)

const validTimerInput = computed(() => {
  const m = Number(timerMinutes.value) || 0
  const s = Number(timerSeconds.value) || 0
  return (m > 0 || s > 0) && s >= 0 && s < 60
})

const timerDisplay = computed(() => {
  const secs = timerRemaining.value || timerTotal.value || 0
  const mm = Math.floor(secs / 60).toString().padStart(2, '0')
  const ss = (secs % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
})

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

function resetTimer() {
  clearInterval(timerInterval.value)
  timerInterval.value = null
  timerRemaining.value = timerTotal.value
  timerPaused.value = false
  timerSet.value = false
  timerMinutes.value = 0
  timerSeconds.value = 0
}

function clearTimerToZero() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  timerPaused.value = false
  timerSet.value = false
  timerRemaining.value = 0
  timerTotal.value = 0
  timerMinutes.value = 0
  timerSeconds.value = 0
}

function startTimer() {
  if (!timerSet.value || timerRemaining.value <= 0) return
  clearInterval(timerInterval.value)
  timerPaused.value = false
  timerInterval.value = setInterval(() => {
    if (timerPaused.value) return
    if (timerRemaining.value > 0) {
      timerRemaining.value -= 1
    } else {
      clearInterval(timerInterval.value)
      timerInterval.value = null
      // round ended automatically
      roundActive.value = false
      timerSet.value = false
      // optionally show stats or notification
      showStats.value = true
      // reset timer to zero when round ends automatically
      clearTimerToZero()
    }
  }, 1000)
}


function pauseTimer() {
  timerPaused.value = true
}

function resumeTimer() {
  if (!timerSet.value) return
  timerPaused.value = false
}


/** Computed classes for team outlines */
const teamAOutlineClass = computed(() =>
  teamA.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)
const teamBOutlineClass = computed(() =>
  teamB.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)

/** Shuffle bench/randomise teams and assign */
function randomizeTeams() {
  const shuffled = [...bench.value, ...teamA.value, ...teamB.value].sort(() => Math.random() - 0.5)
  teamA.value = []
  teamB.value = []
  shuffled.forEach((p, i) => {
    (i % 2 === 0 ? teamA.value : teamB.value).push(p)
  })
  bench.value = []
}
// You can annotate: "randomizeTeams() splits all players randomly between Team A and Team B"

function confirmTeams() { teamsLocked.value = true }
function startRound() {
  if (!teamsLocked.value) { alert('Confirm teams before starting a round'); return }
  if (!timerSet.value || (timerRemaining.value <= 0 && timerTotal.value <= 0)) { alert('Set the round timer first'); return }
  roundActive.value = true
  startTimer()
}
function endRound(requireConfirm = true) {
  if (requireConfirm) {
    if (!confirm('End this round now?')) return
  }
  // stop countdown
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
  timerPaused.value = false
  roundActive.value = false
  // mark timer as no longer active (leave remaining for review) and show stats
  timerSet.value = false
  showStats.value = true

  // reset timer to zero when round is ended manually
  clearTimerToZero()
}

function addRound() { teamsLocked.value = false }
function selectWinner(team) {
  if (!roundActive.value && teamsLocked.value) {
    alert(`Team ${team} wins! (implement real logic here)`)
  }
}
function onEndMatch() {
  // optionally confirm ending match
  if (!confirm('End the match now?')) return
  showStats.value = true
  // ensure timer cleared to zero when match ends
  clearTimerToZero()
}

function goBack() { router.back() }

onBeforeUnmount(() => {
  if (timerInterval.value) clearInterval(timerInterval.value)
})

</script>

<style scoped>

.pulsate {
  animation: pulse-glow 1.1s ease-in-out infinite;
  transform-origin: center;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: scale(1); }
  50% { box-shadow: 0 0 24px 6px rgba(255,173,29,0.20); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0 rgba(255,173,29,0); transform: scale(1); }
}

/* disabled visual for Start when not ready */
.disabled-btn {
  background: linear-gradient(90deg,#4a4d52,#3b3d40) !important;
  color: #cfcfcf !important;
  opacity: 0.7;
  box-shadow: none !important;
  cursor: not-allowed !important;
}

.preset.pulsate, .btn-set-inline.pulsate, button.pulsate { outline: none; }

/* ensure disabled attribute still shows cursor not-allowed where needed */
button[disabled] { cursor: not-allowed; opacity: 0.6; }

.timer-setter-inline .setter-row { display:flex; flex-direction:column; gap:10px; width:100%; align-items:center; }
.time-inputs-inline { display:flex; align-items:center; gap:10px; }
.time-input { width:84px; padding:10px 12px; border-radius:8px; background:#16181c; color:#fff; border:1px solid rgba(255,255,255,0.06); font-size:1rem; text-align:center; }
.time-input:focus { outline:none; box-shadow:0 4px 18px rgba(255,173,29,0.06); border-color:rgba(255,173,29,0.18); }
.colon { color:#cfcfcf; font-weight:700; margin:0 4px; }
.btn-set-inline { padding:8px 14px; border-radius:10px; background:linear-gradient(90deg,#2b2f33,#23272b); color:#fff; border:1px solid rgba(255,255,255,0.04); font-weight:700; cursor:pointer; }
.btn-set-inline[disabled] { opacity:0.5; cursor:not-allowed; }

.preset-buttons-inline { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:6px; }
.preset { background:#111318; color:#fff; border:1px solid rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:700; }
.preset:hover { box-shadow: 0 6px 14px rgba(255,173,29,0.05); }

.combined-timer { display:flex; flex-direction:column; align-items:center; gap:12px; margin-bottom:12px; }
.combined-timer .time-inputs { display:flex; align-items:center; gap:8px; }
.combined-timer input[type="number"] { width:84px; padding:10px; border-radius:6px; background:#2a2d33; color:#fff; border:1px solid #444; }
.btn-set { padding:8px 12px; border-radius:8px; background:#2f343a; color:#fff; border:none; }
.timer-display-large { display:flex; flex-direction:column; align-items:center; gap:8px; }
.timer-actions-large { display:flex; gap:8px; }

/* .timer-state { display:flex; justify-content:center; margin: 10px 0 18px; }
.state-row {
  display:flex;
  gap:18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));
  padding:8px 14px;
  border-radius:10px;
  border:1px solid rgba(255,173,29,0.06);
  align-items:center;
} */
.state-item { color:#f3e6c2; font-weight:700; font-size:0.95rem; padding:4px 6px; }
.state-item strong { color:#ffefcf; margin-right:6px; }

 /* keep existing styles... */
 .center-timer { display:flex; justify-content:center; margin: 18px 0 26px; }

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
.time-large { font-size:2.4rem; color:#ffad1d; font-weight:800; font-family: 'Helvetica Neue', Arial, sans-serif; }
.progress-wrap { width:90%; height:8px; background: rgba(255,255,255,0.06); border-radius:6px; overflow:hidden; }
.progress-bar { height:100%; background: linear-gradient(90deg,#ffad1d,#ffda99); width:0%; transition: width 0.4s linear; }
.timer-controls { display:flex; gap:8px; justify-content:center; width:100%; margin-top:4px; }
.btn, .btn-start, .btn-reset {
  padding:8px 14px;
  border-radius:8px;
  border:none;
  cursor:pointer;
  font-weight:700;
}

.btn-start { padding:8px 14px; border-radius:8px; background:linear-gradient(90deg,#ffad1d,#ffda99); color:#0b0b0b; border:none; font-weight:700; }
.btn, .btn-reset { padding:8px 12px; border-radius:8px; background:#ffffff12; color:#fff; border:none; }


.btn-reset { background:#3a3f45; color:#fff; }
.btn[disabled] { opacity:0.45; cursor:not-allowed; }
 

.matchroom-container { background: #10121A; color: #fff; min-height: 100vh; padding: 32px; }
header { display: flex; align-items: center; justify-content: space-between; }
.bench-section, .team-card { background: #23262e; border-radius: 18px; padding: 20px 26px; margin-bottom: 22px; }
.bench-list, .team-drop-list { display: flex; gap: 28px; min-height: 100px; flex-wrap: wrap; align-items: flex-start; }
  .player-avatar { display:flex; flex-direction:column; align-items:center; margin:0 10px; }
  .avatar-img { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; object-fit:cover; }
.avatar-fallback { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#ffad1d; font-weight:700; font-size:1rem; }
.player-name { margin-top: 6px; color: #ffad1d; font-weight: 700; font-size: 0.95rem; }

.team-card { min-width: 330px; flex: 1; border: 2.5px dashed #fff4d1; transition: border 0.3s; min-height: 200px; }
.active-outline { border: 2.5px solid #ffad1d !important; }
.inactive-outline { border: 2.5px dashed #ededed !important; }
.active-pulse { animation: pulseborder 1s infinite alternate; border: 2.5px solid #ffad1d !important; }
@keyframes pulseborder { from { box-shadow: 0 0 0 0 #ffad1d55; } to { box-shadow: 0 0 20px 8px #ffad1d90; } }
.actions-row { margin-top: 30px; display: flex; gap: 22px; justify-content: center; }
.back-btn, .end-match-btn { border:none; background:#B23B3B; color: #fff; border-radius: 8px; padding:9px 18px; font-weight:700; }
.bench-section p { font-size: 0.96rem; color: #ccc; margin-bottom:16px; }
.teams-grid { display: flex; gap: 34px; align-items: flex-start; justify-content: center; }
</style>
