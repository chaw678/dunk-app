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

        <!-- Following & Followers buttons (open modal lists) -->
        <div style="display:flex;gap:10px;margin-top:12px;justify-content:center;">
          <button class="btn-follow" @click="openFollowing">Following ({{ (profile.following && Object.keys(profile.following).length) || 0 }})</button>
          <button class="btn-follow" @click="openFollowers">Followers ({{ (profile.followers && Object.keys(profile.followers).length) || 0 }})</button>
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
          <div class="match-stats-card">
            <p class="lead-text">This player has <span class="text-warning fw-semibold">{{ totalWins }}</span> wins across all levels.</p>
            <div class="chart-grid-lines" aria-hidden="true"></div>
            <div class="stats-chart d-flex align-items-end justify-content-between">
              <div class="chart-bar"
                   @mouseenter="showBarTooltip($event, 'Open', stats.open_wins)"
                   @mouseleave="hideBarTooltip">
                <div class="bar-fill" :style="{ height: (stats.open_wins > 0 ? (animateBars ? barHeight(stats.open_wins) : '8px') : '4px'), background: (stats.open_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (stats.open_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '0ms' }" aria-hidden="true"></div>
                <div class="bar-value">{{ stats.open_wins > 0 ? displayOpen : '' }}</div>
                <div class="bar-label">Open</div>
              </div>

              <div class="chart-bar"
                   @mouseenter="showBarTooltip($event, 'Intermediate', stats.intermediate_wins)"
                   @mouseleave="hideBarTooltip">
                <div class="bar-fill" :style="{ height: (stats.intermediate_wins > 0 ? (animateBars ? barHeight(stats.intermediate_wins) : '8px') : '4px'), background: (stats.intermediate_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (stats.intermediate_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '90ms' }" aria-hidden="true"></div>
                <div class="bar-value">{{ stats.intermediate_wins > 0 ? displayIntermediate : '' }}</div>
                <div class="bar-label">Intermediate</div>
              </div>

              <div class="chart-bar"
                   @mouseenter="showBarTooltip($event, 'Professional', stats.professional_wins)"
                   @mouseleave="hideBarTooltip">
                <div class="bar-fill" :style="{ height: (stats.professional_wins > 0 ? (animateBars ? barHeight(stats.professional_wins) : '8px') : '4px'), background: (stats.professional_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (stats.professional_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '180ms' }" aria-hidden="true"></div>
                <div class="bar-value">{{ stats.professional_wins > 0 ? displayProfessional : '' }}</div>
                <div class="bar-label">Professional</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Followers / Following modal -->
  <div v-if="showFollowersModal || showFollowingModal" class="follow-popup-overlay" @click.self="closeFollowModal">
    <div class="follow-popup-content">
      <div class="follow-popup-header">
        <h3>{{ showFollowersModal ? 'Followers' : 'Following' }}</h3>
        <button class="close-btn" @click="closeFollowModal">✕</button>
      </div>

      <input v-model="searchQuery" type="text" placeholder="Search..." class="search-input" />

      <div class="follow-list">
        <div class="follow-item" v-for="f in filteredFollowList" :key="f.uid">
          <div role="button" tabindex="0" class="d-flex align-items-center w-100 text-decoration-none text-reset" @click.prevent="openPublicProfile(f.uid)">
            <img :src="f.photoURL || (usersMap[f.uid] && usersMap[f.uid].avatar) || ''" class="avatar" />
            <div class="info">
              <div class="username">{{ f.name }}</div>
              <div class="sub">{{ f.sub || 'User' }}</div>
            </div>
          </div>
          <button v-if="currentUser && currentUser.uid === uid" class="remove-btn" @click="confirmRemoveFollower(f.uid)">Remove</button>
          <button v-else-if="showFollowingModal" class="remove-btn" @click="confirmUnfollow(f.uid)">Unfollow</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirmation popup -->
  <div v-if="showConfirmPopup" class="confirm-popup-overlay" @click.self="closeConfirmPopup">
    <div class="confirm-popup-content">
      <h2 class="popup-title">Confirm Action</h2>
      <p class="popup-text">{{ confirmMessage }}</p>
      <div class="popup-buttons">
        <button class="btn-confirm" @click="runConfirmAction()">Confirm</button>
        <button class="btn-cancel" @click="closeConfirmPopup">Cancel</button>
      </div>
    </div>
  </div>

  <!-- Tooltip -->
  <div v-if="showTooltip" class="chart-tooltip" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px', transform: 'translateX(-50%)' }">{{ tooltipContent }}</div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDataFromFirebase, onDataChange, setChildData, deleteChildData } from '../firebase/firebase'
import { avatarForUser, seededAvatar } from '../utils/avatar.js'
import { onUserStateChanged } from '../firebase/auth'

