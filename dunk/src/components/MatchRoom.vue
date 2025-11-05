<template>
  <div class="matchroom-container">
    <!-- Final Match Results View (shown when match is ended) -->
    <div v-if="isMatchEnded" class="final-results-view">
      <header class="final-results-header">
        <h1>Final Match Results</h1>
        <button @click="closeFinalResults" class="close-btn" aria-label="Close">✕</button>
      </header>

      <!-- Rounds History -->
      <section class="rounds-history">
        <h2 class="rounds-history-header">Rounds History</h2>

        <div v-if="!(rounds && rounds.length)" class="rounds-empty">No rounds played yet.</div>

        <div v-else class="round-list">
          <div v-for="(r, idx) in (rounds || [])" :key="r.ts" class="round-card" :title="formatDate(r.endedAt)">
            <div class="round-card-header">
              <span class="round-index">Round {{ roundsCount ? (roundsCount - idx) : (idx + 1) }}</span>
              <span class="round-time">{{ formatDate(r.endedAt) }}</span>
              <span class="round-duration">{{ formatDuration(r.duration) }}</span>
            </div>

            <div class="round-teams">
              <div class="round-team">
                <div class="round-team-label">Team A</div>
                <div class="round-team-roster">
                  <div v-for="uid in (r.teamA || [])" :key="uid" class="round-player">
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
                  <div v-for="uid in (r.teamB || [])" :key="uid" class="round-player">
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

    <!-- Normal Match Room View (shown when match is active) -->
    <div v-else>
    <header>
      <button @click="goBack" class="close-btn" aria-label="Close">✕</button>
      <h1 v-if="teamsLocked">Round #{{ roundsCount + 1 }}</h1>
      <h1 v-else>{{ displayTitle }}</h1>
      <button v-if="!isPlayerView && isHost" @click="onEndMatch" class="end-match-btn">End Match</button>
    </header>
    <div class="title-actions" style="text-align: center;">
      <button @click="showSummary = true" class="summary-btn">Match Summary</button>
    </div>

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
        :disabled="teamsLocked || !isHost"
        class="bench-list"
        item-key="uid"
      >

    <template #item="{ element }">
  <div class="player-avatar" title="" @click="openProfileModal(element)">
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="displayAvatarFor(element)">
                    <img :src="displayAvatarFor(element)" class="avatar-img" :alt="displayNameFor(element)" />
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
      <!-- If this is the player-only nested view and teams are locked, show a read-only timer card so
           players see the round UI (but cannot set or start the timer). -->
      <div v-if="isPlayerView && teamsLocked" class="timer-card">
        <div class="timer-header">Round Timer</div>
        <div class="timer-main">
          <div class="time-large">00:00</div>
          <div class="progress-wrap" aria-hidden="true">
            <div class="progress-bar" style="width:0%"></div>
          </div>
        </div>
        <div class="timer-controls">
          <button class="btn-start disabled-btn" disabled>Start Round</button>
        </div>
      </div>
    </div>

  

    <!-- Teams Grid -->
    <section class="teams-grid">
      <div :class="['team-card', teamAOutlineClass]" @click="!teamsLocked && selectWinner('A')">
        <h2>Team A</h2>
  <draggable v-model="teamA" :group="'players'" :disabled="teamsLocked || !isHost" item-key="uid" class="team-drop-list">
            <template #item="{ element }">
            <div class="player-avatar" title="" @click="openProfileModal(element)">
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="displayAvatarFor(element)">
                    <img :src="displayAvatarFor(element)" class="avatar-img" :alt="displayNameFor(element)" />
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
  <draggable v-model="teamB" :group="'players'" :disabled="teamsLocked || !isHost" item-key="uid" class="team-drop-list">
            <template #item="{ element }">
            <div class="player-avatar" title="" @click="openProfileModal(element)">
              <div class="player-left">
                <div class="avatar-block">
                  <template v-if="displayAvatarFor(element)">
                    <img :src="displayAvatarFor(element)" class="avatar-img" :alt="displayNameFor(element)" />
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
        <!-- Only show host controls when this is NOT the player-only nested view and the user is host -->
        <template v-if="!isPlayerView && isHost">
          <!-- Show "Go to Round" when round is active (teams locked from active round) -->
          <button v-if="teamsLocked" @click="goToRound" class="go-to-round-btn">Go to Round</button>
          <!-- Show team controls when round is not active -->
          <template v-else>
            <button @click="randomizeTeams">Randomize Teams</button>
            <button
              @click="confirmTeams"
              :disabled="!teamReady"
              :class="{ pulsate: confirmShouldPulse }"
            >Confirm Teams</button>
          </template>
        </template>
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
    <h2 class="rounds-history-header">Rounds History</h2>

    <div v-if="!((rounds || []).length)" class="rounds-empty">No rounds played yet. Start a round to see history here.</div>

    <div v-else class="round-list">
      <div v-for="(r, idx) in (rounds || [])" :key="r.ts" class="round-card" :title="formatDate(r.endedAt)">
        <div class="round-card-header">
          <span class="round-index">Round {{ (rounds && rounds.length) ? (rounds.length - idx) : (idx + 1) }}</span>
          <span class="round-time">{{ formatDate(r.endedAt) }}</span>
          <span class="round-duration">{{ formatDuration(r.duration) }}</span>
        </div>

        <div class="round-teams">
          <div class="round-team">
            <div class="round-team-label">Team A</div>
            <div class="round-team-roster">
              <div v-for="uid in (r.teamA || [])" :key="uid" class="round-player">
                <div class="round-avatar"  @click="openProfileModal(uid)">
                  <img v-if="displayAvatarFor(uid)" :src="displayAvatarFor(uid)" class="round-avatar-img" :alt="displayNameFor(uid)" />
                  <div v-else class="round-avatar-fallback"  @click="openProfileModal(uid)">{{ initials(displayNameFor(uid)) }}</div>
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
              <div v-for="uid in (r.teamB || [])" :key="uid" class="round-player">
                <div class="round-avatar" @click="openProfileModal(uid)">
                  <img v-if="displayAvatarFor(uid)" :src="displayAvatarFor(uid)" class="round-avatar-img" :alt="displayNameFor(uid)" />
                  <div v-else class="round-avatar-fallback" @click="openProfileModal(uid)">{{ initials(displayNameFor(uid)) }}</div>
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

  <!-- Stats Modal -->
  <EndMatchSummary v-if="showStats" :dbPath="(matchData && matchData.__dbPath) || (matchId ? `matches/${matchId}` : null)" :matchData="matchData" @close="showStats=false" />
  <EndMatchSummary v-if="showSummary" :dbPath="(matchData && matchData.__dbPath) || (matchId ? `matches/${matchId}` : null)" :matchData="matchData" compact @close="showSummary=false" />
  <ProfileModal v-if="showProfileModal" :uid="profileModalUid" :initialProfile="profileModalInitial" @close="closeProfileModal" />
  <ConfirmModal 
    v-model="showEndConfirm"
    title="End match"
    message="End the match now?"
    confirmLabel="OK"
    cancelLabel="Cancel"
    @confirm="confirmEndMatch"
  />
  <!-- <StatisticsModal v-if="showStats" :stats="computedStats" @close="showStats=false" /> -->
  <!-- nested child route outlet for player-only view -->
  <router-view />
  </div>
  </div>
  
