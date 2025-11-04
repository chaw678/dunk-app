<template>
  <Teleport to="body">
    <div class="end-summary-overlay" @click.self="close">
      <div :class="['end-summary-modal', { compact: props.compact }]">
        <!-- Large centered match title (matches Rounds Completed font but bigger) -->
        <div class="modal-match-title">{{ matchTitle }}</div>

        <header class="summary-header">
          <!-- LIVE / Match Ended indicator -->
          <span v-if="isMatchLive" class="match-status-badge live-badge">LIVE</span>
          <span v-else-if="isMatchEnded" class="match-status-badge ended-badge">Match Ended</span>
          <button class="close-btn" @click="close">✕</button>
        </header>

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

        <section class="round-summary">
          <h3>Rounds completed: {{ rounds.length }}</h3>
        </section>

        <!-- Scrollable area: player rankings and rounds history will scroll while the header/details/round-summary remain fixed -->
        <div class="summary-scroll">
          <section class="players-ranking">
            <h3>Player rankings (by match wins)</h3>
            <ul class="ranking-list">
              <li v-for="(p, idx) in sortedPlayers" :key="p.uid" :class="['ranking-item', { 'rank-1': idx === 0, 'rank-2': idx === 1, 'rank-3': idx === 2 }]" @click="openProfileModal(p.uid)">
                <div class="rank-number">#{{ idx + 1 }}</div>
                <div class="pill-left">
                  <div class="member-avatar-wrapper">
                    <div class="member-avatar-small"><img :src="avatarForUid(p.uid)" :alt="displayNameFor(p.uid) + ' avatar'"/></div>
                    <div v-if="idx === 0" class="medal-badge">🥇</div>
                    <div v-else-if="idx === 1" class="medal-badge">🥈</div>
                    <div v-else-if="idx === 2" class="medal-badge">🥉</div>
                  </div>
                  <div class="member-meta">
                    <div class="member-name">{{ displayNameFor(p.uid) }}</div>
                    <div class="member-sub">Total: {{ displayTotalWinsForUid(p.uid) }}</div>
                  </div>
                </div>
                <div class="member-wins">🏆 {{ displayMatchWinsForUid(p.uid) }}</div>
              </li>
            </ul>
          </section>

          <section class="rounds-history">
            <h3>Rounds history</h3>
            <ul class="round-list">
              <li v-for="(r, idx) in rounds" :key="r.ts || idx" class="round-card">
                <div class="card-left">
                  <div class="round-index">#{{ rounds.length ? (rounds.length - idx) : (idx + 1) }}</div>
                  <div class="round-time">{{ formatDate(r.endedAt) }}</div>
                  <div class="round-duration">⏱ {{ formatDuration(r.duration) }}</div>
                </div>
                <div class="card-main">
                  <div class="teams-row">
                    <div class="team-block team-a">
                      <div class="team-title">Team A</div>
                      <div class="team-members">
                        <template v-for="uid in (r.teamA || [])" :key="uid">
                          <div class="member-pill" @click.stop="openProfileModal(uid)">
                            <div class="member-avatar-small"><img :src="avatarForUid(uid)" :alt="displayNameFor(uid) + ' avatar'"/></div>
                            <div class="member-name">{{ displayNameFor(uid) }}</div>
                            <div class="member-sub">Total: {{ displayTotalWinsForUid(uid) }}</div>
                            <div class="member-wins">🏆 {{ displayMatchWinsForUid(uid) }}</div>
                          </div>
                        </template>
                      </div>
                    </div>

                    <div class="team-block team-b">
                      <div class="team-title">Team B</div>
                      <div class="team-members">
                        <template v-for="uid in (r.teamB || [])" :key="uid">
                          <div class="member-pill" @click.stop="openProfileModal(uid)">
                            <div class="member-avatar-small"><img :src="avatarForUid(uid)" :alt="displayNameFor(uid) + ' avatar'"/></div>
                            <div class="member-name">{{ displayNameFor(uid) }}</div>
                            <div class="member-sub">Total: {{ displayTotalWinsForUid(uid) }}</div>
                            <div class="member-wins">🏆 {{ displayMatchWinsForUid(uid) }}</div>
                          </div>
                        </template>
                      </div>
                    </div>
                  </div>

                  <div class="round-footer">
                    <div class="winner-pill">Winner: <strong>{{ r.winningTeam }} — {{ winnersLabel(r) }}</strong></div>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
    <ProfileModal v-if="showProfileModal" :uid="profileModalUid" :initialProfile="profileModalInitial" @close="closeProfileModal" />
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Teleport } from 'vue'
import { getDataFromFirebase, onDataChange } from '../firebase/firebase'
import { avatarForUser } from '../utils/avatar.js'
import ProfileModal from './ProfileModal.vue'

