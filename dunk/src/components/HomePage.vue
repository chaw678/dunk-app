<template>
  <div class="homepage">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Welcome to <span class="brand-highlight">Dunk+</span></h1>
        <div class="hero-main">
          <div class="hero-text">
            <p class="hero-subtitle">Find basketball courts, join matches, and connect with players in Singapore</p>
            <div class="hero-actions">
              <button class="cta-button primary" @click="navigateToMatches">Find Matches</button>
              <button class="cta-button secondary" @click="navigateToCourts">Discover Courts</button>
            </div>
          </div>
          <div class="hero-image">
            <div class="basketball-icon"><svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="#ffb14d">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.2 14.2c2.8-5.2 8.3-8.4 14.3-7.4" />
      <path d="m11.3 21.8-1.9-2.8c-2.4-3.6-3.2-8.3-.7-12.4" />
      <path d="M21.8 12.7c-2.4 4.5-8.2 6.8-13.4 5" />
    </svg></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pending Invites Section -->
    <section v-if="currentUser" class="invites-section">
      <div class="container">
        <div class="invitations-wrapper">
          <div class="invitations-section">
            <h3 class="section-heading">
              <i class="bi bi-bell-fill me-2"></i>Match Invitations
              <span v-if="invitationsCount > 0" class="notification-badge">{{ invitationsCount }}</span>
            </h3>
            
            <!-- Show invitations if they exist -->
            <div v-if="activeInvitations.length > 0" class="invitations-container">
              <!-- Carousel wrapper for more than 3 invitations -->
              <div v-if="activeInvitations.length > 3" class="carousel-wrapper" 
                   @mouseenter="pauseAutoPlay" 
                   @mouseleave="resumeAutoPlay">
                <button class="carousel-btn prev" @click="scrollCarousel(-1)">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <div class="carousel-track" ref="carouselTrack">
                  <div class="carousel-slide" v-for="inv in activeInvitations" :key="inv.id">
                    <div class="invitation-card-wrapper">
                      <div class="invitation-card">
                        <div class="invitation-header">
                          <h3 class="invitation-match-title">{{ inv.title }}</h3>
                          <span v-if="getMatchStatus(inv) === 'Live'" class="match-status-badge live">
                            LIVE
                          </span>
                        </div>
                        <div class="invitation-body">
                          <div class="invitation-content">
                            <div class="invitation-court-name">
                              <i class="bi bi-geo-alt-fill"></i>
                              {{ inv.court || 'Unknown court' }}
                            </div>
                            <div class="invitation-date">
                              <i class="bi bi-calendar-fill"></i>
                              {{ formatInvitationDate(inv.date) }}
                            </div>
                            <div class="invitation-time">
                              <i class="bi bi-clock-fill"></i>
                              {{ formatInvitationTime(inv.startTime, inv.endTime) }}
                            </div>
                            <div class="invitation-tags">
                              <span class="invitation-tag">{{ inv.gender || 'All' }}</span>
                              <span class="invitation-tag">{{ inv.type || 'Open' }}</span>
                            </div>
                            <div class="invitation-inviter" v-if="inv.inviterUid" @click="openProfileModal(inv.inviterUid)" style="cursor: pointer;">
                              <img :src="inv.inviterAvatar" :alt="inv.inviterName" class="inviter-avatar" />
                              <span>Invited by <strong>{{ inv.inviterName }}</strong></span>
                            </div>
                          </div>
                          <div class="invitation-actions">
                            <button class="btn-accept" @click="acceptInvite(inv)">
                              <i class="bi bi-check-lg"></i> Accept
                            </button>
                            <button class="btn-decline" @click="declineInvite(inv)">
                              <i class="bi bi-x-lg"></i> Decline
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button class="carousel-btn next" @click="scrollCarousel(1)">
                  <i class="bi bi-chevron-right"></i>
                </button>
                <!-- Carousel indicators -->
                <div class="carousel-indicators">
                  <button 
                    v-for="(dot, index) in totalSlides" 
                    :key="index"
                    class="indicator-dot"
                    :class="{ active: index === currentSlide }"
                    @click="goToSlide(index)"
                  ></button>
                </div>
              </div>
              
              <!-- Regular grid for 3 or fewer invitations -->
              <div v-else class="invitations-grid">
                <div class="invitation-card-wrapper" v-for="inv in activeInvitations" :key="inv.id">
                  <div class="invitation-card">
                    <div class="invitation-header">
                      <h3 class="invitation-match-title">{{ inv.title }}</h3>
                      <span v-if="getMatchStatus(inv) === 'Live'" class="match-status-badge live">
                        LIVE
                      </span>
                    </div>
                    <div class="invitation-body">
                      <div class="invitation-content">
                        <div class="invitation-court-name">
                          <i class="bi bi-geo-alt-fill"></i>
                          {{ inv.court || 'Unknown court' }}
                        </div>
                        <div class="invitation-date">
                          <i class="bi bi-calendar-fill"></i>
                          {{ formatInvitationDate(inv.date) }}
                        </div>
                        <div class="invitation-time">
                          <i class="bi bi-clock-fill"></i>
                          {{ formatInvitationTime(inv.startTime, inv.endTime) }}
                        </div>
                        <div class="invitation-tags">
                          <span class="invitation-tag">{{ inv.gender || 'All' }}</span>
                          <span class="invitation-tag">{{ inv.type || 'Open' }}</span>
                        </div>
                        <div class="invitation-inviter" v-if="inv.inviterUid" @click="openProfileModal(inv.inviterUid)" style="cursor: pointer;">
                          <img :src="inv.inviterAvatar" :alt="inv.inviterName" class="inviter-avatar" />
                          <span>Invited by <strong>{{ inv.inviterName }}</strong></span>
                        </div>
                      </div>
                      <div class="invitation-actions">
                        <button class="btn-accept" @click="acceptInvite(inv)">
                          <i class="bi bi-check-lg"></i> Accept
                        </button>
                        <button class="btn-decline" @click="declineInvite(inv)">
                          <i class="bi bi-x-lg"></i> Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Show empty state when no invitations -->
            <div v-else class="no-invites-state">
              <div class="empty-icon">📨</div>
              <h4>No pending invitations</h4>
              <p>Create a match and invite your friends to play basketball together!</p>
              <button class="btn-create-match" @click="openCreateMatchModal">
                <i class="bi bi-plus-lg"></i> Create Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommended Matches Section -->
    <section v-if="currentUser" class="invitesi-section">
      <div class="container">
        <div class="invitations-wrapper">
          <div class="invitations-section">
            <div class="section-header">
              <h3 class="section-heading">
                <i class="bi bi-star-fill me-2"></i>Recommended Matches for You
              </h3>
              <button class="btn-view-all" @click="navigateToRecommendedMatches">
                <span>View All</span>
                <i class="bi bi-arrow-right"></i>
              </button>
            </div>
            
            <!-- Show recommended matches if they exist -->
            <div v-if="recommendedMatches.length > 0" class="conveyor-belt-container" 
                 :class="{ 'auto-scroll': shouldAutoScroll }">
              
              <!-- Conveyor Belt Track -->
              <div class="conveyor-belt-track" ref="conveyorTrack">
                <!-- Show static grid if few matches, scrolling belt if many -->
                <template v-if="recommendedMatches.length >= 4">
                  <!-- Enough matches for smooth scrolling - create 3 sets -->
                  <div v-for="duplicateIndex in 3" :key="`duplicate-${duplicateIndex}`" class="conveyor-belt-section">
                    <div v-for="match in recommendedMatches" :key="`${duplicateIndex}-${match.id}`" class="match-card conveyor-card">
                      <div class="match-header">
                        <h4 class="match-title">{{ match.title }}</h4>
                        <div v-if="isMatchCurrentlyLive(match)" class="match-status ongoing">LIVE</div>
                      </div>
                      <div class="match-body">
                        <div class="match-details">
                          <div class="match-court">
                            <i class="bi bi-geo-alt"></i>
                            {{ match.court || match.location }}
                          </div>
                          <div class="match-time">
                            <i class="bi bi-clock"></i>
                            {{ formatMatchTime(match.startTime, match.endTime) }}
                          </div>
                          <div class="match-players">
                            <i class="bi bi-people"></i>
                            {{ getPlayerCount(match) }}/{{ match.maxPlayers || 10 }} players
                          </div>
                          <div class="match-tags">
                            <span class="match-tag">{{ match.gender || 'All' }}</span>
                            <span class="match-tag">{{ match.type || 'Open' }}</span>
                          </div>
                        </div>
                        <div class="match-actions">
                          <button class="btn-join-recommendation" @click="joinMatch(match)">
                            <i class="bi bi-plus-lg"></i> Join Match
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
                
                <template v-else>
                  <!-- Few matches - show static grid without auto-scroll -->
                  <div class="conveyor-belt-section static-matches">
                    <div v-for="match in recommendedMatches" :key="match.id" class="match-card conveyor-card">
                      <div class="match-header">
                        <h4 class="match-title">{{ match.title }}</h4>
                        <div v-if="isMatchCurrentlyLive(match)" class="match-status ongoing">LIVE</div>
                      </div>
                      <div class="match-body">
                        <div class="match-details">
                          <div class="match-court">
                            <i class="bi bi-geo-alt"></i>
                            {{ match.court || match.location }}
                          </div>
                          <div class="match-time">
                            <i class="bi bi-clock"></i>
                            {{ formatMatchTime(match.startTime, match.endTime) }}
                          </div>
                          <div class="match-players">
                            <i class="bi bi-people"></i>
                            {{ getPlayerCount(match) }}/{{ match.maxPlayers || 10 }} players
                          </div>
                          <div class="match-tags">
                            <span class="match-tag">{{ match.gender || 'All' }}</span>
                            <span class="match-tag">{{ match.type || 'Open' }}</span>
                          </div>
                        </div>
                        <div class="match-actions">
                          <button class="btn-join-recommendation" @click="joinMatch(match)">
                            <i class="bi bi-plus-lg"></i> Join Match
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Show empty state when no recommendations -->
            <div v-else class="no-recommendations-state">
              <div class="empty-icon">🎯</div>
              <h4>No recommended matches</h4>
              <p v-if="!currentUserProfile">Complete your profile to see personalized match recommendations.</p>
              <p v-else-if="!userLocation && !locationPermissionGranted">Enable location access to see matches in your area.</p>
              <p v-else>No recommended matches available in your area. Check back later or explore other regions.</p>
              <button class="btn-explore-matches" @click="navigateToMatches">
                <i class="bi bi-search"></i> Explore All Matches
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="stat-number text-center">Why Choose Dunk+?</h2>
        <div class="features-grid">
          <div class="feature-card"  @click="navigateToCourts">
            <div class="feature-icon">🏟️</div>
            <h3>Find Courts</h3>
            <p>Discover basketball courts across Singapore with real-time availability and ratings</p>
          </div>
          <div class="feature-card"  @click="navigateToMatches">
            <div class="feature-icon">👥</div>
            <h3>Join Matches</h3>
            <p>Connect with players of similar skill levels and join exciting basketball matches</p>
          </div>
          <div class="feature-card" @click="navigateToLeaderboard">
            <div class="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your performance, climb the leaderboard, and improve your game</p>
          </div>
          <div class="feature-card" @click="navigateToRecommendedMatches">
            <div class="feature-icon">🎯</div>
            <h3>Smart Matching</h3>
            <p>Get personalized match recommendations based on your location, skill, and preferences</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">500+</div>
            <div class="stat-label">Active Players</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50+</div>
            <div class="stat-label">Basketball Courts</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">1000+</div>
            <div class="stat-label">Matches Played</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5</div>
            <div class="stat-label">Regions Covered</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2>Ready to Start Playing?</h2>
          <p>Join the Dunk+ community and elevate your basketball experience</p>
          <button class="cta-button large" @click="getStarted">Get Started</button>
        </div>
      </div>
    </section>
  </div>
  
  <!-- ProfileModal -->
  <ProfileModal 
    v-if="showProfileModal" 
    :uid="profileModalUid" 
    :initialProfile="profileModalInitial" 
    @close="closeProfileModal" 
  />
  
  <!-- AddMatchModal -->
  <AddMatchModal 
    v-if="showAddMatchModal" 
    :courtList="courts" 
    :courtName="''" 
    @close="showAddMatchModal = false" 
    @created="onMatchCreated" 
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, deleteChildData, onDataChange } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import { seededAvatar, avatarForUser } from '../utils/avatar.js'
import ProfileModal from './ProfileModal.vue'
import AddMatchModal from './AddMatchModal.vue'

