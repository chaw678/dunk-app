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
            <div class="basketball-icon">🏀</div>
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
            <div v-if="invitations.length > 0" class="invitations-container">
              <!-- Carousel wrapper for more than 3 invitations -->
              <div v-if="invitations.length > 3" class="carousel-wrapper">
                <button class="carousel-btn prev" @click="scrollCarousel(-1)" :disabled="currentSlide === 0">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <div class="carousel-track" ref="carouselTrack">
                  <div class="carousel-slide" v-for="inv in invitations" :key="inv.id">
                    <div class="invitation-card-wrapper">
                      <div class="invitation-card">
                        <div class="invitation-header">
                          <h3 class="invitation-match-title">{{ inv.title }}</h3>
                        </div>
                        <div class="invitation-body">
                          <div class="invitation-content">
                            <div class="invitation-court-name">{{ inv.court || 'Unknown court' }}</div>
                            <div class="invitation-date">{{ formatInvitationDate(inv.date) }}</div>
                            <div class="invitation-time">{{ formatInvitationTime(inv.startTime, inv.endTime) }}</div>
                            <div class="invitation-tags">
                              <span class="invitation-tag">{{ inv.gender || 'All' }}</span>
                              <span class="invitation-tag">{{ inv.type || 'Open' }}</span>
                            </div>
                            <div class="invitation-inviter">
                              <i class="bi bi-person-circle"></i>
                              <span>Invited by {{ inv.inviterName || 'Unknown' }}</span>
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
                <button class="carousel-btn next" @click="scrollCarousel(1)" :disabled="currentSlide >= maxSlides">
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
                <div class="invitation-card-wrapper" v-for="inv in invitations" :key="inv.id">
                  <div class="invitation-card">
                    <div class="invitation-header">
                      <h3 class="invitation-match-title">{{ inv.title }}</h3>
                    </div>
                    <div class="invitation-body">
                      <div class="invitation-content">
                        <div class="invitation-court-name">{{ inv.court || 'Unknown court' }}</div>
                        <div class="invitation-date">{{ formatInvitationDate(inv.date) }}</div>
                        <div class="invitation-time">{{ formatInvitationTime(inv.startTime, inv.endTime) }}</div>
                        <div class="invitation-tags">
                          <span class="invitation-tag">{{ inv.gender || 'All' }}</span>
                          <span class="invitation-tag">{{ inv.type || 'Open' }}</span>
                        </div>
                        <div class="invitation-inviter">
                          <i class="bi bi-person-circle"></i>
                          <span>Invited by {{ inv.inviterName || 'Unknown' }}</span>
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
              <button class="btn-create-match" @click="navigateToMatches">
                <i class="bi bi-plus-lg"></i> Create Match
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <h2 class="section-title">Why Choose Dunk+?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🏟️</div>
            <h3>Find Courts</h3>
            <p>Discover basketball courts across Singapore with real-time availability and ratings</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3>Join Matches</h3>
            <p>Connect with players of similar skill levels and join exciting basketball matches</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Track Progress</h3>
            <p>Monitor your performance, climb the leaderboard, and improve your game</p>
          </div>
          <div class="feature-card">
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData, deleteChildData, onDataChange } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'

const router = useRouter()

// Current user state
const currentUser = ref(null)

// Invitations state
const invitations = ref([])
const invitationsCount = computed(() => invitations.value.length)

// Carousel state
const currentSlide = ref(0)
const carouselTrack = ref(null)

// Carousel computed properties
const maxSlides = computed(() => {
  return Math.ceil(invitations.value.length / 3) - 1
})

