<template>
  <div class="container-fluid min-vh-100 bg-transparent d-flex align-items-center justify-content-center px-2" style="background: transparent;">
    <div class="w-100 mx-auto text-white" style="max-width:900px;">
  <button class="back-btn" @click="goBack" aria-label="Go back"><MoveLeft /></button>

      <!-- Header -->
      <div class="mb-3">
        <h2 class="fw-bold text-warning mb-0" style="font-size:2.25rem;">Profile</h2>
        <div class="mb-1 text-secondary" style="font-size:1.1rem;">View a user's public profile and stats.</div>
      </div>

      <!-- Avatar, name, email-like -->
      <div class="d-flex flex-column align-items-center mb-3">
        <div class="profile-avatar-wrapper">
          <img v-if="!imgErrored" :src="photoUrl" @error="onImgError" class="profile-avatar-img" />
          <div v-else class="profile-avatar-fallback">
            {{ displayInitials }}
          </div>
        </div>
        <h3 class="fw-bold mb-0 mt-2" style="font-size:1.7rem;">{{ profile.name || profile.username || 'Anonymous' }}</h3>
        <div style="color:#9CA3AF;font-size:1.1rem;">{{ profile.email || '' }}</div>
        <div class="mt-2" v-if="!(currentUser && currentUser.uid && currentUser.uid === uid)">
          <button class="btn btn-outline-primary me-2" @click="toggleFollow">{{ (profile.followers && currentUser && currentUser.uid && profile.followers[currentUser.uid]) ? 'Unfollow' : 'Follow' }}</button>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="row gx-3 gy-3 text-center mb-4">
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Trophy :color="'#FFAD1D'" :size="28" class="mb-2" />
            <span class="fw-medium">Ranking</span>
            <span class="badge bg-purple text-white mt-1" style="font-size:0.92rem;">{{ profile.skill || 'Open' }}</span>
          </div>
        </div>
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Star :color="'#FFAD1D'" :size="28" class="mb-2" />
            <span class="fw-medium">Score</span>
            <div class="fs-4 fw-semibold text-warning mt-1">{{ profile.score || 0 }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Users :color="'#FFAD1D'" :size="28" class="mb-2" />
            <span class="fw-medium">Gender</span>
            <span class="fw-semibold text-warning mt-1">{{ profile.gender || 'All' }}</span>
          </div>
        </div>
        <div class="col-6 col-md-3 d-flex">
          <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
            <Cake :color="'#FFAD1D'" :size="28" class="mb-2" />
            <span class="fw-medium">Age</span>
            <span class="fs-4 fw-semibold text-warning mt-1">{{ profile.age || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Following & Followers -->
      <div class="row gx-3 justify-content-center mb-3">
        <div class="col-6 col-md-4">
          <button type="button" class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3" style="background:#181A20;">
            Following ({{ profile.following ? Object.keys(profile.following).length : 0 }})
          </button>
        </div>
        <div class="col-6 col-md-4">
          <button type="button" class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3" style="background:#181A20;">
            Followers ({{ profile.followers ? Object.keys(profile.followers).length : 0 }})
          </button>
        </div>
      </div>

      <!-- Bio -->
      <div class="mb-4 px-3">
        <h5>About</h5>
        <p>{{ profile.bio || 'No bio available.' }}</p>
      </div>
      <!-- Recent posts & matches -->
      <div class="mb-4 px-3">
        <h5>Recent Posts</h5>
        <ul>
          <li v-for="p in recentPosts" :key="p.id"><router-link :to="`/forum`">{{ p.caption || p.title || 'Post' }}</router-link></li>
          <li v-if="recentPosts.length === 0" class="text-muted">No recent posts</li>
        </ul>
      </div>

      <div class="mb-4 px-3">
        <h5>Recent Matches</h5>
        <ul>
          <li v-for="m in recentMatches" :key="m.id"><router-link :to="m.id ? `/matches/${m.id}` : '/matches'">{{ m.title || 'Match' }}</router-link></li>
          <li v-if="recentMatches.length === 0" class="text-muted">No recent matches</li>
        </ul>
      </div>

      <!-- Match Statistics -->
      <div class="mb-4 px-3">
        <h5>Match Statistics</h5>
        <p class="text-muted">You have a total of <span class="text-warning fw-semibold">{{ totalWins }}</span> wins across all skill levels. Here's the breakdown:</p>

        <div class="match-stats-card border rounded-3 p-3 mt-2">
          <div class="stats-chart d-flex align-items-end justify-content-between">
            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: barHeight(statsFromProfile.open_wins) }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.open_wins }}</div>
              <div class="bar-label">Open</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: barHeight(statsFromProfile.intermediate_wins) }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.intermediate_wins }}</div>
              <div class="bar-label">Intermediate</div>
            </div>

            <div class="chart-bar">
              <div class="bar-fill" :style="{ height: barHeight(statsFromProfile.professional_wins) }" aria-hidden="true"></div>
              <div class="bar-value">{{ statsFromProfile.professional_wins }}</div>
              <div class="bar-label">Professional</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDataFromFirebase, overwriteDataToFirebase, setChildData, deleteChildData } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import { MoveLeft, Trophy, Star, Users, Cake } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const uid = route.params.uid
