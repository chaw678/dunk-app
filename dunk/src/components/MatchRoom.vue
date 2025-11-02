<template>
  <div class="matchroom-container">
    <header>
      <button @click="goBack" class="back-btn">← Back</button>
      <h1>{{ displayTitle }}</h1>
      <button @click="onEndMatch" class="end-match-btn">End Match</button>
    </header>

    <!-- wins chart moved below teams grid -->

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
      <!-- Simple round controls (timer removed; control lives in RoundStarted) -->
      <div class="center-controls">
        <div class="controls" style="display:flex;justify-content:center;gap:12px;margin:18px 0 24px;">
          <button
            class="btn-start"
            v-if="!roundActive"
            @click="startRound"
            :disabled="!startEnabled"
            :class="{ 'disabled-btn': !startEnabled, pulsate: startShouldPulse }"
          >Start Round</button>
          <button class="btn-end" v-if="roundActive" @click.prevent.stop="endRound(true)">End Round</button>
        </div>
      </div>

      
    </div>

  

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
    <!-- wins chart moved below match controls -->

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

    <!-- Wins bar chart (mirrors RoundStarted) - placed below controls as requested -->
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

    <!-- Stats Modal -->
    <StatisticsModal v-if="showStats" :stats="computedStats" @close="showStats=false" />
  </div>
  
</template>



<script setup>

import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
 import draggable from 'vuedraggable'
 import { useRoute, useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, onDataChange } from '../firebase/firebase'
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

// --- wins chart (live) ---
const winsA = ref(0)
const winsB = ref(0)
const winsTotal = computed(() => (Number(winsA.value) || 0) + (Number(winsB.value) || 0))
const winsPercentA = computed(() => { const t = winsTotal.value; return t ? Math.round((winsA.value / t) * 100) : 0 })
const winsPercentB = computed(() => { const t = winsTotal.value; return t ? Math.round((winsB.value / t) * 100) : 0 })
const animateA = ref(false)
const animateB = ref(false)

watch(winsA, (nv, ov) => { if (nv !== ov) { animateA.value = true; setTimeout(() => (animateA.value = false), 650) } })
watch(winsB, (nv, ov) => { if (nv !== ov) { animateB.value = true; setTimeout(() => (animateB.value = false), 650) } })

let winsUnsub = null
async function loadWins() {
  try {
    // prefer stored __dbPath when available
    const dbPath = (matchData.value && matchData.value.__dbPath) ? matchData.value.__dbPath : (matchId.value ? `matches/${matchId.value}` : null)
    if (!dbPath) return
    // subscribe to realtime wins updates
    if (winsUnsub) {
      try { winsUnsub() } catch (e) {}
      winsUnsub = null
    }
    winsUnsub = onDataChange(`${dbPath}/wins`, (val) => {
      winsA.value = (val && val.A) ? Number(val.A) : 0
      winsB.value = (val && val.B) ? Number(val.B) : 0
    })
  } catch (e) { console.warn('loadWins failed', e) }
}

// computed stats object used by the optional StatisticsModal
const computedStats = computed(() => ({
  wins: { A: Number(winsA.value) || 0, B: Number(winsB.value) || 0, total: Number(winsTotal.value) || 0 },
  teams: { teamA: teamA.value || [], teamB: teamB.value || [] },
  match: matchData.value || {}
}))


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
      // subscribe to live wins updates for this match
      await loadWins()
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
const startEnabled = computed(() => teamsLocked.value)
const startShouldPulse = computed(() => startEnabled.value && !roundActive.value)

// timer removed: startEnabled depends only on teamsLocked; keep startShouldPulse


/** Computed classes for team outlines */
const teamAOutlineClass = computed(() =>
  teamA.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)
const teamBOutlineClass = computed(() =>
  teamB.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)

// async function resolveMatchDbPath() {
//   // prefer explicit __dbPath, otherwise construct from matches/<id>
//   const p = matchData.value && matchData.value.__dbPath
//   if (p) return p
//   if (matchId.value) return `matches/${matchId.value}`
//   return null
// }

async function resolveMatchDbPath() {
  if (matchData.value && matchData.value.__dbPath) return matchData.value.__dbPath
  if (matchId.value) return `matches/${matchId.value}`
  return null
}