</template>



<script setup>

import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
 import draggable from 'vuedraggable'
 import { useRoute, useRouter } from 'vue-router'
import { onUserStateChanged } from '../firebase/auth'
import { getDataFromFirebase, setChildData, onDataChange } from '../firebase/firebase'
import { avatarForUser } from '../utils/avatar.js'
import ProfileModal from './ProfileModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import EndMatchSummary from './EndMatchSummary.vue'
// RoundsHistory inlined below; no external import

const route = useRoute()
const router = useRouter()
const matchId = computed(() => route.params.id)

// determine if nested player child route is active
const isPlayerView = computed(() => String(route.name) === 'PlayerRoom' || String(route.path || '').endsWith('/player'))

// auth state so we can detect host user
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
    console.log('isHost check:', { currentUserUid: uid, owner, result: false })
    return false
  } catch (e) { 
    console.log('isHost error:', e)
    return false
  }
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

// modal state for profile
const showProfileModal = ref(false)
const profileModalUid = ref(null)
// optional initial profile object to render immediately in the modal so
// the modal view matches the pill the user clicked (avoids mismatch while
// the modal subscribes to the users/<uid> node).
const profileModalInitial = ref(null)

// Confirm modal state for end match
const showEndConfirm = ref(false)

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
function closeProfileModal() { showProfileModal.value = false; profileModalUid.value = null; profileModalInitial.value = null }

/** Initial player data */
const allPlayers = []
const matchData = ref({})
const bench = ref([]) 

