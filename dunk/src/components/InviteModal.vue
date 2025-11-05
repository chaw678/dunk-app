<template>
  <ModalPortal @overlay="close">
    <div class="inv-modal card">
      <div class="card-header d-flex justify-content-between align-items-center following-header">
        <div>
          <h2 class="following-title">Invite</h2>
          <div class="small text-muted invite-subtitle">Invite people from your following and followers list</div>
        </div>
        <button class="btn-close big-x" @click="close" aria-label="Close">✕</button>
      </div>

      <div class="card-body inv-body">
            <div class="inv-actions mb-3">
              <div class="search-wrapper">
                <input type="text" class="form-control form-control-lg" placeholder="Search following/followers..." v-model="filter" />
              </div>
            </div>

            <div class="candidates-list">
              <ul class="list-unstyled mb-0">
                <li v-for="u in filteredCandidates" :key="u.uid" :class="['invite-row card-item', { selected: selectedMap[u.uid], 'already-invited': alreadyInvitedUsers.has(u.uid) }]" @click="!alreadyInvitedUsers.has(u.uid) && toggleSelect(u.uid)">
                  <div class="small-avatar">
                    <img :src="avatarUrl(u)" alt="avatar" v-if="avatarUrl(u)" />
                    <div v-else class="avatar-initial">{{ initials(u.name || u.username || u.uid) }}</div>
                  </div>
                  <div class="flex-fill ms-3">
                    <div class="invite-name">{{ u.name || u.username || u.email || u.uid }}</div>
                    <div class="small text-muted" v-if="profileSubtitle(u)">{{ profileSubtitle(u) }}</div>
                  </div>
                  <div class="ms-3">
                    <button 
                      class="btn-invite-row" 
                      :class="{ 
                        invited: selectedMap[u.uid] || alreadyInvitedUsers.has(u.uid)
                      }" 
                      :disabled="alreadyInvitedUsers.has(u.uid)"
                      @click.stop="!alreadyInvitedUsers.has(u.uid) && toggleSelect(u.uid)"
                    >
                      <span v-if="alreadyInvitedUsers.has(u.uid) || selectedMap[u.uid]">Invited</span>
                      <span v-else>Invite</span>
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <div class="mt-3 d-flex justify-content-end gap-2">
              <button class="btn btn-outline-secondary" @click="close">Cancel</button>
              <button class="btn btn-primary" :disabled="sending || !selectedUids.length" @click="sendInvites">
                <span v-if="sending">Sending...</span>
                <span v-else>Invite ({{ selectedUids.length }})</span>
              </button>
            </div>
          </div>
    </div>
  </ModalPortal>
</template>

<script setup>
import ModalPortal from './ModalPortal.vue'
import { ref, computed, watch } from 'vue'
import { setChildData, getDataFromFirebase } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'

const props = defineProps({
  match: { type: Object, required: true },
  users: { type: Object, default: () => ({}) }, // optional users cache map
  me: { type: Object, default: null }
})
const emit = defineEmits(['close', 'sent'])

const filter = ref('')
const selectAll = ref(false)
const sending = ref(false)
const selectedMap = ref({})

// Track users who have already been invited to this match
const alreadyInvitedUsers = ref(new Set())

// Build candidates list: merge following + followers for current user
const candidates = ref([])

async function loadAlreadyInvited() {
  alreadyInvitedUsers.value = new Set()
  if (!props.match || !props.match.id || !props.me) return
  
  try {
    // Check all users' invitations to see if this match was already sent to them
    const matchId = props.match.id
    const following = (await getDataFromFirebase(`users/${props.me.uid}/following`)) || {}
    const followers = (await getDataFromFirebase(`users/${props.me.uid}/followers`)) || {}
    const uids = Array.from(new Set([ ...Object.keys(following), ...Object.keys(followers) ]))
    
    for (const uid of uids) {
      try {
        const userInvitations = await getDataFromFirebase(`users/${uid}/invitations`)
        if (userInvitations && userInvitations[matchId]) {
          alreadyInvitedUsers.value.add(uid)
        }
      } catch (err) {
        // Skip if we can't check this user
      }
    }
  } catch (err) {
    console.warn('Failed to load already invited users', err)
  }
}