const router = useRouter()

// Current user state
const currentUser = ref(null)
const currentUserProfile = ref(null)

// ProfileModal state
const showProfileModal = ref(false)
const profileModalUid = ref(null)
const profileModalInitial = ref(null)

// AddMatchModal state
const showAddMatchModal = ref(false)
const courts = ref([])

// Invitations state
const invitations = ref([])

// Filter out invitations for past matches
const activeInvitations = computed(() => {
    if (!invitations.value || invitations.value.length === 0) return []
    
    const now = new Date()
    return invitations.value.filter(inv => {
        // Filter out invalid/incomplete invitations (missing title)
        if (!inv.title) {
            console.warn('Filtering out incomplete invitation (no title):', inv)
            return false
        }
        
        // Check if invitation has an end time
        if (inv.end) {
            try {
                const endDate = new Date(inv.end)
                if (!isNaN(endDate.getTime()) && endDate < now) {
                    return false // Match has ended
                }
            } catch (e) {
                console.warn('Invalid end date for invitation:', inv)
            }
        }
        
        // Check if invitation has a date and no end (use date as reference)
        if (inv.date && !inv.end) {
            try {
                const matchDate = new Date(inv.date)
                if (!isNaN(matchDate.getTime())) {
                    // Consider a match past if it was more than 3 hours ago
                    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000))
                    if (matchDate < threeHoursAgo) {
                        return false // Match started more than 3 hours ago, likely over
                    }
                }
            } catch (e) {
                console.warn('Invalid date for invitation:', inv)
            }
        }
        
        return true // Keep invitation if not past
    })
})

const invitationsCount = computed(() => activeInvitations.value.length)

// Recommendations state
const matches = ref([])
const userLocation = ref(null)
const locationPermissionGranted = ref(false)
const courtsData = ref({})
const usersCache = ref({})

// Carousel state
const currentSlide = ref(0)
const carouselTrack = ref(null)

// Auto-play state
const autoPlayInterval = ref(null)
const isAutoPlayPaused = ref(false)

// Carousel computed properties
const maxSlides = computed(() => {
  return Math.ceil(activeInvitations.value.length / 3) - 1
})

const totalSlides = computed(() => {
  return Math.ceil(activeInvitations.value.length / 3)
})

// Auto-scroll condition for conveyor belt
const shouldAutoScroll = computed(() => {
  return recommendedMatches.value.length >= 4
})

// Realtime subscription for invitations
let invitesUnsub = null