const props = defineProps({ uid: { type: String, required: true } })
const emit = defineEmits(['close'])
const uid = props.uid

const profile = ref({})
const imgErrored = ref(false)
const currentUser = ref(null)
let userUnsub = null
// follower modal state and users map (copied from Profile.vue interactive behavior)
const usersMap = ref({})
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)
const showConfirmPopup = ref(false)
const confirmAction = ref(null)
const confirmMessage = ref('')
const searchQuery = ref('')
const filteredFollowers = ref([])
const filteredFollowing = ref([])

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
  // load users map for follower/following modals if needed
  try { loadUsersMap() } catch (e) { /* ignore */ }
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
const totalWins = profileTotalWins

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
      // ask for confirm when unfollowing from modal for parity with Profile
      confirmMessage.value = 'Are you sure you want to unfollow this user?'
      confirmAction.value = async () => {
        try {
          await deleteChildData(`users/${myUid}/following`, uid)
          await deleteChildData(`users/${uid}/followers`, myUid)
          // update local profile if necessary
          try { if (profile.value && profile.value.followers) { const upd = { ...profile.value }; if (upd.followers) delete upd.followers[myUid]; profile.value = upd } } catch(e){}
        } catch (e) { console.warn('unfollow failed', e) }
        showConfirmPopup.value = false
      }
      showConfirmPopup.value = true
      return
    } else {
      await setChildData(`users/${myUid}/following`, uid, { at: Date.now() })
      await setChildData(`users/${uid}/followers`, myUid, { at: Date.now() })
    }
  } catch (e) { console.warn('toggleFollow failed', e) }
}

// Users map and followers/following modal logic (copied/adapted from Profile.vue)
async function loadUsersMap() {
  try {
    const users = await getDataFromFirebase('users')
    if (users && typeof users === 'object') {
      const out = {}
      for (const [k, u] of Object.entries(users)) {
        try {
          const userObj = Object.assign({ uid: k }, (u || {}))
          const resolvedAvatar = avatarForUser(userObj)
          out[k] = Object.assign({}, u, { avatar: (u && (u.avatar || u.photoURL)) ? (u.avatar || u.photoURL) : resolvedAvatar })
        } catch (inner) {
          out[k] = u
        }
      }
      usersMap.value = out
    } else {
      usersMap.value = {}
    }
  } catch (e) { usersMap.value = {} }
}

const followersList = computed(() => {
  const f = profile.value && profile.value.followers ? Object.keys(profile.value.followers) : []
  return f.map(id => {
    const u = usersMap.value && usersMap.value[id] ? usersMap.value[id] : null
    const uWins = (u) ? (Number(u.openWins ?? 0) + Number(u.intermediateWins ?? 0) + Number(u.professionalWins ?? 0)) : 0
    const rank = computeRankingFromWinsLocal(uWins)
    const sub = `${rank}${(u && u.gender) ? ' ' + u.gender : ''}`
    return { uid: id, name: (u && (u.name || u.username)) || id, email: u?.email || '', photoURL: u?.photoURL || null, sub }
  })
})
const followingList = computed(() => {
  const f = profile.value && profile.value.following ? Object.keys(profile.value.following) : []
  return f.map(id => {
    const u = usersMap.value && usersMap.value[id] ? usersMap.value[id] : null
    const uWins = (u) ? (Number(u.openWins ?? 0) + Number(u.intermediateWins ?? 0) + Number(u.professionalWins ?? 0)) : 0
    const rank = computeRankingFromWinsLocal(uWins)
    const sub = `${rank}${(u && u.gender) ? ' ' + u.gender : ''}`
    return { uid: id, name: (u && (u.name || u.username)) || id, email: u?.email || '', photoURL: u?.photoURL || null, sub }
  })
})

function openFollowers() {
  if (!Object.keys(usersMap.value).length) loadUsersMap()
  showFollowersModal.value = true
  showFollowingModal.value = false
  searchQuery.value = ''
  filteredFollowers.value = followersList.value
}
function openFollowing() {
  if (!Object.keys(usersMap.value).length) loadUsersMap()
  showFollowingModal.value = true
  showFollowersModal.value = false
  searchQuery.value = ''
  filteredFollowing.value = followingList.value
}
function closeFollowModal() {
  showFollowersModal.value = false
  showFollowingModal.value = false
  searchQuery.value = ''
}

const filteredFollowList = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim()
  const searchList = (list) => {
    if (!q) return list
    return list.filter(u => {
      const rawName = ((u.name || u.username) || '').toLowerCase().trim()
      const firstToken = (rawName.split(/\s+/)[0] || '')
      const emailLocal = ((u.email || '').toLowerCase().split('@')[0] || '')
      return (firstToken && firstToken.startsWith(q)) || (emailLocal && emailLocal.startsWith(q))
    })
  }
  try {
    if (showFollowersModal.value) return searchList(followersList.value)
    if (showFollowingModal.value) return searchList(followingList.value)
  } catch (e) { console.warn('filteredFollowList error', e) }
  return []
})