async function loadCandidates() {
  candidates.value = []
  if (!props.me) return
  try {
    const following = (await getDataFromFirebase(`users/${props.me.uid}/following`)) || {}
    const followers = (await getDataFromFirebase(`users/${props.me.uid}/followers`)) || {}
    const uids = Array.from(new Set([ ...Object.keys(following), ...Object.keys(followers) ]))
    // map to user profiles using provided users cache first to avoid many calls
    const out = []
    for (const uid of uids) {
      let profile = (props.users && props.users[uid]) || null
      if (!profile) {
        try {
          profile = await getDataFromFirebase(`users/${uid}`)
        } catch (err) {
          profile = null
        }
      }
      if (profile) profile.uid = uid
      else profile = { uid }
      out.push(profile)
    }
    candidates.value = out
  } catch (err) {
    console.warn('InviteModal: failed to load candidates', err)
    candidates.value = []
  }
}

onUserStateChanged((u) => {
  // if me in props changes, caller should re-open the modal; still we can reload
})

watch(() => props.me, () => { 
  loadCandidates()
  loadAlreadyInvited()
}, { immediate: true })

const filteredCandidates = computed(() => {
  const term = (filter.value || '').toLowerCase().trim()

  const pool = []
  for (const u of candidates.value) {
    if (!u) continue

    // Exclude users who are already part of the match (joinedBy map, players array, or playersMap)
    try {
      const m = props.match || {}
      if (m.joinedBy && typeof m.joinedBy === 'object' && u.uid && m.joinedBy[u.uid]) continue
      if (m.playersMap && u.uid && m.playersMap[u.uid]) continue
      if (m.players && Array.isArray(m.players)) {
        const uname = (u.name || u.username || '').toString().toLowerCase()
        if (uname && m.players.some(p => (''+p).toLowerCase() === uname)) continue
      }
    } catch (e) {
      // ignore check errors and continue
    }

    // Only include users who are eligible for this match (gender + rank requirements)
    try {
      if (!isEligibleForMatch(u)) continue
    } catch (e) {
      // if eligibility check fails, skip this user
      continue
    }

    pool.push(u)
  }

  if (!term) return pool

  // find prefix (startsWith) matches on name/username
  const prefixMatches = []
  const containsMatches = []
  for (const u of pool) {
    const name = ('' + (u.name || u.username || '')).toLowerCase()
    const email = ('' + (u.email || '')).toLowerCase()
    const combined = `${name} ${email}`.trim()
    if (name.startsWith(term) || (u.username && ('' + u.username).toLowerCase().startsWith(term))) {
      prefixMatches.push(u)
    } else if (combined.indexOf(term) !== -1) {
      containsMatches.push(u)
    }
  }

  // If we have any prefix matches, show ONLY those (as requested). Otherwise fall back to contains matches.
  if (prefixMatches.length) {
    // optional: sort prefix matches alphabetically by display name
    prefixMatches.sort((a, b) => {
      const da = ('' + (a.name || a.username || a.email || a.uid)).toLowerCase()
      const db = ('' + (b.name || b.username || b.email || b.uid)).toLowerCase()
      if (da < db) return -1
      if (da > db) return 1
      return 0
    })
    return prefixMatches
  }

  containsMatches.sort((a, b) => {
    const da = ('' + (a.name || a.username || a.email || a.uid)).toLowerCase()
    const db = ('' + (b.name || b.username || b.email || b.uid)).toLowerCase()
    if (da < db) return -1
    if (da > db) return 1
    return 0
  })

  return containsMatches
})

function seededAvatar(name) {
  const username = name || 'anon'
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
}

function avatarUrl(u) {
  if (!u) return seededAvatar()
  // common keys where a profile photo might be stored
  return u.photoURL || u.avatar || u.photo || u.profilePhoto || (u.uid ? seededAvatar(u.name || u.username || u.uid) : seededAvatar(u.name))
}

function capitalize(s) {
  if (!s) return ''
  return ('' + s).toString().trim().replace(/^[a-z]/, c => c.toUpperCase())
}

function profileSubtitle(u) {
  if (!u) return ''
  const rank = (u.ranking || u.skill || '').toString().trim()
  const gender = (u.gender || '').toString().trim()
  const parts = []
  if (rank) parts.push(capitalize(rank))
  if (gender) parts.push(capitalize(gender))
  return parts.join(' ')
}

// Eligibility helpers: only invite users who meet the match's gender and rank requirements
function normalizeMatchType(t) {
  if (!t) return 'Open'
  const s = ('' + t).toLowerCase()
  if (s === 'beginner') return 'Open'
  if (s.includes('open') || s === 'open') return 'Open'
  if (s.includes('intermediate')) return 'Intermediate'
  if (s.includes('professional') || s.includes('pro')) return 'Professional'
  return 'Open'
}

