<template>
  <div class="profile-modal-overlay" @click.self="close">
    <div class="profile-modal">
      <button class="modal-close" @click="close">✕</button>
      <div class="profile-inner">
        <div class="profile-header">
          <div class="avatar-wrap">
            <img v-if="!imgErrored" :src="resolvedAvatarSrc" @error="onImgError" class="avatar-img" />
            <div v-else class="avatar-fallback">{{ displayInitials }}</div>
          </div>
          <div class="profile-meta">
            <h2>{{ profile.name || profile.username || 'Anonymous' }}</h2>
            <div class="profile-email" v-if="profile.email">{{ profile.email }}</div>
            <div class="profile-actions">
              <button v-if="currentUser && currentUser.uid && currentUser.uid !== uid" class="btn-follow" @click="toggleFollow">{{ isFollowing ? 'Unfollow' : 'Follow' }}</button>
            </div>
          </div>
        </div>

        <div class="profile-stats">
          <div class="stat">Ranking<br/><strong>{{ displayRanking }}</strong></div>
          <div class="stat">Total Wins<br/><strong>{{ profileTotalWins }}</strong></div>
          <div class="stat">Gender<br/><strong>{{ profile.gender || '—' }}</strong></div>
          <div class="stat">Age<br/><strong>{{ profile.age ?? '—' }}</strong></div>
        </div>

        <div class="profile-bio">
          <h3>Bio</h3>
          <p>{{ profile.bio || 'No bio yet.' }}</p>
        </div>

        <div class="profile-match-stats">
          <h3>Match Statistics</h3>
          <div class="stats-row">
            <div class="stat-bar">
              <div class="label">Open</div>
              <div class="value">{{ stats.open_wins }}</div>
            </div>
            <div class="stat-bar">
              <div class="label">Intermediate</div>
              <div class="value">{{ stats.intermediate_wins }}</div>
            </div>
            <div class="stat-bar">
              <div class="label">Professional</div>
              <div class="value">{{ stats.professional_wins }}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getDataFromFirebase, onDataChange, setChildData, deleteChildData } from '../firebase/firebase'
import { avatarForUser } from '../utils/avatar.js'
import { onUserStateChanged } from '../firebase/auth'

const props = defineProps({ uid: { type: String, required: true } })
const emit = defineEmits(['close'])
const uid = props.uid

const profile = ref({})
const imgErrored = ref(false)
const currentUser = ref(null)
let userUnsub = null

async function loadProfile(u) {
  try {
    // subscribe to the user's node for live updates
    if (userUnsub) try { userUnsub(); } catch(e) {}
    userUnsub = onDataChange(`users/${u}`, (val) => {
      profile.value = (val && typeof val === 'object') ? ({ uid: u, ...val }) : ({ uid: u })
    })
  } catch (e) {
    try {
      const users = await getDataFromFirebase('users')
      if (users && users[u]) profile.value = { uid: u, ...(users[u] || {}) }
      else profile.value = { uid: u }
    } catch (err) { profile.value = { uid: u } }
  }
}

onMounted(async () => {
  await loadProfile(uid)
  onUserStateChanged((u) => { currentUser.value = u })
})

onBeforeUnmount(() => {
  try { if (userUnsub) userUnsub() } catch (e) {}
})

const resolvedAvatarSrc = computed(() => {
  try {
    const p = profile.value || {}
    const explicit = p.photoURL || p.avatar || null
    if (explicit && typeof explicit === 'string') return explicit
    return avatarForUser({ uid: uid, name: p.name || p.username })
  } catch (e) { return avatarForUser({ uid }) }
})

const displayInitials = computed(() => {
  const name = (profile.value && (profile.value.name || profile.value.username)) || ''
  return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() || 'U'
})

function onImgError(e) { imgErrored.value = true }

const stats = computed(() => ({
  open_wins: Number(profile.value?.openWins || profile.value?.open_wins || 0),
  intermediate_wins: Number(profile.value?.intermediateWins || profile.value?.intermediate_wins || 0),
  professional_wins: Number(profile.value?.professionalWins || profile.value?.professional_wins || 0)
}))

const profileTotalWins = computed(() => stats.value.open_wins + stats.value.intermediate_wins + stats.value.professional_wins)

function computeRankingFromWinsLocal(wins) {
  const n = Number(wins || 0)
  if (n > 40) return 'Professional'
  if (n > 20) return 'Intermediate'
  return 'Beginner'
}
const displayRanking = computed(() => computeRankingFromWinsLocal(profileTotalWins.value))

const isFollowing = computed(() => {
  if (!currentUser.value || !currentUser.value.uid) return false
  return Boolean(profile.value && profile.value.followers && profile.value.followers[currentUser.value.uid])
})

async function toggleFollow() {
  if (!currentUser.value || !currentUser.value.uid) { alert('Sign in to follow users'); return }
  const myUid = currentUser.value.uid
  if (myUid === uid) return
  try {
    if (isFollowing.value) {
      await deleteChildData(`users/${myUid}/following`, uid)
      await deleteChildData(`users/${uid}/followers`, myUid)
    } else {
      await setChildData(`users/${myUid}/following`, uid, { at: Date.now() })
      await setChildData(`users/${uid}/followers`, myUid, { at: Date.now() })
    }
  } catch (e) { console.warn('toggleFollow failed', e) }
}

function close() { emit('close') }
</script>

<style scoped>
.profile-modal-overlay { position: fixed; inset: 0; background: rgba(10,12,14,0.7); display:flex; align-items:center; justify-content:center; z-index:11000 }
.profile-modal { width: 92%; max-width: 760px; background: #0f1113; border-radius: 14px; padding: 18px; border: 2px solid #FFAD1D; box-shadow: 0 22px 64px rgba(0,0,0,0.7); position: relative }
.modal-close { position:absolute; right:12px; top:12px; background:transparent; border:none; color:#fff; font-size:20px; cursor:pointer }
.profile-header { display:flex; gap:16px; align-items:center }
.avatar-wrap { width:100px; height:100px; border-radius:50%; overflow:hidden; border:4px solid #FFAD1D; display:flex; align-items:center; justify-content:center }
.avatar-img { width:100%; height:100%; object-fit:cover }
.avatar-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; font-weight:700; font-size:28px }
.profile-meta h2 { margin:0; color:#fff }
.profile-email { color:#9CA3AF }
.profile-actions { margin-top:8px }
.btn-follow { background:#FFAD1D; border:none; color:#081017; padding:8px 12px; border-radius:8px; font-weight:700; cursor:pointer }
.profile-stats { display:flex; gap:12px; margin-top:14px }
.profile-stats .stat { flex:1; background:#16181c; padding:12px; border-radius:10px; text-align:center; color:#d3c7a3 }
.profile-bio { margin-top:14px; background:#0f1316; padding:12px; border-radius:8px; color:#d3c7a3 }
.profile-match-stats { margin-top:14px }
.stats-row { display:flex; gap:12px }
.stat-bar { flex:1; background:#101214; padding:10px; border-radius:8px; text-align:center }
.stat-bar .label { color:#9ca3af }
.stat-bar .value { font-weight:900; color:#ffd98a; font-size:1.25rem }
</style>