function normalizePlayers(playersNode) {
  console.log('🔄 normalizePlayers input:', playersNode)
  if (!playersNode) return []
  if (Array.isArray(playersNode)) {
    const result = playersNode.map(p => ({
      uid: p?.uid || p?.id || p?.key || '',
      name: p?.name || p?.displayName || p?.username || null,
      avatar: p?.avatar || p?.photoURL || null
    }))
    console.log('✅ normalizePlayers (array) result:', result)
    return result
  }
  if (typeof playersNode === 'object') {
    const result = Object.entries(playersNode).map(([k, v]) => {
      // Handle cases where v is just `true` (e.g., joinedBy: { uid: true })
      if (v === true) {
        return { uid: k, name: null, avatar: null }
      }
      // Handle string values (e.g., joinedBy: { uid: "username" })
      if (typeof v === 'string') {
        return { uid: k, name: v, avatar: null }
      }
      // Handle object values
      return {
        uid: v?.uid || v?.id || v?.key || k,
        name: v?.name || v?.displayName || v?.username || null,
        avatar: v?.avatar || v?.photoURL || null
      }
    })
    console.log('✅ normalizePlayers (object) result:', result)
    return result
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
  console.log('MatchRoom: Setting up users subscription')
  return new Promise((resolve) => {
    let firstLoad = true
    usersUnsub = onDataChange('users', (val) => {
      usersMap.value = val || {}
      console.log('MatchRoom: usersMap updated with', Object.keys(usersMap.value).length, 'users')
      if (firstLoad) {
        firstLoad = false
        resolve()
      }
    })
  })
}

async function enrichPlayers(list) {
  if (!list || !list.length) return []
  const users = usersMap.value || {}
  console.log('MatchRoom enrichPlayers: input list', list)
  console.log('MatchRoom enrichPlayers: usersMap has', Object.keys(users).length, 'users')
  console.log('MatchRoom enrichPlayers: usersMap keys:', Object.keys(users))
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
    console.log('MatchRoom enrichPlayers: processing item', p, 'type:', typeof p)
    // Handle both string UIDs and objects
    const uid = (typeof p === 'string') ? p : (p.uid || p.id || p.key || '')
    console.log('MatchRoom enrichPlayers: extracted uid:', uid)
  // robust lookup: try direct key, trimmed key, then value-field matches
  let resolved = (users && users[uid]) || null
  let resolvedKey = resolved ? uid : null
  if (!resolved) {
    const keys = Object.keys(users || {})
    // try trimmed exact match
    const kTrim = keys.find(k => String(k).trim() === String(uid).trim())
    if (kTrim) {
      resolved = users[kTrim]
      resolvedKey = kTrim
    }
  }
  if (!resolved) {
    // try to find user by matching common id fields inside the user objects
    const found = Object.entries(users || {}).find(([k, v]) => {
      if (!v || typeof v !== 'object') return false
      return (v.uid === uid || v.id === uid || v.key === uid || v.userId === uid || v.username === uid)
    })
    if (found) {
      resolvedKey = found[0]
      resolved = found[1]
    }
  }
  console.log('MatchRoom enrichPlayers: uid', uid, 'resolved:', resolved ? `FOUND (key=${resolvedKey})` : 'NOT FOUND', resolved ? resolved.name : '')
    // prefer profile values from usersMap (resolved) over any local fields on p
    // Prefer an explicit profilepicture field if present (new canonical key)
    const avatar = (resolved && (resolved.profilepicture || resolved.avatar || resolved.photoURL || resolved.picture || resolved.photo || resolved.imageURL || resolved.thumbnail)) || (typeof p === 'object' ? p.avatar : null) || null

    // If no avatar at all, generate a fallback seeded by profile name or local name
    let finalAvatar = avatar
    if (!finalAvatar) {
      const pName = (typeof p === 'object') ? p.name : null
      const seedName = encodeURIComponent(((resolved && (resolved.name || resolved.displayName || resolved.username)) || pName || uid || '').split(' ')[0])
      if (resolved && resolved.gender) {
        finalAvatar = (String(resolved.gender).toLowerCase() === 'female')
          ? `https://avatar.iran.liara.run/public/girl?username=${seedName}`
          : `https://avatar.iran.liara.run/public/boy?username=${seedName}`
      } else {
        const nameFull = encodeURIComponent(((resolved && (resolved.name || resolved.displayName)) || pName || uid).trim())
        finalAvatar = `https://ui-avatars.com/api/?name=${nameFull}&background=1f262b&color=ffad1d&format=png&size=128`
      }

      // persist generated avatar into users/<uid>/profilepicture when possible
      if (resolved && uid) {
        try {
          // fire-and-forget; non-blocking
          setChildData(`users/${uid}`, 'profilepicture', finalAvatar).catch(() => {})
        } catch (e) { /* ignore */ }
      }
    }

    // Prefer canonical profile name stored under users/<uid>.name first
    const name = (resolved && (resolved.name || resolved.displayName || resolved.username)) || p.name || uid || 'Player'
      // prefer live wins from users node, fallback to per-match playersMap.NumberOfWins if available
      let wins = 0
      if (resolved && (typeof resolved.wins !== 'undefined')) {
        wins = Number(resolved.wins || 0)
      } else {
        const pm = (playersMap.value && (playersMap.value[uid])) ? playersMap.value[uid] : null
        if (pm && typeof pm.NumberOfWins !== 'undefined') wins = Number(pm.NumberOfWins || 0)
      }
    return { uid, name, avatar: finalAvatar, wins }
  })
  console.log('MatchRoom enrichPlayers: returning', out.length, 'enriched players')
  return out
}

