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
      <!-- Following & Followers (placed below avatar, above stats) -->
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

      <!-- Stats grid (LoginPage style) -->
      <div class="row gx-3 gy-3 text-center mb-4">
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Trophy :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Ranking</span>
            <span class="badge bg-purple text-white mt-1" style="font-size:0.92rem;">{{ displayRanking }}</span>
          </div>
        </div>

        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Star :color="'#FFAD1D'" :size="32" class="mb-2" />
            <span class="fw-medium">Total Wins</span>
            <div class="fs-4 fw-semibold text-warning mt-1">{{ profileTotalWins }}</div>
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
            <div class="chart-bar"
                 @mouseenter="showBarTooltip($event, 'Open', statsFromProfile.open_wins)"
                 @mouseleave="hideBarTooltip">
              <div class="bar-fill" :style="{ height: (statsFromProfile.open_wins > 0 ? (animateBars ? barHeight(statsFromProfile.open_wins) : '8px') : '4px'), background: (statsFromProfile.open_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.open_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '0ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.open_wins > 0 ? displayOpen : '' }}</div>
              <div class="bar-label">Open</div>
            </div>

            <div class="chart-bar"
                 @mouseenter="showBarTooltip($event, 'Intermediate', statsFromProfile.intermediate_wins)"
                 @mouseleave="hideBarTooltip">
              <div class="bar-fill" :style="{ height: (statsFromProfile.intermediate_wins > 0 ? (animateBars ? barHeight(statsFromProfile.intermediate_wins) : '8px') : '4px'), background: (statsFromProfile.intermediate_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.intermediate_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '90ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.intermediate_wins > 0 ? displayIntermediate : '' }}</div>
              <div class="bar-label">Intermediate</div>
            </div>

            <div class="chart-bar"
                 @mouseenter="showBarTooltip($event, 'Professional', statsFromProfile.professional_wins)"
                 @mouseleave="hideBarTooltip">
              <div class="bar-fill" :style="{ height: (statsFromProfile.professional_wins > 0 ? (animateBars ? barHeight(statsFromProfile.professional_wins) : '8px') : '4px'), background: (statsFromProfile.professional_wins > 0 ? 'linear-gradient(180deg,#ffca6a,#ffad1d)' : 'transparent'), boxShadow: (statsFromProfile.professional_wins > 0 ? '0 6px 18px rgba(0,0,0,0.35)' : 'none'), transitionDelay: '180ms' }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.professional_wins > 0 ? displayProfessional : '' }}</div>
              <div class="bar-label">Professional</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <div v-if="showTooltip" 
           class="chart-tooltip" 
           :style="{ 
             left: tooltipPosition.x + 'px', 
             top: tooltipPosition.y + 'px',
             transform: 'translateX(-50%)' 
           }">
        {{ tooltipContent }}
      </div>

      


      <!-- Followers / Following modal (copied from LoginPage for exact parity) -->
      <!-- Followers popup -->
      <div v-if="showFollowersModal" class="follow-popup-overlay" @click.self="closeFollowModal">
        <div class="follow-popup-content">
          <div class="follow-popup-header">
            <h3>Followers</h3>
            <button class="close-btn" @click="closeFollowModal">✕</button>
          </div>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search followers..."
            class="search-input"
          />

          <div class="follow-list">
            <div class="follow-item" v-for="f in filteredFollowList" :key="f.uid" v-if="matchesQuery(f)">
              <div
                role="button"
                tabindex="0"
                class="d-flex align-items-center w-100 text-decoration-none text-reset"
                @click.prevent="openPublicProfile(f.uid)"
                @keyup.enter="openPublicProfile(f.uid)"
              >
                <img
                  :src="f.photoURL || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(f.email.split('@')[0])}`"
                  class="avatar"
                />
                <div class="info">
                  <div class="username">{{ f?.name || f?.email || 'Unknown User' }}</div>
                  <div class="sub">{{ f.sub || 'User' }}</div>
                </div>
              </div>
              <button v-if="currentUser && currentUser.uid === uid" class="remove-btn" @click="confirmRemoveFollower(f.uid)">Remove</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Following popup -->
      <div v-if="showFollowingModal" class="follow-popup-overlay" @click.self="closeFollowModal">
        <div class="follow-popup-content">
          <div class="follow-popup-header">
            <h3>Following</h3>
            <button class="close-btn" @click="closeFollowModal">✕</button>
          </div>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search following..."
            class="search-input"
          />

          <div class="follow-list">
            <div class="follow-item" v-for="f in filteredFollowList" :key="f.uid" v-if="matchesQuery(f)">
              <div
                role="button"
                tabindex="0"
                class="d-flex align-items-center w-100 text-decoration-none text-reset"
                @click.prevent="openPublicProfile(f.uid)"
                @keyup.enter="openPublicProfile(f.uid)"
              >
                <img
                  :src="f.photoURL || `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(f.email.split('@')[0])}`"
                  class="avatar"
                />
                <div class="info">
                  <div class="username">{{ f?.name || f?.email || 'Unknown User' }}</div>
                  <div class="sub">{{ f.sub || 'User' }}</div>
                </div>
              </div>

              <button class="remove-btn" @click="confirmUnfollow(f.uid)">Unfollow</button>
            </div>
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
const uid = computed(() => route.params.uid)