const profile = ref({})
const stats = ref({})
const currentUser = ref(null)
const imgErrored = ref(false)
const recentPosts = ref([])
const recentMatches = ref([])

onMounted(async () => {
  if (!uid) return
  try {
    const users = await getDataFromFirebase('users')
    if (users && users[uid]) profile.value = users[uid]

    // basic stats: count matches created and joined
    const matches = await getDataFromFirebase('matches')
    let joined = 0, created = 0
    if (matches) {
      const arr = Array.isArray(matches) ? matches : Object.entries(matches).map(([id,v])=>({id,...v}))
      for (const m of arr) {
        if (m && m.joinedBy && m.joinedBy[uid]) joined++
        if (m && (m.owner === uid || m.owner === profile.value.name)) created++
      }
    }
    stats.value = { matchesJoined: joined, matchesCreated: created }
  } catch (e) {
    console.warn('Failed to load profile', e)
  }
})

onMounted(() => {
  // listen for signed-in user so we can follow/unfollow
  onUserStateChanged((u) => {
    currentUser.value = u
    // if the signed-in user opened their own profile, redirect to login page
    try {
      if (u && u.uid && u.uid === uid) {
        router.replace('/login')
      }
    } catch (e) {
      // ignore
    }
  })

  // load recent posts and matches for this profile
  loadRecentContent()
})

async function loadRecentContent() {
  try {
    const posts = await getDataFromFirebase('forumUploads')
    if (posts) {
      const arr = Array.isArray(posts) ? posts : Object.entries(posts).map(([id, v]) => ({ id, ...v }))
      recentPosts.value = arr.filter(p => (p.createdByUid === uid || p.createdBy === uid || p.author === uid)).sort((a,b)=> (b.createdAt||0)-(a.createdAt||0)).slice(0,5)
    }
  } catch (e) {
    recentPosts.value = []
  }

  try {
    const matches = await getDataFromFirebase('matches')
    if (matches) {
      const marr = Array.isArray(matches) ? matches : Object.entries(matches).map(([id,v]) => ({ id, ...v }))
      recentMatches.value = marr.filter(m => (m.owner === uid || m.createdByUid === uid)).sort((a,b)=> (b.createdAt||0)-(a.createdAt||0)).slice(0,5)
    }
  } catch (e) {
    recentMatches.value = []
  }
}

function goBack() { router.back() }

const displayInitials = computed(() => {
  const name = profile.value.name || profile.value.username || ''
  return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() || 'U'
})