// Confirmation popup handlers (copied from Profile.vue)
function runConfirmAction() { if (confirmAction.value && typeof confirmAction.value === 'function') confirmAction.value() }
function closeConfirmPopup() { showConfirmPopup.value = false; confirmAction.value = null; confirmMessage.value = '' }

function confirmRemoveFollower(uidToRemove) {
  if (!currentUser.value || currentUser.value.uid !== uid) return
  confirmMessage.value = 'Are you sure you want to remove this follower?'
  confirmAction.value = async () => {
    try {
      await deleteChildData(`users/${uid}/followers/${uidToRemove}`, null)
      await deleteChildData(`users/${uidToRemove}/following/${uid}`, null)
      // reload profile
      await loadProfile(uid)
      showConfirmPopup.value = false
    } catch (e) { console.error(e) }
  }
  showConfirmPopup.value = true
}

function confirmUnfollow(uidToRemove) {
  confirmMessage.value = 'Are you sure you want to unfollow this user?'
  confirmAction.value = async () => {
    try {
      if (!currentUser.value) return
      const myUid = currentUser.value.uid
      await deleteChildData(`users/${myUid}/following`, uidToRemove)
      await deleteChildData(`users/${uidToRemove}/followers`, myUid)
      await loadUsersMap()
      if (showFollowingModal.value) filteredFollowing.value = followingList.value
      showConfirmPopup.value = false
    } catch (e) { console.error(e) }
  }
  showConfirmPopup.value = true
}

// navigation helper to open public profile route
const router = useRouter()
function openPublicProfile(targetUid) {
  try { closeFollowModal() } catch (e) {}
  router.push({ name: 'PublicProfile', params: { uid: targetUid } })

}

// Chart animations & counters (copied from Profile.vue)
const animateBars = ref(false)
const showTooltip = ref(false)
const tooltipContent = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
const displayOpen = ref(0)
const displayIntermediate = ref(0)
const displayProfessional = ref(0)
let countsStarted = false
function animateCounts(duration = 700) {
  if (countsStarted) return
  countsStarted = true
  const start = performance.now()
  const startVals = { o: 0, i: 0, p: 0 }
  const targets = { o: stats.value.open_wins, i: stats.value.intermediate_wins, p: stats.value.professional_wins }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3) }
  function step(now) {
    const t = Math.min(1, (now - start) / duration)
    const e = easeOutCubic(t)
    displayOpen.value = Math.round(startVals.o + (targets.o - startVals.o) * e)
    displayIntermediate.value = Math.round(startVals.i + (targets.i - startVals.i) * e)
    displayProfessional.value = Math.round(startVals.p + (targets.p - startVals.p) * e)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
onMounted(() => { setTimeout(() => { animateBars.value = true }, 80); if (animateBars.value) animateCounts() })
watch(animateBars, (v) => { if (v) animateCounts() })
function showBarTooltip(event, skillLevel, wins) {
  const rect = event.target.getBoundingClientRect()
  tooltipPosition.value = { x: rect.left + rect.width / 2, y: rect.top - 45 }
  tooltipContent.value = `${skillLevel}: ${wins} win${wins !== 1 ? 's' : ''}`
  showTooltip.value = true
}
function hideBarTooltip() { showTooltip.value = false }

function barHeight(value) {
  const basePx = 30
  const maxVisiblePx = 160
  const maxVal = Math.max(1, stats.value.open_wins, stats.value.intermediate_wins, stats.value.professional_wins)
  const ratio = value / maxVal
  const scaled = Math.sqrt(ratio)
  const px = Math.round(basePx + scaled * (maxVisiblePx - basePx))
  return `${px}px`
}

// allow profile owner to randomize avatar (copied)
async function randomizeAvatar() {
  try {
    if (!currentUser.value || !currentUser.value.uid) { alert('Please sign in to change your avatar.'); return }
    if (String(currentUser.value.uid) !== String(uid)) { alert('You can only randomize your own profile picture.'); return }
    const suffix = Math.random().toString(36).slice(2, 9)
    const seed = `${uid}-${suffix}`
    const gender = (profile.value && profile.value.gender) || undefined
    const newUrl = seededAvatar(seed, gender)
    await setChildData(`users/${uid}`, 'avatar', newUrl)
    profile.value = { ...(profile.value || {}), avatar: newUrl, photoURL: profile.value.photoURL || newUrl }
    try { window.dispatchEvent(new CustomEvent('user-avatar-changed', { detail: { uid: uid, avatar: newUrl } })) } catch(e){}
    try { window.location.reload() } catch (e) {}
  } catch (e) { console.error('randomizeAvatar failed', e); alert('Failed to randomize avatar — try again.') }
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
