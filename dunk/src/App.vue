<template>
  <div id="app">
    <!-- Sidebar receives v-model:collapsed so App controls layout -->
    <Sidebar v-model:collapsed="collapsed" :disabled="sidebarDisabled" />

    <!-- Topbar (logo + title + actions) aligned with main content -->
    <header class="topbar" :class="{ collapsed }"
      :style="{ '--sidebar-current-width': collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }">
      <div class="topbar-inner">
        <div class="brand-left" @click="navigateToHomePage" style="cursor: pointer;">
          <div class="top-logo" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
              <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
              <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
            </svg>
          </div>
          <div class="top-title">Dunk+</div>
        </div>
      </div>
    </header>

    <!-- Main content shifts/expands depending on sidebar collapsed state -->
    <div :class="['main-content', {'collapsed': collapsed}]" 
         :style="{ '--sidebar-current-width': collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)' }">
      <router-view />
    </div>

    <!-- Global match end modal -->
    <EndMatchSummary
      v-if="showGlobalMatchEndModal"
      :dbPath="globalMatchEndDbPath"
      @close="closeGlobalMatchEndModal"
      @post-to-forum="handlePostToForum"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, provide } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import DunkLogo from './components/DunkLogo.vue'
import EndMatchSummary from './components/EndMatchSummary.vue'
import { onUserStateChanged } from './firebase/auth'
import { onDataChange } from './firebase/firebase'

const collapsed = ref(false)
const router = useRouter()

// Sidebar disabled state (for when round is active)
const sidebarDisabled = ref(false)

// Provide function to child components to control sidebar state
provide('setSidebarDisabled', (disabled) => {
  sidebarDisabled.value = disabled
})

// Global match end modal state
const showGlobalMatchEndModal = ref(false)
const globalMatchEndDbPath = ref(null)
const currentUser = ref(null)
const trackedMatches = ref({}) // Track which matches we've already shown modals for

let matchesUnsub = null

const navigateToHomePage = () => {
  router.push('/homepage')
}

const handlePostToForum = () => {
  // Navigate to forum after posting
  router.push('/forum')
  closeGlobalMatchEndModal()
}

const closeGlobalMatchEndModal = () => {
  showGlobalMatchEndModal.value = false
  globalMatchEndDbPath.value = null
}

// Watch for user authentication
onMounted(() => {
  onUserStateChanged((user) => {
    currentUser.value = user
    if (user) {
      // User is signed in, subscribe to matches
      subscribeToMatches()
    } else {
      // User signed out, unsubscribe
      if (matchesUnsub) {
        matchesUnsub()
        matchesUnsub = null
      }
      trackedMatches.value = {}
    }
  })
})

onBeforeUnmount(() => {
  if (matchesUnsub) {
    matchesUnsub()
  }
})