async function populateBenchFromMatch(md) {
  console.log('🏀 populateBenchFromMatch called with matchData:', md)
  if (!md || typeof md !== 'object') {
    console.log('⚠️ populateBenchFromMatch: no match data, using allPlayers')
    bench.value = [...allPlayers]
    return
  }
  // common fields to check - ADDED joinedBy
  const fields = ['players', 'joined', 'joinedBy', 'participants', 'playersList', 'roster', 'members', 'playersMap', 'attendees']
  let raw = null
  for (const f of fields) {
    if (md[f]) { 
      console.log(`✅ Found players in field '${f}':`, md[f])
      raw = md[f]; 
      break 
    }
  }
  
  if (!raw) {
    console.log('⚠️ No players found in standard fields, checking nested...')
  }
  
  // sometimes players live at match.players.<uid> or deeper nested
  if (!raw && md.players && typeof md.players === 'object' && Object.keys(md.players).length && !Array.isArray(md.players)) {
    console.log('✅ Found nested players object:', md.players)
    raw = md.players
  }
  
  let normalized = normalizePlayers(raw)
  console.log('📊 Normalized players:', normalized)
  
  if (!normalized.length) {
    // fallback: if matchData has a simple array of uids in 'uids'
    if (Array.isArray(md.uids) && md.uids.length) {
      console.log('✅ Found uids array:', md.uids)
      normalized = md.uids.map(u => ({ uid: u, name: null, avatar: null }))
    }
  }
  
  if (!normalized.length) {
    console.log('⚠️ No players found after normalization, using allPlayers')
    bench.value = [...allPlayers]
    return
  }
  
  console.log('🔄 Enriching players...')
  bench.value = await enrichPlayers(normalized)
  console.log('✅ Enriched bench:', bench.value)
  
  try {
    // Remove any players from bench who are already present in teamA or teamB
    const assigned = new Set()
    ;(teamA.value || []).forEach(p => { const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null); if (uid) assigned.add(uid) })
    ;(teamB.value || []).forEach(p => { const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null); if (uid) assigned.add(uid) })
    if (assigned.size) {
      console.log('🔧 Removing assigned players from bench:', Array.from(assigned))
      bench.value = (bench.value || []).filter(p => { const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null); return !assigned.has(uid) })
    }
  } catch (e) { console.warn('populateBenchFromMatch dedupe failed', e) }
  console.log('🏁 Final bench entries:', bench.value)
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
const winsTotal = computed(() => (Number(winsA.value || 0)) + (Number(winsB.value || 0)))
const winsPercentA = computed(() => { const t = winsTotal.value; return t ? Math.round((Number(winsA.value || 0) / t) * 100) : 0 })
const winsPercentB = computed(() => { const t = winsTotal.value; return t ? Math.round((Number(winsB.value || 0) / t) * 100) : 0 })
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

