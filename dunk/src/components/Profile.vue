<template>
  <div class="container-fluid min-vh-100 bg-transparent d-flex align-items-center justify-content-center px-2" style="background: transparent;">
    <div class="w-100 mx-auto text-white" style="max-width:700px;">
      <button class="back-btn" @click="goBack" aria-label="Go back"><MoveLeft /></button>

      <!-- Header (match LoginPage look) -->
      <div class="mb-3">
        <h2 class="fw-bold text-warning mb-0" style="font-size:2.25rem;">Profile</h2>
        <div class="mb-1 text-secondary" style="font-size:1.1rem;">View a user's public profile and stats.</div>
      </div>

      <!-- Avatar, name, email -->
      <div class="d-flex flex-column align-items-center mb-3">
        <div style="width:100px;height:100px;border-radius:50%;border:5px solid #FFAD1D;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img v-if="!imgErrored" :src="photoUrl" @error="onImgError" style="width:100%;height:100%;object-fit:cover;" alt="Profile"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1f262b;color:#fff;font-weight:700;border-radius:50%;">
            {{ displayInitials }}
          </div>
        </div>

        <h3 class="fw-bold mb-0 mt-2" style="font-size:1.7rem;">{{ profile.name || profile.username || 'Anonymous' }}</h3>

        <div v-if="profile && profile.email" style="color:#9CA3AF;font-size:1.1rem;">
          {{ profile.email }}
        </div>

        <div class="mt-2" v-if="!(currentUser && currentUser.uid && currentUser.uid === uid)">
          <button
            v-if="currentUser && currentUser.uid"
            class="btn btn-outline-primary me-2"
            @click="toggleFollow"
          >
            {{ (profile.followers && currentUser && currentUser.uid && profile.followers[currentUser.uid]) ? 'Unfollow' : 'Follow' }}
          </button>
          <button v-else class="btn btn-outline-primary me-2" disabled>Follow</button>
        </div>
      </div>

      <!-- Stats grid (LoginPage style) -->
      <div class="row gx-3 gy-3 text-center mb-4">
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Trophy :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Ranking</span>
            <span class="badge bg-purple text-white mt-1" style="font-size:0.92rem;">{{ profile.skill ? profile.skill : 'Open' }}</span>
          </div>
        </div>

        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Star :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Score</span>
            <div class="fs-4 fw-semibold text-warning mt-1">{{ (profile && profile.score !== undefined) ? profile.score : 0 }}</div>
          </div>
        </div>

        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Users :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Gender</span>
            <span class="fw-semibold text-warning mt-1">{{ (profile && profile.gender) ? profile.gender : 'Not Set' }}</span>
          </div>
        </div>

        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Cake :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Age</span>
            <span class="fs-4 fw-semibold text-warning mt-1">{{ (profile && profile.age !== undefined && profile.age !== null) ? profile.age : '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Bio and Skill -->
      <div class="mb-4 px-3">
        <div class="col-12 d-flex mb-2">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <span class="fw-medium">Bio</span>
            <span class="fs-6 text-warning mt-1 text-center">{{ (profile && profile.bio) ? profile.bio : 'No bio yet.' }}</span>
          </div>
        </div>
        <div class="col-12 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <span class="fw-medium">Skill / Badge</span>
            <span class="fs-6 text-warning mt-1">{{ (profile && profile.skill) ? profile.skill : 'Unassigned' }}</span>
          </div>
        </div>

        <!-- Match Statistics (chart) -->
        <div class="match-stats-card border rounded-3 p-3 mt-2">
          <div class="match-stats-header d-flex align-items-center mb-2">
            <ChartColumn :size="18" class="me-2 text-warning" />
            <h5 class="mb-0">Match Statistics</h5>
          </div>
          <p class="lead-text">This player has <span class="text-warning fw-semibold">{{ totalWins }}</span> wins across all levels.</p>
          <div class="chart-grid-lines" aria-hidden="true"></div>
          <div class="stats-chart d-flex align-items-end justify-content-between">
            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (animateBars ? barHeight(statsFromProfile.open_wins) : '8px'), transitionDelay: '0ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ displayOpen }}</div>
              <div class="bar-label">Open</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (animateBars ? barHeight(statsFromProfile.intermediate_wins) : '8px'), transitionDelay: '90ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ displayIntermediate }}</div>
              <div class="bar-label">Intermediate</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: (animateBars ? barHeight(statsFromProfile.professional_wins) : '8px'), transitionDelay: '180ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ displayProfessional }}</div>
              <div class="bar-label">Professional</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Following & Followers (LoginPage pill/buttons look) -->
      <div class="row gx-3 justify-content-center mb-3">
        <div class="col-6 col-md-4 d-flex justify-content-center mb-2">
          <button
            type="button"
            class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
            style="background:#181A20;"
            @click="openFollowing"
          >
            <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
            Following ({{ followingList.length }})
          </button>
        </div>
        <div class="col-6 col-md-4 d-flex justify-content-center mb-2">
          <button
            type="button"
            class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
            style="background:#181A20;"
            @click="openFollowers"
          >
            <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
            Followers ({{ followersList.length }})
          </button>
        </div>
      </div>


      <!-- Followers / Following modal -->
      <!-- <div v-if="showFollowersModal || showFollowingModal" class="modal-overlay loginpage-modal" @click.self="closeFollowModal">
        <div class="follow-modal-styled loginpage-follow-modal" role="dialog" aria-modal="true">
          <div class="follow-modal-header-styled loginpage-header">
            <div class="d-flex align-items-center">
              <Users :color="'#FFAD1D'" :size="26" class="me-3" />
              <h1 class="follow-title">{{ showFollowingModal ? 'Following' : 'Followers' }}</h1>
            </div>
            <button class="btn-close-styled" @click="closeFollowModal" aria-label="Close">×</button>
          </div> -->
        
      <div v-if="showFollowersModal || showFollowingModal" class="modal-overlay" @click.self="closeFollowModal">
        <div class="follow-modal-styled" role="dialog" aria-modal="true">
          <div class="follow-modal-header-styled">
            <div class="d-flex align-items-center">
              <Users :color="'#FFAD1D'" :size="20" class="me-3" />
              <h3 class="mb-0" style="color:#FFAD1D;font-weight:700;font-size:1.6rem;">
                {{ showFollowingModal ? 'Following' : 'Followers' }}
              </h3>
              </div>
            <button class="btn-close-styled" @click="closeFollowModal" aria-label="Close">×</button>
          </div>
          

          <div class="search-bar-wrapper loginpage-search">
            <input
              type="search"
              v-model="searchQuery"
              placeholder="Search following..."
              class="search-input-styled"
              aria-label="Search followers"
            />
          </div>

          <div class="follow-modal-body-styled loginpage-body">
            <div class="list-grid login-list">
              <div
                v-for="u in filteredFollowList"
                :key="u.uid"
                class="user-card-styled login-user-card"
                @click="$router.push(`/profile/${u.uid}`)"
              >
                <div class="d-flex align-items-center">
                  <img v-if="u.photoURL" :src="u.photoURL" class="user-avatar-login" />
                  <div v-else class="user-avatar-fallback-login">{{ (u.name||'U').slice(0,1).toUpperCase() }}</div>
                  <div class="ms-3">
                    <div class="user-name-login">{{ u.name }}</div>
                    <div class="user-label-login text-muted">{{ u.email || u.gender || 'User' }}</div>
                  </div>
                </div>

                <div class="action-area-login">
                  <button v-if="showFollowingModal" class="unfollow-btn-login" @click.stop="confirmUnfollow(u.uid)">Unfollow</button>
                  <button v-else-if="currentUser && currentUser.uid === uid" class="unfollow-btn-login" @click.stop="confirmRemoveFollower(u.uid)">Remove</button>
                </div>
              </div>
            </div>

            <div v-if="filteredFollowList.length === 0" class="text-center text-muted py-4">No users found</div>
          </div>
        </div>
     </div>


      <!-- Confirmation popup (re-used from LoginPage) -->
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

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, deleteChildData } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import { MoveLeft, Trophy, Star, Users, Cake, ChartColumn } from 'lucide-vue-next'

// keep same scroll behavior
onBeforeMount(() => { window.scrollTo(0,0) })

const route = useRoute()
const router = useRouter()
const uid = route.params.uid

const profile = ref({
  name: '',
  username: '',
  email: '',
  gender: '',
  age: null,
  skill: '',
  score: 0,
  followers: {},
  following: {},
  bio: '',
  statistics: { open_wins:0, intermediate_wins:0, professional_wins:0 }
})

watch(() => route.params.uid, async (newUid, oldUid) => {
  if (newUid && newUid !== oldUid) await fetchProfile(newUid)
})

async function fetchProfile(targetUid) {
  try {
    const users = await getDataFromFirebase('users')
    if (users && users[targetUid]) {
      profile.value = { ...profile.value, ...users[targetUid] }
    }
  } catch (e) {
    console.warn('Failed to load profile', e)
  }
}

// basic state
const currentUser = ref(null)
const imgErrored = ref(false)

// modal / follower state
const usersMap = ref({})
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)
const showConfirmPopup = ref(false)
const confirmAction = ref(null)
const confirmMessage = ref('')
const searchQuery = ref('')
const filteredFollowers = ref([])
const filteredFollowing = ref([])
const profilePollRef = ref(null)