const totalSlides = computed(() => {
  return Math.ceil(invitations.value.length / 3)
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
    invitesUnsub = onDataChange(`users/${uid}/invitations`, (invData) => {
        if (!invData) {
            invitations.value = []
            return
        }
        const arr = Object.keys(invData).map(id => ({ id, ...invData[id] }))
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
        const matchPath = invitation.matchPath
        if (!matchPath) {
            console.error('No match path in invitation')
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
        
        // Navigate to matches page to see the joined match
        router.push('/matches')
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

// Format invitation date for display
function formatInvitationDate(dateStr) {
    if (!dateStr) return 'Unknown date'
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric'
        })
    } catch (err) {
        return dateStr
    }
}

// Format time display for invitations
function formatInvitationTime(startTime, endTime) {
    if (!startTime && !endTime) return 'Time TBD'
    if (startTime && endTime) return `${startTime} - ${endTime}`
    if (startTime) return `From ${startTime}`
    if (endTime) return `Until ${endTime}`
    return 'Time TBD'
}

// Carousel navigation functions
const scrollCarousel = (direction) => {
  const newSlide = currentSlide.value + direction
  if (newSlide >= 0 && newSlide <= maxSlides.value) {
    currentSlide.value = newSlide
    updateCarouselPosition()
  }
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

// Navigation functions
const navigateToMatches = () => {
  router.push('/matches')
}

const navigateToCourts = () => {
  router.push('/court-finder')
}

const getStarted = () => {
  // Navigate to matches or show sign-up if not logged in
  router.push('/matches')
}

// Setup user authentication watcher
onMounted(() => {
    onUserStateChanged((user) => {
        currentUser.value = user
        if (user) {
            loadInvitations()
            subscribeInvitationsRealtime(user.uid)
        } else {
            invitations.value = []
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
})
</script>

<style scoped>
.homepage {
  min-height: 100vh;
  background: linear-gradient(rgba(26, 31, 46, 0.7), rgba(44, 50, 58, 0.7)), url('../assets/basketball-court-with-flooring.avif');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #dde3ea;
}

/* Hero Section */
.hero-section {
  padding: 20px 20px;
  min-height: 80vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
}

.hero-content {
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
}

.hero-title {
  font-size: 5rem;
  font-weight: bold;
  margin-bottom: 20px;
  line-height: 1.2;
  text-align: center;
  width: 100%;
  color: #dde3ea;
}

.hero-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  width: 100%;
}

.hero-text {
  text-align: center;
  padding-left: 180px;
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
  font-size: 1.25rem;
  color: #a2aec3;
  margin-bottom: 40px;
  line-height: 1.6;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 1s ease-out 0.5s both;
}

.hero-actions {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
  animation: fadeInUp 1s ease-out 0.8s both;
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
}

.basketball-icon {
  font-size: 12rem;
  animation: bounce 1.5s infinite ease-in-out;
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
  padding: 60px 20px;
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
    grid-template-columns: repeat(3, 1fr); /* Fixed 3 columns */
    gap: 20px;
    width: 100%;
    align-items: start;
    justify-items: center; /* Center cards in grid cells */
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
    justify-content: center;
    width: 100%;
    min-height: 380px; /* Consistent wrapper height */
}

.invitation-card {
    background: linear-gradient(135deg, #FF9A3C 0%, #FF8C1A 100%);
    border-radius: 16px;
    overflow: hidden;
    width: 320px; /* Fixed width for consistency */
    height: 380px; /* Fixed height for consistency */
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
}

.invitation-date {
    color: #fff;
    font-size: 1rem;
    font-weight: 700;
    margin-top: 4px;
}

.invitation-time {
    color: #fff;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 8px;
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
}

.invitation-inviter i {
    font-size: 1.2rem;
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
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 15px rgba(255, 149, 0, 0.3);
}

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
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 60px;
  color: #ff9500;
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
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    justify-content: center;
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
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .cta-button {
    padding: 12px 24px;
    font-size: 0.9rem;
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
    grid-template-columns: repeat(2, 1fr); /* 2 columns on small screens */
    gap: 15px;
  }
  
  .invitation-card {
    width: 280px; /* Fixed width for mobile */
    height: 350px; /* Fixed height for mobile */
  }
  
  .invitation-card-wrapper {
    min-height: 350px; /* Match card height */
  }
  
  .carousel-slide {
    min-height: 350px; /* Match card height */
    flex: 0 0 100%; /* Show 1 card per view on mobile */
  }
  
  .carousel-btn.prev {
    left: -15px;
  }
  
  .carousel-btn.next {
    right: -15px;
  }
}

/* Tablet responsive styles */
@media (max-width: 768px) {
  .invitations-grid {
    grid-template-columns: repeat(2, 1fr); /* Two columns on tablet */
    gap: 16px;
  }
  
  .invitation-card {
    width: 300px; /* Fixed width for tablet */
    height: 365px; /* Fixed height for tablet */
  }
  
  .invitation-card-wrapper {
    min-height: 365px; /* Match card height */
  }
  
  .carousel-slide {
    min-height: 365px; /* Match card height */
    flex: 0 0 calc(50% - 10px); /* Show 2 cards per view on tablet */
  }
}
</style>