let teamsUnsub = null
let hasNavigatedToRound = false // Track if we've already navigated to prevent loops
let manuallyReturnedToMatchRoom = false // Track if user manually clicked back from RoundStarted
let lastTeamsHash = null // track last seen teams to detect changes
let lastTeamsConfirmedAt = null
let matchRoundActiveUnsub = null
async function subscribeTeams(dbPath) {
  try {
    if (!dbPath) return
    console.log('subscribeTeams: setting up subscription for', dbPath)
    if (teamsUnsub) { try { teamsUnsub() } catch (e) {} ; teamsUnsub = null }
    // Subscribe to teams node so non-host players update their UI when host confirms
    teamsUnsub = onDataChange(`${dbPath}/teams`, async (val) => {
      console.log('subscribeTeams: teams change detected', val)
      try {
        if (!val) {
          // clear teams if DB teams removed
          teamA.value = []
          teamB.value = []
          teamsLocked.value = false
          await populateBenchFromMatch(matchData.value)
          return
        }
        const rawA = Array.isArray(val.teamA) ? val.teamA : (val.teamA ? normalizePlayers(val.teamA) : [])
        const rawB = Array.isArray(val.teamB) ? val.teamB : (val.teamB ? normalizePlayers(val.teamB) : [])
        const enrichedA = await enrichPlayers(rawA)
        const enrichedB = await enrichPlayers(rawB)
        
        // Only update teams if this is NOT the host, or if teams are currently empty
        // This prevents overwriting the host's local team assignments when they return to MatchRoom
        if (!isHost.value || ((teamA.value || []).length === 0 && (teamB.value || []).length === 0)) {
          teamA.value = enrichedA
          teamB.value = enrichedB
          // Only lock teams for non-host players
          // Hosts should always be able to reorganize teams for the next round
          if (!isHost.value) {
            teamsLocked.value = true
          }
          // remove assigned players from bench
          try {
            const removed = new Set([...(enrichedA || []).map(p => p.uid), ...(enrichedB || []).map(p => p.uid)])
            bench.value = (bench.value || []).filter(p => !removed.has(p.uid))
          } catch (e) { /* ignore */ }
        }
        
        // If this is a non-host player viewing MatchRoom and teams just became locked,
        // navigate them to RoundStarted so they see the same UI as the host.
        // We compute a teams hash so that if teams change (host confirms new teams)
        // we will clear the manual-return block and navigate players.
        try {
          const teamsArr = { teamA: (val && val.teamA) ? (Array.isArray(val.teamA) ? val.teamA : Object.values(val.teamA)) : [], teamB: (val && val.teamB) ? (Array.isArray(val.teamB) ? val.teamB : Object.values(val.teamB)) : [] }
          const newHash = JSON.stringify({ a: (teamsArr.teamA || []).slice().sort(), b: (teamsArr.teamB || []).slice().sort() })
          const hasTeams = !!(val && (val.teamA || val.teamB))
          console.log('subscribeTeams: teams updated', { isHost: isHost.value, hasTeams, currentRoute: route.path, hasNavigated: hasNavigatedToRound, manualReturn: manuallyReturnedToMatchRoom, newHash, lastTeamsHash })

          // If teams changed compared to last seen, allow navigation (clear manual-return)
          if (lastTeamsHash !== newHash) {
            console.log('subscribeTeams: detected teams change (hash mismatch). resetting manual return flag')
            manuallyReturnedToMatchRoom = false
            lastTeamsHash = newHash
          }
          // Also check for an explicit teamsConfirmedAt timestamp written by the host
          const confirmedAt = (val && (val.teamsConfirmedAt || val.teamsConfirmedAt === 0)) ? String(val.teamsConfirmedAt) : (val && val.teamsConfirmed) ? String(val.teamsConfirmed) : null
          if (confirmedAt && confirmedAt !== lastTeamsConfirmedAt) {
            console.log('subscribeTeams: detected teamsConfirmedAt change', { new: confirmedAt, old: lastTeamsConfirmedAt })
            manuallyReturnedToMatchRoom = false
            lastTeamsConfirmedAt = confirmedAt
          }

          if (!hasNavigatedToRound && !isHost.value && hasTeams && !manuallyReturnedToMatchRoom) {
            hasNavigatedToRound = true // Set flag to prevent re-navigation
            console.log('Non-host detected with teams - navigating to RoundStarted')
            // navigate to RoundStarted with teams in state
            const query = (matchData.value && matchData.value.__dbPath) ? { path: matchData.value.__dbPath } : {}
            const teamAUids = (enrichedA || []).map(p => p.uid || p.name || p)
            const teamBUids = (enrichedB || []).map(p => p.uid || p.name || p)
            const state = { teams: { teamA: teamAUids, teamB: teamBUids }, confirmed: true }
            if (matchData.value && matchData.value.__dbPath) state.matchPath = matchData.value.__dbPath
            // include owner so RoundStarted can detect non-host immediately
            const owner = matchData.value && (matchData.value.ownerId || matchData.value.ownerUid || matchData.value.owner || matchData.value.createdby || matchData.value.host)
            if (owner) state.owner = owner
            console.log('Pushing to RoundStarted with state:', state)
            await router.push({ name: 'RoundStarted', params: { id: matchId.value }, query, state })
            console.log('Navigation complete')
          }
        } catch (e) { console.warn('Failed to navigate player to RoundStarted', e) }
      } catch (e) { console.warn('subscribeTeams handler failed', e) }
    })

    // Also subscribe to an explicit teamsLocked boolean in case host toggles it separately
    // Only apply this lock to non-hosts; hosts should always be able to edit teams
    try {
      onDataChange(`${dbPath}/teamsLocked`, (val) => {
        try { 
          if (!isHost.value) {
            teamsLocked.value = !!val 
          }
        } catch (e) {}
      })
    } catch (e) { /* ignore */ }

  } catch (e) { console.warn('subscribeTeams failed', e) }
}

// --- rounds history (inlined) ---
const rounds = ref([])
const roundsCount = computed(() => (rounds.value || []).length || 0)
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