function subscribeInvitationsRealtime(uid) {
    // Clean up any existing listener
    if (invitesUnsub) {
        try { invitesUnsub() } catch (e) {}
        invitesUnsub = null
    }
    if (!uid) {
        invitations.value = []
        return
    }
    invitesUnsub = onDataChange(`users/${uid}/invitations`, async (invData) => {
        if (!invData) {
            invitations.value = []
            return
        }
        const arr = Object.keys(invData).map(id => ({ id, ...invData[id] }))
        
        // Enrich invitations with current match status and inviter profile
        for (const inv of arr) {
            if (inv.matchPath) {
                try {
                    const matchData = await getDataFromFirebase(inv.matchPath)
                    if (matchData) {
                        // Update the started flag from the actual match
                        inv.started = matchData.started || matchData._started || false
                    }
                } catch (e) {
                    // If we can't fetch match data, keep the invitation as-is
                    console.warn('Failed to enrich invitation with match data:', e)
                }
            }
            
            // Fetch inviter profile data
            if (inv.invitedBy) {
                try {
                    const inviterData = await getDataFromFirebase(`users/${inv.invitedBy}`)
                    if (inviterData) {
                        inv.inviterName = inviterData.name || inviterData.displayName || inviterData.username || 'Unknown'
                        inv.inviterAvatar = avatarForUser(inviterData)
                        inv.inviterUid = inv.invitedBy
                    }
                } catch (e) {
                    console.warn('Failed to fetch inviter profile:', e)
                    inv.inviterName = 'Unknown'
                    inv.inviterAvatar = seededAvatar('unknown')
                }
            }
        }
        
        invitations.value = arr
    })
}

// Load invitations for the current user
async function loadInvitations() {
    if (!currentUser.value) {
        invitations.value = []
        return
    }
    try {
        const invData = await getDataFromFirebase(`users/${currentUser.value.uid}/invitations`)
        if (!invData) {
            invitations.value = []
            return
        }
        // Convert object to array
        const invArray = Object.keys(invData).map(matchId => ({
            id: matchId,
            ...invData[matchId]
        }))
        invitations.value = invArray
    } catch (err) {
        console.error('Failed to load invitations', err)
        invitations.value = []
    }
}

// Accept an invitation - join the match and remove the invitation
async function acceptInvite(invitation) {
    if (!currentUser.value) return
    
    try {
        // Find the match using the matchPath or construct it from the invitation data
        let matchPath = invitation.matchPath
        
        // If matchPath is missing, try to construct it from invitation data
        if (!matchPath && invitation.court && invitation.date && invitation.id) {
            matchPath = `matches/${invitation.court}/${invitation.date}/${invitation.id}`
            console.log('Constructed matchPath from invitation data:', matchPath)
        }
        
        if (!matchPath) {
            console.error('No match path in invitation and cannot construct one:', invitation)
            alert('Cannot join this match - invitation data is incomplete')
            await declineInvite(invitation)
            return
        }
        
        // Get the match data
        const matchData = await getDataFromFirebase(matchPath)
        if (!matchData) {
            alert('Match no longer exists')
            await declineInvite(invitation)
            return
        }
        
        // Add user to the match's joinedBy and playersMap
        await setChildData(`${matchPath}/joinedBy`, currentUser.value.uid, true)
        
        const playerData = {
            uid: currentUser.value.uid,
            name: currentUser.value.displayName || currentUser.value.email || 'Player',
            avatar: currentUser.value.photoURL || '',
            joinedAt: Date.now()
        }
        await setChildData(`${matchPath}/playersMap`, currentUser.value.uid, playerData)
        
        // Remove the invitation
        await deleteChildData(`users/${currentUser.value.uid}/invitations`, invitation.id)
        
        // Reload invitations
        await loadInvitations()
        
        alert('You have joined the match!')
    } catch (err) {
        console.error('Failed to accept invitation', err)
        alert('Failed to join match')
    }
}

// Decline an invitation - just remove it
async function declineInvite(invitation) {
    if (!currentUser.value) return
    
    try {
        await deleteChildData(`users/${currentUser.value.uid}/invitations`, invitation.id)
        await loadInvitations()
    } catch (err) {
        console.error('Failed to decline invitation', err)
    }
}

function openProfileModal(target) {
    if (!target) return
    // allow either a uid string or an enriched inviter object
    if (typeof target === 'string') {
        profileModalUid.value = target
        profileModalInitial.value = null
    } else if (typeof target === 'object' && target) {
        const uid = target.uid || target.id || target.key || null
        if (!uid) return
        profileModalUid.value = uid
        // keep the enriched object (name/avatar) so modal can render immediately
        profileModalInitial.value = target
    } else {
        return
    }
    showProfileModal.value = true
}

function closeProfileModal() {
    showProfileModal.value = false
    profileModalUid.value = null
    profileModalInitial.value = null
}

// Recommendation helper functions (copied from Matches.vue)
function normalizeSkill(skill) {
    if (!skill) return 'Open'
    const s = ('' + skill).trim().toLowerCase()
    if (s.startsWith('pro')) return 'Professional'
    if (s.startsWith('inter')) return 'Intermediate'
    if (s.startsWith('beg')) return 'Beginner'
    if (s.startsWith('open')) return 'Open'
    return 'Open'
}

function getRegionFromLocation(location) {
    if (!location) return null
    
    if (typeof location === 'string') {
        return location.trim()
    }
    
    if (location.lat && location.lng) {
        return getRegionFromCoordinates(location.lat, location.lng)
    }
    
    if (location.region) {
        return location.region.trim()
    }
    
    if (location.address) {
        const address = location.address.toLowerCase()
        if (address.includes('central') || address.includes('orchard') || address.includes('marina') || address.includes('raffles')) {
            return 'Central'
        }
        if (address.includes('east') || address.includes('bedok') || address.includes('tampines') || address.includes('pasir ris')) {
            return 'East'
        }
        if (address.includes('west') || address.includes('jurong') || address.includes('clementi') || address.includes('bukit batok')) {
            return 'West'
        }
        if (address.includes('north') || address.includes('woodlands') || address.includes('yishun') || address.includes('sembawang')) {
            return 'North'
        }
        if (address.includes('south') || address.includes('sentosa') || address.includes('harbourfront')) {
            return 'South'
        }
    }
    
    return null
}

function getRegionFromCoordinates(lat, lng) {
    if (lat >= 1.26 && lat <= 1.32 && lng >= 103.82 && lng <= 103.87) {
        return 'Central'
    }
    if (lat >= 1.30 && lat <= 1.38 && lng >= 103.87 && lng <= 104.00) {
        return 'East'
    }
    if (lat >= 1.30 && lat <= 1.40 && lng >= 103.60 && lng <= 103.82) {
        return 'West'
    }
    if (lat >= 1.40 && lat <= 1.47 && lng >= 103.75 && lng <= 103.85) {
        return 'North'
    }
    if (lat >= 1.23 && lat <= 1.30 && lng >= 103.80 && lng <= 103.87) {
        return 'South'
    }
    
    if (lng < 103.82) return 'West'
    if (lng > 103.87) return 'East'  
    if (lat > 1.38) return 'North'
    if (lat < 1.28) return 'South'
    
    return 'Central'
}

function getSkillLevelScore(userSkill, matchRequiredSkill) {
    if (!userSkill || !matchRequiredSkill) return 0.5
    
    const skillLevels = ['Open', 'Beginner', 'Intermediate', 'Professional']
    const userSkillNormalized = normalizeSkill(userSkill)
    const matchSkillNormalized = normalizeSkill(matchRequiredSkill)
    
    const userIndex = skillLevels.indexOf(userSkillNormalized)
    const requiredIndex = skillLevels.indexOf(matchSkillNormalized)
    
    if (userIndex === -1 || requiredIndex === -1) return 0.5
    if (userIndex === requiredIndex) return 1.0
    if (matchSkillNormalized === 'Open') return 0.9
    
    const diff = Math.abs(userIndex - requiredIndex)
    if (diff === 1) return 0.6
    if (diff === 2) return 0.3
    return 0.1
}