function goBack() { router.back() }

async function loadUsersMap() {
  try {
    const users = await getDataFromFirebase('users')
    usersMap.value = users || {}
  } catch (e) {
    usersMap.value = {}
  }
}

const followersList = computed(() => {
  const f = profile.value && profile.value.followers ? Object.keys(profile.value.followers) : []
  return f.map(id => {
    const u = usersMap.value && usersMap.value[id] ? usersMap.value[id] : null
    return { uid: id, name: (u && (u.name || u.username)) || id, email: u?.email || '', photoURL: u?.photoURL || null, gender: u?.gender || 'User' }
  })
})
const followingList = computed(() => {
  const f = profile.value && profile.value.following ? Object.keys(profile.value.following) : []
  return f.map(id => {
    const u = usersMap.value && usersMap.value[id] ? usersMap.value[id] : null
    return { uid: id, name: (u && (u.name || u.username)) || id, email: u?.email || '', photoURL: u?.photoURL || null, gender: u?.gender || 'User' }
  })
})

// initialize filtered lists when opening modals
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

// keep a computed filtered output for modal list rendering
const filteredFollowList = computed(() => {
  const q = (searchQuery.value || '').toLowerCase().trim()
  if (showFollowersModal.value) {
    if (!q) return filteredFollowers.value
    return filteredFollowers.value.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q))
  }
  if (showFollowingModal.value) {
    if (!q) return filteredFollowing.value
    return filteredFollowing.value.filter(u => (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q))
  }
  return []
})