function avatarForUid(uid) {
  if (!uid) return avatarForUser('anon')
  const u = usersMap.value && usersMap.value[uid]
  if (u && u.profilepicture) return u.profilepicture
  if (u && u.avatar) return u.avatar
  return avatarForUser(u || uid)
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
    // start live users subscription and wait for initial load
    // so enrichPlayers can resolve profile names immediately
    await subscribeUsers()
    console.log('MatchRoom onMounted: subscribeUsers complete')
    let data = null
    const pathQuery = route.query.path
    // If navigation provided teams via history state (for example returning
    // from RoundStarted), restore them so the UI shows the confirmed
    // allocations immediately but do NOT lock them — the user should be able
    // to re-randomize or re-assign after returning.
    const historyState = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : null
    let restoredTeams = false
    // Only restore teams automatically if the navigation explicitly marks
    // them as confirmed (coming back after a winner confirmation) or when a
    // manual restore flag is present. This prevents End Round (which merely
    // stops the timer) from causing an automatic restore.
    if (historyState && historyState.teams && (historyState.confirmed === true || historyState.restore === true)) {
      try {
        const teams = historyState.teams || {}
        const rawA = Array.isArray(teams.teamA) ? teams.teamA.map(u => (typeof u === 'string' ? { uid: u } : (u && u.uid ? { uid: u.uid } : u))) : []
        const rawB = Array.isArray(teams.teamB) ? teams.teamB.map(u => (typeof u === 'string' ? { uid: u } : (u && u.uid ? { uid: u.uid } : u))) : []
        teamA.value = await enrichPlayers(rawA)
        teamB.value = await enrichPlayers(rawB)
        // Lock teams if coming back from an active round, unlock if winner was selected
        // roundActive: true = timer was running, lock teams and show "Go to Round"
        // confirmed: true (without roundActive) = winner selected, unlock teams for next round
        teamsLocked.value = historyState.roundActive === true
        // compute and remember teams hash so subscribeTeams can detect future changes
        try {
          const a = Array.isArray(teams.teamA) ? teams.teamA : (teams.teamA ? Object.values(teams.teamA) : [])
          const b = Array.isArray(teams.teamB) ? teams.teamB : (teams.teamB ? Object.values(teams.teamB) : [])
          lastTeamsHash = JSON.stringify({ a: (a || []).slice().sort(), b: (b || []).slice().sort() })
        } catch (e) { /* ignore */ }
        // If restore flag is present, user manually clicked back - prevent immediate auto-navigation
        if (historyState.restore === true) {
          manuallyReturnedToMatchRoom = true
          console.log('Manual return detected - will not auto-navigate to RoundStarted')
        }
        restoredTeams = true
        // if matchPath provided, prefer it when loading matchData below
        if (historyState.matchPath) route.query.path = historyState.matchPath
      } catch (e) { console.warn('Failed to restore teams from history state', e) }
    }
    if (pathQuery) {
      console.log('🔍 Loading match from pathQuery:', pathQuery)
      data = await getDataFromFirebase(pathQuery)
      if (data) { 
        console.log('✅ Match data loaded from pathQuery:', data)
        matchData.value = { ...(data || {}), __dbPath: String(pathQuery) }
        // Don't return here - continue to set up subscriptions below
      }
    }
    if (!data) {
      console.log('🔍 Loading match from matches/' + matchId.value)
      data = await getDataFromFirebase(`matches/${matchId.value}`)
      if (data) {
        console.log('✅ Match data loaded from matches/', data)
        matchData.value = { ...(data || {}), __dbPath: `matches/${matchId.value}` }
      }
    }
    if (!data) {
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
      console.log('📋 Manually calling populateBenchFromMatch with:', matchData.value)
      await populateBenchFromMatch(matchData.value)
      console.log('📋 After populateBenchFromMatch, bench has:', (bench.value || []).length, 'players')
      // If we restored teams from history state above, remove those players from the bench
      try {
        if (restoredTeams) {
          const removed = new Set([...(teamA.value || []).map(p => p.uid), ...(teamB.value || []).map(p => p.uid)])
          bench.value = (bench.value || []).filter(p => !removed.has(p.uid))
        }
      } catch (e) { console.warn('Failed to trim bench after restoring teams', e) }
      // subscribe to live wins updates for this match
      await loadWins()
      // subscribe to teams so players see confirmed team allocations
      try {
        const dbPath = await resolveMatchDbPath()
        console.log('onMounted: attempting to subscribe to teams at path:', dbPath)
        if (dbPath) {
          await subscribeTeams(dbPath)
          console.log('onMounted: subscribeTeams completed successfully')
          // subscribe to roundActive so hosts who navigate back while a round is
          // active see locked teams and the 'Go to Round' button
          try {
            if (matchRoundActiveUnsub) { try { matchRoundActiveUnsub() } catch (e) {} ; matchRoundActiveUnsub = null }
            matchRoundActiveUnsub = onDataChange(`${dbPath}/roundActive`, (val) => {
              try {
                // reflect remote round state locally
                roundActive.value = !!val
                // when a round is active, lock teams so they cannot be moved
                if (roundActive.value) {
                  teamsLocked.value = true
                } else {
                  // when round ends, allow teams to be unlocked according to DB
                  teamsLocked.value = !!val
                }
              } catch (e) { console.warn('match roundActive handler failed', e) }
            })
          } catch (e) { console.warn('subscribe to match roundActive failed', e) }
        } else {
          console.warn('onMounted: dbPath is null, cannot subscribe to teams')
        }
      } catch (e) { 
        console.error('subscribeTeams on mount failed', e) 
      }
  } catch (e) {
    console.error('Failed to load match data', e)
  }
})

const teamA = ref([])
const teamB = ref([])

const teamsLocked = ref(false)
const roundActive = ref(false)
const showStats = ref(false)
const showSummary = ref(false)

const teamReady = computed(() => ((teamA.value || []).length > 0 && (teamB.value || []).length > 0))
const confirmShouldPulse = computed(() => teamReady.value && !teamsLocked.value)
const startEnabled = computed(() => teamsLocked.value)
const startShouldPulse = computed(() => startEnabled.value && !roundActive.value)

// timer removed: startEnabled depends only on teamsLocked; keep startShouldPulse


/** Computed classes for team outlines */
const teamAOutlineClass = computed(() =>
  (teamA.value || []).length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)