function getGameTypePreferenceScore(userSkillLevel, matchType) {
    if (!userSkillLevel || !matchType) return 0.7
    
    const userSkill = normalizeSkill(userSkillLevel)
    const matchSkill = normalizeSkill(matchType)
    
    if (userSkill === matchSkill) return 1.0
    
    if (userSkill === 'Open') {
        if (matchSkill === 'Beginner') return 0.9
        if (matchSkill === 'Intermediate') return 0.7
        if (matchSkill === 'Professional') return 0.4
    }
    
    if (userSkill === 'Beginner') {
        if (matchSkill === 'Open') return 0.9
        if (matchSkill === 'Intermediate') return 0.6
        if (matchSkill === 'Professional') return 0.2
    }
    
    if (userSkill === 'Intermediate') {
        if (matchSkill === 'Open') return 0.8
        if (matchSkill === 'Beginner') return 0.7
        if (matchSkill === 'Professional') return 0.8
    }
    
    if (userSkill === 'Professional') {
        if (matchSkill === 'Open') return 0.6
        if (matchSkill === 'Beginner') return 0.3
        if (matchSkill === 'Intermediate') return 0.9
    }
    
    return 0.5
}

function getAgeCompatibilityWithPlayers(userAge, match, usersData) {
    if (!userAge || !match.joinedBy || !usersData) return 0.7
    
    const playerAges = []
    
    for (const uid of Object.keys(match.joinedBy)) {
        if (usersData[uid] && usersData[uid].age) {
            playerAges.push(usersData[uid].age)
        }
    }
    
    if (playerAges.length === 0) return 0.7
    
    const avgAge = playerAges.reduce((sum, age) => sum + age, 0) / playerAges.length
    const ageDiff = Math.abs(userAge - avgAge)
    
    if (ageDiff <= 3) return 1.0
    if (ageDiff <= 5) return 0.9
    if (ageDiff <= 8) return 0.7
    if (ageDiff <= 12) return 0.5
    return 0.3
}

function getRegionCompatibilityScore(userRegion, courtRegion) {
    if (!userRegion || !courtRegion) return 0.5
    
    const userReg = userRegion.toLowerCase().trim()
    const courtReg = courtRegion.toLowerCase().trim()
    
    if (userReg === courtReg) return 1.0
    return 0.5
}

function calculateRecommendationScore(match, userProfile, userLoc, usersData) {
    let score = 0
    let totalWeight = 0
    
    if (userLoc || userProfile?.location) {
        const userRegion = getRegionFromLocation(userLoc) || getRegionFromLocation(userProfile?.location)
        const courtRegion = getRegionFromLocation(match.court)
        
        if (userRegion && courtRegion) {
            const regionScore = getRegionCompatibilityScore(userRegion, courtRegion)
            score += regionScore * 0.3
            totalWeight += 0.3
        }
    }
    
    if (userProfile?.skillLevel && match.type) {
        const skillScore = getSkillLevelScore(userProfile.skillLevel, match.type)
        score += skillScore * 0.25
        totalWeight += 0.25
    }
    
    if (userProfile?.skillLevel && match.type) {
        const gameTypeScore = getGameTypePreferenceScore(userProfile.skillLevel, match.type)
        score += gameTypeScore * 0.2
        totalWeight += 0.2
    }
    
    if (match.gender && userProfile?.gender) {
        let genderScore = 1.0
        if (match.gender === 'All') {
            genderScore = 1.0
        }
        score += genderScore * 0.15
        totalWeight += 0.15
    }
    
    if (userProfile?.age && match.joinedBy && usersData) {
        const ageScore = getAgeCompatibilityWithPlayers(userProfile.age, match, usersData)
        score += ageScore * 0.1
        totalWeight += 0.1
    }
    
    const finalScore = totalWeight > 0 ? score / totalWeight : 0
    return finalScore
}

function isPast(match) {
    if (!match) return false
    
    // Check if manually ended
    if (match.ended || match.endedAt) return true
    
    const now = new Date()
    
    // If we have end time, check if it's past that
    if (match.endTime && match.date) {
        try {
            const endDateTime = new Date(`${match.date}T${match.endTime}:00`)
            if (endDateTime < now) return true
        } catch (e) {
            // Invalid date format, fall back to other checks
        }
    }
    
    return false
}

function isHost(match) {
    if (!currentUser.value || !match) return false
    return match.createdby === currentUser.value.uid || match.ownerId === currentUser.value.uid
}

function getPlayerCount(match) {
    if (!match.joinedBy) return 0
    return Object.keys(match.joinedBy).length
}

// Check if match has actually started and is currently live
function isMatchCurrentlyLive(match) {
    if (!match) return false
    
    // Only show LIVE if the match has been explicitly started
    // Check for actual status indicators that show the match is active
    if (match.status === 'live' || match.status === 'active' || match.status === 'ongoing') {
        return true
    }
    
    // Check if match has been manually started by host
    if (match.started === true || match.isStarted === true || match.matchStarted === true) {
        return true
    }
    
    // Check if match has a start timestamp indicating it was actually begun
    if (match.startedAt || match.actualStartTime) {
        return true
    }
    
    // Don't show LIVE just based on scheduled time - require explicit start action
    return false
}

// Computed property for recommended matches
const recommendedMatches = computed(() => {
    if (!currentUser.value || !matches.value.length) return []
    
    const uid = currentUser.value.uid
    
    // Filter available matches
    const availableMatches = matches.value.filter(m => {
        if (isPast(m) || isHost(m) || (m.joinedBy && m.joinedBy[uid])) {
            return false
        }
        
        // Gender compatibility
        if (m.gender && m.gender !== 'All' && currentUserProfile.value?.gender) {
            const userGender = currentUserProfile.value.gender.toLowerCase().trim()
            const matchGender = m.gender.toLowerCase().trim()
            
            if (matchGender !== 'all' && matchGender !== userGender) {
                return false
            }
        }
        
        // Skill level compatibility
        if (m.type && currentUserProfile.value?.skillLevel) {
            const userSkill = normalizeSkill(currentUserProfile.value.skillLevel)
            const matchSkill = normalizeSkill(m.type)
            
            const skillLevels = ['Open', 'Beginner', 'Intermediate', 'Professional']
            const userIndex = skillLevels.indexOf(userSkill)
            const matchIndex = skillLevels.indexOf(matchSkill)
            
            if (userIndex !== -1 && matchIndex !== -1 && matchIndex > userIndex) {
                if (matchSkill !== 'Open') {
                    return false
                }
            }
        }
        
        // Region compatibility
        const userRegion = getRegionFromLocation(userLocation.value) || getRegionFromLocation(currentUserProfile.value?.location)
        if (userRegion) {
            let courtRegion = null
            
            if (m.courtId && courtsData.value[m.courtId]) {
                courtRegion = getRegionFromLocation(courtsData.value[m.courtId])
            } else if (m.court && typeof m.court === 'object') {
                courtRegion = getRegionFromLocation(m.court)
            } else if (m.court && typeof m.court === 'string') {
                const courtName = m.court.toLowerCase().trim()
                for (const [id, courtData] of Object.entries(courtsData.value)) {
                    if (courtData && courtData.name && courtData.name.toLowerCase().trim() === courtName) {
                        courtRegion = getRegionFromLocation(courtData)
                        break
                    }
                }
            }
            
            if (courtRegion && userRegion) {
                const userReg = userRegion.toLowerCase().trim()
                const courtReg = courtRegion.toLowerCase().trim()
                
                if (userReg !== courtReg) {
                    return false
                }
            }
        }
        
        return true
    })
    
    if (!currentUserProfile.value) return availableMatches
    
    // Calculate recommendation scores
    const recommendedMatches = availableMatches.map(match => {
        const enhancedMatch = { ...match }
        if (match.courtId && courtsData.value[match.courtId]) {
            enhancedMatch.court = courtsData.value[match.courtId]
        }
        
        const score = calculateRecommendationScore(
            enhancedMatch, 
            currentUserProfile.value, 
            userLocation.value,
            usersCache.value
        )
        
        return { match, score }
    })
    .filter(item => item.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .map(item => item.match)
    
    return recommendedMatches // Remove the slice limit here
})

// Group recommended matches by time
const groupedRecommendations = computed(() => {
    const now = new Date()
    const out = { ongoing: [], scheduled: [] }
    
    for (const m of recommendedMatches.value) {
        if (isPast(m)) continue
        
        // Basic time check
        if (m.startTime && m.date) {
            try {
                const startDateTime = new Date(`${m.date}T${m.startTime}:00`)
                const endDateTime = m.endTime ? new Date(`${m.date}T${m.endTime}:00`) : null
                
                if (endDateTime && now >= startDateTime && now <= endDateTime) {
                    out.ongoing.push(m)
                } else if (startDateTime > now) {
                    out.scheduled.push(m)
                } else {
                    out.ongoing.push(m)
                }
            } catch (e) {
                out.scheduled.push(m)
            }
        } else {
            out.scheduled.push(m)
        }
    }
    
    return out
})

// Format time display for matches
function formatMatchTime(startTime, endTime) {
    if (!startTime && !endTime) return 'Time TBD'
    if (startTime && endTime) return `${startTime} - ${endTime}`
    if (startTime) return `From ${startTime}`
    if (endTime) return `Until ${endTime}`
    return 'Time TBD'
}

// Format date display for matches  
function formatMatchDate(dateStr) {
    if (!dateStr) return 'TBD'
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        })
    } catch (err) {
        return dateStr
    }
}

