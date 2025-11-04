<template>
  <ModalPortal @overlay="close">
    <div class="jp-modal card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <strong>{{ title || 'Players' }}</strong>
          <div class="small text-muted">{{ players?.length || 0 }} joined</div>
        </div>
        <button class="btn-close" @click="close" aria-label="Close"></button>
      </div>
      <div class="card-body jp-body">
        <ul class="list-unstyled mb-0">
          <li v-for="(p, i) in players || []" :key="i" class="player-row border-bottom">
            <div class="player-avatar">
              <router-link v-if="p.uid" :to="`/profile/${p.uid}`" class="player-link">
                <img v-if="p.profilepicture || p.avatar" :src="p.profilepicture || p.avatar" alt="avatar" class="big-avatar" />
                <div v-else class="avatar-initial big-avatar">{{ initials(p.name) }}</div>
              </router-link>
              <template v-else>
                <img v-if="p.profilepicture || p.avatar" :src="p.profilepicture || p.avatar" alt="avatar" class="big-avatar" />
                <div v-else class="avatar-initial big-avatar">{{ initials(p.name) }}</div>
              </template>
            </div>
            <div class="player-info">
              <div class="player-name">
                <router-link v-if="p.uid" :to="`/profile/${p.uid}`" class="text-reset text-decoration-none name-link">{{ p.name }}</router-link>
                <span v-else class="name-link">{{ p.name }}</span>
              </div>
              <div v-if="p.meta" class="small text-muted">{{ p.meta }}</div>
            </div>
            <div class="player-actions">
              <!-- don't show follow controls for yourself -->
              <template v-if="me && p.uid && me.uid !== p.uid">
                <button v-if="!isFollowing(p.uid)" class="btn btn-sm btn-primary me-2" :disabled="loadingFollowing[p.uid]" @click="followUser(p.uid)">
                  <span v-if="loadingFollowing[p.uid]">...</span>
                  <span v-else>Follow</span>
                </button>
                <button v-else class="btn btn-sm btn-outline-secondary" :disabled="loadingFollowing[p.uid]" @click="unfollowUser(p.uid)">
                  <span v-if="loadingFollowing[p.uid]">...</span>
                  <span v-else>Unfollow</span>
                </button>
              </template>
            </div>
          </li>
        </ul>
        <div v-if="!players || !players.length" class="text-center text-muted py-4">No players yet</div>
      </div>
    </div>
  </ModalPortal>
</template>

<script setup>
import ModalPortal from './ModalPortal.vue'
import { defineProps, defineEmits, ref } from 'vue'
import { onUserStateChanged } from '../firebase/auth'
import { getDataFromFirebase, setChildData, deleteChildData } from '../firebase/firebase'

const props = defineProps({
  // players: array of { name, uid?, avatar?, meta? }
  players: { type: Array, default: () => [] },
  title: { type: String, default: '' }
})
const emit = defineEmits(['close'])

const me = ref(null)
const followingMap = ref({})
const loadingFollowing = ref({})

function close() { emit('close') }

function initials(name) {
  if (!name) return ''
  return name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
}

onUserStateChanged(async (u) => {
  me.value = u
  if (!u) {
    followingMap.value = {}
    return
  }
  try {
    const data = await getDataFromFirebase(`users/${u.uid}/following`)
    followingMap.value = data || {}
  } catch (err) {
    console.warn('Failed to load following map', err)
    followingMap.value = {}
  }
})

function isFollowing(uid) {
  if (!uid) return false
  return Boolean(followingMap.value && followingMap.value[uid])
}

async function followUser(uid) {
  if (!me.value) { alert('Please sign in to follow'); return }
  if (!uid || isFollowing(uid)) return
  loadingFollowing.value = { ...loadingFollowing.value, [uid]: true }
  try {
    // add to current user's following map and add to target user's followers map
    await setChildData(`users/${me.value.uid}/following`, uid, true)
    await setChildData(`users/${uid}/followers`, me.value.uid, true)
    // optimistic update locally
    followingMap.value = { ...(followingMap.value || {}), [uid]: true }
  } catch (err) {
    console.error('Failed to follow user', err)
    alert('Failed to follow — try again')
  } finally {
    loadingFollowing.value = { ...loadingFollowing.value, [uid]: false }
  }
}

async function unfollowUser(uid) {
  if (!me.value) { alert('Please sign in to unfollow'); return }
  if (!uid || !isFollowing(uid)) return
  loadingFollowing.value = { ...loadingFollowing.value, [uid]: true }
  try {
    await deleteChildData(`users/${me.value.uid}/following`, uid)
    await deleteChildData(`users/${uid}/followers`, me.value.uid)
    // optimistic local update
    const copy = { ...(followingMap.value || {}) }
    delete copy[uid]
    followingMap.value = copy
  } catch (err) {
    console.error('Failed to unfollow user', err)
    alert('Failed to unfollow — try again')
  } finally {
    loadingFollowing.value = { ...loadingFollowing.value, [uid]: false }
  }
}
</script>

<style scoped>
.jp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2,6,11,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
}
.jp-modal {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(180deg,#0b0f12,#0d1114);
  border: 1px solid rgba(255,255,255,0.04);
}
.jp-body { overflow: auto; padding: 8px 16px; }
.player-row { --avatar-size: 180px; display: flex; align-items: center; gap: 18px; padding: 18px 0; position: relative; }
.player-avatar { flex: 0 0 auto; width: var(--avatar-size); }
.big-avatar { width: var(--avatar-size); height: var(--avatar-size); border-radius: 50%; object-fit: cover; display: block; border: 6px solid rgba(255,255,255,0.02); position: relative; z-index: 2 }
.avatar-initial.big-avatar { display:flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; font-weight:700 }
.player-avatar .player-link { display: block }
.player-avatar .player-link .big-avatar { cursor: pointer }
.player-info { flex: 1 1 auto; display:flex; flex-direction:column; justify-content:center; }
.player-name { font-size: 20px; color: #fff; font-weight: 700; line-height: 1.2 }
.name-link { color: #fff; text-decoration: none }
.player-actions { flex: 0 0 auto; display:flex; align-items:center }
.small-avatar { width:40px; height:40px; border-radius:50%; overflow:hidden; display:inline-block; vertical-align:middle; margin-right:12px }
.small-avatar img, img.small-avatar { width:100%; height:100%; display:block; object-fit:cover }
.avatar-initial { width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; background:#1f262b; color:#fff; font-weight:700 }
.card-header { padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.06); color: #ffffff }
.card-header strong { color: #ffffff }
.card-header .small { color: #e6eef6; font-weight: 600 }
.jp-body li { padding-top:10px; padding-bottom:10px }
.jp-body .fw-bold { color: #e6eef6 }
.jp-body .small { color: #9fb0bf }
.btn-close { background: transparent; border: none; color:#cfd9e3; font-size: 18px; }
.player-row.border-bottom { border-bottom: none; }
.player-row.border-bottom::after {
  content: '';
  position: absolute;
  left: calc(var(--avatar-size) + 18px);
  right: 0;
  bottom: 0;
  height: 1px;
  background: rgba(255,255,255,0.06);
  z-index: 1;
}
.player-link { color: #e6eef6; text-decoration: none }
.player-link:hover { text-decoration: underline }
</style>