const teamBOutlineClass = computed(() =>
  (teamB.value || []).length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
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
        teamB: teamB.value.map(p => p.uid || p.name || p),
        teamsConfirmedAt: Date.now() // Write timestamp alongside teams so subscription sees it
      }
    }
    await setChildData(dbPath, 'teams', payload.teams)
    // Persist a teamsLocked flag so other clients (players) can react and
    // show the confirmed allocations immediately.
    try { 
      await setChildData(dbPath, 'teamsLocked', true)
    } catch (e) { /* non-fatal */ }
  } catch (e) {
    console.warn('saveTeamsToDB failed', e)
  }
}

/** Shuffle bench/randomise teams and assign */
function randomizeTeams() {
  // Build a deduplicated pool of players from bench + current teams keyed by uid
  const poolMap = new Map()
  const addToPool = (arr) => {
    (arr || []).forEach(p => {
      const uid = (p && p.uid) ? p.uid : (typeof p === 'string' ? p : null)
      if (!uid) return
      // keep the object form if available (prefer enriched objects)
      if (!poolMap.has(uid)) poolMap.set(uid, p)
    })
  }
  addToPool(bench.value)
  addToPool(teamA.value)
  addToPool(teamB.value)
  const pool = Array.from(poolMap.values())
  // shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
  }
  teamA.value = []
  teamB.value = []
  pool.forEach((p, i) => { (i % 2 === 0 ? teamA.value : teamB.value).push(p) })
  bench.value = []
}
// You can annotate: "randomizeTeams() splits all players randomly between Team A and Team B"