// Join a match
async function joinMatch(match) {
    if (!currentUser.value) {
        alert('Please sign in to join matches')
        return
    }
    
    const uid = currentUser.value.uid
    
    // Check if already joined
    if (match.joinedBy && match.joinedBy[uid]) {
        alert('You have already joined this match')
        return
    }
    
    try {
        // Use the match's database path if available
        let matchPath = match.__dbPath
        
        // If no __dbPath, construct it from match data
        if (!matchPath) {
            const matchId = match.id || match.title
            if (match.court && match.date && matchId) {
                matchPath = `matches/${match.court}/${match.date}/${matchId}`
            } else {
                // Fallback: try to find the match in Firebase
                console.warn('Match missing required fields for path construction:', match)
                alert('Unable to join match - invalid match data')
                return
            }
        }
        
        // Optimistically update local state
        if (!match.joinedBy) match.joinedBy = {}
        match.joinedBy = { ...match.joinedBy, [uid]: true }
        
        // Persist to Firebase - update joinedBy and playersMap
        await setChildData(`${matchPath}/joinedBy`, uid, true)
        
        // Add player name to playersMap for display
        const displayName = (currentUserProfile.value && currentUserProfile.value.name) || 
                           currentUser.value.displayName || 
                           (currentUser.value.email && currentUser.value.email.split('@')[0]) || 
                           uid
        await setChildData(`${matchPath}/playersMap`, uid, displayName)
        
        // Refresh matches
        await loadMatches()
        
        alert('Successfully joined the match!')
    } catch (error) {
        console.error('Failed to join match:', error)
        alert('Failed to join match. Please try again.')
    }
}

// Load data functions
async function loadMatches() {
    try {
        const data = await getDataFromFirebase('matches')
        if (!data) {
            matches.value = []
            return
        }
        
        const out = []
        for (const [court, matchesByDate] of Object.entries(data)) {
            if (!matchesByDate || typeof matchesByDate !== 'object') continue
            
            for (const [date, matchesOnDate] of Object.entries(matchesByDate)) {
                if (!matchesOnDate || typeof matchesOnDate !== 'object') continue
                
                for (const [matchId, matchData] of Object.entries(matchesOnDate)) {
                    if (!matchData || typeof matchData !== 'object') continue
                    
                    out.push({
                        id: matchId,
                        court: court,
                        date: date,
                        __dbPath: `matches/${court}/${date}/${matchId}`,
                        ...matchData
                    })
                }
            }
        }
        
        matches.value = out
    } catch (error) {
        console.error('Failed to load matches:', error)
        matches.value = []
    }
}

async function loadCourtsData() {
    try {
        const data = await getDataFromFirebase('courts')
        if (!data) {
            courtsData.value = {}
            return
        }
        
        if (Array.isArray(data)) {
            const courtsObj = {}
            data.forEach((court, index) => {
                courtsObj[court.id || index] = court
            })
            courtsData.value = courtsObj
        } else {
            courtsData.value = data
        }
    } catch (e) {
        console.warn('Failed to load courts data:', e)
        courtsData.value = {}
    }
}

async function loadUsers() {
    try {
        const users = await getDataFromFirebase('users')
        if (users && typeof users === 'object') {
            usersCache.value = users
        }
    } catch (e) {
        console.warn('Failed to load users cache:', e)
    }
}

// Get user location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation.value = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                locationPermissionGranted.value = true
            },
            (error) => {
                console.warn('Location access denied:', error)
                locationPermissionGranted.value = false
            }
        )
    }
}

// Format invitation date for display with relative timing
function formatInvitationDate(dateStr) {
    if (!dateStr) return 'Unknown date'
    try {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = date - now
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        
        // If today
        if (diffDays === 0) {
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffMins = Math.floor(diffMs / (1000 * 60))
            
            if (diffMins < 0) {
                // Match is happening now or recently started
                return 'Today (Ongoing)'
            } else if (diffMins < 60) {
                return `Today (in ${diffMins} min)`
            } else if (diffHours < 12) {
                return `Today (in ${diffHours}h)`
            } else {
                return 'Today'
            }
        }
        
        // If tomorrow
        if (diffDays === 1) return 'Tomorrow'
        
        // If within a week
        if (diffDays > 0 && diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'long' })
        }
        
        // Otherwise show full date
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        })
    } catch (err) {
        return dateStr
    }
}

// Get match status badge text
function getMatchStatus(inv) {
    if (!inv.date) return 'Scheduled'
    
    try {
        const now = new Date()
        const startDate = new Date(inv.date)
        const endDate = inv.end ? new Date(inv.end) : null
        
        // If match has ended
        if (endDate && endDate < now) {
            return 'Ended'
        }
        
        // Check if match is actually started by the host
        // Only show "Live" if the match has been explicitly started
        const isStarted = inv.started || inv._started || false
        
        // If match is ongoing (time-wise) AND has been started by host
        if (startDate <= now && (!endDate || endDate >= now)) {
            // Only return "Live" if the host has started the match
            if (isStarted) {
                return 'Live'
            }
            // If scheduled time has arrived but host hasn't started, show "Scheduled"
            return 'Scheduled'
        }
        
        // If match is starting soon (within 30 minutes)
        const diffMins = Math.floor((startDate - now) / (1000 * 60))
        if (diffMins > 0 && diffMins <= 30) {
            return 'Starting Soon'
        }
        
        // Otherwise it's scheduled
        return 'Scheduled'
    } catch (err) {
        return 'Scheduled'
    }
}