function subscribeToMatches() {
  if (matchesUnsub) return // Already subscribed
  
  try {
    matchesUnsub = onDataChange('matches', (data) => {
      if (!data || !currentUser.value) return
      
      const uid = currentUser.value.uid
      
      // Check all matches for ones the user is involved in
      // Matches can be nested like matches/{court}/{date}/{matchId}
      function checkMatch(matchData, matchPath) {
        if (!matchData) return
        
        // Check if user is involved in this match (host or joined player)
        const isHost = matchData.host === uid
        const isJoined = matchData.playersMap && matchData.playersMap[uid]
        
        if (!isHost && !isJoined) return // User not involved in this match
        
        // Check if match just ended
        const matchEnded = matchData.matchEnded === true
        const matchId = matchPath.split('/').pop()
        const alreadyShown = trackedMatches.value[matchId]
        
        if (matchEnded && !alreadyShown) {
          // Match just ended and we haven't shown the modal yet
          console.log('Global match end detected for match:', matchId, 'at path:', matchPath)
          trackedMatches.value[matchId] = true
          globalMatchEndDbPath.value = matchPath
          showGlobalMatchEndModal.value = true
        }
      }
      
      // Traverse the nested structure
      Object.entries(data).forEach(([key1, val1]) => {
        if (!val1 || typeof val1 !== 'object') return
        
        // Check if this is directly a match object (has host or playersMap)
        if (val1.host || val1.playersMap) {
          checkMatch(val1, `matches/${key1}`)
        } else {
          // It's a nested level, traverse deeper
          Object.entries(val1).forEach(([key2, val2]) => {
            if (!val2 || typeof val2 !== 'object') return
            
            // Check if this level contains matches
            if (val2.host || val2.playersMap) {
              checkMatch(val2, `matches/${key1}/${key2}`)
            } else {
              // Another level of nesting
              Object.entries(val2).forEach(([key3, val3]) => {
                if (!val3 || typeof val3 !== 'object') return
                checkMatch(val3, `matches/${key1}/${key2}/${key3}`)
              })
            }
          })
        }
      })
    })
  } catch (e) {
    console.warn('Failed to subscribe to matches in App.vue', e)
  }
}
</script>


<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  background: black;
  color: #fff;
}


.main-content {
  min-width: 0;
  transition: margin-left 0.25s ease, padding 0.25s ease;
  padding: 40px 24px; 
  margin-left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  background: #000;
  overflow-x: hidden;
  padding-top: 112px; /* Add space for topbar */
}

.main-content.collapsed {
  /* When sidebar is collapsed, reduce the margin-left to match the collapsed sidebar width */
  margin-left: var(--sidebar-collapsed-width);
  padding-left: 24px; /* Keep consistent padding */
}

/* Ensure the router-view content stacks properly */
main {
  box-sizing: border-box;
}

/* Topbar styling */
.topbar {
  position: fixed;
  left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  right: 0;
  height: 72px;
  display: flex;
  align-items: center;
  /* keep topbar above content but below sidebar when needed */
  z-index: 210;
  padding: 0 32px;
  /* slightly translucent topbar that matches the dark theme but keeps some background visible */
  background: linear-gradient(90deg, rgba(15,20,24,0.78) 0%, rgba(13,17,20,0.78) 100%);
  box-shadow: 0 2px 16px 0 rgba(12, 18, 28, 0.14);
  -webkit-backdrop-filter: blur(6px) saturate(120%);
  backdrop-filter: blur(6px) saturate(120%);
  transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

.topbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.topbar .top-title{

  margin-left: -5px;
  transform: scale(1.2); /* makes text appear 30% larger */
  transform-origin: left center; /* so it doesn’t shift weirdly */
  font-family: 'Saira Semi Condensed', sans-serif;
}

.brand-left {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: -8px;
}

.top-logo {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffb14d;
}

.top-logo svg {
  width: 28px;
  height: 28px;
}

.top-title {
  color: orange;
  font-size: 1.6rem;
  font-weight: 800;
}

.create-btn {
  background: #ff9a3c;
  color: #111;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
}

/* Mobile/Tablet styles - Keep sidebar visible but adjust layout */
@media (max-width: 1024px) {
  /* Topbar stays aligned with sidebar */
  .topbar {
    left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  }
  /* Hide topbar when sidebar is open and overlaying (i.e., not collapsed) */
  .topbar:not(.collapsed) {
    display: none;
  }
  
  /* Main content still respects sidebar width */
  .main-content {
    margin-left: calc(var(--sidebar-current-width, var(--sidebar-width)));
  }
  
  .main-content.collapsed {
    /* mirror the behavior above for smaller screens: don't offset the whole
       main content when collapsed, use left padding so internal centering works */
    margin-left: 0;
    padding-left: var(--sidebar-collapsed-width);
  }
  
  /* Optional: reduce padding on mobile/tablet */
  .main-content {
    padding: 24px 16px;
    padding-top: 96px;
  }
}
</style>