const photoUrl = computed(() => {
  if (profile.value && profile.value.photoURL) return profile.value.photoURL
  const name = profile.value.name || profile.value.username || profile.value.email || uid || 'anon'
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(name)}`
})

function onImgError() { imgErrored.value = true }

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
  // simple scale: map max-ish values to 220px height
  const max = Math.max(1, statsFromProfile.value.open_wins, statsFromProfile.value.intermediate_wins, statsFromProfile.value.professional_wins)
  const pct = value / Math.max(1, max)
  const px = Math.round(30 + pct * 190) // min 30px, max ~220px
  return `${px}px`
}

function isFollowing() {
  if (!currentUser.value || !profile.value) return false
  const meFollowing = currentUser.value && currentUser.value.uid && profileFollowMap(currentUser.value.uid)
  // fallback: check profile.followers contains current user
  if (profile.value.followers && currentUser.value.uid) return Boolean(profile.value.followers[currentUser.value.uid])
  return !!meFollowing
}

function profileFollowMap(myUid) {
  // attempt to read local currentUser following data (not authoritative)
  // we will use profile.followers for reliable check
  return null
}

async function toggleFollow() {
  if (!currentUser.value) { alert('Please sign in to follow users'); return }
  const myUid = currentUser.value.uid
  if (!myUid) { alert('Please sign in'); return }
  if (myUid === uid) return

  try {
    const users = await getDataFromFirebase('users')
    if (!users) return
    const me = users[myUid] || {}
    const target = users[uid] || {}

    const already = Boolean(me.following && me.following[uid])
    if (already) {
      // remove child entries to avoid clobbering other fields
      await deleteChildData(`users/${myUid}/following`, uid)
      await deleteChildData(`users/${uid}/followers`, myUid)

      // update local profile.followers if present
      if (profile.value && profile.value.followers) {
        const updated = { ...profile.value }
        if (updated.followers) delete updated.followers[myUid]
        profile.value = updated
        // notify local client that we unfollowed someone so UI can react immediately
        try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'unfollow', targetUid: uid } })) } catch (e) {}
      }
    } else {
      const payload = { at: Date.now() }
      await setChildData(`users/${myUid}/following`, uid, payload)
      await setChildData(`users/${uid}/followers`, myUid, payload)

      // optimistic UI update
      profile.value = { ...profile.value, followers: { ...(profile.value.followers || {}), [myUid]: payload } }
        // notify local client that we followed someone so UI can react immediately
        try { window.dispatchEvent(new CustomEvent('user-follow-changed', { detail: { action: 'follow', targetUid: uid } })) } catch (e) {}
    }
  } catch (e) {
    console.error('Failed to toggle follow', e)
    alert('Failed to update follow — try again')
  }
}
</script>

<style scoped>
.profile-card { max-width:760px; margin: 24px auto; padding: 24px; background:#111317; color:#fff; border-radius:12px }
.profile-header { display:flex; gap:18px; align-items:center }
.avatar-lg { width:84px; height:84px; border-radius:50%; background:#1f262b; display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:24px }
.back-btn {
  position: fixed;
  left: calc(var(--sidebar-current-width, var(--sidebar-width)) + 12px);
  /* place just below the topbar/logo so it sits outside the header */
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
.profile-body { margin-top:18px }
.stat-row { margin-bottom:6px }

/* Profile avatar sizing and small avatar utility used elsewhere */
.profile-avatar-wrapper { width: 120px; height: 120px; border-radius: 50%; border: 5px solid #FFAD1D; overflow: hidden; display:flex; align-items:center; justify-content:center }
.profile-avatar-img { width: 100%; height: 100%; object-fit: cover }
.profile-avatar-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; font-weight:700; font-size:28px }

.avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(0,0,0,0.6); margin-left:-12px }

/* Match statistics chart */
.match-stats-card { background: #0F1113; border: 1px solid rgba(255,255,255,0.04); }
.stats-chart { gap: 18px; }
.chart-bar { flex: 1 1 0; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; padding:8px }
.bar-fill { width: 60%; background: #FFAD1D; border-radius: 6px 6px 0 0; transition: height 300ms ease; }
.bar-value { color: #fff; font-weight:700; margin-top:8px }
.bar-label { color:#9CA3AF; margin-top:6px; font-size:0.9rem }
</style>