/* --- save teams to realtime DB --- */
// async function saveTeamsToDB() {
//   try {
//     const dbPath = await resolveMatchDbPath()
//     if (!dbPath) return
//     // write teams as arrays of uids (and optionally full objects)
//     const payload = {
//       teams: {
//         teamA: teamA.value.map(p => p.uid || p.name || p),
//         teamB: teamB.value.map(p => p.uid || p.name || p)
//       }
//     }
//     // setChildData on dbPath children individually to avoid overwriting other fields
//     await setChildData(dbPath, 'teams', payload.teams)
//     // optionally persist playersMap entries for display
//     // await setChildData(dbPath, 'teamsMap', { teamA: teamA.value, teamB: teamB.value })
//   } catch (e) {
//     console.warn('saveTeamsToDB failed', e)
//   }
// }

async function saveTeamsToDB() {
  try {
    const dbPath = await resolveMatchDbPath()
    if (!dbPath) return
    const payload = {
      teams: {
        teamA: teamA.value.map(p => p.uid || p.name || p),
        teamB: teamB.value.map(p => p.uid || p.name || p)
      }
    }
    await setChildData(dbPath, 'teams', payload.teams)
  } catch (e) {
    console.warn('saveTeamsToDB failed', e)
  }
}

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

async function confirmTeams() {
  console.log('confirmTeams() called', { teamA: teamA.value.length, teamB: teamB.value.length, matchId: matchId?.value })
  if (!(teamA.value.length && teamB.value.length)) {
    console.warn('Cannot confirm - teams not filled')
    return
  }
  teamsLocked.value = true

  // remove confirmed players from bench
  const removed = new Set([...(teamA.value.map(p => p.uid || p.name)), ...(teamB.value.map(p => p.uid || p.name))])
  bench.value = bench.value.filter(p => !removed.has(p.uid || p.name))

  try {
    await saveTeamsToDB()
    console.log('Teams saved to DB')
  } catch (e) {
    console.error('saveTeamsToDB error', e)
  }

  // navigate to RoundStarted
  try {
    if (!router) { console.error('router is undefined') }
  // prefer named route and pass the match DB path so RoundStarted can return to the exact same DB node
  const navState = { teams: { teamA: teamA.value.map(p => p.uid || p.name || p), teamB: teamB.value.map(p => p.uid || p.name || p) } }
  if (matchData.value && matchData.value.__dbPath) navState.matchPath = matchData.value.__dbPath
  const query = {}
  if (matchData.value && matchData.value.__dbPath) query.path = matchData.value.__dbPath
  // prefer named route and include history state + query path
  await router.push({ name: 'RoundStarted', params: { id: matchId.value }, query, state: navState })
    console.log('Navigated via named route to RoundStarted')
  } catch (err) {
    console.warn('Named route push failed, trying path push', err)
    try {
      await router.push(`/match/${encodeURIComponent(String(matchId.value))}/round`)
      console.log('Navigated via path to /match/:id/round')
    } catch (err2) {
      console.error('Navigation failed', err2)
      alert('Navigation failed — check console for details')
    }
  }
}

async function startRound() {
  if (!teamsLocked.value) { alert('Confirm teams before starting a round'); return }
  roundActive.value = true
  // persist active flag so other clients can react
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', true)
      await setChildData(dbPath, 'lastRoundStartedAt', new Date().toISOString())
    }
  } catch (e) { /* ignore persistence errors */ }
}

async function endRound(requireConfirm = true) {
  if (requireConfirm) {
    if (!confirm('End this round now?')) return
  }
  roundActive.value = false
  showStats.value = true
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', false)
      await setChildData(dbPath, 'lastRoundEndedAt', new Date().toISOString())
    }
  } catch (e) { /* ignore */ }
}

function addRound() { teamsLocked.value = false }
function selectWinner(team) {
  if (!roundActive.value && teamsLocked.value) {
    alert(`Team ${team} wins! (implement real logic here)`)
  }
}
async function onEndMatch() {
  // optionally confirm ending match
  if (!confirm('End the match now?')) return
  showStats.value = true
  // persist match end state and ensure roundActive is false
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      await setChildData(dbPath, 'roundActive', false)
      await setChildData(dbPath, 'lastRoundEndedAt', new Date().toISOString())
    }
  } catch (e) { /* ignore persistence errors */ }
}

function goBack() { router.back() }

onBeforeUnmount(() => {
  if (winsUnsub) {
    try { winsUnsub() } catch (e) {}
    winsUnsub = null
  }
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

/* Wins chart (copied small subset from RoundStarted.vue) */
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