const props = defineProps({ dbPath: { type: String, required: false }, matchData: { type: Object, required: false }, compact: { type: Boolean, required: false, default: false } })
const emit = defineEmits(['close', 'open-profile'])

const match = ref(props.matchData || {})
const usersMap = ref({})
const playersMap = ref({})
const winsByEachPlayer = ref({})
const rounds = ref([])

// ProfileModal state
const showProfileModal = ref(false)
const profileModalUid = ref(null)
const profileModalInitial = ref(null)

let usersUnsub = null
let playersMapUnsub = null
let winsByEachUnsub = null
let roundsUnsub = null
let matchUnsub = null
let _prevBodyOverflow = null

async function loadInitial() {
  try {
    const dbPath = props.dbPath || (match.value && match.value.__dbPath) || null
    if (dbPath) {
      const remote = await getDataFromFirebase(dbPath)
      if (remote) match.value = { ...(match.value || {}), ...(remote || {}), __dbPath: dbPath }

      // Subscribe to match data changes (for live status updates)
      try { matchUnsub = onDataChange(dbPath, (v) => { if (v) match.value = { ...(match.value || {}), ...(v || {}), __dbPath: dbPath } }) } catch (e) { console.warn('match subscribe failed', e) }
      try { playersMapUnsub = onDataChange(`${dbPath}/playersMap`, (v) => { playersMap.value = v || {} }) } catch (e) { console.warn('pm subscribe failed', e) }
      try { winsByEachUnsub = onDataChange(`${dbPath}/WinsByEachPlayer`, (v) => { winsByEachPlayer.value = v || {} }) } catch (e) {}
      try { roundsUnsub = onDataChange(`${dbPath}/roundsplayed`, (val) => { const arr = val ? Object.entries(val).map(([k,v])=>({ ts:k, ...v })) : []; arr.sort((a,b)=>Number(b.ts)-Number(a.ts)); rounds.value = arr }) } catch (e) {}
    }
    try { usersUnsub = onDataChange('users', (v) => { usersMap.value = v || {} }) } catch (e) { console.warn('users subscribe failed', e) }
  } catch (e) { console.warn('EndMatchSummary loadInitial failed', e) }
}

onMounted(() => {
  loadInitial()
  try {
    _prevBodyOverflow = document && document.body ? document.body.style.overflow : null
    if (document && document.body) document.body.style.overflow = 'hidden'
  } catch (e) {}
})

onBeforeUnmount(() => {
  try { if (usersUnsub) usersUnsub() } catch(_){ }
  try { if (playersMapUnsub) playersMapUnsub() } catch(_){ }
  try { if (winsByEachUnsub) winsByEachUnsub() } catch(_){ }
  try { if (roundsUnsub) roundsUnsub() } catch(_){ }
  try { if (matchUnsub) matchUnsub() } catch(_){ }
  try { if (document && document.body) document.body.style.overflow = (_prevBodyOverflow !== null ? _prevBodyOverflow : '') } catch (e) {}
})

function close() { emit('close') }

function openProfile(uid) { emit('open-profile', uid) }

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

function avatarForUid(uid) { const u = usersMap.value && usersMap.value[uid]; if (u && u.profilepicture) return u.profilepicture; if (u && u.avatar) return u.avatar; return avatarForUser(u || uid) }

function displayNameFor(uid) { if (!uid) return ''; const u = usersMap.value && usersMap.value[uid]; return (u && (u.name || u.displayName || u.username)) || uid }

function displayTotalWinsForUid(uid) { const u = usersMap.value && usersMap.value[uid]; if (u && typeof u.totalWins !== 'undefined') return Number(u.totalWins || 0); return 0 }

