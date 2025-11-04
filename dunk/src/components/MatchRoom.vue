<template>
  <div class="matchroom-container">
    <header>
      <button @click="goBack" class="back-btn">← Back</button>
      <h1>{{ displayTitle }}</h1>
      <button @click="onEndMatch" class="end-match-btn">End Match</button>
    </header>

    <!-- Match details card -->
    <section class="match-details">
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-icon">📅</div>
          <div>
            <div class="detail-label">Date</div>
            <div class="detail-value">{{ matchDateDisplay }}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🕒</div>
          <div>
            <div class="detail-label">Time</div>
            <div class="detail-value">{{ matchTimeDisplay }}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">📍</div>
          <div>
            <div class="detail-label">Court</div>
            <div class="detail-value">{{ courtDisplay }}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🏷️</div>
          <div>
            <div class="detail-label">Type</div>
            <div class="detail-value">{{ matchTypeDisplay }}</div>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-icon">🚻</div>
          <div>
            <div class="detail-label">Gender</div>
            <div class="detail-value">{{ genderDisplay }}</div>
          </div>
        </div>
      </div>
    </section>

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
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="element?.avatar">
                    <img :src="element.avatar" class="avatar-img" :alt="displayNameFor(element)" />
                  </template>
                  <template v-else>
                    <div class="avatar-fallback">{{ initials(displayNameFor(element)) }}</div>
                  </template>
                  <div class="player-sub">Total: {{ displayTotalWinsForUid(element && element.uid) }}</div>
                </div>
                <div class="player-name">{{ displayNameFor(element) }}</div>
              </div>
              <div class="player-wins" :class="{ 'pulse-win': winsPulse[element.uid] }">🏆 {{ displayMatchWinsForUid(element && element.uid) }}</div>
              <div class="player-extra">
                <div class="extra-row">🏆 Wins (match): <strong>{{ displayMatchWinsForUid(element && element.uid) }}</strong></div>
                <div class="extra-row"><a :href="`/profile/${element && element.uid}`" class="player-link">View profile</a></div>
              </div>
            </div>
        </template>
      </draggable>
    </section>


    <div class="center-timer">
      <!-- Simple round controls (timer removed; control lives in RoundStarted) -->
      

      
    </div>

  

    <!-- Teams Grid -->
    <section class="teams-grid">
      <div :class="['team-card', teamAOutlineClass]" @click="!teamsLocked && selectWinner('A')">
        <h2>Team A</h2>
        <draggable v-model="teamA" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
            <template #item="{ element }">
            <div class="player-avatar">
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="element?.avatar">
                    <img :src="element.avatar" class="avatar-img" :alt="displayNameFor(element)" />
                  </template>
                  <template v-else>
                    <div class="avatar-fallback">{{ initials(displayNameFor(element)) }}</div>
                  </template>
                  <div class="player-sub">Total: {{ displayTotalWinsForUid(element && element.uid) }}</div>
                </div>
                <div class="player-name">{{ displayNameFor(element) }}</div>
              </div>
              <div class="player-wins" :class="{ 'pulse-win': winsPulse[element.uid] }">🏆 {{ displayMatchWinsForUid(element && element.uid) }}</div>
              <div class="player-extra">
                <div class="extra-row">🏆 Wins (match): <strong>{{ displayMatchWinsForUid(element && element.uid) }}</strong></div>
                <div class="extra-row"><a :href="`/profile/${element && element.uid}`" class="player-link">View profile</a></div>
              </div>
            </div>
            </template>
        </draggable>
      </div>
      <div :class="['team-card', teamBOutlineClass]" @click="!teamsLocked && selectWinner('B')">
        <h2>Team B</h2>
        <draggable v-model="teamB" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
            <template #item="{ element }">
            <div class="player-avatar">
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="element?.avatar">
                    <img :src="element.avatar" class="avatar-img" :alt="displayNameFor(element)" />
                  </template>
                  <template v-else>
                    <div class="avatar-fallback">{{ initials(displayNameFor(element)) }}</div>
                  </template>
                  <div class="player-sub">Total: {{ displayTotalWinsForUid(element && element.uid) }}</div>
                </div>
                <div class="player-name">{{ displayNameFor(element) }}</div>
              </div>
              <div class="player-wins" :class="{ 'pulse-win': winsPulse[element.uid] }">🏆 {{ displayMatchWinsForUid(element && element.uid) }}</div>
              <div class="player-extra">
                <div class="extra-row">🏆 Wins (match): <strong>{{ displayMatchWinsForUid(element && element.uid) }}</strong></div>
                <div class="extra-row"><a :href="`/profile/${element && element.uid}`" class="player-link">View profile</a></div>
              </div>
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

  <!-- Rounds history panel (inlined & upgraded styling) -->
  <section class="rounds-history">
    <div class="rounds-header">
      <h2>Rounds History</h2>
      <div class="rounds-sub">Recent rounds, winners & player win counts</div>
    </div>

    <div v-if="!(rounds && rounds.length)" class="empty">No rounds played yet. Start a round to see history here.</div>

    <ul v-else class="round-list">
      <li v-for="(r, idx) in (rounds || [])" :key="r.ts" class="round-card" :title="formatDate(r.endedAt)">
        <div class="card-left">
          <div class="round-index">#{{ (rounds && rounds.length) ? (rounds.length - idx) : (idx + 1) }}</div>
          <div class="round-time">{{ formatDate(r.endedAt) }}</div>
          <div class="round-duration">⏱ {{ formatDuration(r.duration) }}</div>
        </div>

        <div class="card-main">
          <div class="teams-row">
            <div class="team-block team-a">
              <div class="team-title">A</div>
              <div class="team-members">
                <template v-for="uid in (r.teamA || [])" :key="uid">
                  <div class="member-pill">
              <div class="member-avatar-small">{{ initials(displayNameFor(uid)) }}</div>
              <div class="member-name">{{ displayNameFor(uid) }}</div>
              <div class="member-sub">Total: {{ displayTotalWinsForUid(uid) }}</div>
              <div class="member-wins" :class="{ 'pulse-win': winsPulse[uid] }">🏆 {{ displayMatchWinsForUid(uid) }}</div>
                  </div>
                </template>
              </div>
            </div>

            <div class="team-block team-b">
              <div class="team-title">B</div>
              <div class="team-members">
                <template v-for="uid in (r.teamB || [])" :key="uid">
                  <div class="member-pill">
                    <div class="member-avatar-small">{{ initials(displayNameFor(uid)) }}</div>
                      <div class="member-name">{{ displayNameFor(uid) }}</div>
                      <div class="member-sub">Total: {{ displayTotalWinsForUid(uid) }}</div>
                      <div class="member-wins" :class="{ 'pulse-win': winsPulse[uid] }">🏆 {{ displayMatchWinsForUid(uid) }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="round-footer">
            <div class="winner-pill">Winner: <strong>{{ r.winningTeam }} — {{ winnersLabel(r) }}</strong></div>
            <div class="round-actions">
              <button class="btn-mini">View details</button>
            </div>
          </div>
        </div>
      </li>
    </ul>
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
// RoundsHistory inlined below; no external import
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

const usersMap = ref({})
let usersUnsub = null
// playersMap stored under the match node (per-match counters like NumberOfWins)
const playersMap = ref({})
let playersMapUnsub = null
// per-match username-keyed wins (Matches/<id>/WinsByEachPlayer)
const winsByEachPlayer = ref({})
let winsByEachPlayerUnsub = null
// pulse flags per-uid for wins animation
const winsPulse = ref({})
// previous wins snapshot to detect increments
const prevWins = ref({})

function subscribeUsers() {
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
  usersUnsub = onDataChange('users', (val) => {
    usersMap.value = val || {}
  })
}

async function enrichPlayers(list) {
  if (!list || !list.length) return []
  const users = usersMap.value || {}
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
      // prefer live wins from users node, fallback to per-match playersMap.NumberOfWins if available
      let wins = 0
      if (resolved && (typeof resolved.wins !== 'undefined')) {
        wins = Number(resolved.wins || 0)
      } else {
        const pm = (playersMap.value && (playersMap.value[uid])) ? playersMap.value[uid] : null
        if (pm && typeof pm.NumberOfWins !== 'undefined') wins = Number(pm.NumberOfWins || 0)
      }
      return { uid, name, avatar, wins }
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

watch(matchData, async (next) => {
  await populateBenchFromMatch(next)
  // when matchData changes (or is discovered), ensure wins subscription follows
  try {
    await loadWins()
    await loadRounds()
  } catch (e) {
    console.warn('loadWins after matchData failed', e)
  }
}, { immediate: true, deep: true })

// Propagate live `users` updates (wins) into the in-memory player objects
// so the per-player trophy badges update immediately.
watch(usersMap, async (next) => {
  try {
    // detect increments and trigger pulse animations
    try {
      const users = next || {}
      for (const [uid, u] of Object.entries(users)) {
        const wins = Number((u && typeof u.wins !== 'undefined') ? (u.wins || 0) : 0)
        const prev = typeof prevWins.value[uid] !== 'undefined' ? Number(prevWins.value[uid] || 0) : undefined
        prevWins.value[uid] = wins
        if (typeof prev !== 'undefined' && wins > prev) {
          // set pulse flag
          winsPulse.value[uid] = true
          // clear after animation
          setTimeout(() => { try { winsPulse.value[uid] = false } catch (e) {} }, 900)
        }
      }
    } catch (e) {
      console.warn('failed to compute wins diff', e)
    }

    // Full re-enrich of displayed lists when users change is more robust
    // than trying to guess where wins live inside the user node.
    const rehydrate = async (listRef) => {
      if (!listRef || !listRef.value) return
      // build a minimal list of uid placeholders to re-enrich
      const minimal = listRef.value.map(p => ({ uid: (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null) })).filter(Boolean)
      if (!minimal.length) return
      const enriched = await enrichPlayers(minimal)
      // replace the list in-place so Vue picks up the change
      listRef.value.splice(0, listRef.value.length, ...enriched)
    }

    await rehydrate(bench)
    await rehydrate(teamA)
    await rehydrate(teamB)
  } catch (e) {
    console.warn('usersMap watcher failed to rehydrate player lists', e)
  }
}, { deep: true })


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

// Match detail derived values
const matchDateDisplay = computed(() => {
  try {
    if (matchData.value && matchData.value.date) return String(matchData.value.date)
    if (matchData.value && matchData.value.startAtISO) return new Date(matchData.value.startAtISO).toLocaleDateString()
    return '—'
  } catch (e) { return '—' }
})

const matchTimeDisplay = computed(() => {
  try {
    if (matchData.value && matchData.value.startTime && matchData.value.endTime) return `${matchData.value.startTime} — ${matchData.value.endTime}`
    if (matchData.value && matchData.value.startTime) return matchData.value.startTime
    if (matchData.value && matchData.value.startAtISO) return new Date(matchData.value.startAtISO).toLocaleTimeString()
    return '—'
  } catch (e) { return '—' }
})

const courtDisplay = computed(() => {
  try {
    return matchData.value && (matchData.value.court || matchData.value.venue || matchData.value.location || matchData.value.title) ? (matchData.value.court || matchData.value.venue || matchData.value.location || matchData.value.title) : 'Unknown venue'
  } catch (e) { return 'Unknown venue' }
})

const matchTypeDisplay = computed(() => {
  try { return matchData.value && matchData.value.type ? String(matchData.value.type) : 'Open' } catch (e) { return 'Open' }
})

const genderDisplay = computed(() => {
  try { return matchData.value && matchData.value.gender ? String(matchData.value.gender) : 'All' } catch (e) { return 'All' }
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
  } catch (e) { console.warn('loadWins failed', e) }
}

// --- rounds history (inlined) ---
const rounds = ref([])
let roundsUnsub = null
async function loadRounds() {
  try {
    const dbPath = (matchData.value && matchData.value.__dbPath) ? matchData.value.__dbPath : (matchId.value ? `matches/${matchId.value}` : null)
    if (!dbPath) return
    if (roundsUnsub) { try { roundsUnsub() } catch (e) {} ; roundsUnsub = null }
    roundsUnsub = onDataChange(`${dbPath}/roundsplayed`, (val) => {
      const arr = val ? Object.entries(val).map(([k, v]) => ({ ts: k, ...v })) : []
      arr.sort((a, b) => Number(b.ts) - Number(a.ts))
      rounds.value = arr
    })
  } catch (e) { console.warn('loadRounds error', e); rounds.value = [] }
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

function nameFor(uid) {
  const u = usersMap.value && usersMap.value[uid]
  return (u && (u.name || u.displayName || u.username)) || uid
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

function sanitizeUserKey(uname) {
  if (!uname) return String(uname || '').replace(/[.$#\[\]\/]/g, '_')
  return String(uname).replace(/[.$#\[\]\/]/g, '_')
}

function displayWinsForUid(uid) {
  if (!uid) return 0
  // prefer WinsByEachPlayer keyed by sanitized username
  const u = usersMap.value && usersMap.value[uid]
  const uname = (u && (u.username || u.name || u.displayName)) || uid
  const safe = sanitizeUserKey(uname)
  if (winsByEachPlayer.value && typeof winsByEachPlayer.value[safe] !== 'undefined') {
    return Number(winsByEachPlayer.value[safe] || 0)
  }
  // fallback to global users.wins
  if (u && typeof u.wins !== 'undefined') return Number(u.wins || 0)
  // fallback to per-match playersMap NumberOfWins
  const pm = playersMap.value && playersMap.value[uid]
  if (pm && typeof pm.NumberOfWins !== 'undefined') return Number(pm.NumberOfWins || 0)
  return 0
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

// computed stats object used by the optional StatisticsModal
const computedStats = computed(() => ({
  wins: { A: Number(winsA.value) || 0, B: Number(winsB.value) || 0, total: Number(winsTotal.value) || 0 },
  teams: { teamA: teamA.value || [], teamB: teamB.value || [] },
  match: matchData.value || {}
}))


onMounted(async () => {
  if (!matchId.value && !route.query.path) return
  try {
    // start live users subscription so player wins are available when enriching
    subscribeUsers()
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
      const nowIso = new Date().toISOString()
      // ensure round is closed
      await setChildData(dbPath, 'roundActive', false)
      await setChildData(dbPath, 'lastRoundEndedAt', nowIso)
      // mark match as ended so Matches.vue treats it as past immediately
      try {
        await setChildData(dbPath, 'started', false)
      } catch (e) { /* non-fatal */ }
      try {
        await setChildData(dbPath, 'endedAt', nowIso)
      } catch (e) { /* non-fatal */ }
      // also set endAtISO for consistency with other places that check ISO fields
      try { await setChildData(dbPath, 'endAtISO', nowIso) } catch (e) {}
      // keep local model in sync so UI updates immediately
      try { matchData.value = { ...(matchData.value || {}), started: false, endedAt: nowIso, endAtISO: nowIso } } catch (e) {}
      // navigate back to Matches so the card shows under Past Matches
      try { await router.push('/matches') } catch (e) { /* ignore navigation failures */ }
    }
  } catch (e) { /* ignore persistence errors */ }
}

function goBack() { router.back() }

onBeforeUnmount(() => {
  if (winsUnsub) {
    try { winsUnsub() } catch (e) {}
    winsUnsub = null
  }
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
  if (roundsUnsub) {
    try { roundsUnsub() } catch (e) {}
    roundsUnsub = null
  }
  if (playersMapUnsub) { try { playersMapUnsub() } catch (e) {} ; playersMapUnsub = null }
  if (winsByEachPlayerUnsub) { try { winsByEachPlayerUnsub() } catch (e) {} ; winsByEachPlayerUnsub = null }
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
  /* player tile row: avatar + name on left, wins on right */
  .player-avatar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 10px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02)); border-radius:10px; border:1px solid rgba(255,255,255,0.02); position:relative; white-space:nowrap }
  .player-left { display:flex; align-items:center; gap:12px; min-width:0; overflow:hidden }
  /* Full-width tiles for team lists */
  .team-drop-list { display:flex; flex-direction:column; gap:12px; align-items:stretch }
  .team-drop-list .player-avatar { width:100% }
  /* Keep bench compact */
  .bench-list { display:flex; gap:28px; min-height:100px; flex-wrap:wrap; align-items:flex-start }
  .bench-list .player-avatar { width:auto }
  .avatar-img { width:48px; height:48px; border-radius:50%; border:3px solid #FFAD1D; object-fit:cover; flex-shrink:0 }
  .avatar-fallback { width:48px; height:48px; border-radius:50%; border:3px solid #FFAD1D; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#ffad1d; font-weight:700; font-size:1rem; flex-shrink:0 }
  .player-name { color: #ffad1d; font-weight: 700; font-size: 0.98rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; flex:1; min-width:0 }
  .avatar-block { display:flex; flex-direction:column; align-items:center; gap:6px; margin-right:8px }
  .player-sub { color: #cfc9b0; font-weight:600; font-size:0.78rem; margin-top:2px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden }
  .player-sub { color: #cfc9b0; font-weight:600; font-size:0.78rem; margin-top:2px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden }
  .player-wins { margin-left:12px; color:#fff; font-weight:900; font-size:1rem; display:flex; align-items:center; gap:8px; color:#ffd98a; flex-shrink:0 }
  .player-extra { position:absolute; right:12px; top:calc(100% + 8px); background:#0f1316; border:1px solid rgba(255,255,255,0.03); padding:8px 10px; border-radius:8px; min-width:160px; box-shadow:0 10px 30px rgba(0,0,0,0.6); opacity:0; transform:translateY(-6px); transition:opacity 180ms ease, transform 180ms ease; pointer-events:none; z-index:40 }
  .player-avatar:hover .player-extra { opacity:1; transform:translateY(0); pointer-events:auto }
  .player-extra .extra-row { color:#d3c7a3; font-weight:700; margin-bottom:6px }
  .player-link { color:#ffda99; font-weight:800; text-decoration:none }
  /* ensure contents stay inline and never wrap */
  .team-drop-list .player-avatar, .team-drop-list .player-avatar * { white-space:nowrap }

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

/* --- Rounds history upgraded styles --- */
.rounds-history { margin: 22px auto; max-width: 980px; background: linear-gradient(180deg,#0f1114,#15161a); padding: 16px; border-radius: 14px; border:1px solid rgba(255,255,255,0.04); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
.rounds-header { display:flex; justify-content:space-between; align-items:baseline; gap:12px; margin-bottom:12px }
.rounds-header h2 { color:#ffd98a; margin:0; font-size:1.6rem }
.rounds-sub { color:#d3c7a3; font-size:0.9rem }
.round-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px }
.round-card { display:flex; gap:12px; align-items:flex-start; background: linear-gradient(90deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02)); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.03); transition: transform 180ms ease, box-shadow 180ms ease; }
.round-card:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(0,0,0,0.6); }
.card-left { width:140px; display:flex; flex-direction:column; gap:6px; align-items:flex-start }
.round-index { font-weight:900; color:#fff; font-size:1.1rem }
.round-time { color:#d3c7a3; font-size:0.85rem }
.round-duration { color:#ffd98a; font-weight:800; font-size:0.85rem }
.card-main { flex:1; display:flex; flex-direction:column; gap:10px }
.teams-row { display:flex; gap:10px; align-items:flex-start }
.team-block { flex:1; background: rgba(255,255,255,0.02); padding:8px; border-radius:10px }
.team-title { font-weight:900; color:#fff4d1; margin-bottom:8px }
.team-members { display:flex; gap:8px; flex-wrap:wrap }
.member-pill { display:flex; gap:8px; align-items:center; background: linear-gradient(180deg, #0f1114, #141516); padding:6px 8px; border-radius:8px; border:1px solid rgba(255,255,255,0.03); }
.member-avatar-small { width:30px; height:30px; border-radius:50%; background:#ffad1d; color:#0b0b0b; display:flex; align-items:center; justify-content:center; font-weight:900 }
  .member-name { color:#fff; font-weight:800; font-size:0.82rem }
  .member-sub { color:#cfc9b0; font-weight:700; font-size:0.72rem; margin-left:4px }
  .member-wins { color:#ffd98a; font-weight:900; margin-left:6px }
.round-footer { display:flex; justify-content:space-between; align-items:center }
.winner-pill { background: linear-gradient(90deg,#1f262b,#23272b); color:#ffd98a; padding:6px 10px; border-radius:10px; font-weight:800 }
.btn-mini { background:#ffad1d; border:none; color:#0b0b0b; padding:6px 10px; border-radius:8px; font-weight:800; cursor:pointer }

/* pulse animation for wins increments */
.pulse-win { animation: wins-pulse 820ms cubic-bezier(.2,.9,.2,1); transform-origin: center; }
@keyframes wins-pulse {
  0% { transform: scale(1); filter: drop-shadow(0 0 0 rgba(255,215,120,0)); }
  25% { transform: scale(1.18); }
  55% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

/* Match details card */
.match-details { max-width:980px; margin:18px auto; background: linear-gradient(180deg,#0f1114,#15161a); border-radius:12px; padding:12px 14px; border:1px solid rgba(255,255,255,0.03); }
.details-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; align-items:center }
.detail-item { display:flex; gap:12px; align-items:center }
.detail-icon { width:42px; height:42px; border-radius:8px; background:linear-gradient(180deg,#111315,#1b1f22); display:flex; align-items:center; justify-content:center; font-size:20px; color:#ffd98a; border:1px solid rgba(255,255,255,0.03) }
.detail-label { color:#d3c7a3; font-weight:700; font-size:0.82rem }
.detail-value { color:#fff; font-weight:900; margin-top:2px }

/* subtle tile hover expansion */
.player-avatar { transition: transform 180ms ease, box-shadow 180ms ease }
.player-avatar:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(0,0,0,0.6) }

</style>