function rankLevel(r) {
  const s = ('' + (r || '')).toLowerCase()
  if (s.includes('professional') || s.includes('pro')) return 3
  if (s.includes('intermediate') || s.includes('inter')) return 2
  return 1 // Beginner / Open
}

function isEligibleForMatch(u) {
  try {
    const m = props.match || {}
    // gender check: match may be 'All' or specific 'Male'/'Female'
    const matchGender = (m.gender || 'All').toString().trim()
    if (matchGender && matchGender.toLowerCase() !== 'all') {
      // require user to have a matching gender set
      if (!u || !u.gender) return false
      if (u.gender.toString().trim().toLowerCase() !== matchGender.toLowerCase()) return false
    }

    // rank/level check
    const matchTypeRaw = m.type || m.level || m.matchType || 'Open'
    const matchType = normalizeMatchType(matchTypeRaw)
    if (matchType === 'Open') return true
    const userRankRaw = u && (u.ranking || u.skill) ? (u.ranking || u.skill) : 'Beginner'
    const userLevel = rankLevel(userRankRaw)
    const neededLevel = rankLevel(matchType)
    return userLevel >= neededLevel
  } catch (e) {
    // in case of unexpected data, be conservative and exclude
    return false
  }
}

watch(selectAll, (v) => {
  const map = { ...(selectedMap.value || {}) }
  for (const u of filteredCandidates.value) {
    map[u.uid] = v
  }
  selectedMap.value = map
})

function initials(name) {
  if (!name) return ''
  return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
}

function toggleSelect(uid) {
  selectedMap.value = { ...(selectedMap.value || {}), [uid]: !selectedMap.value[uid] }
}

const selectedUids = computed(() => Object.keys(selectedMap.value || {}).filter(k => selectedMap.value[k]))

async function sendInvites() {
  if (!props.me) { alert('Please sign in'); return }
  const list = selectedUids.value
  if (!list.length) return
  sending.value = true
  try {
    const matchId = props.match.id || (props.match.__dbPath ? props.match.__dbPath.split('/').pop() : (`m_${Date.now()}`))
    const summary = {
      id: matchId,
      title: props.match.title || props.match.name || 'Match',
      court: props.match.court || props.match.location || '',
      date: props.match.date || props.match.startAtISO || new Date().toISOString(),
      invitedBy: props.me.uid,
      invitedAt: Date.now(),
      matchPath: props.match.__dbPath || null
    }
    for (const uid of list) {
      try {
        await setChildData(`users/${uid}/invitations`, matchId, summary)
        // Add to already invited set
        alreadyInvitedUsers.value.add(uid)
      } catch (err) {
        console.warn('Invite failed for', uid, err)
      }
    }
    // Clear selection after sending
    selectedMap.value = {}
    emit('sent', list)
    close()
  } catch (err) {
    console.error('sendInvites error', err)
    alert('Failed to send invites — try again')
  } finally {
    sending.value = false
  }
}

function close() { emit('close') }
</script>