// watch lists to keep filtered copies in sync
watch([followersList, followingList], () => {
  if (showFollowersModal.value) filteredFollowers.value = followersList.value
  if (showFollowingModal.value) filteredFollowing.value = followingList.value
})

// load profile + users map and start a short poll to refresh profile
onMounted(async () => {
  if (!uid) return
  try {
    const users = await getDataFromFirebase('users')
    if (users && users[uid]) profile.value = { ...profile.value, ...users[uid] }
    await loadUsersMap()

    if (profilePollRef.value) clearInterval(profilePollRef.value)
    profilePollRef.value = setInterval(async () => { try { await fetchProfile(uid) } catch(e){} }, 5000)
  } catch (e) {
    console.warn('Failed to initialize profile', e)
  }

  onUserStateChanged((u) => { currentUser.value = u })
})

// cleanup
onBeforeUnmount(() => {
  if (profilePollRef.value) { clearInterval(profilePollRef.value); profilePollRef.value = null }
})

// image fallback helpers
const displayInitials = computed(() => {
  const p = profile.value || {}
  const name = p.name || p.username || ''
  return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() || 'U'
})
const photoUrl = computed(() => {
  const p = profile.value || {}
  if (p.photoURL) return p.photoURL
  const name = p.name || p.username || p.email || uid || 'anon'
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name)}`
})
function onImgError() { imgErrored.value = true }

// stats and chart helpers (reuse from LoginPage)
const statsFromProfile = computed(() => {
  const s = (profile.value && profile.value.statistics) ? profile.value.statistics : {}
  return {
    open_wins: Number(s.open_wins || 0),
    intermediate_wins: Number(s.intermediate_wins || 0),
    professional_wins: Number(s.professional_wins || 0)
  }
})
const totalWins = computed(() => {
  const s = statsFromProfile.value
  return s.open_wins + s.intermediate_wins + s.professional_wins
})
function barHeight(value) {
  const max = Math.max(1, statsFromProfile.value.open_wins, statsFromProfile.value.intermediate_wins, statsFromProfile.value.professional_wins)
  const pct = value / Math.max(1, max)
  const px = Math.round(30 + pct * 190)
  return `${px}px`
}
const animateBars = ref(false)
const displayOpen = ref(0)
const displayIntermediate = ref(0)
const displayProfessional = ref(0)
let countsStarted = false
function animateCounts(duration = 700) {
  if (countsStarted) return
  countsStarted = true
  const start = performance.now()
  const startVals = { o: 0, i: 0, p: 0 }
  const targets = {
    o: statsFromProfile.value.open_wins,
    i: statsFromProfile.value.intermediate_wins,
    p: statsFromProfile.value.professional_wins
  }
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
onMounted(() => { setTimeout(() => { animateBars.value = true }, 80) })
watch(animateBars, (v) => { if (v) animateCounts() })

// Follow / Unfollow logic (keeps the behavior from earlier Profile.vue)
async function toggleFollow() {
  if (!currentUser.value) { alert('Please sign in to follow users'); return }
  const myUid = currentUser.value.uid
  if (!myUid) { alert('Please sign in'); return }
  if (myUid === uid) return

  if (!profile.value.followers) profile.value.followers = {}
  if (!profile.value.following) profile.value.following = {}

  try {
    const users = await getDataFromFirebase('users')
    if (!users) return
    const me = users[myUid] || {}
    const already = Boolean(me.following && me.following[uid])
    if (already) {
      await deleteChildData(`users/${myUid}/following`, uid)
      await deleteChildData(`users/${uid}/followers`, myUid)
      if (profile.value && profile.value.followers) {
        const updated = { ...profile.value }
        if (updated.followers) delete updated.followers[myUid]
        profile.value = updated
        try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'unfollow', targetUid: uid } })) } catch(e) {}
      }
    } else {
      const payload = { at: Date.now() }
      await setChildData(`users/${myUid}/following`, uid, payload)
      await setChildData(`users/${uid}/followers`, myUid, payload)
      profile.value = { ...profile.value, followers: { ...(profile.value.followers || {}), [myUid]: payload } }
      try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'follow', targetUid: uid } })) } catch(e) {}
    }
  } catch (e) {
    console.error('Failed to toggle follow', e)
    alert('Failed to update follow — try again')
  }
}

// Confirmation helpers used by modal (remove follower / unfollow)
function runConfirmAction() {
  if (confirmAction.value && typeof confirmAction.value === 'function') confirmAction.value()
}
function closeConfirmPopup() {
  showConfirmPopup.value = false
  confirmAction.value = null
  confirmMessage.value = ''
}
function confirmRemoveFollower(uidToRemove) {
  confirmMessage.value = 'Are you sure you want to remove this follower?'
  confirmAction.value = async () => {
    try {
      await deleteChildData(`users/${uid}/followers/${uidToRemove}`, null) // delete child via helper
      await deleteChildData(`users/${uidToRemove}/following/${uid}`, null)
      // reload profile from DB
      await fetchProfile(uid)
      showConfirmPopup.value = false
    } catch (e) { console.error(e) }
  }
  showConfirmPopup.value = true
}
function confirmUnfollow(uidToRemove) {
  confirmMessage.value = 'Are you sure you want to unfollow this user?'
  confirmAction.value = async () => {
    try {
      // remove my following and their follower entries
      if (!currentUser.value) return
      const myUid = currentUser.value.uid
      await deleteChildData(`users/${myUid}/following`, uidToRemove)
      await deleteChildData(`users/${uidToRemove}/followers`, myUid)
      // refresh following list
      await loadUsersMap()
      if (showFollowingModal.value) filteredFollowing.value = followingList.value
      showConfirmPopup.value = false
    } catch (e) { console.error(e) }
  }
  showConfirmPopup.value = true
}
</script>

<style scoped>
/* LOGINPAGE styles copied/adapted to make Profile look identical to LoginPage */
/* minimal edits: keep all visual rules required for exact match */
.bg-purple { background-color: #7133e2 !important; }
.border-gray-600 { border-color: #50575e !important; }
.profile-stat-card { min-height: 140px; background: transparent !important; }

.back-btn {
  position: fixed;
  left: calc(var(--sidebar-current-width, var(--sidebar-width)) + 12px);
  top: calc(var(--topbar-height, 72px) + 8px);
  background: rgba(24,28,35,0.9);
  border: 1px solid rgba(255,255,255,0.06);
  color: #fff;
  font-size: 18px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  z-index: 1200;
  box-shadow: 0 6px 18px rgba(0,0,0,0.45);
}

/* Avatar helpers */
.user-avatar-styled { width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #FFAD1D }
.user-avatar-fallback-styled { width:64px;height:64px;border-radius:50%;background:#FFAD1D;color:#000;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px }

/* Match statistics chart */
.match-stats-card { background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.02)); border: 1px solid rgba(255,255,255,0.04); padding: 18px; position: relative; overflow: hidden; }
.match-stats-card .lead-text { color: rgba(255,255,255,0.88); margin-bottom: 8px; font-size:0.98rem }
.stats-chart { gap: 28px; align-items:flex-end; height:260px; padding-bottom:12px; display:flex }
.chart-bar { flex: 1 1 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; position:relative }
.chart-grid-lines { position:absolute; left:18px; right:18px; top:18px; bottom:56px; pointer-events:none; background-image: linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 100% 44px; opacity:0.9; }
.bar-fill { width: 60%; background: linear-gradient(180deg,#ffca6a,#ffad1d); border-radius: 8px 8px 4px 4px; transition: height 360ms cubic-bezier(.2,.9,.3,1); display:flex; align-items:flex-start; justify-content:center; padding-top:8px; box-shadow: 0 6px 18px rgba(0,0,0,0.35); }
.bar-value { color: #081017; font-weight:800; font-size:0.98rem; margin-bottom:6px }
.bar-label { color:#9CA3AF; margin-top:10px; font-size:0.95rem }

/* Follow modal styles (LoginPage styled) */
.modal-overlay { position: fixed; inset: 0; background: rgba(20,20,20,0.85); display: flex; justify-content: center; align-items: center; z-index: 9999; }

.follow-modal-styled {
  width: 100%;
  max-width: 520px;        /* smaller, same as LoginPage */
  background: #1a1c20;
  border-radius: 16px;
  border: 3px solid #FFAD1D;
  overflow: hidden;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 48px rgba(0,0,0,0.6);
  padding: 0;
}
.follow-modal-header-styled h3 {
  margin: 0;
  font-size: 1.6rem; /* matches LoginPage header scale */
  line-height: 1;
}
.btn-close-styled { background: transparent; border: none; color: #fff; font-size: 32px; cursor: pointer; line-height: 1; transition: color 0.2s; }
.btn-close-styled:hover { color: #FFAD1D; }
.search-bar-wrapper { padding: 16px 28px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.search-input-styled { width: 100%; padding: 14px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 16px; outline: none; transition: all 0.2s; }
.search-input-styled::placeholder { color: rgba(255,255,255,0.4); }
.search-input-styled:focus { background: rgba(255,255,255,0.08); border-color: #FFAD1D; }
.follow-modal-body-styled { flex: 1; overflow-y: auto; padding: 12px 28px 20px; }
.user-card-styled { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; margin-bottom: 10px; background: rgba(255,255,255,0.03); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.user-card-styled:hover { background: rgba(255,255,255,0.06); transform: translateY(-2px); }
.unfollow-btn-styled { padding: 10px 28px; background: rgba(60,60,65,0.8); color: #FFAD1D; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.unfollow-btn-styled:hover { background: rgba(80,80,85,0.9); transform: scale(1.05); }

/* Confirm popup */
.confirm-popup-overlay { position: fixed; inset: 0; background: rgba(20, 20, 20, 0.85); display: flex; justify-content: center; align-items: center; z-index: 99999; }
.confirm-popup-content { display: flex; flex-direction: column; align-items: center; justify-content: center; background: #181a20; border-radius: 1.2rem; padding: 32px 48px; border: 2px solid #FFAD1D; text-align: center; color: #ffad1d; max-width: 340px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45); animation: popup-fade-in 0.5s cubic-bezier(.68,-0.55,.27,1.55) both; }
.popup-buttons { display: flex; justify-content: center; gap: 16px; margin-top: 20px; }
.btn-confirm { background: #FFAD1D; color: #181A20; padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-cancel { background: #323B46; color: #FFD75C; padding: 8px 18px; border-radius: 6px; cursor: pointer; border: none; }
.unfollow-btn { background: #3a3f47; color: #FFD75C; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.unfollow-btn:hover { background: #4d5660; }
@keyframes popup-fade-in { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* responsive */
@media (max-width: 540px) { .stats-chart { height: 180px } .bar-fill { width: 72% } }


/* .loginpage-modal { z-index: 10050; }
.loginpage-follow-modal { width: 100%; max-width: 720px; border: 4px solid #FFAD1D; border-radius: 18px; padding: 12px; background: #121316; box-shadow: 0 18px 48px rgba(0,0,0,0.7); }
.loginpage-header { padding: 20px 26px; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,173,29,0.06); }
.follow-title { color: #FFAD1D; font-weight: 800; font-size: 44px; margin: 0; line-height: 1; letter-spacing: -0.5px; } */

.btn-close-styled { font-size: 34px; color: #fff; background: transparent; border: none; cursor: pointer; padding: 6px 10px; }
.btn-close-styled:hover { color: #FFD27A; transform: translateY(-2px); }


.loginpage-search { padding: 18px 26px; }
.search-input-styled { width: 100%; padding: 16px 20px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.03); color: #fff; font-size: 16px; height: 54px; box-sizing: border-box; }
.search-input-styled::placeholder { color: rgba(255,255,255,0.36); }


.loginpage-body { padding: 12px 22px 20px; max-height: 56vh; overflow: auto; }
.login-list { display:flex; flex-direction:column; gap:12px; padding: 6px 8px; }
.login-user-card { padding: 14px 16px; border-radius: 12px; background: #17181b; align-items: center; justify-content: space-between; transition: transform .12s ease, background .12s ease; }
.login-user-card:hover { transform: translateY(-6px); background: #1c1d21; }


.user-avatar-login { width:64px; height:64px; border-radius:50%; object-fit:cover; border:4px solid #FFAD1D; box-shadow: 0 6px 18px rgba(0,0,0,0.45); }
.user-avatar-fallback-login { width:64px; height:64px; border-radius:50%; background:#FFAD1D; display:flex; align-items:center; justify-content:center; font-weight:800; color:#081017; border:4px solid #FFAD1D; }


.user-name-login { color:#fff; font-weight:800; font-size:18px; letter-spacing:0.2px; text-transform:uppercase; }
.user-label-login { color: rgba(255,255,255,0.6); font-size:13px; margin-top:2px; }


.unfollow-btn-login { background: rgba(35,38,43,0.92); color: #FFAD1D; border: none; padding: 10px 18px; border-radius: 12px; font-weight:700; cursor:pointer; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.25); transition: transform .12s ease, background .12s ease; }
.unfollow-btn-login:hover { transform: translateY(-3px); background: rgba(45,48,54,0.98); }


.action-area-login { display:flex; align-items:center; gap:8px; }


@media (max-width: 720px) {
  .loginpage-follow-modal { max-width: 92%; padding: 10px; }
  .follow-title { font-size: 32px; }
  .user-avatar-login, .user-avatar-fallback-login { width:56px; height:56px; border-width:3px; }
  .unfollow-btn-login { padding: 8px 14px; }
}

</style>