async function confirmTeams() {
  console.log('confirmTeams() called', { teamA: (teamA.value || []).length, teamB: (teamB.value || []).length, matchId: matchId?.value })
  if (!((teamA.value || []).length && (teamB.value || []).length)) {
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
  // include owner info so RoundStarted can immediately detect host when
  // navigation arrives via history state (avoids a round-trip to DB before
  // enabling host-only controls)
  try {
    const owner = matchData.value && (matchData.value.ownerId || matchData.value.ownerUid || matchData.value.owner || matchData.value.createdby || matchData.value.host)
    if (owner) navState.owner = owner
  } catch (e) { /* ignore */ }
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

// Navigate to RoundStarted when round is already active
async function goToRound() {
  try {
    const navState = { 
      teams: { 
        teamA: teamA.value.map(p => p.uid || p.name || p), 
        teamB: teamB.value.map(p => p.uid || p.name || p) 
      },
      roundActive: true // Indicate round is already active
    }
    if (matchData.value && matchData.value.__dbPath) navState.matchPath = matchData.value.__dbPath
    const owner = matchData.value && (matchData.value.ownerId || matchData.value.ownerUid || matchData.value.owner || matchData.value.createdby || matchData.value.host)
    if (owner) navState.owner = owner
    
    const query = {}
    if (matchData.value && matchData.value.__dbPath) query.path = matchData.value.__dbPath
    
    await router.push({ name: 'RoundStarted', params: { id: matchId.value }, query, state: navState })
    console.log('Navigated to active round')
  } catch (err) {
    console.error('Navigation to round failed', err)
    try {
      await router.push(`/match/${encodeURIComponent(String(matchId.value))}/round`)
    } catch (err2) {
      console.error('Fallback navigation failed', err2)
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

function onEndMatch() {
  // Show confirm modal instead of browser confirm
  showEndConfirm.value = true
}

async function confirmEndMatch() {
  // Close the modal
  showEndConfirm.value = false
  
  // persist match end state and ensure roundActive is false
  try {
    const dbPath = await resolveMatchDbPath()
    if (dbPath) {
      const nowIso = new Date().toISOString()
      // ensure round is closed
      await setChildData(dbPath, 'roundActive', false)
      await setChildData(dbPath, 'lastRoundEndedAt', nowIso)
      // mark match as ended
      await setChildData(dbPath, 'matchEnded', true)
      await setChildData(dbPath, 'endedAt', nowIso)
      await setChildData(dbPath, 'endAtISO', nowIso)
      await setChildData(dbPath, 'started', false)
      // keep local model in sync so UI updates immediately
      matchData.value = { ...(matchData.value || {}), matchEnded: true, started: false, endedAt: nowIso, endAtISO: nowIso }
    }
  } catch (e) { 
    console.warn('End match error:', e)
  }
}

function closeFinalResults() {
  // Navigate back to Matches so the card shows under Past Matches
  try {
    router.push('/matches')
  } catch (e) {
    console.warn('Navigation failed:', e)
  }
}

function goBack() {
  // Close MatchRoom and navigate to Matches organizer showing the All Matches tab
  try {
    router.push({ path: '/matches', query: { tab: 'all' } })
  } catch (e) {
    // fallback to history back if push fails
    try { router.back() } catch (err) { /* ignore */ }
  }
}

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
  if (teamsUnsub) { try { teamsUnsub() } catch (e) {} ; teamsUnsub = null }
  if (matchRoundActiveUnsub) { try { matchRoundActiveUnsub() } catch (e) {} ; matchRoundActiveUnsub = null }
})

</script>

<style scoped>
/* Center header title and summary button; position nav buttons absolutely so title remains centered */
.matchroom-container > header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
}
.matchroom-container > header .back-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: #B23B3B; /* restored red background */
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 8px;
  padding: 9px 18px;
  font-weight: 700;
}
.matchroom-container > header .end-match-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
.title-actions { display:flex; justify-content:center; margin-top:8px; }
.summary-btn { display:inline-flex; margin:0 auto; }

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

/* Final Results View */
.final-results-view {
  min-height: 100vh;
  padding: 20px;
}
.final-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.final-results-header h1 {
  color: #ffd98a;
  font-size: 2.2rem;
  font-weight: 800;
  margin: 0;
}
.final-results-view .rounds-history {
  margin-top: 0;
}

/* ensure disabled attribute still shows cursor not-allowed where needed */
button[disabled] { cursor: not-allowed; opacity: 0.6; }

/* Go to Round button styling */
.go-to-round-btn {
  background: linear-gradient(90deg, #4a9eff, #2e7bd4) !important;
  color: #fff !important;
  font-weight: 700;
  padding: 10px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(74, 158, 255, 0.25);
  transition: all 0.2s ease;
}
.go-to-round-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(74, 158, 255, 0.35);
}

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

.timer-state { display:flex; justify-content:center; margin: 10px 0 18px; }
.state-row {
  display:flex;
  gap:18px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));
  padding:8px 14px;
  border-radius:10px;
  border:1px solid rgba(255,173,29,0.06);
  align-items:center;
}
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
  .player-avatar { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px 10px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02)); border-radius:10px; border:1px solid rgba(255,255,255,0.02); position:relative; white-space:nowrap; cursor: pointer; }
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
.summary-btn { border:none; background:#2b6baf; color:#fff; border-radius:8px; padding:9px 14px; font-weight:700; margin:0 6px; }
.title-actions { margin:8px 0 16px; display:flex; gap:8px; justify-content:center; width:100%; align-items:center }
.close-btn {
  border: none;
  background: transparent;
  color: #fff;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
}
.close-btn:hover { background: rgba(255,255,255,0.03); transform: scale(1.03) }
.bench-section p { font-size: 0.96rem; color: #ccc; margin-bottom:16px; }
.teams-grid { display: flex; gap: 34px; align-items: flex-start; justify-content: center; }

.player-pill { cursor: pointer; }

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

/* --- Rounds History Styles --- */
.rounds-history { 
  margin: 32px auto; 
  max-width: 980px; 
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
}
.round-player-stats { 
  display: flex; 
  gap: 6px; 
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
.matchroom-title {
  margin: 0;
  color: #fff;
  /* Match style from Matches.vue: keep white color but match font-size/weight */
  font-size: 48px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.details-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; align-items:center }
.detail-item { display:flex; gap:12px; align-items:center }
.detail-icon { width:42px; height:42px; border-radius:8px; background:linear-gradient(180deg,#111315,#1b1f22); display:flex; align-items:center; justify-content:center; font-size:20px; color:#ffd98a; border:1px solid rgba(255,255,255,0.03) }
.detail-label { color:#d3c7a3; font-weight:700; font-size:0.82rem }
.detail-value { color:#fff; font-weight:900; margin-top:2px }

/* subtle tile hover expansion */
.player-avatar { transition: transform 180ms ease, box-shadow 180ms ease }
.player-avatar:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(0,0,0,0.6) }

</style>

<style scoped>
/* Responsive fixes for narrow viewports to prevent the matchroom UI from breaking */
@media (max-width: 1100px) {
  .matchroom-container { padding: 20px 16px; }
  header h1 { font-size: 1.2rem; }
  .teams-grid { flex-direction: column; gap: 18px; align-items: stretch; }
  .team-card { min-width: 0 !important; width: 100%; }
  .bench-list, .team-drop-list { gap: 14px; }
  .wins-chart { max-width: 100%; padding: 0 8px; }
  .wins-title { font-size: 2rem; }
}

@media (max-width: 720px) {
  .matchroom-container { padding: 14px 10px; }
  .details-grid { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); }
  .player-name { font-size: 0.9rem; }
  .player-sub { font-size: 0.72rem; }
  .member-pill { padding: 6px; gap: 10px; }
  .member-name { font-size: 0.9rem }
  .rounds-history { padding: 12px; }
  .round-card { flex-direction: column; }
  .card-left { width: 100%; display:flex; gap:8px; }
  .card-main { width: 100%; }
}

/* Very small screens: allow horizontal scroll for the teams grid as a fallback */
@media (max-width: 420px) {
  .teams-grid { display: block; overflow-x: auto; white-space: nowrap; padding-bottom: 6px; }
  .team-card { display: inline-block; vertical-align: top; white-space: normal; min-width: 280px; width: 86%; margin-right: 12px; }
  .bench-list { overflow-x: auto; white-space: nowrap; }
  .bench-list .player-avatar { display: inline-flex; width: auto; }
}

/* Always allow horizontal scrolling of the main container if content overflows */
.matchroom-container { overflow-x: auto; }

</style>
