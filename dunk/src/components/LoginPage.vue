<script setup>
import { ref, onMounted, computed } from 'vue'
import { Trophy, Star, Users, Cake } from 'lucide-vue-next'
import { loginWithGoogle, logout, onUserStateChanged, saveUserToDatabase } from '../firebase/auth.js'

const user = ref(null)
const error = ref('')

const photoSrc = computed(() => {
  // prefer provider photoURL, otherwise generate a seed-based avatar
  const u = user.value
  if (u && u.photoURL) return u.photoURL
  // derive a username from the email local-part when available
  const username = (u && (u.email ? u.email.split('@')[0] : (u.displayName || u.uid))) || 'anon'
  return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
})

const imgErrored = ref(false)

function initials(name) {
  if (!name) return 'A'
  return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
}

function onImgError(e) {
  // If the image fails (eg 429), try the seeded avatar API first, then fall back to initials
  try {
  const u = user.value
  const username = (u && (u.email ? u.email.split('@')[0] : (u.displayName || u.uid))) || 'anon'
  const fallback = `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
    const img = e && e.target
    if (!img) return
    // avoid infinite loop: if already set to fallback, show initials
    if (img.src && img.src.includes('avatar.iran.liara.run')) {
      imgErrored.value = true
    } else {
      img.src = fallback
    }
  } catch (err) {
    imgErrored.value = true
  }
}

onMounted(() => {
  onUserStateChanged(async (currentUser) => {
    user.value = currentUser
    if (currentUser && currentUser.uid) await saveUserToDatabase(currentUser)
  })
})

async function handleGoogleSignIn() {
  error.value = ''
  try {
    const result = await loginWithGoogle()
    user.value = result.user
    await saveUserToDatabase(result.user)
    alert('Signed in with Google!')
  } catch (e) {
    error.value = 'Google sign-in failed'
    console.error(e)
  }
}
async function handleLogout() {
  try {
    await logout()
    user.value = null
    alert('Logged out.')
  } catch (e) {
    error.value = 'Logout failed'
    console.error(e)
  }
}
</script>

<template>
  <div class="container-fluid min-vh-100 bg-transparent d-flex align-items-center justify-content-center px-2" style="background: transparent;">
    <!-- Login UI -->
    <div v-if="!user" class="mx-auto" style="max-width:350px;">
      <button @click="handleGoogleSignIn" type="button"
        class="btn btn-outline-warning w-100 py-3 d-flex align-items-center justify-content-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
          <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
          <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
        </svg>
        <span class="fs-5 fw-semibold">Sign in with Google</span>
      </button>
      <p v-if="error" class="mt-2 text-danger small text-center">{{ error }}</p>
    </div>

    <!-- Profile screen -->
    <div v-else class="w-100 mx-auto text-white" style="max-width:700px;">
      <!-- Header -->
      <div class="mb-3">
        <h2 class="fw-bold text-warning mb-0" style="font-size:2.25rem;">My Profile</h2>
        <div class="mb-1 text-secondary" style="font-size:1.1rem;">View and manage your personal information.</div>
      </div>
      <!-- Avatar, name, email -->
      <div class="d-flex flex-column align-items-center mb-3">
        <div style="width:100px;height:100px;border-radius:50%;border:5px solid #FFAD1D;overflow:hidden;display:flex;align-items:center;justify-content:center;">
          <img v-if="!imgErrored" :src="photoSrc" @error="onImgError" style="width:100%;height:100%;object-fit:cover;" alt="Profile"/>
          <div v-else style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#1f262b;color:#fff;font-weight:700;border-radius:50%;">
            {{ initials(user && user.displayName) }}
          </div>
        </div>
        <h3 class="fw-bold mb-0 mt-2" style="font-size:1.7rem;">{{ user.displayName || 'Anonymous' }}</h3>
        <div style="color:#9CA3AF;font-size:1.1rem;">{{ user.email }}</div>
      </div>
      <!-- Stats grid using flexbox for equal height cards with border -->
      <div class="row gx-3 gy-3 text-center mb-4">
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <!-- Icon (Ranking) -->
      <Trophy :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Ranking</span>
      <span class="badge bg-purple text-white mt-1" style="font-size:0.92rem;">Professional</span>
    </div>
  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Star :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Score</span>
      <div class="fs-4 fw-semibold text-warning mt-1">1250</div>
    </div>
  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Users :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Gender</span>
      <span class="fw-semibold text-warning mt-1">Male</span>
    </div>
  </div>
  <div class="col-6 col-md-3 d-flex">
    <div class="stat-card flex-fill d-flex flex-column align-items-center justify-content-center px-2 py-3 border rounded-3 border-gray-600">
      <Cake :color="'#FFAD1D'" :size="32" class="mb-2" />
      <span class="fw-medium">Age</span>
      <span class="fs-4 fw-semibold text-warning mt-1">28</span>
    </div>
  </div>
</div>

      <!-- Following & Followers -->
      <div class="row gx-3 justify-content-center mb-3">
        <div class="col-6 col-md-4">
          <button type="button" class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
            style="background:#181A20;">
            <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
            Following (3)
          </button>
        </div>
        <div class="col-6 col-md-4">
          <button type="button" class="btn btn-dark w-100 d-flex align-items-center justify-content-center rounded-3"
            style="background:#181A20;">
            <Users :color="'#FFAD1D'" :size="22" class="me-2"/>
            Followers (6)
          </button>
        </div>
      </div>
      <!-- Logout button -->
      <div class="mt-4 px-3 mb-2">
        <button @click="handleLogout" type="button" class="btn btn-danger w-100 rounded-pill fs-5">
          Log Out
        </button>
        <p v-if="error" class="mt-2 text-danger small text-center">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<style>
.bg-purple { background-color: #7133e2 !important; }
.border-gray-600 { border-color: #50575e !important; }
.profile-stat-card {
  min-height: 140px;
  background: transparent !important;
}
</style>