<style scoped>
.inv-overlay { position: fixed; inset:0; background: rgba(2,6,11,0.6); display:flex; align-items:center; justify-content:center; z-index:1300; padding:24px }
.inv-modal { width:100%; max-width:640px; max-height:80vh; overflow:hidden; border-radius:12px; background: linear-gradient(180deg,#0b0f12,#0d1114); border:1px solid rgba(255,255,255,0.04) }
.inv-body { overflow:auto; padding:12px 16px }
.inv-modal .card-header { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.10); color:#fff }
.inv-modal .card-header .small { color: #e6eef6; opacity: 1; font-size: 0.95rem; font-weight: 500; margin-top:4px }
.inv-modal .invite-row { padding:12px 10px; border-bottom:1px solid rgba(255,255,255,0.02); gap:12px; align-items:center }
.small-avatar {
  flex: 0 0 44px; /* fixed basis: don't let avatar shrink */
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.small-avatar img {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover; /* keep aspect ratio and cover */
  border-radius: 50%;
  border: 3px solid rgba(255,154,60,0.95);
  box-sizing: border-box;
}
.avatar-initial {
  flex: 0 0 44px;
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1f262b;
  color: #fff;
  border-radius: 50%;
  border: 3px solid rgba(255,154,60,0.95);
  box-sizing: border-box;
}
.invite-name { font-weight:700; color:#fff }
.invite-row:hover { background: rgba(255,255,255,0.02); }

/* selected state: darken/highlight the row */
.invite-row.selected { background: rgba(255,154,60,0.08); border-left: 4px solid rgba(255,154,60,0.12); }

.select-icon-wrapper { flex: 0 0 auto; display:flex; align-items:center }
.select-icon { display:inline-flex; align-items:center; justify-content:center; width:40px; height:28px; border-radius:6px; border:1px solid rgba(255,255,255,0.04); color:#e6eef6; font-weight:700; background: rgba(0,0,0,0.04) }
.invite-row.selected .select-icon { background: #ff9a3c; color: #111; border-color: rgba(0,0,0,0.06) }

/* visually hide element but keep for accessibility */
.visually-hidden { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0 }

/* Scrollable candidate list: will naturally scroll once content exceeds max-height (~5 rows) */
.candidates-list { max-height: 360px; overflow: auto; padding-right: 6px }
.candidates-list::-webkit-scrollbar { width: 10px }
.candidates-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.04); border-radius: 6px }

/* Slightly nicer checkboxes and small search input */
input[type="checkbox"] { width:18px; height:18px; accent-color: #ff9a3c }
input.form-control-sm { padding: 6px 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.10); color: #fff; border-radius:6px }
input.form-control-sm::placeholder { color: #9fb0bf; opacity: 1 }
input.form-control-sm:focus { outline: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 3px rgba(255,154,60,0.06) }
.badge.bg-secondary { background: rgba(255,255,255,0.04); color: #e6eef6; padding: 4px 8px; border-radius: 8px }
.form-check-label { color: #e6eef6 }

/* Style the primary Invite button to match app orange */
.inv-modal .btn-primary {
  background: #ff9a3c;
  color: #111;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(255,154,60,0.12);
}
.inv-modal .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none }
.inv-modal .btn-primary:hover:not(:disabled) {
  background: #ffb369;
}

.inv-modal .btn-outline-secondary { border-color: rgba(255,255,255,0.06); color: #cfd9e3; background: transparent }

/* Themed adjustments to match 'Following' UI */
.inv-modal { border: 3px solid rgba(255,154,60,0.95); box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
.inv-body { padding: 18px 20px }
.inv-modal .card-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.following-title { color: #ff9a3c; font-size: 36px; margin: 0; font-weight: 800 }
.btn-close.big-x { background: transparent; border: none; color: #fff; font-size: 22px; line-height:1 }

.search-wrapper .form-control-lg { width:100%; padding: 12px 14px; border-radius: 10px; background: #141617; border: 1px solid rgba(255,255,255,0.06); color: #ffffff }
.invite-subtitle { color: rgba(120, 115, 115, 0.92); margin-top:6px; font-size: 0.95rem }
.search-wrapper .form-control-lg::placeholder { color: rgba(91, 91, 91, 0.65) }

/* make muted small text in rows very high contrast for readability */
.invite-row .small.text-muted { color: rgba(96, 95, 95, 0.65) }

.card-item { margin: 10px 0; background: rgba(18,20,22,0.85); padding: 12px; border-radius: 10px; display: flex; align-items: center }
.invite-name { font-weight:700; color:#fff; font-size: 1.05rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.invite-row .flex-fill { min-width: 0; /* allow the text column to shrink and truncate properly */ }
.invite-row:hover { transform: translateY(-1px); }

.btn-invite-row { min-width: 96px; padding: 8px 12px; border-radius: 10px; background: #ff9a3c; color: #111; border: none; font-weight:700; transition: all 0.2s ease; cursor: pointer; }
.btn-invite-row.invited { background: rgba(255,255,255,0.04); color: #ffb76a; }
.btn-invite-row.invited:disabled {
  background: rgba(255,255,255,0.04);
  color: #ffb76a;
  opacity: 1;
  cursor: not-allowed;
}

.invite-row.already-invited {
  cursor: not-allowed;
}

.invite-row.already-invited:hover {
  transform: none;
}

/* hide legacy select icon CSS (we use per-row button now) */
.select-icon-wrapper, .select-icon { display: none }

/* Override Bootstrap's .text-muted inside this modal to ensure good contrast */
.inv-modal .text-muted { color: rgba(91, 91, 91, 0.92) !important }
</style>