const profile = ref({
  name: '',
  username: '',
  email: '',
  gender: '',
  age: null,
  // default skill set to 'Beginner' so profiles without an explicit skill show Beginner
  skill: 'Beginner',
  // new canonical field for rank
  ranking: 'Beginner',
  score: 0,
  followers: {},
  following: {},
  bio: '',
  // migrated to flat fields: openWins, intermediateWins, professionalWins
  // old nested `statistics` removed
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

  // helper: perform strict prefix-only search on a list of users
  const searchList = (list) => {
    if (!q) return list
    return list.filter(u => {
      // match only the first token of the display name (first name) or the local-part of the email
      const rawName = ((u.name || u.username) || '').toLowerCase().trim()
      const firstToken = (rawName.split(/\s+/)[0] || '')
      const emailLocal = ((u.email || '').toLowerCase().split('@')[0] || '')
      return (firstToken && firstToken.startsWith(q)) || (emailLocal && emailLocal.startsWith(q))
    })
  }

  try {
    if (showFollowersModal.value) {
      const out = searchList(followersList.value)
      // debug: log query and results to help trace filtering issues in browser console
      // eslint-disable-next-line no-console
      console.debug('[Profile] filteredFollowList - followers', { q, baseCount: (followersList.value || []).length, resultCount: out.length, sample: out.slice(0,8).map(u => u.name || u.email) })
      return out
    }
    if (showFollowingModal.value) {
      const out = searchList(followingList.value)
      // eslint-disable-next-line no-console
      console.debug('[Profile] filteredFollowList - following', { q, baseCount: (followingList.value || []).length, resultCount: out.length, sample: out.slice(0,8).map(u => u.name || u.email) })
      return out
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Profile] filteredFollowList error', e)
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
  if (!uid.value) return
  try {
    const users = await getDataFromFirebase('users')
    if (users && users[uid.value]) profile.value = { ...profile.value, ...users[uid.value] }
    await loadUsersMap()

    if (profilePollRef.value) clearInterval(profilePollRef.value)
    profilePollRef.value = setInterval(async () => { try { await fetchProfile(uid.value) } catch(e){} }, 5000)
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

// stats and chart helpers (use flat camelCase win fields only)
const statsFromProfile = computed(() => {
  const p = profile.value || {}
  const o = Number(p.openWins ?? 0)
  const i = Number(p.intermediateWins ?? 0)
  const pr = Number(p.professionalWins ?? 0)
  // keep the returned shape the chart expects (snake_case keys)
  return {
    open_wins: o,
    intermediate_wins: i,
    professional_wins: pr
  }
})

const totalWins = computed(() => {
  const s = statsFromProfile.value
  return s.open_wins + s.intermediate_wins + s.professional_wins
})

// Profile-level total wins derived from the flat fields (openWins, intermediateWins, professionalWins)
const profileTotalWins = computed(() => {
  const p = profile.value || {}
  const o = Number(p.openWins ?? 0)
  const i = Number(p.intermediateWins ?? 0)
  const pr = Number(p.professionalWins ?? 0)
  return o + i + pr
})

// Display ranking on public profile derived from profileTotalWins (ignore stale stored ranking)
function computeRankingFromWinsLocal(wins) {
  const n = Number(wins || 0)
  if (n > 40) return 'Professional'
  if (n > 20) return 'Intermediate'
  return 'Beginner'
}

const displayRanking = computed(() => {
  return computeRankingFromWinsLocal(profileTotalWins.value)
})

// If the profile belongs to the signed-in user, keep the DB `ranking` in sync when wins cross thresholds.
watch(profileTotalWins, async (newVal, oldVal) => {
  try {
    if (!currentUser.value || !currentUser.value.uid) return
    if (!uid.value) return
    // Only update ranking in DB when the viewer is the profile owner
    if (currentUser.value.uid !== uid.value) return
    const desired = computeRankingFromWinsLocal(Number(newVal || 0))
    const stored = profile.value && profile.value.ranking
    if (stored !== desired) {
      try {
        await setChildData(`users/${uid.value}`, 'ranking', desired)
        // keep UI state in sync
        profile.value = { ...(profile.value || {}), ranking: desired }
      } catch (e) {
        console.error('Failed to persist profile ranking', e)
      }
    }
  } catch (e) {
    console.error('Error while syncing profile ranking', e)
  }
})
function barHeight(value) {
  // Compute proportional bar heights but cap them to the chart's available height
  // to avoid visual overflow when one value dominates.
  const basePx = 30
  // Lower the max visible height to ensure bars never touch header or labels
  const maxVisiblePx = 160 // leave extra breathing room above/below bars

  const maxVal = Math.max(1, statsFromProfile.value.open_wins, statsFromProfile.value.intermediate_wins, statsFromProfile.value.professional_wins)
  const ratio = value / maxVal
  // soft-scale using square-root to reduce dominance of extremely large values while keeping proportions
  const scaled = Math.sqrt(ratio)
  const px = Math.round(basePx + scaled * (maxVisiblePx - basePx))
  return `${px}px`
}
const animateBars = ref(false)

// tooltip state
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

// tooltip functions
function showBarTooltip(event, skillLevel, wins) {
  const rect = event.target.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 45
  }
  tooltipContent.value = `${skillLevel}: ${wins} win${wins !== 1 ? 's' : ''}`
  showTooltip.value = true
}

function hideBarTooltip() {
  showTooltip.value = false
}

// Follow / Unfollow logic (keeps the behavior from earlier Profile.vue)
async function toggleFollow() {
  if (!currentUser.value) { alert('Please sign in to follow users'); return }
  const myUid = currentUser.value.uid
  if (!myUid) { alert('Please sign in'); return }
  if (myUid === uid.value) return

  if (!profile.value.followers) profile.value.followers = {}
  if (!profile.value.following) profile.value.following = {}

  try {
    const users = await getDataFromFirebase('users')
    if (!users) return
    const me = users[myUid] || {}
    const already = Boolean(me.following && me.following[uid.value])
    if (already) {
      await deleteChildData(`users/${myUid}/following`, uid.value)
      await deleteChildData(`users/${uid.value}/followers`, myUid)
      if (profile.value && profile.value.followers) {
        const updated = { ...profile.value }
        if (updated.followers) delete updated.followers[myUid]
        profile.value = updated
        try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'unfollow', targetUid: uid.value } })) } catch(e) {}
      }
    } else {
      const payload = { at: Date.now() }
      await setChildData(`users/${myUid}/following`, uid.value, payload)
      await setChildData(`users/${uid.value}/followers`, myUid, payload)
      profile.value = { ...profile.value, followers: { ...(profile.value.followers || {}), [myUid]: payload } }
      try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'follow', targetUid: uid.value } })) } catch(e) {}
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
  // Only the profile owner may remove followers via this public profile view
  if (!currentUser.value || currentUser.value.uid !== uid.value) {
    console.warn('Not authorized to remove followers from this profile')
    return
  }
  confirmMessage.value = 'Are you sure you want to remove this follower?'
  confirmAction.value = async () => {
    try {
      await deleteChildData(`users/${uid.value}/followers/${uidToRemove}`, null) // delete child via helper
      await deleteChildData(`users/${uidToRemove}/following/${uid.value}`, null)
      // reload profile from DB
      await fetchProfile(uid.value)
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

// Navigate to another user's public profile (close modal first so it doesn't open as nested modal)
function openPublicProfile(targetUid) {
  try {
    // close follow modal UI first
    closeFollowModal()
  } catch (e) {}
  // navigate to the public profile route
  router.push({ name: 'PublicProfile', params: { uid: targetUid } })
}

// Helper used by the template v-if to ensure only strictly matching items are shown.
function matchesQuery(u) {
  try {
    const q = (searchQuery.value || '').toLowerCase().trim()
    if (!q) return true
    const rawName = ((u.name || u.username) || '').toLowerCase().trim()
    const firstToken = (rawName.split(/\s+/)[0] || '')
    const emailLocal = ((u.email || '').toLowerCase().split('@')[0] || '')
    return (firstToken && firstToken.startsWith(q)) || (emailLocal && emailLocal.startsWith(q))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Profile] matchesQuery error', e)
    return false
  }
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

/* Chart Tooltip */
.chart-tooltip {
  position: fixed;
  background: rgba(20, 25, 35, 0.95);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 202, 106, 0.3);
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

.chart-tooltip::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(20, 25, 35, 0.95);
}

/* Add hover effects to chart bars */
.chart-bar {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.chart-bar:hover {
  transform: translateY(-2px);
}

.chart-bar:hover .bar-fill {
  box-shadow: 0 8px 24px rgba(255, 173, 29, 0.4);
}

/* Follow modal styles (LoginPage styled) */
.modal-overlay { position: fixed; inset: 0; background: rgba(20,20,20,0.85); display: flex; justify-content: center; align-items: center; z-index: 9999; }

.follow-modal-styled {
  width: 100%;
  max-width: 760px;        /* match larger modal in screenshot */
  background: #0f1113; /* slightly darker */
  border-radius: 14px;
  border: 4px solid #FFAD1D;
  overflow: hidden;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 22px 64px rgba(0,0,0,0.7);
  padding: 0;
}
.follow-modal-header-styled h3 {
  margin: 0;
  font-size: 1.6rem; /* matches LoginPage header scale */
  line-height: 1;
}
.btn-close-styled { background: transparent; border: none; color: #fff; font-size: 32px; cursor: pointer; line-height: 1; transition: color 0.2s; }
.btn-close-styled:hover { color: #FFAD1D; }
.search-bar-wrapper { padding: 18px 28px; border-bottom: 1px solid rgba(255,255,255,0.04); }
.search-input-styled { width: 100%; padding: 16px 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; color: #fff; font-size: 15px; outline: none; transition: all 0.16s; }
.search-input-styled::placeholder { color: rgba(255,255,255,0.4); }
.search-input-styled:focus { background: rgba(255,255,255,0.08); border-color: #FFAD1D; }
.follow-modal-body-styled { flex: 1; overflow-y: auto; padding: 12px 28px 20px; }
.user-card-styled { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; margin-bottom: 14px; background: #17181b; border-radius: 14px; cursor: pointer; transition: all 0.16s ease; }
.user-card-styled:hover { background: #1b1c1f; transform: translateY(-4px); }
.unfollow-btn-styled { padding: 10px 26px; background: rgba(35,38,43,0.92); color: #FFAD1D; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.25); transition: transform .12s ease, background .12s ease; }
.unfollow-btn-styled:hover { transform: translateY(-3px); background: rgba(45,48,54,0.98); }

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


.user-avatar-login { width:64px; height:64px; border-radius:50%; object-fit:cover; border:6px solid #FFAD1D; box-shadow: 0 10px 28px rgba(0,0,0,0.55); }
.user-avatar-fallback-login { width:64px; height:64px; border-radius:50%; background:#FFAD1D; display:flex; align-items:center; justify-content:center; font-weight:800; color:#081017; border:6px solid #FFAD1D; box-shadow: 0 10px 28px rgba(0,0,0,0.55); }


.user-name-login { color:#fff; font-weight:800; font-size:18px; letter-spacing:0.2px; text-transform:uppercase; }
.user-label-login { color: rgba(255,255,255,0.45); font-size:13px; margin-top:6px; }


.unfollow-btn-login { background: rgba(35,38,43,0.92); color: #FFAD1D; border: none; padding: 10px 18px; border-radius: 12px; font-weight:700; cursor:pointer; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.25); transition: transform .12s ease, background .12s ease; }
.unfollow-btn-login:hover { transform: translateY(-3px); background: rgba(45,48,54,0.98); }


.action-area-login { display:flex; align-items:center; gap:8px; }


@media (max-width: 720px) {
  .loginpage-follow-modal { max-width: 92%; padding: 10px; }
  .follow-title { font-size: 32px; }
  .user-avatar-login, .user-avatar-fallback-login { width:56px; height:56px; border-width:3px; }
  .unfollow-btn-login { padding: 8px 14px; }
}

/* Follow-popup styles from LoginPage (exact copy to ensure parity) */
.follow-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20,20,30,0.93);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
}
.follow-popup-content {
  width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  background: #181a20;
  border-radius: 12px;
  border: 2px solid #FFAD1D;
  padding: 20px;
}
.follow-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #FFAD1D;
  margin-bottom: 10px;
}
.search-input {
  width: 100%;
  background: #21242a;
  color: #FFD75C;
  border: 1px solid #30373d;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.follow-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.follow-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background: #22272d;
  gap: 10px;
}
.avatar {
  flex: 0 0 44px; /* don't let avatar shrink */
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 3px solid #FFAD1D;
  object-fit: cover;
  display: block;
}
.info {
  flex: 1 1 auto; /* allow to shrink */
  min-width: 0; /* enables truncation inside flex */
  margin-left: 6px;
}
.username {
  color: #fff;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sub {
  color: #9ca3af;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.remove-btn:hover { background: #c0392b; }
.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
}

</style>