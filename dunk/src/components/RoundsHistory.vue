<template>
  <section class="rounds-history">
    <h2>Rounds History</h2>
    <div v-if="!rounds.length" class="empty">No rounds played yet.</div>
    <ul v-else class="round-list">
      <li v-for="(r, idx) in rounds" :key="r.ts" class="round-item">
        <div class="round-header">
          <div class="round-num">Round {{ rounds.length - idx }}</div>
          <div class="round-meta">{{ formatDate(r.endedAt) }} • {{ formatDuration(r.duration) }}</div>
        </div>
        <div class="round-body">
          <div class="team">
            <div class="team-label">A</div>
            <div class="team-members">
              <span v-for="uid in r.teamA" :key="uid" class="member">{{ nameFor(uid) }} <span class="member-wins">🏆 {{ (users[uid] && users[uid].wins) ? users[uid].wins : (users.value && users.value[uid] && users.value[uid].wins) || 0 }}</span></span>
            </div>
          </div>
          <div class="team">
            <div class="team-label">B</div>
            <div class="team-members">
              <span v-for="uid in r.teamB" :key="uid" class="member">{{ nameFor(uid) }} <span class="member-wins">🏆 {{ (users[uid] && users[uid].wins) ? users[uid].wins : (users.value && users.value[uid] && users.value[uid].wins) || 0 }}</span></span>
            </div>
          </div>
        </div>
        <div class="round-winner">Winner: <strong>{{ r.winningTeam }} — {{ winnersLabel(r) }}</strong></div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getDataFromFirebase, onDataChange } from '../firebase/firebase'

const props = defineProps({ matchData: { type: Object, required: false }, matchId: { type: [String, Number], required: false } })

const rounds = ref([])
const users = ref({})
let unsub = null
let usersUnsub = null

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
  const u = users.value && users.value[uid]
  return (u && (u.name || u.displayName || u.username)) || uid
}

function winnersLabel(r) {
  if (!r || !r.winningTeamMembers) return '—'
  return r.winningTeamMembers.map(nameFor).join(', ')
}

function subscribeUsers() {
  if (usersUnsub) { try { usersUnsub() } catch (e) {} ; usersUnsub = null }
  usersUnsub = onDataChange('users', (val) => {
    users.value = val || {}
  })
}

async function loadRounds() {
  try {
    const dbPath = (props.matchData && props.matchData.__dbPath) ? props.matchData.__dbPath : (props.matchId ? `matches/${props.matchId}` : null)
    if (!dbPath) return
    if (unsub) { try { unsub() } catch (e) {} ; unsub = null }
    unsub = onDataChange(`${dbPath}/roundsplayed`, (val) => {
      const arr = val ? Object.entries(val).map(([k, v]) => ({ ts: k, ...v })) : []
      // sort descending by timestamp
      arr.sort((a, b) => Number(b.ts) - Number(a.ts))
      rounds.value = arr
    })
  } catch (e) { console.warn('loadRounds error', e); rounds.value = [] }
}

onMounted(async () => {
  subscribeUsers()
  await loadRounds()
})

onBeforeUnmount(() => {
  if (unsub) {
    try { unsub() } catch (e) {}
    unsub = null
  }
  if (usersUnsub) {
    try { usersUnsub() } catch (e) {}
    usersUnsub = null
  }
})
</script>

<style scoped>
.rounds-history { margin: 20px auto; max-width: 820px; background: #17181c; padding: 14px; border-radius: 12px; border:1px solid rgba(255,255,255,0.04) }
.rounds-history h2 { color: #ffda99; margin: 6px 8px }
.empty { color: #cfcfcf; padding: 12px }
.round-list { list-style:none; padding: 0; margin: 0; display:flex; flex-direction:column; gap:12px }
.round-item { background: #0f1114; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.02) }
.round-header { display:flex; justify-content:space-between; align-items:center; gap:12px }
.round-num { color:#fff; font-weight:800 }
.round-meta { color:#d3c7a3 }
.round-body { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap }
.team { flex:1; min-width:180px }
.team-label { color:#f3e6c2; font-weight:800 }
.team-members { margin-top:8px; display:flex; gap:8px; flex-wrap:wrap }
  .team-members { margin-top:8px; display:flex; gap:8px; flex-wrap:nowrap; overflow:auto }
  .member { background:#1b1d20; color:#ffefcf; padding:6px 8px; border-radius:8px; font-weight:700; white-space:nowrap; text-overflow:ellipsis; overflow:hidden; max-width:240px; display:inline-flex; align-items:center }
  .member-wins { margin-left:8px; color:#ffd98a; font-weight:800; flex-shrink:0 }
.round-winner { margin-top:10px; color:#fff }
</style>