function sanitizeUserKey(uname) { if (!uname) return String(uname || '').replace(/[.$#\[\]\//]/g, '_'); return String(uname).replace(/[.$#\[\]\//]/g, '_') }

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

const sortedPlayers = computed(() => {
  const map = playersMap.value || {}
  const seeds = new Set()
  Object.keys(map || {}).forEach(k => seeds.add(k))
  const m = match.value || {}
  if (m.players && typeof m.players === 'object') Object.keys(m.players).forEach(k => seeds.add(k))
  ;(rounds.value || []).forEach(r => { (r.teamA || []).forEach(u => seeds.add(u)); (r.teamB || []).forEach(u => seeds.add(u)) })

  const arr = Array.from(seeds).map(uid => ({ 
    uid, 
    wins: displayMatchWinsForUid(uid),
    totalWins: displayTotalWinsForUid(uid)
  }))
  // Sort by match wins (descending), then by total wins (descending), then by uid alphabetically
  arr.sort((a,b) => {
    const matchWinsDiff = Number(b.wins || 0) - Number(a.wins || 0)
    if (matchWinsDiff !== 0) return matchWinsDiff
    const totalWinsDiff = Number(b.totalWins || 0) - Number(a.totalWins || 0)
    if (totalWinsDiff !== 0) return totalWinsDiff
    return a.uid.localeCompare(b.uid)
  })
  return arr
})

function formatDate(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleString() } catch (e) { return String(iso) } }
function formatDuration(sec) { if (!sec && sec !== 0) return '—'; const s = Number(sec) || 0; if (s < 60) return `${s}s`; const m = Math.floor(s/60); const rem = s%60; return `${m}m ${rem}s` }

function winnersLabel(r) { if (!r || !r.winningTeamMembers) return '—'; return r.winningTeamMembers.map(uid => displayNameFor(uid)).join(', ') }

const matchTitle = computed(() => { const t = (match.value && (match.value.title || match.value.name)) ? String(match.value.title || match.value.name).trim() : ''; return t || 'Untitled Match' })
const matchDateDisplay = computed(() => { try { if (match.value && match.value.date) return String(match.value.date); if (match.value && match.value.startAtISO) return new Date(match.value.startAtISO).toLocaleDateString(); return '—' } catch (e) { return '—' } })
const matchTimeDisplay = computed(() => { try { if (match.value && match.value.startTime && match.value.endTime) return `${match.value.startTime} — ${match.value.endTime}`; if (match.value && match.value.startTime) return match.value.startTime; if (match.value && match.value.startAtISO) return new Date(match.value.startAtISO).toLocaleTimeString(); return '—' } catch (e) { return '—' } })
const courtDisplay = computed(() => { try { return match.value && (match.value.court || match.value.venue || match.value.location || match.value.title) ? (match.value.court || match.value.venue || match.value.location || match.value.title) : 'Unknown venue' } catch (e) { return 'Unknown venue' } })
const matchTypeDisplay = computed(() => { try { return match.value && match.value.type ? String(match.value.type) : 'Open' } catch (e) { return 'Open' } })
const genderDisplay = computed(() => { try { return match.value && match.value.gender ? String(match.value.gender) : 'All' } catch (e) { return 'All' } })

// Match status indicators
const isMatchLive = computed(() => {
  try {
    return (match.value.started || match.value._started) && !match.value.endedAt && !match.value.endedAtISO
  } catch (e) {
    return false
  }
})
const isMatchEnded = computed(() => {
  try {
    return !!(match.value.endedAt || match.value.endedAtISO)
  } catch (e) {
    return false
  }
})

</script>

<style scoped>
/* Overlay + entry animations */
.end-summary-overlay { position:fixed; inset:0; background:rgba(8,10,12,0.9); display:flex; align-items:center; justify-content:center; z-index:11000; backdrop-filter: blur(4px); animation: overlayFade 180ms ease both }
.end-summary-modal { position: relative; box-sizing: border-box; width:880px; max-width:96%; max-height:calc(92vh - 36px); /* modal will be a flex column; inner area will scroll */ display:flex; flex-direction:column; background: linear-gradient(180deg,#0f1114,#151617); border-radius:14px; padding:18px; border:2px solid #FFAD1D; box-shadow: 0 22px 64px rgba(0,0,0,0.7); transform-origin:center center; animation: modalPop 220ms cubic-bezier(.2,.9,.2,1) both }
.end-summary-modal.compact { width:92%; max-width:680px; padding:14px }

.summary-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:10px }
.summary-header h2 { color:#ffad1d; margin:0; font-size:1.6rem; letter-spacing:0.6px }
.summary-meta { color:#d3c7a3; font-weight:700; font-size:0.9rem; margin-top:4px }
.close-btn { position: absolute; right: 12px; top: 12px; background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer }

/* Match status badges (LIVE / Match Ended) */
.match-status-badge {
  position: absolute;
  left: 20px;
  top: 21px;
  display: inline-block;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border: 1px solid rgba(0,0,0,0.4);
}

.live-badge {
  background: linear-gradient(180deg, #a83a3a 0%, #c84b4b 100%);
  color: rgba(255, 210, 210, 0.95);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.03), 0 6px 18px rgba(200,50,50,0.12);
  animation: live-blink 2.6s ease-in-out infinite;
}

.ended-badge {
  background: linear-gradient(180deg, #3a5a8a 0%, #4b6bc8 100%);
  color: rgba(210, 230, 255, 0.95);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.03), 0 6px 18px rgba(50,100,200,0.12);
}

@keyframes live-blink {
  0% { opacity: 1; transform: translateZ(0) scale(1); }
  45% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
  55% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
  100% { opacity: 1; transform: translateZ(0) scale(1); }
}

.details-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap:12px; margin-bottom:14px }
.detail-item { display:flex; gap:10px; align-items:center }
.detail-icon { width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#111214,#1a1d20); color:#ffd98a; font-size:18px; border:1px solid rgba(255,255,255,0.03) }
.detail-label { color:#cfc9b0; font-weight:700 }
.detail-value { color:#fff; font-weight:900 }

.round-summary h3 { color:#ffd98a; font-weight:900; margin:0 0 8px 0; font-size:2.2rem }

/* Large centered match title in modal */
.modal-match-title { color:#fff; font-weight:900; font-size:3rem; text-align:center; margin:6px 0 12px; line-height:1; }

.players-ranking { margin-top:8px }
.ranking-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px }
.ranking-item { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:10px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02)); border:1px solid rgba(255,255,255,0.03); cursor:pointer; transition: transform 160ms ease, box-shadow 160ms ease }
.ranking-item:hover { transform: translateY(-6px); box-shadow: 0 18px 40px rgba(0,0,0,0.6) }
/* Top 3 special backgrounds */
.ranking-item.rank-1 { background: linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,193,7,0.06)); border:1px solid rgba(255,215,0,0.25); box-shadow: 0 4px 16px rgba(255,215,0,0.15); }
.ranking-item.rank-2 { background: linear-gradient(135deg, rgba(192,192,192,0.12), rgba(169,169,169,0.06)); border:1px solid rgba(192,192,192,0.25); box-shadow: 0 4px 16px rgba(192,192,192,0.15); }
.ranking-item.rank-3 { background: linear-gradient(135deg, rgba(205,127,50,0.12), rgba(184,115,51,0.06)); border:1px solid rgba(205,127,50,0.25); box-shadow: 0 4px 16px rgba(205,127,50,0.15); }
.rank-number { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,#ffad1d,#ffd98a); color:#0b0b0b; font-weight:900; font-size:1.1rem; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow: 0 4px 12px rgba(255,173,29,0.25); }
.pill-left { display:flex; align-items:center; gap:3px }
.member-avatar-wrapper { position:relative; display:flex; align-items:center; justify-content:center; }
.member-avatar-small { width:44px; height:44px; border-radius:50%; overflow:hidden; border:3px solid #ffad1d }
.member-avatar-small img { width:100%; height:100%; object-fit:cover }
.medal-badge { position:absolute; bottom:-4px; right:-6px; font-size:1.3rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); z-index:1; }
.member-meta { display:flex; flex-direction:column }
.member-name { color:#fff; font-weight:900; font-size:1rem }
.member-sub { color:#cfc9b0; font-weight:700; font-size:0.85rem }
.member-wins { color:#ffd98a; font-weight:900 }

.rounds-history { margin-top:16px }
.round-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px }
.round-card { display:flex; gap:12px; align-items:flex-start; background: linear-gradient(90deg,#0f1114,#151617); padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,0.03); transition: transform 180ms ease, box-shadow 180ms ease }
.round-card:hover { transform: translateY(-6px); box-shadow: 0 22px 60px rgba(0,0,0,0.6) }
.card-left { width:140px; display:flex; flex-direction:column; gap:6px }
.round-index { font-weight:900; color:#fff; font-size:1.05rem }
.round-time { color:#d3c7a3; font-size:0.85rem }
.round-duration { color:#ffd98a; font-weight:800; font-size:0.85rem }
.card-main { flex:1; display:flex; flex-direction:column; gap:10px }
.teams-row { display:flex; flex-direction:column; gap:12px }
.team-block { flex:1; background: rgba(255,255,255,0.02); padding:10px; border-radius:10px }
.team-title { font-weight:900; color:#fff4d1; margin-bottom:8px }
.team-members { display:flex; gap:8px; flex-wrap:wrap }
.member-pill { display:flex; gap:8px; align-items:center; background: linear-gradient(180deg, #0f1114, #141516); padding:8px; border-radius:10px; border:1px solid rgba(255,255,255,0.03); cursor:pointer }
.member-pill:hover { box-shadow: 0 12px 36px rgba(0,0,0,0.55) }
.member-avatar-small img { display:block }

/* scrollbar for modal body */
.summary-scroll { overflow:auto; flex:1; padding-top:8px; display:flex; flex-direction:column; gap:12px }
.summary-scroll::-webkit-scrollbar { width:10px }
.summary-scroll::-webkit-scrollbar-track { background: transparent }
.summary-scroll::-webkit-scrollbar-thumb { background: linear-gradient(180deg,#2b2f33,#1f2326); border-radius:10px }

/* Animations */
@keyframes modalPop { from { transform: translateY(8px) scale(0.98); opacity:0 } to { transform: translateY(0) scale(1); opacity:1 } }
@keyframes overlayFade { from { opacity:0 } to { opacity:1 } }

</style>
