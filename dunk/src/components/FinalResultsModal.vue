<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <header class="modal-header">
        <h1>Final Match Results</h1>
        <button @click="$emit('close')" class="close-btn" aria-label="Close">✕</button>
      </header>

      <div class="modal-body">
        <!-- Match Details -->
        <section class="match-details-section">
          <h2 class="section-title">Match Details</h2>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Court:</span>
              <span class="detail-value">{{ matchData.court || matchData.location || 'Unknown' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{ formatMatchDate(matchData) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Type:</span>
              <span class="detail-value">{{ matchData.matchType || 'Casual' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Gender:</span>
              <span class="detail-value">{{ matchData.gender || 'All' }}</span>
            </div>
          </div>
        </section>

        <!-- Rounds History -->
        <section class="rounds-history-section">
          <h2 class="section-title">Rounds History</h2>
          <div v-if="!rounds || rounds.length === 0" class="rounds-empty">
            No rounds played in this match.
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDataFromFirebase, onDataChange } from '../firebase/firebase'

const props = defineProps({
  matchPath: {
    type: String,
    required: true
  }
})

defineEmits(['close'])

const matchData = ref({})
const rounds = ref([])
const usersMap = ref({})
let usersUnsub = null

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
          resolve()
        }
      })
    } catch (e) { 
      console.warn('subscribeUsers failed', e)
      resolve()
    }
  })
}

function initials(name) {
  if (!name) return 'U'
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0,2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function displayNameFor(element) {
  if (!element) return ''
  if (typeof element === 'string') {
    const uid = element
    const resolved = usersMap.value && usersMap.value[uid]
    return (resolved && (resolved.name || resolved.displayName || resolved.username)) || uid
  }
  const uid = element.uid || element.id || element.key || null
  const resolved = uid && usersMap.value ? usersMap.value[uid] : null
  const resolvedName = (resolved && (resolved.name || resolved.displayName || resolved.username)) || null
  const fallback = uid || (element && element.name) || 'Player'
  return element.name || resolvedName || fallback
}

function displayAvatarFor(element) {
  if (!element) return null
  const uid = (typeof element === 'string') ? element : (element.uid || element.id || element.key || null)
  const resolved = uid && usersMap.value ? usersMap.value[uid] : null
  if (resolved) {
    return resolved.profilepicture || resolved.avatar || resolved.photoURL || resolved.picture || resolved.photo || resolved.imageURL || resolved.thumbnail || null
  }
  if (typeof element === 'object' && element.avatar) return element.avatar
  return null
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

function formatMatchDate(match) {
  if (!match) return '—'
  try {
    if (match.startISO) return new Date(match.startISO).toLocaleDateString()
    if (match.start) return new Date(match.start).toLocaleDateString()
    return '—'
  } catch (e) {
    return '—'
  }
}

function sanitizeUserKey(uname) {
  if (!uname) return String(uname || '').replace(/[.$#\[\]\/]/g, '_')
  return String(uname).replace(/[.$#\[\]\/]/g, '_')
}

const winsByEachPlayer = ref({})
const playersMap = ref({})

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

async function loadMatchData() {
  try {
    const data = await getDataFromFirebase(props.matchPath)
    if (data) {
      matchData.value = data
      
      // Load rounds
      if (data.roundsplayed) {
        rounds.value = Object.entries(data.roundsplayed)
          .map(([key, round]) => ({
            ...round,
            key
          }))
          .sort((a, b) => {
            const timeA = a.endedAt ? new Date(a.endedAt).getTime() : 0
            const timeB = b.endedAt ? new Date(b.endedAt).getTime() : 0
            return timeB - timeA
          })
      }
      
      // Load wins data
      if (data.WinsByEachPlayer) {
        winsByEachPlayer.value = data.WinsByEachPlayer
      }
      if (data.playersMap) {
        playersMap.value = data.playersMap
      }
    }
  } catch (e) {
    console.warn('Failed to load match data:', e)
  }
}

onMounted(async () => {
  await subscribeUsers()
  await loadMatchData()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-container {
  background: #10121A;
  border-radius: 16px;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: sticky;
  top: 0;
  background: #10121A;
  z-index: 10;
}

.modal-header h1 {
  color: #ffd98a;
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
}

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
  font-size: 24px;
  font-weight: 800;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: scale(1.05);
}

.modal-body {
  padding: 24px 28px;
}

.section-title {
  color: #ffd98a;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.match-details-section {
  margin-bottom: 32px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.detail-label {
  color: #d3c7a3;
  font-weight: 700;
  font-size: 0.85rem;
  margin-right: 8px;
}

.detail-value {
  color: #fff;
  font-weight: 800;
}

.rounds-history-section {
  margin-top: 32px;
}

.rounds-empty {
  color: #cfc9b0;
  text-align: center;
  padding: 32px;
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
</style>