// Format time display for invitations
function formatInvitationTime(startTime, endTime) {
    if (!startTime && !endTime) return 'Time TBD'
    
    // Helper function to convert 24h to 12h format
    const to12Hour = (time24) => {
        if (!time24) return ''
        const [hours, minutes] = time24.split(':')
        let hour = parseInt(hours)
        const ampm = hour >= 12 ? 'pm' : 'am'
        hour = hour % 12 || 12
        return `${hour}:${minutes} ${ampm}`
    }
    
    if (startTime && endTime) {
        return `${to12Hour(startTime)} - ${to12Hour(endTime)}`
    }
    if (startTime) return `From ${to12Hour(startTime)}`
    if (endTime) return `Until ${to12Hour(endTime)}`
    return 'Time TBD'
}

// Carousel navigation functions
const scrollCarousel = (direction) => {
  const newSlide = currentSlide.value + direction
  
  if (direction > 0) {
    // Going forward - loop to beginning if at end
    currentSlide.value = newSlide > maxSlides.value ? 0 : newSlide
  } else {
    // Going backward - loop to end if at beginning
    currentSlide.value = newSlide < 0 ? maxSlides.value : newSlide
  }
  
  updateCarouselPosition()
}

const goToSlide = (slideIndex) => {
  if (slideIndex >= 0 && slideIndex <= maxSlides.value) {
    currentSlide.value = slideIndex
    updateCarouselPosition()
  }
}

const updateCarouselPosition = () => {
  if (carouselTrack.value) {
    const slideWidth = 33.333 // Each slide shows 3 cards (100% / 3)
    const translateX = -(currentSlide.value * slideWidth * 3) // Move by 3 card widths
    carouselTrack.value.style.transform = `translateX(${translateX}%)`
  }
}

// Auto-play functions
const startAutoPlay = () => {
  if (autoPlayInterval.value) clearInterval(autoPlayInterval.value)
  
  // Only start auto-play if there are enough slides and it's not paused
  if (invitations.value.length > 3 && !isAutoPlayPaused.value) {
    autoPlayInterval.value = setInterval(() => {
      if (!isAutoPlayPaused.value) {
        scrollCarousel(1) // Move to next slide
      }
    }, 5000) // 5 seconds
  }
}

const stopAutoPlay = () => {
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value)
    autoPlayInterval.value = null
  }
}

const pauseAutoPlay = () => {
  isAutoPlayPaused.value = true
}

const resumeAutoPlay = () => {
  isAutoPlayPaused.value = false
  startAutoPlay()
}

// Navigation functions
const navigateToMatches = () => {
  router.push('/matches')
}

const navigateToRecommendedMatches = () => {
  router.push('/matches?tab=recommended')
}

const navigateToCourts = () => {
  router.push('/court-finder')
}

const navigateToLeaderboard = () => {
  router.push('/leaderboard')
}

const getStarted = () => {
  // Navigate to matches or show sign-up if not logged in
  router.push('/matches')
}

// Create match modal functions
const openCreateMatchModal = () => {
  if (!currentUser.value) {
    // If not signed in, navigate to matches page which will handle sign-in
    router.push('/matches')
    return
  }
  showAddMatchModal.value = true
}

const onMatchCreated = async () => {
  showAddMatchModal.value = false
  // Reload matches to show the new match
  await loadMatches()
}

// Load courts for the create match modal
const loadCourts = async () => {
  try {
    const data = await getDataFromFirebase('courts')
    if (!data) {
      courts.value = []
      return
    }
    if (Array.isArray(data)) {
      courts.value = data
    } else if (typeof data === 'object') {
      courts.value = Object.keys(data).map(k => ({ ...data[k], key: k, id: k }))
    } else {
      courts.value = []
    }
  } catch (err) {
    console.error('Failed to load courts', err)
    courts.value = []
  }
}

// Watch for invitations changes to restart auto-play
watch(invitations, () => {
  startAutoPlay()
}, { immediate: false })

// Setup user authentication watcher
onMounted(async () => {
    // Load initial data
    await loadMatches()
    await loadCourtsData()
    await loadCourts()
    await loadUsers()
    
    // Try to get user location
    if (navigator.geolocation) {
        getUserLocation()
    }
    
    // Start carousel auto-play
    startAutoPlay()
    
    onUserStateChanged(async (user) => {
        currentUser.value = user
        if (user) {
            loadInvitations()
            subscribeInvitationsRealtime(user.uid)
            
            // Load user profile for recommendations
            try {
                const users = await getDataFromFirebase('users')
                if (users && users[user.uid]) {
                    currentUserProfile.value = users[user.uid]
                }
            } catch (e) {
                console.warn('Failed to load user profile:', e)
            }
        } else {
            invitations.value = []
            currentUserProfile.value = null
            if (invitesUnsub) {
                try { invitesUnsub() } catch (e) {}
                invitesUnsub = null
            }
        }
    })
})

// Watch for changes in invitations to reset carousel
watch(invitations, () => {
    currentSlide.value = 0
    updateCarouselPosition()
}, { deep: true })

// Cleanup on unmount
onUnmounted(() => {
    if (invitesUnsub) {
        try { invitesUnsub() } catch (e) {}
        invitesUnsub = null
    }
    
    // Stop auto-play
    stopAutoPlay()
})
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  position: relative; /* establish a containing block for the fixed bg layer */
  color: #dde3ea;
  overflow-x: hidden; /* Prevent horizontal scroll */
}

/* Pin the background image + gradient to the viewport so it fills the whole page
   and doesn’t move with inner content. */
.homepage::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    linear-gradient(rgba(26, 31, 46, 0.7), rgba(44, 50, 58, 0.7)),
    url('../assets/basketball-court-with-flooring.avif') center / cover no-repeat;
  z-index: 0;
  pointer-events: none;
}

/* Ensure page content renders above the fixed background */
.homepage > * { position: relative; z-index: 1; }

.hero-section {
  padding: 20px 16px;
  min-height: 10vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  display: flex;
  flex-direction: column;
  /* gap:15px; */
  align-items: center;
  padding: 0 16px;
  box-sizing: border-box;
}

.hero-title {
  font-size: clamp(2rem, 8vw, 5rem); /* Responsive font size */
  font-weight: bold;
  /* margin-bottom: 20px; */
  line-height: 1.2;
  text-align: center;
  width: 100%;
  color: #dde3ea;
  word-wrap: break-word;
}

.hero-main {
  display: flex !important;
  flex-direction: column !important; /* Stack by default for better centering */
  gap: 30px;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  text-align: center;
}

