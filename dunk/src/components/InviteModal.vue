<template>
  <div class="inv-overlay" @click.self="close">
    <div class="inv-modal card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>Invite players</strong>
          <div class="small text-muted">Invite your followers or people you follow to this match</div>
        </div>
        <button class="btn-close" @click="close" aria-label="Close"></button>
      </div>

      <div class="card-body inv-body">
            <div class="inv-actions mb-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <div class="form-check">
                  <input id="selectAll" type="checkbox" class="form-check-input" v-model="selectAll" />
                  <label for="selectAll" class="form-check-label">Select all</label>
                </div>
              </div>
              <div style="min-width:180px;">
                <input type="text" class="form-control form-control-sm" placeholder="Search by name" v-model="filter" />
              </div>
            </div>

            <div class="candidates-list">
              <ul class="list-unstyled mb-0">
                <li v-for="u in filteredCandidates" :key="u.uid" :class="['invite-row', { selected: selectedMap[u.uid] }]" class="d-flex align-items-center" @click="toggleSelect(u.uid)">
                  <div class="me-3" @click.stop>
                    <!-- keep checkbox for accessibility but visually hidden -->
                    <input type="checkbox" :id="`chk_${u.uid}`" v-model="selectedMap[u.uid]" class="visually-hidden" />
                  </div>
                  <div class="small-avatar me-3">
                    <img :src="avatarUrl(u)" alt="avatar" v-if="avatarUrl(u)" />
                    <div v-else class="avatar-initial">{{ initials(u.name || u.username || u.uid) }}</div>
                  </div>
                  <div class="flex-fill">
                    <div class="invite-name">{{ u.name || u.username || u.email || u.uid }}</div>
                    <div class="small text-muted">{{ u.meta || u.city || '' }}</div>
                  </div>
                  <div class="ms-3 select-icon-wrapper">
                    <span class="select-icon" :aria-checked="selectedMap[u.uid] ? 'true' : 'false'">
                      <template v-if="selectedMap[u.uid]">✓</template>
                      <template v-else>＋</template>
                    </span>
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
  </div>
</template>

<script setup>
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

// Build candidates list: merge following + followers for current user
const candidates = ref([])

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

watch(() => props.me, () => { loadCandidates() }, { immediate: true })

const filteredCandidates = computed(() => {
  const term = (filter.value || '').toLowerCase().trim()
  return candidates.value.filter(u => {
    if (!u) return false

    // Exclude users who are already part of the match (joinedBy map, players array, or playersMap)
    try {
      const m = props.match || {}
      if (m.joinedBy && typeof m.joinedBy === 'object' && u.uid && m.joinedBy[u.uid]) return false
      if (m.playersMap && u.uid && m.playersMap[u.uid]) return false
      if (m.players && Array.isArray(m.players)) {
        const uname = (u.name || u.username || '').toString().toLowerCase()
        if (uname && m.players.some(p => (''+p).toLowerCase() === uname)) return false
      }
    } catch (e) {
      // ignore check errors and continue
    }

    if (!term) return true
    const s = `${u.name || u.username || ''} ${u.email || ''}`.toLowerCase()
    return s.indexOf(term) !== -1
  })
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
      } catch (err) {
        console.warn('Invite failed for', uid, err)
      }
    }
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
.small-avatar { width:44px; height:44px; border-radius:50%; overflow:hidden }
.small-avatar img { width:100%; height:100%; object-fit:cover }
.avatar-initial { width:44px; height:44px; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; border-radius:50% }
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
</style>