.hero-text {
  text-align: center;
  padding-left: 16px;
  padding-right: 16px;
  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-highlight {
  color: #ff9500;
  text-shadow: 0 0 20px rgba(255, 149, 0, 0.6), 0 0 40px rgba(255, 149, 0, 0.4), 0 0 60px rgba(255, 149, 0, 0.2);
  background: linear-gradient(135deg, #ff9500 0%, #ffb347 50%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: brandPulse 2s ease-in-out infinite alternate;
}

.hero-subtitle {
  font-size: clamp(1rem, 3vw, 1.25rem); /* Responsive font size */
  color: #a2aec3;
  margin-bottom: 30px;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.5s both;
  max-width: 100%;
  word-wrap: break-word;
  text-align: center;
}

.hero-actions {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.8s both;
  width: 100%;
}

.cta-button {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
  min-width: 200px;
}

.cta-button.primary {
  background: linear-gradient(135deg, #ff9500 0%, #ffb347 100%);
  color: #1a1f2e;
  box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.cta-button.primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.cta-button.primary:hover::before {
  left: 100%;
}

.cta-button.primary:hover {
  background: linear-gradient(135deg, #ffb347 0%, #ff9500 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 149, 0, 0.3);
}

.cta-button.secondary {
  background: transparent;
  color: #ff9500;
  border: 2px solid #ff9500;
  box-shadow: 0 0 15px rgba(255, 149, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.cta-button.secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background: linear-gradient(135deg, #ff9500, #ffb347);
  transition: width 0.3s ease;
  z-index: -1;
}

.cta-button.secondary:hover::before {
  width: 100%;
}

.cta-button.secondary:hover {
  background: #ff9500;
  color: #1a1f2e;
  transform: translateY(-2px);
}

.cta-button.large {
  padding: 18px 36px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #ff9500 0%, #ffb347 100%);
  color: #1a1f2e;
}

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.basketball-icon {
  font-size: 10rem;
  animation: bounce 1.5s infinite ease-in-out;
  margin: 0 auto;
}

/* Standard container for consistent horizontal padding/centering */
.container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

/* Normalize section spacing for visual consistency */
section { 
  padding-top: 40px; 
  padding-bottom: 40px; 
  max-width: 100%;
  overflow-x: hidden;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-40px);
  }
  60% {
    transform: translateY(-20px);
  }
}

@keyframes brandPulse {
  0% {
    text-shadow: 0 0 20px rgba(255, 149, 0, 0.6), 0 0 40px rgba(255, 149, 0, 0.4);
  }
  100% {
    text-shadow: 0 0 30px rgba(255, 149, 0, 0.8), 0 0 50px rgba(255, 149, 0, 0.6), 0 0 70px rgba(255, 149, 0, 0.4);
  }
}

/* Two-column layout for very large screens only */
@media (min-width: 1400px) {
  .hero-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
  }
  
  .basketball-icon {
    font-size: 16rem;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Invites Section */
.invites-section {
  padding: 40px 20px;
  background: rgba(0, 0, 0, 0.1);
}

/* Invitations Section */
.invitations-wrapper {
    width: 100%;
}

.invitations-section {
    padding: 24px;
    background: rgba(255, 154, 60, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 154, 60, 0.15);
}

.invitations-section .section-heading {
    margin-top: 0;
    margin-bottom: 20px;
    text-align: left;
    color: #ff9500;
    font-size: 2rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

.notification-badge {
    background: #ff9500;
    color: #1a1f2e;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
}

.invitations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive columns */
  gap: 20px;
  width: 100%;
  max-width: 100%;
  align-items: start;
  justify-items: stretch; /* allow cards to align consistently */
  box-sizing: border-box;
}

/* Carousel styles */
.carousel-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
}

.carousel-track {
    display: flex;
    width: 100%;
    transition: transform 0.3s ease-in-out;
    gap: 20px;
}

.carousel-slide {
    flex: 0 0 calc(33.333% - 14px); /* Show 3 cards per view */
    display: flex;
    justify-content: center;
    min-height: 380px; /* Match card height */
}

.carousel-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
}

.carousel-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.carousel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.carousel-btn.prev {
    left: -20px;
}

.carousel-btn.next {
    right: -20px;
}

.carousel-btn i {
    font-size: 18px;
    color: #FF8C1A;
}

.carousel-indicators {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 20px;
}

.indicator-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 140, 26, 0.3);
    cursor: pointer;
    transition: background 0.2s;
}

.indicator-dot.active {
    background: #FF8C1A;
}

.indicator-dot:hover {
    background: rgba(255, 140, 26, 0.6);
}

.invitation-card-wrapper {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    min-height: 380px; /* Consistent wrapper height */
}

.invitation-card {
    background: linear-gradient(135deg, #FF9A3C 0%, #FF8C1A 100%);
    border-radius: 16px;
    overflow: hidden;
    width: 100%; /* Responsive width */
    max-width: 380px; /* Max width for larger screens */
    min-width: 280px; /* Min width to maintain readability */
    height: auto; /* Auto height for flexibility */
    min-height: 380px; /* Minimum height for consistency */
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s;
}

.invitation-card:hover {
    transform: translateY(-2px);
}

.invitation-header {
    padding: 20px 20px 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0; /* Prevent header from shrinking */
    gap: 12px;
}

.invitation-match-title {
    color: #000;
    font-weight: 700;
    font-size: 1.25rem;
    margin: 0;
    flex: 1;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* Limit title to 2 lines */
    line-clamp: 2; /* Standard property for compatibility */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}

.match-status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    white-space: nowrap;
    flex-shrink: 0;
    letter-spacing: 0.5px;
}

.match-status-badge.scheduled {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
}

.match-status-badge.live {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    animation: pulse-badge 2s ease-in-out infinite;
}

.match-status-badge.starting {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
}

@keyframes pulse-badge {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

.invitation-body {
    background: #1a1d23;
    padding: 20px;
    display: flex;
    flex-direction: column;
    border-radius: 0 0 16px 16px;
    flex: 1; /* Take remaining space */
    justify-content: space-between; /* Distribute content */
}

.invitation-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1; /* Take available space */
}

.invitation-court-name {
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; /* Handle long court names */
    display: flex;
    align-items: center;
    gap: 8px;
}

.invitation-court-name i {
    color: #ff9a3c;
    flex-shrink: 0;
}

.invitation-date {
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.invitation-date i {
    color: #ff9a3c;
    flex-shrink: 0;
}

.invitation-time {
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.invitation-time i {
    color: #ff9a3c;
    flex-shrink: 0;
}

.invitation-tags {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.invitation-tag {
    background: rgba(255, 154, 60, 0.15);
    color: #ff9a3c;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
}

.invitation-inviter {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #9fb0bf;
    font-size: 0.9rem;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    transition: color 0.2s;
}

.invitation-inviter:hover {
    color: #ff9a3c !important;
}

.invitation-inviter i {
    font-size: 1.2rem;
}

.inviter-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ff9a3c;
}

.invitation-actions {
    display: flex;
    gap: 12px;
    margin-top: 16px; /* Add space above actions */
    flex-shrink: 0; /* Prevent actions from shrinking */
}

.invitation-actions .btn-accept,
.invitation-actions .btn-decline {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.95rem;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.invitation-actions .btn-accept {
    background: #10b981;
    color: #fff;
}

.invitation-actions .btn-accept:hover {
    background: #059669;
    transform: translateY(-1px);
}

.invitation-actions .btn-decline {
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.invitation-actions .btn-decline:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
}

/* No invites empty state */
.no-invites-state {
    text-align: center;
    padding: 40px 20px;
    color: #a2aec3;
}

.no-invites-state .empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.no-invites-state h4 {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 12px;
    font-weight: 600;
}

.no-invites-state p {
    color: #a2aec3;
    font-size: 1rem;
    margin-bottom: 24px;
    line-height: 1.5;
}

.btn-create-match {
    background: linear-gradient(135deg, #ff9500 0%, #ffb347 100%);
    color: #1a1f2e;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-create-match:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

/* Recommended Matches Section */
.recommended-matches-section {
    padding: 40px 20px;
    background: rgba(26, 31, 46, 0.95);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.recommendations-wrapper {
    max-width: 1200px;
    margin: 0 auto;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.recommendations-section .section-heading {
    font-size: 1.8rem;
    font-weight: bold;
    color: #fff;
    margin: 0;
    display: flex;
    align-items: center;
    text-align: left;
    justify-content: flex-start;
}

.recommendations-section .section-heading i {
    color: #ff9500;
    margin-right: 12px;
}

.btn-view-all {
    background: rgba(255, 149, 0, 0.1);
    color: #ff9500;
    border: 1px solid rgba(255, 149, 0, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-view-all:hover {
    background: rgba(255, 149, 0, 0.2);
    border-color: rgba(255, 149, 0, 0.5);
    transform: translateY(-1px);
}

.btn-view-all i {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
}

.btn-view-all:hover i {
    transform: translateX(2px);
}

/* Conveyor Belt Styles */
.conveyor-belt-container {
    margin-top: 20px;
    overflow: hidden;
    position: relative;
    padding: 20px 0;
}

.conveyor-belt-track {
    display: flex;
    width: fit-content;
    gap: 20px;
}

.conveyor-belt-container.auto-scroll .conveyor-belt-track {
    animation: conveyorScroll 60s linear infinite;
}

.conveyor-belt-section {
    display: flex;
    gap: 20px;
    flex-shrink: 0;
}

@keyframes conveyorScroll {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-33.333%); /* Move by 1/3 since we have 3 duplicates */
    }
}

.conveyor-card {
    flex: 0 0 320px; /* Fixed width for consistent scrolling */
    height: auto;
}

/* Pause animation on hover */
.conveyor-belt-container:hover.auto-scroll .conveyor-belt-track {
    animation-play-state: paused;
}

/* Static matches layout for few matches */
.static-matches {
    display: flex;
    gap: 20px;
    justify-content: flex-start;
    flex-wrap: wrap;
}

.static-matches .conveyor-card {
    flex: 0 0 320px;
    min-width: 320px;
}

.matches-subsection {
    margin-bottom: 40px;
}

.matches-subsection:last-child {
    margin-bottom: 0;
}

.subsection-heading {
    font-size: 1.3rem;
    font-weight: 600;
    color: #fff;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
}

.subsection-heading i {
    color: #ff9500;
    margin-right: 8px;
}

.matches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 20px;
}

.match-card {
    background: rgba(44, 50, 58, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.match-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 149, 0, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.match-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
}

.match-title {
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
    line-height: 1.3;
}

.match-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    margin-left: 12px;
}

.match-status.ongoing {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.match-status.scheduled {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
}

.match-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.match-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.match-court,
.match-time,
.match-players {
    display: flex;
    align-items: center;
    color: #a2aec3;
    font-size: 0.9rem;
}

.match-court i,
.match-time i,
.match-players i {
    color: #ff9500;
    margin-right: 8px;
    width: 16px;
}

.match-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 4px;
}

.match-tag {
    background: rgba(255, 149, 0, 0.2);
    color: #ff9500;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid rgba(255, 149, 0, 0.3);
}

.match-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
}

.btn-join-recommendation {
    background: linear-gradient(135deg, #ff9500 0%, #ffb347 100%);
    color: #1a1f2e;
    border: none;
    padding: 10px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-join-recommendation:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 149, 0, 0.3);
}

.btn-join-recommendation i {
    font-size: 12px;
}

/* No recommendations empty state */
.no-recommendations-state {
    text-align: center;
    padding: 60px 20px;
    color: #a2aec3;
}

.no-recommendations-state .empty-icon {
    font-size: 4rem;
    margin-bottom: 20px;
}

.no-recommendations-state h4 {
    color: #fff;
    font-size: 1.5rem;
    margin-bottom: 12px;
    font-weight: 600;
}

.no-recommendations-state p {
    color: #a2aec3;
    font-size: 1rem;
    margin-bottom: 24px;
    line-height: 1.5;
}

.btn-explore-matches {
    background: rgba(255, 149, 0, 0.2);
    color: #ff9500;
    border: 1px solid rgba(255, 149, 0, 0.3);
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.btn-explore-matches:hover {
    background: rgba(255, 149, 0, 0.3);
    border-color: rgba(255, 149, 0, 0.5);
    transform: translateY(-1px);
}

/* Features section */

.btn-create-match:hover {
    background: linear-gradient(135deg, #ffb347 0%, #ff9500 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 149, 0, 0.4);
}

/* Features Section */
.features-section {
  padding: 80px 20px;
  background: rgba(255, 255, 255, 0.02);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 60px;
  color: #ff9500;
  font-weight: bold;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(255, 149, 0, 0.1);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(255, 149, 0, 0.1);
  border-color: rgba(255, 149, 0, 0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.4rem;
  margin-bottom: 15px;
  color: #ff9500;
}

.feature-card p {
  color: #a2aec3;
  line-height: 1.6;
}

/* Stats Section */
.stats-section {
  padding: 80px 20px;
  background: rgba(0, 0, 0, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: #ff9500;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 1.1rem;
  color: #a2aec3;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* CTA Section */
.cta-section {
  padding: 80px 20px;
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.1) 0%, rgba(255, 149, 0, 0.05) 100%);
}

.cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #ff9500;
}

.cta-content p {
  font-size: 1.2rem;
  color: #a2aec3;
  margin-bottom: 40px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-main {
    gap: 40px;
  }
  
  .hero-title {
    font-size: clamp(2rem, 5vw, 2.5rem);
  }
  
  .hero-actions {
    justify-content: center;
    flex-direction: column;
    width: 100%;
  }
  
  .cta-button {
    width: 100%;
    max-width: 300px;
  }
  
  .basketball-icon {
    font-size: 8rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .cta-content h2 {
    font-size: 2rem;
  }
  
  /* Ensure invitations grid is responsive */
  .invitations-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  /* Stack title and button and prevent overflow on very small screens */
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .recommendations-section .section-heading,
  .section-header .section-heading {
    text-align: left;
    width: 100%;
  }
  .btn-view-all {
    width: 100%;
    justify-content: center;
    white-space: normal; /* allow wrapping instead of overflowing */
    font-size: 0.95rem;
    padding: 10px 14px;
  }
  .hero-title {
    font-size: clamp(1.5rem, 8vw, 2rem);
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .cta-button {
    padding: 12px 24px;
    font-size: 0.9rem;
    width: 100%;
  }
  
  .basketball-icon {
    font-size: 6rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-number {
    font-size: 2.5rem;
  }
  
  /* Responsive invitation cards */
  .invitations-grid {
    grid-template-columns: 1fr; /* Single column on very small screens */
    gap: 15px;
  }
  
  .invitation-card {
    width: 100%; /* Full width for mobile */
    max-width: 350px;
    margin: 0 auto;
    height: auto; /* Auto height for mobile */
    min-height: 320px;
  }
  
  .invitation-card-wrapper {
    min-height: auto; /* Auto height */
  }
  
  .carousel-slide {
    min-height: auto; /* Auto height */
    flex: 0 0 100%; /* Show 1 card per view on mobile */
  }
  
  .carousel-btn.prev {
    left: -15px;
  }
  
  .carousel-btn.next {
    right: -15px;
  }
  
  /* Reduce hero padding */
  .hero-section {
    padding: 20px 12px;
    padding-top: 40px;
  }
  
  .hero-content {
    padding: 0 8px;
  }
  
  .hero-text {
    padding-left: 8px;
    padding-right: 8px;
  }
}

/* Slightly wider small screens: keep the header from pushing the button out
   of its card by stacking earlier. */
@media (max-width: 640px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .btn-view-all {
    width: 100%;
    justify-content: center;
    white-space: normal;
  }
}

/* Tablet responsive styles */
@media (max-width: 768px) {
  .invitations-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive columns on tablet */
    gap: 16px;
  }
  
  .invitation-card {
    width: 100%; /* Full width within grid cell */
    max-width: 100%;
    min-height: 365px; /* Fixed height for tablet */
  }
  
  .invitation-card-wrapper {
    min-height: auto; /* Auto height */
  }
  
  .carousel-slide {
    min-height: auto; /* Auto height */
    flex: 0 0 calc(50% - 10px); /* Show 2 cards per view on tablet */
  }
}

/* Medium screen adjustments */
@media (max-width: 900px) {
  .invitations-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 18px;
  }
  
  .container {
    padding: 0 20px;
  }
}
</style>