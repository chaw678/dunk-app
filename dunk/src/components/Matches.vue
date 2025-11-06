<template>
    <div class="page-bg">
        <!-- Sign in popup -->
        <div v-if="showPopup" class="success-overlay" @click.self="handlePopupClose">
            <div class="success-popup">
                <div class="success-icon" style="background:#e04747">✕</div>
                <h3>Sign-in Required</h3>
                <p>Please sign in to perform this action.</p>
                <div class="popup-buttons">
                    <button class="sign-in-btn" @click.stop="handleSignIn">Sign In with Google</button>
                    <button class="close-btn" @click.stop="handlePopupClose">Close</button>
                </div>
            </div>
        </div>
        <!-- Success popup shown after creating a match -->
        <div v-if="showCreatedPopup" class="success-overlay" @click.self="closeCreatedPopup">
            <div class="success-popup">
                <div class="success-icon" style="background:#16a34a">✓</div>
                <h3>Match created</h3>
                <p>Match has been created!</p>
                <div class="popup-buttons">
                    <button class="sign-in-btn" @click.stop="closeCreatedPopup">OK</button>
                </div>
            </div>
        </div>
        <!-- Confirm modal (themed) - rendered via Teleport at the end so it overlays page content -->
        
        <div class="card large-card">
            <div v-if="!embedded" class="page-header matches-header">
                <div>
                    <h1 class="matches-title">Match Organizer</h1>
                    <p class="matches-desc">Create and join public or private basketball games.</p>
                </div>
                <div>
                    <button class="btn-create-match" :title="currentUser ? 'Create a match' : 'Sign in to create matches'" @click="handleCreateMatch"><span class="icon-circle"><i class="bi bi-plus-lg"></i></span> Create Match</button>
                </div>
            </div>

            <!-- Embedded compact header when rendered inside CourtFinder -->
            <div v-if="embedded" class="embedded-header">
                <div class="embedded-title">Matches at {{ courtFilter || 'this court' }}</div>
                <div class="embedded-header-actions">
                    <button class="btn-create-match small" :title="currentUser ? 'Create a match' : 'Sign in to create matches'" @click="handleCreateMatch"><span class="icon-circle"><i class="bi bi-plus-lg"></i></span> Create Match</button>
                </div>
            </div>

            <div class="tabs mb-3">
                <div class="tabs-pill" role="tablist" aria-label="Match tabs">
                    <button :class="['tab-pill', selectedTab === 'all' ? 'active' : '']" @click="selectedTab = 'all'">All Matches</button>
                    <button :class="['tab-pill', selectedTab === 'recommended' ? 'active' : '']" @click="selectedTab = 'recommended'">Recommended</button>
                    <button :class="['tab-pill', selectedTab === 'hosts' ? 'active' : '']" @click="selectedTab = 'hosts'">My Matches</button>
                    <button :class="['tab-pill', selectedTab === 'joined' ? 'active' : '']" @click="selectedTab = 'joined'">
                        Joined Matches
                    </button>
                    <button :class="['tab-pill', selectedTab === 'invites' ? 'active' : '']" @click="selectedTab = 'invites'">
                        Pending Invites
                        <span v-if="invitationsCount > 0" class="notification-badge">{{ invitationsCount }}</span>
                    </button>
                    <button :class="['tab-pill', selectedTab === 'past' ? 'active' : '']" @click="selectedTab = 'past'">Past Matches</button>
                </div>
            </div>
  <!-- Invitations Section - Show when user has pending invitations -->
            <div v-if="activeInvitations.length > 0 && selectedTab === 'invites'" class="invitations-wrapper mb-4">
                <div class="invitations-section">
                    <h3 class="section-heading">
                        <i class="bi bi-bell-fill me-2"></i>Match Invitations
                    </h3>
                    <div class="invitations-grid">
                        <div class="invitation-card-wrapper" v-for="inv in activeInvitations" :key="inv.id">
                            <div class="card invitation-card">
                                <div class="card-body">
                                    <h5 class="invitation-title">{{ inv.title }}</h5>
                                    <div class="invitation-details">
                                        <div class="invitation-detail-item">
                                            <i class="bi bi-geo-alt-fill"></i>
                                            <span>{{ inv.court || 'Unknown court' }}</span>
                                        </div>
                                        <div class="invitation-detail-item">
                                            <i class="bi bi-calendar-fill"></i>
                                            <span>{{ formatInvitationDate(inv.date) }}</span>
                                        </div>
                                        <div class="invitation-detail-item" v-if="inv.startTime || inv.endTime">
                                            <i class="bi bi-clock-fill"></i>
                                            <span>{{ formatInvitationTime(inv.startTime, inv.endTime) }}</span>
                                        </div>
                                        <div class="invitation-detail-item inviter-info" v-if="inv.inviterUid" @click="openProfileModal(inv.inviterUid)" style="cursor: pointer;">
                                            <img :src="inv.inviterAvatar" :alt="inv.inviterName" class="inviter-avatar" />
                                            <span>Invited by <strong>{{ inv.inviterName }}</strong></span>
                                        </div>
                                    </div>
                                    <div class="invitation-actions">
                                        <button class="btn btn-success btn-sm" @click="acceptInvite(inv)">
                                            <i class="bi bi-check-lg me-1"></i>Accept
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm" @click="declineInvite(inv)">
                                            <i class="bi bi-x-lg me-1"></i>Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Grouped sections: Ongoing / Scheduled / Past -->
            <!-- Empty state when the selected tab has no matches -->
            <div v-if="isTabEmpty" class="embedded-empty-state" v-cloak>
                <div class="empty-card card">
                    <div class="card-body">
                                                <DunkLogo />
                        <p class="lead mb-2">{{ emptyMessage }}</p>
                        <p class="empty-subtitle">Try switching tabs or create a match for this court.</p>
                    </div>
                </div>
            </div>
            <div v-if="selectedTab !== 'past' && groupedMatches && groupedMatches.ongoing && groupedMatches.ongoing.length">
                <h3 class="section-heading">Ongoing</h3>
                <div class="row g-3 matches-grid">
                    <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in (groupedMatches && groupedMatches.ongoing ? groupedMatches.ongoing : [])" :key="match?.id || idx">
    <div
        :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : (isPlaying(match) ? 'playing-match' : '')]"
        role="button"
        tabindex="0"
        @click="openMatch(match, $event)"
        @keydown.enter="openMatch(match, $event)"
    >
    <div class="card-header match-card-header">
      <h3 class="match-title mb-1">{{ match.title }}</h3>
                                <div class="match-header-right">
                                    <span v-if="(match.started || match._started) && !isPast(match)" class="match-started-badge">LIVE</span>
          <div class="match-people text-warning fw-bold small"><i class="bi bi-people-fill me-1"></i> {{ (displayedPlayers(match).length) }}/{{ match.maxPlayers || 10 }}</div>
                                </div>
    </div>
    <div class="card-body d-flex flex-column h-100 p-4">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div>
          <div class="match-sub small">{{ match.location }}</div>
          <div class="match-date">{{ formatDate(match) }}</div>
        </div>
        <div></div>
      </div>

      <div class="match-meta-row mb-3">
        <div class="time-range">{{ formatTimeRange(match) }}</div>
        <div class="meta-pill">{{ match.gender || 'All' }}</div>
        <div class="meta-pill">{{ match.court || match.location || 'Unknown court' }}</div>
    <div class="meta-pill badge-type">{{ normalizeMatchType(match && (match.type || match.level || match.skill)) }}</div>
      </div>

      <div class="avatars mb-3">
                        <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                    <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                        <img v-if="p && (p.profilepicture || p.avatar)" :src="p.profilepicture || p.avatar" class="avatar-img" />
                        <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                    </template>
          <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
        </div>
      </div>

      <div class="mt-auto">
        <!-- Action buttons row -->
        <div class="d-flex justify-content-between align-items-center">
          <div class="btn-group">
            <template v-if="isHost(match)">
              <template v-if="match.started || match._started">
                <!-- Host can still invite even after the match has started -->
                <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-invite btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" @click.prevent.stop="endMatch(match)"><i class="bi bi-stop-fill me-2"></i>End Match</button>
              </template>
              <template v-else>
                <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-invite btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                <button type="button" class="btn btn-success btn-sm ms-2 d-flex align-items-center" @click.prevent.stop="startMatch(match)"><i class="bi bi-play-fill me-2"></i>Start Match</button>
              </template>
            </template>
            <template v-else-if="isJoined(match)">
                          <template v-if="match.started || match._started">
                              <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-invite btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                            </template>
                          <template v-else>
                              <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                              <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : 'Leave match'" @click.prevent.stop="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                          </template>
            </template>
                      <template v-else>
                          <span class="join-wrapper" :title="joinDisabledReason(match) || 'Join match'" @click.stop>
                              <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" @click.prevent.stop="joinMatch(match)">Join</button>
                          </span>
                      </template>
          </div>
          <div></div>
        </div>
        <!-- Match Summary button row - only shown if match has started -->
        <div v-if="match.started || match._started" class="mt-2">
          <button type="button" class="btn summary-btn btn-sm d-flex align-items-center" @click.prevent.stop="openMatchSummary(match)"><i class="bi bi-list-check me-2"></i>Match Summary</button>
        </div>
      </div>
    </div>
  </div>
</div>
                    </div>
                </div>


            <div v-if="groupedMatches && groupedMatches.scheduled && groupedMatches.scheduled.length">
                <h3 class="section-heading">Scheduled</h3>
                <div class="row g-3 matches-grid">
                        <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in (groupedMatches && groupedMatches.scheduled ? groupedMatches.scheduled : [])" :key="match?.id || idx">
                        <!-- reuse same card markup -->
                        <div :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : (isPlaying(match) ? 'playing-match' : '')]">
                            <div class="card-header match-card-header">
                                <h3 class="match-title mb-1">{{ match.title }}</h3>
                                <div class="match-header-right">
                                    <span v-if="(match.started || match._started) && !isPast(match)" class="match-started-badge">STARTED</span>
                                    <div class="match-people text-warning fw-bold small"><i class="bi bi-people-fill me-1"></i> {{ (displayedPlayers(match).length) }}/{{ match.maxPlayers || 10 }}</div>
                                </div>
                            </div>
                            <div class="card-body d-flex flex-column h-100 p-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div class="match-sub small">{{ match.location }}</div>
                                        <div class="match-date">{{ formatDate(match) }}</div>
                                    </div>
                                    <div></div>
                                </div>

                                <div class="match-meta-row mb-3">
                                    <div class="time-range">{{ formatTimeRange(match) }}</div>
                                    <div class="meta-pill">{{ match.gender || 'All' }}</div>
                                    <div class="meta-pill">{{ match.court || match.location || 'Unknown court' }}</div>
                                    <div class="meta-pill badge-type">{{ normalizeMatchType(match && (match.type || match.level || match.skill)) }}</div>
                                </div>

                                <div class="avatars mb-3">
                                    <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                                        <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                                            <img v-if="p && (p.profilepicture || p.avatar)" :src="p.profilepicture || p.avatar" class="avatar-img" />
                                            <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                                        </template>
                                        <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
                                    </div>
                                </div>

                                <div class="mt-auto d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        <template v-if="isHost(match)">
                                            <!-- For scheduled matches, hosts can invite and start; keep delete as a secondary action -->
                                            <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-invite btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                            <button type="button" class="btn btn-success btn-sm ms-2 d-flex align-items-center" @click.prevent.stop="startMatch(match)"><i class="bi bi-play-fill me-2"></i>Start Match</button>
                                            <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" @click.prevent="deleteMatch(match)"><i class="bi bi-trash me-2"></i>Delete</button>
                                        </template>
                                        <template v-else-if="isJoined(match)">
                                            <!-- Joined players can invite others before the match starts and can leave -->
                                            <button :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : ''" type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent.stop="!isPast(match) && openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                            <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : 'Leave match'" @click.prevent="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                                        </template>
                                        <template v-else>
                                            <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" :title="joinDisabledReason(match) || 'Join match'" @click.prevent.stop="joinMatch(match)">Join</button>
                                        </template>
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="groupedMatches && groupedMatches.past && groupedMatches.past.length">
                <h3 class="section-heading">Past</h3>
                <div class="row g-3 matches-grid">
                        <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in (groupedMatches && groupedMatches.past ? groupedMatches.past : [])" :key="match?.id || idx">
                        <!-- reuse same card markup -->
                        <div 
                            :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : (isPlaying(match) ? 'playing-match' : '')]"
                            role="button"
                            tabindex="0"
                            @click="openMatch(match, $event)"
                            @keydown.enter="openMatch(match, $event)"
                        >
                            <div class="card-header match-card-header">
                                <h3 class="match-title mb-1">{{ match.title }}</h3>
                                <div class="match-header-right">
                                    <span v-if="(match.started || match._started) && !isPast(match)" class="match-started-badge">STARTED</span>
                                    <div class="match-people text-warning fw-bold small"><i class="bi bi-people-fill me-1"></i> {{ (displayedPlayers(match).length) }}/{{ match.maxPlayers || 10 }}</div>
                                </div>
                            </div>
                            <div class="card-body d-flex flex-column h-100 p-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div class="match-sub small">{{ match.location }}</div>
                                        <div class="match-date">{{ formatDate(match) }}</div>
                                    </div>
                                    <div></div>
                                </div>

                                <div class="match-meta-row mb-3">
                                    <div class="time-range">{{ formatTimeRange(match) }}</div>
                                    <div class="meta-pill">{{ match.gender || 'All' }}</div>
                                    <div class="meta-pill">{{ match.court || match.location || 'Unknown court' }}</div>
                                    <div class="meta-pill badge-type">{{ normalizeMatchType(match && (match.type || match.level || match.skill)) }}</div>
                                </div>

                                <div class="avatars mb-3">
                                    <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                                        <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                                            <img v-if="p && (p.profilepicture || p.avatar)" :src="p.profilepicture || p.avatar" class="avatar-img" />
                                            <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                                        </template>
                                        <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
                                    </div>
                                </div>

                                <div class="mt-auto">
                                    <!-- Action buttons row -->
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="d-flex flex-column align-items-start">
                                            <template v-if="isHost(match)">
                                                <button type="button" class="btn btn-danger btn-sm d-flex align-items-center" @click.prevent="deleteMatch(match)"><i class="bi bi-trash me-2"></i>Delete</button>
                                            </template>
                                            <template v-else-if="isJoined(match)">
                                                <!-- No actions for joined past matches -->
                                            </template>
                                            <template v-else>
                                                <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" :title="joinDisabledReason(match) || 'Join match'" @click.prevent.stop="joinMatch(match)">Join</button>
                                            </template>
                                        </div>
                                        <div class="d-flex flex-column align-items-end">
                                            <button type="button" class="btn btn-primary btn-sm d-flex align-items-center" @click.prevent.stop="openMatchSummary(match)"><i class="bi bi-clipboard-data me-2"></i>Match Summary</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Empty state for Past Matches when user has none -->
            <div v-if="selectedTab === 'past' && groupedMatches && (!groupedMatches.past || groupedMatches.past.length === 0)" class="past-empty-state">
            </div> 
        </div>

    <!-- render modals outside the main container using Teleport -->
    <Teleport to="body">
        <AddMatchModal v-if="showAddMatchModal" :courtList="courts" :courtName="courtFilter || ''" @close="showAddMatchModal = false" @created="onMatchCreated" />
        <InviteModal v-if="showInviteModal" :match="inviteMatch" :users="usersCache.value" :me="currentUser" @close="showInviteModal = false" @sent="onInvitesSent" />
        <JoinedPlayersModal v-if="showPlayersModal" :players="activePlayers" :title="activeTitle" @close="closePlayersModal" />
        <EndMatchSummary 
          v-if="showMatchSummary" 
          :dbPath="(summaryMatch && summaryMatch.__dbPath) || (summaryMatch && summaryMatch.id ? `matches/${summaryMatch.id}` : null)" 
          :matchData="summaryMatch" 
          @close="onCloseSummary"
          @post-to-forum="onPostMatchToForum"
          @cancel-navigate="onCancelSummary"
        />
        <ConfirmModal
            v-if="showConfirm"
            v-model="showConfirm"
            :title="pendingConfirm ? pendingConfirm.title : ''"
            :message="pendingConfirm ? pendingConfirm.message : ''"
            :confirmLabel="pendingConfirm && pendingConfirm.destructive ? 'Delete' : 'OK'"
            cancelLabel="Cancel"
            :destructive="pendingConfirm && pendingConfirm.destructive"
            @confirm="onConfirmModal"
        />
        <ProfileModal 
            v-if="showProfileModal" 
            :uid="profileModalUid" 
            :initialProfile="profileModalInitial" 
            @close="closeProfileModal" 
        />
        <PopupMessage 
            v-model="showAlertPopup"
            :message="alertMessage"
            :type="alertType"
        />
    </Teleport>
    </div>
</template>

<script setup>

import { ref, computed, onMounted, onUnmounted, watch, Teleport } from 'vue'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useRouter, useRoute } from 'vue-router'
const props = defineProps({
    courtFilter: { type: String, default: '' },
    embedded: { type: Boolean, default: false }
})
// expose convenient local bindings for template/script
const { courtFilter, embedded } = props
import { getDataFromFirebase, pushDataToFirebase, overwriteDataToFirebase, setChildData, deleteChildData, onDataChange } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import AddMatchModal from './AddMatchModal.vue'
import JoinedPlayersModal from './JoinedPlayersModal.vue'
import InviteModal from './InviteModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import DunkLogo from './DunkLogo.vue'
import EndMatchSummary from './EndMatchSummary.vue'
import { seededAvatar, avatarForUser } from '../utils/avatar.js'
import ProfileModal from './ProfileModal.vue'
import PopupMessage from './PopupMessage.vue'

const showPopup = ref(false)
const isSigningIn = ref(false)
const auth = getAuth()

// Alert popup state
const showAlertPopup = ref(false)
const alertMessage = ref('')
const alertType = ref('error')

function showAlert(message, type = 'error') {
    alertMessage.value = message
    alertType.value = type
    showAlertPopup.value = true
}

const maxAvatars = 6
const usersCache = ref({})
let usersUnsub = null

function subscribeUsersRealtime() {
    // cleanup previous
    if (usersUnsub) {
        try { usersUnsub() } catch (e) {}
        usersUnsub = null
    }
    try {
        usersUnsub = onDataChange('users', (udata) => {
            usersCache.value = udata || {}
        })
    } catch (e) {
        // fallback to one-time load
        console.warn('subscribeUsersRealtime failed, falling back to one-time load', e)
        loadUsers()
    }
}

// Use centralized avatar helper from ../utils/avatar.js

async function loadUsers() {
    try {
        const udata = await getDataFromFirebase('users')
        usersCache.value = udata || {}
    } catch (e) {
        usersCache.value = {}
    }
}
const showPlayersModal = ref(false)
const activePlayers = ref([])
const activeTitle = ref('')
const showCreatedPopup = ref(false)
// global confirm modal state for this component
const showConfirm = ref(false)
const pendingConfirm = ref(null) // { action: 'delete'|'start'|'end', match, title, message, destructive }

// ProfileModal state
const showProfileModal = ref(false)
const profileModalUid = ref(null)
const profileModalInitial = ref(null)

function openConfirm(action, match) {
    const titleMap = { delete: 'Delete match', start: 'Start match', end: 'End match' }
    const messageMap = {
        delete: 'Delete this match? This action cannot be undone.',
        start: 'Start this match now?',
        end: 'End this match now?'
    }
    pendingConfirm.value = { action, match, title: titleMap[action] || 'Confirm', message: messageMap[action] || '' , destructive: action === 'delete' }
    showConfirm.value = true
}

async function onConfirmModal() {
    if (!pendingConfirm.value) return
    const { action, match } = pendingConfirm.value
    showConfirm.value = false
    const a = action
    pendingConfirm.value = null
    if (a === 'delete') await deleteMatchConfirmed(match)
    if (a === 'start') await startMatchConfirmed(match)
    if (a === 'end') await endMatchConfirmed(match)
}

function closeCreatedPopup() {
    showCreatedPopup.value = false
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

const router = useRouter()
const route = useRoute()

// Check for tab query parameter on mount
const selectedTab = ref(route.query.tab || 'all')

// function openMatch(match, event) {
//     if (!match) return
//     // prefer named route, fallback to path
//     try {
//         router.push({ name: 'MatchRoom', params: { id: match.id } })
//     } catch (e) {
//         router.push(`/match/${match.id}`)
//     }
// }

// function openMatch(match) {
//   if (!match) return
//   // prefer common id names, fallback to __dbPath last segment or .key
//   const id = match.id || match.key || match._id || match['.key'] || (match.__dbPath ? match.__dbPath.split('/').pop() : null)
//   if (!id) {
//     console.warn('openMatch: no id found on match object', match)
//     return
//   }
//   try {
//     router.push({ name: 'MatchRoom', params: { id: String(id) } })
//   } catch (e) {
//     router.push(`/match/${encodeURIComponent(String(id))}`)
//   }
// }

async function openMatch(match, event) {
    console.log('openMatch called with match:', match)
    if (!match) return
        // If the click originated from an interactive child (button, link, avatar, tooltip wrapper,
        // or other control), do not navigate — the child should handle the action.
        try {
                if (event && event.target && event.target.closest) {
                        const blocked = event.target.closest('button, a, .join-wrapper, .avatar-stack, .popup-buttons, .invitation-actions, .sign-in-btn, .close-btn')
                        if (blocked) return
                }
        } catch (e) {
                // ignore and continue
        }
        
        // If match is ended, show the end match summary modal instead of navigating
        if (isPast(match)) {
            summaryMatch.value = match
            showMatchSummary.value = true
            return
        }
        
        // NEW: Prevent opening match if it hasn't been started yet
        // EVERYONE (including host) must wait until "Start Match" is clicked
        if (!match.started && !match._started) {
            if (isHost(match)) {
                showAlert('Please click "Start Match" to begin the match.')
            } else {
                showAlert('Match has not started yet. Wait for the host to start the match.')
            }
            return
        }
        
        // NEW: Prevent opening match if user hasn't joined (unless they're the host)
        if (!isJoined(match) && !isHost(match)) {
            showAlert('You must join this match to view it.')
            return
        }
        
        // If joining is disabled for this match (e.g., wrong gender, full, or not signed in),
        // prevent card-level navigation so users don't get taken to the MatchRoom unintentionally.
        try {
                const disabledReason = joinDisabledReason(match)
                // allow hosts and already-joined users to still open the room
                if (disabledReason && !isHost(match) && !isJoined(match)) return
        } catch (e) {
                // conservative default: do not block navigation on error
        }

    // common id locations on match objects
    let id = match.id || match.key || match['.key'] || match._id || (match.__dbPath ? String(match.__dbPath).split('/').pop() : null)

    // If we still don't have an id, try to infer it from the matches collection using title/id fields
    if (!id) {
        try {
            const all = await getDataFromFirebase('matches')
            if (all && typeof all === 'object') {
                // try direct key lookup (unlikely since id was falsy) then search values
                const byKey = all[match] || all[match?.title]
                if (byKey) id = match?.title || match
                if (!id) {
                    const foundEntry = Object.entries(all).find(([k, v]) => {
                        if (!v || typeof v !== 'object') return false
                        // match by known fields: id, key, title, name
                        return String(v.id) === String(match.id)
                            || String(v.key) === String(match.key)
                            || String(v.title) === String(match.title)
                            || String(v.name) === String(match.title)
                            || String(k) === String(match.title)
                    })
                    if (foundEntry) id = foundEntry[0]
                }
            }
        } catch (e) {
            console.warn('openMatch: failed to fetch matches to infer id', e)
        }
    }

    if (!id) {
        console.warn('openMatch: could not find a DB id for match object', match)
        return
    }

    const strId = String(id)
    // If this match is live and the current user has joined but is not the host,
    // route to the nested player view so host-only controls are hidden.
    try {
        // Use the router instance available in this component
        if ((match.started || match._started) && isJoined(match) && !isHost(match)) {
            router.push({ name: 'PlayerRoom', params: { id: strId }, query: { path: match.__dbPath || '' } })
        } else {
            router.push({ name: 'MatchRoom', params: { id: strId }, query: { path: match.__dbPath || '' } })
        }
    } catch (e) {
        // Fallback to path-based navigation; include /player suffix for player view
        const playerPath = (match.started || match._started) && isJoined(match) && !isHost(match)
            ? `/match/${encodeURIComponent(strId)}/player`
            : `/match/${encodeURIComponent(strId)}`
        router.push({ path: playerPath, query: { path: match.__dbPath || '' } })
    }
}

// Google sign-in handler
async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    try {
        const result = await signInWithPopup(auth, provider)
        showPopup.value = false
        return result.user
    } catch (error) {
        console.error('Google sign-in error:', error)
        showPopup.value = true
        throw error
    }
}

// Handle sign-in
async function handleSignIn() {
    if (isSigningIn.value) return
    isSigningIn.value = true
    try {
        await loginWithGoogle()
    } catch (err) {
        console.error('Google sign-in failed', err)
        showPopup.value = true
    } finally {
        isSigningIn.value = false
    }
}

// Handle popup close
const handlePopupClose = (event) => {
    if (!event) {
        showPopup.value = false
        return
    }

    const el = event.target || event.currentTarget

    if (el.classList && el.classList.contains('success-overlay')) {
        showPopup.value = false
        return
    }

    if (el.classList && el.classList.contains('sign-in-btn')) {
        handleSignIn()
        return
    }

    if (el.classList && (el.classList.contains('close-btn'))) {
        showPopup.value = false
        return
    }

    if (el.closest) {
        if (el.closest('.close-btn') || el.closest('.sign-in-btn')) {
            showPopup.value = false
            return
        }
    }
}

// Auth state integration: popup auto-closes after sign-in handled below

// Handle create match button (show popup if not signed in)
function handleCreateMatch() {
    if (!currentUser.value) {
        showPopup.value = true
        return
    }
    showAddMatchModal.value = true
}

// (Join button is disabled when restricted; no popup on join)

function openPlayersModal(match) {
    const out = []
    // If match.joinedBy is a map of uid:true, prefer listing by uid
    if (match && match.joinedBy && typeof match.joinedBy === 'object') {
        for (const uid of Object.keys(match.joinedBy)) {
            // prefer playersMap which may store either a plain name or a player object by uid
            let raw = (match.playersMap && match.playersMap[uid])
            let name = ''
            if (raw) {
                // if entry is a string, use it; if it's an object, extract known name fields
                if (typeof raw === 'string') name = raw
                else if (typeof raw === 'object') name = raw.username || raw.name || raw.displayName || raw.uid || ''
            }
            // fallback to user record in users cache (if available)
            if (!name && usersCache.value && usersCache.value[uid]) {
                const u = usersCache.value[uid]
                name = u.username || u.name || u.displayName || (u.email && u.email.split('@')[0]) || ''
            }
            // final fallback to uid
            if (!name) name = uid
            const avatar = (usersCache.value && usersCache.value[uid] && (
                usersCache.value[uid].profilepicture || usersCache.value[uid].avatar || usersCache.value[uid].photoURL || usersCache.value[uid].picture || usersCache.value[uid].photo || usersCache.value[uid].imageURL || usersCache.value[uid].thumbnail
            )) || seededAvatar(name)
            out.push({ uid, name, avatar })
        }
    } else if (Array.isArray(match.players)) {
        for (const name of match.players) out.push({ name, uid: undefined, avatar: seededAvatar(name) })
    }
    activePlayers.value = out
    activeTitle.value = match.title || 'Players'
    showPlayersModal.value = true
}

function closePlayersModal() {
    showPlayersModal.value = false
    activePlayers.value = []
    activeTitle.value = ''
}

// demo data: players is an array of player names (you'll replace this with Firebase data)
// const matches = ref([
//   {
//     id: 1,
//     title: 'Casual 5v5',
//     location: 'Bishan ActiveSG Court',
//     time: 'Sat, 4:00 PM',
//     level: 'Intermediate',
//     visibility: 'Public',
//     players: ['Alice Brown','Ben Carter','Cindy Diaz','Dan Evans','Eve Ford','Frank Green','George Hill'],
//     maxPlayers: 10,
//     owner: 'alice'
//   },
//   {
//     id: 2,
//     title: 'Morning Hoops',
//     location: 'Kallang Outdoor Court',
//     time: 'Sun, 8:00 AM',
//     level: 'All Levels',
//     visibility: 'Public',
//     players: ['Henry Ivy','Ivy Jones','Jack King'],
//     maxPlayers: 10,
//     owner: 'bob'
//   },
//   {
//     id: 3,
//     title: '3v3 King of the Court',
//     location: 'Jurong West Rooftop Court',
//     time: 'Sat, 2:00 PM',
//     level: 'Intermediate',
//     visibility: 'Public',
//     players: ['Liam Moon','Maya Noor','Nate Owen','Omar Park','Pia Quinn'],
//     maxPlayers: 6,
//     owner: 'alice'
//   }
// ])
const matches = ref([])
const courts = ref([])
const showAddMatchModal = ref(false)
const currentUser = ref(null)
// prefer `ranking` field where available; keep `skill` for backward compatibility
const currentUserProfile = ref({ ranking: 'Open', skill: 'Open', gender: 'All' })
const showInviteModal = ref(false)
const inviteMatch = ref(null)
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

// Track who the current user has invited for each match
// Structure: { matchId: Set(['uid1', 'uid2', ...]) }
const invitedUsersPerMatch = ref({})

// Match Summary modal state
const showMatchSummary = ref(false)
const summaryMatch = ref(null)
// local map of matches the user has marked as "playing" (transient UI state)
const playingMatches = ref({})

function isPlaying(match) {
    if (!match) return false
    // Don't show blue playing style for ended matches
    if (match.matchEnded || match.endedAt || match.endedAtISO) return false
    const id = String(match.id || match.key || match._id || (match.__dbPath ? String(match.__dbPath).split('/').pop() : ''))
    return Boolean(playingMatches.value && playingMatches.value[id])
}

// Persistence helpers: store playing match ids in localStorage so state survives reloads
const PLAYING_STORAGE_KEY = 'dunk_playingMatches_v1'
function loadPlayingMatchesFromStorage() {
    try {
        const raw = localStorage.getItem(PLAYING_STORAGE_KEY)
        if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed && typeof parsed === 'object') playingMatches.value = parsed
        }
    } catch (e) {
        console.warn('Failed to load playingMatches from storage', e)
    }
}
function savePlayingMatchesToStorage() {
    try {
        localStorage.setItem(PLAYING_STORAGE_KEY, JSON.stringify(playingMatches.value || {}))
    } catch (e) {
        console.warn('Failed to save playingMatches to storage', e)
    }
}
function clearPlayingForId(id) {
    if (!id) return
    try {
        const copy = { ...(playingMatches.value || {}) }
        if (copy[id]) {
            delete copy[id]
            playingMatches.value = copy
            savePlayingMatchesToStorage()
        }
    } catch (e) { /* ignore */ }
}

// Location and recommendation data
const userLocation = ref(null)
const locationPermissionGranted = ref(false)
const courtsData = ref([]) // Cache courts data for distance calculations

// Realtime subscription for invitations
let invitesUnsub = null
// Realtime subscription for matches list
let matchesUnsub = null
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

function openInvite(match) {
    if (!currentUser.value) {
        showPopup.value = true
        return
    }
    inviteMatch.value = match
    showInviteModal.value = true
}

function openMatchSummary(match) {
    summaryMatch.value = match
    showMatchSummary.value = true
}

function onCloseSummary() {
    showMatchSummary.value = false
}

function onPostMatchToForum() {
    // Navigate to forum with prefilled data
    const courtName = summaryMatch.value?.court || summaryMatch.value?.venue || summaryMatch.value?.location || 'Unknown Court'
    const matchTitle = summaryMatch.value?.title || summaryMatch.value?.name || 'Match'
    const matchPath = summaryMatch.value?.__dbPath || (summaryMatch.value?.id ? `matches/${summaryMatch.value.id}` : '')
    
    try {
        router.push({
            path: '/forum',
            query: {
                openCreate: '1',
                court: encodeURIComponent(courtName),
                tag: 'Matches',
                matchId: matchPath,
                matchTitle: encodeURIComponent(matchTitle)
            }
        })
    } catch (e) {
        console.error('Failed to navigate to forum:', e)
    }
}

function onCancelSummary() {
    showMatchSummary.value = false
    // No need to navigate since we're already on the Matches page
    // Just close the modal
}

function onInvitesSent(uids) {
    console.log('Invites sent to', uids)
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
            showAlert('Cannot join this match - invitation data is incomplete')
            await declineInvite(invitation)
            return
        }
        
        // Get the match data
        const matchData = await getDataFromFirebase(matchPath)
        if (!matchData) {
            showAlert('Match no longer exists')
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
        
        // Reload invitations and matches
        await loadInvitations()
        await loadMatches()
        
        showAlert('You have joined the match!', 'success')
    } catch (err) {
        console.error('Failed to accept invitation', err)
        showAlert('Failed to join match')
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
    if (startTime) return to12Hour(startTime)
    return 'Time TBD'
}

// Location detection for recommendations
async function getUserLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported')
            locationPermissionGranted.value = false
            resolve(null)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                }
                userLocation.value = location
                locationPermissionGranted.value = true
                resolve(location)
            },
            (error) => {
                console.warn('Geolocation error:', error)
                locationPermissionGranted.value = false
                // Fallback to profile location if available
                if (currentUserProfile.value?.location) {
                    userLocation.value = currentUserProfile.value.location
                    resolve(currentUserProfile.value.location)
                } else {
                    resolve(null)
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        )
    })
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
}

// Calculate skill level compatibility score
function getSkillLevelScore(userSkill, matchRequiredSkill) {
    if (!userSkill || !matchRequiredSkill) return 0.5 // neutral if no data
    
    // Use the correct skill levels for our app
    const skillLevels = ['Open', 'Beginner', 'Intermediate', 'Professional']
    const userSkillNormalized = normalizeSkill(userSkill)
    const matchSkillNormalized = normalizeSkill(matchRequiredSkill)
    
    const userIndex = skillLevels.indexOf(userSkillNormalized)
    const requiredIndex = skillLevels.indexOf(matchSkillNormalized)
    
    if (userIndex === -1 || requiredIndex === -1) return 0.5
    
    // Perfect match gets highest score
    if (userIndex === requiredIndex) return 1.0
    
    // Open matches are accessible to everyone and get good scores
    if (matchSkillNormalized === 'Open') return 0.9
    
    // Calculate based on skill level difference
    const diff = Math.abs(userIndex - requiredIndex)
    if (diff === 1) return 0.6 // close match
    if (diff === 2) return 0.3 // moderate mismatch  
    return 0.1 // poor match
}

// Calculate game type preference score based on user's skill level
function getGameTypePreferenceScore(userSkillLevel, matchType) {
    if (!userSkillLevel || !matchType) return 0.7 // neutral if no data
    
    const userSkill = normalizeSkill(userSkillLevel)
    const matchSkill = normalizeSkill(matchType)
    
    // Perfect match: same skill level
    if (userSkill === matchSkill) return 1.0
    
    // Good matches based on skill progression
    if (userSkill === 'Open') {
        // Open players can join any game type
        if (matchSkill === 'Beginner') return 0.9
        if (matchSkill === 'Intermediate') return 0.7
        if (matchSkill === 'Professional') return 0.4
    }
    
    if (userSkill === 'Beginner') {
        // Beginners prefer beginner/open games, can try intermediate
        if (matchSkill === 'Open') return 0.9
        if (matchSkill === 'Intermediate') return 0.6
        if (matchSkill === 'Professional') return 0.2
    }
    
    if (userSkill === 'Intermediate') {
        // Intermediate players are flexible
        if (matchSkill === 'Open') return 0.8
        if (matchSkill === 'Beginner') return 0.7
        if (matchSkill === 'Professional') return 0.8
    }
    
    if (userSkill === 'Professional') {
        // Professionals prefer challenging games
        if (matchSkill === 'Open') return 0.6
        if (matchSkill === 'Beginner') return 0.3
        if (matchSkill === 'Intermediate') return 0.9
    }
    
    return 0.5 // default neutral score
}

// Calculate age compatibility based on existing players in the match
function getAgeCompatibilityWithPlayers(userAge, match, usersData) {
    if (!userAge || !match.joinedBy || !usersData) return 0.7 // neutral if no data
    
    const playerAges = []
    
    // Collect ages of current players
    for (const uid of Object.keys(match.joinedBy)) {
        if (usersData[uid] && usersData[uid].age) {
            playerAges.push(usersData[uid].age)
        }
    }
    
    // If no age data from existing players, return neutral
    if (playerAges.length === 0) return 0.7
    
    // Calculate age compatibility with existing players
    const avgAge = playerAges.reduce((sum, age) => sum + age, 0) / playerAges.length
    const ageDiff = Math.abs(userAge - avgAge)
    
    // Score based on age difference from group average
    if (ageDiff <= 3) return 1.0      // Very close age match
    if (ageDiff <= 5) return 0.9      // Close age match
    if (ageDiff <= 8) return 0.7      // Moderate age difference
    if (ageDiff <= 12) return 0.5     // Larger age gap but acceptable
    return 0.3                        // Significant age gap
}

// Extract region from court or user location
function getRegionFromLocation(location) {
    if (!location) return null
    
    // If location is a string (like user profile location), return it directly
    if (typeof location === 'string') {
        return location.trim()
    }
    
    // If location has lat/lng coordinates, determine region from coordinates
    if (location.lat && location.lng) {
        return getRegionFromCoordinates(location.lat, location.lng)
    }
    
    // If it's a court object, check for region field
    if (location.region) {
        return location.region.trim()
    }
    
    // If it's a court with address, try to extract region from address
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

// Determine Singapore region from GPS coordinates
function getRegionFromCoordinates(lat, lng) {
    // Singapore's approximate coordinate boundaries for each region
    // Central: Marina Bay, Orchard, City Center
    if (lat >= 1.26 && lat <= 1.32 && lng >= 103.82 && lng <= 103.87) {
        return 'Central'
    }
    
    // East: Bedok, Tampines, Pasir Ris, Changi
    if (lat >= 1.30 && lat <= 1.38 && lng >= 103.87 && lng <= 104.00) {
        return 'East'
    }
    
    // West: Jurong, Clementi, Bukit Batok, Choa Chu Kang
    if (lat >= 1.30 && lat <= 1.40 && lng >= 103.60 && lng <= 103.82) {
        return 'West'
    }
    
    // North: Woodlands, Yishun, Sembawang, Admiralty
    if (lat >= 1.40 && lat <= 1.47 && lng >= 103.75 && lng <= 103.85) {
        return 'North'
    }
    
    // South: Sentosa, HarbourFront, anything south of central
    if (lat >= 1.23 && lat <= 1.30 && lng >= 103.80 && lng <= 103.87) {
        return 'South'
    }
    
    // Default fallback based on general coordinates
    if (lng < 103.82) return 'West'
    if (lng > 103.87) return 'East'  
    if (lat > 1.38) return 'North'
    if (lat < 1.28) return 'South'
    
    return 'Central' // Default to Central if coordinates don't clearly fit other regions
}

// Calculate region compatibility score
function getRegionCompatibilityScore(userRegion, courtRegion) {
    if (!userRegion || !courtRegion) return 0.5 // neutral if no region data
    
    const userReg = userRegion.toLowerCase().trim()
    const courtReg = courtRegion.toLowerCase().trim()
    
    // Since incompatible regions are now pre-filtered, this should always be a match
    if (userReg === courtReg) return 1.0
    
    // Fallback (shouldn't reach here due to pre-filtering)
    return 0.5
}

// Calculate recommendation score for a match
function calculateRecommendationScore(match, userProfile, userLoc, usersData) {
    let score = 0
    let totalWeight = 0
    
    console.log('Calculating score for match:', match.title, {
        match: match,
        userProfile: userProfile,
        userLoc: userLoc,
        usersData: usersData
    })
    
    // Region-based location matching (weight: 0.3)
    // Prioritize GPS location over profile location
    if (userLoc || userProfile?.location) {
        const userRegion = getRegionFromLocation(userLoc) || getRegionFromLocation(userProfile?.location)
        const courtRegion = getRegionFromLocation(match.court)
        
        console.log('Region matching:', { userRegion, courtRegion, match: match.court })
        
        if (userRegion && courtRegion) {
            const regionScore = getRegionCompatibilityScore(userRegion, courtRegion)
            score += regionScore * 0.3
            totalWeight += 0.3
            console.log('Region score:', regionScore, 'Total so far:', score)
        }
    }
    
    // Skill level matching (weight: 0.25)
    if (userProfile?.skillLevel && match.type) {
        const skillScore = getSkillLevelScore(userProfile.skillLevel, match.type)
        score += skillScore * 0.25
        totalWeight += 0.25
        console.log('Skill score:', skillScore, 'Total so far:', score)
    }
    
    // Game type preference based on user's skill level (weight: 0.2)
    if (userProfile?.skillLevel && match.type) {
        const gameTypeScore = getGameTypePreferenceScore(userProfile.skillLevel, match.type)
        score += gameTypeScore * 0.2
        totalWeight += 0.2
        console.log('Game type preference score:', gameTypeScore, 'Total so far:', score)
    }
    
    // Gender preference (weight: 0.15)
    // Note: Incompatible gender matches are already filtered out, so this is just for scoring preference
    if (match.gender && userProfile?.gender) {
        let genderScore = 1.0 // Default to full score since incompatible matches are pre-filtered
        if (match.gender === 'All') {
            genderScore = 1.0 // Perfect match for mixed-gender preference
        }
        score += genderScore * 0.15
        totalWeight += 0.15
        console.log('Gender score:', genderScore, 'Total so far:', score)
    }
    
    // Age compatibility with existing players (weight: 0.1)
    if (userProfile?.age && match.joinedBy && usersData) {
        const ageScore = getAgeCompatibilityWithPlayers(userProfile.age, match, usersData)
        score += ageScore * 0.1
        totalWeight += 0.1
        console.log('Age compatibility score:', ageScore, 'Total so far:', score)
    }
    
    // Normalize score
    const finalScore = totalWeight > 0 ? score / totalWeight : 0
    console.log('Final recommendation score:', finalScore, 'Total weight:', totalWeight)
    return finalScore
}

// Load courts data for recommendation calculations
async function loadCourtsData() {
    try {
        const data = await getDataFromFirebase('courts')
        if (!data) {
            courtsData.value = {}
            return
        }
        
        if (Array.isArray(data)) {
            // Convert array to object with court IDs
            const courtsObj = {}
            data.forEach((court, index) => {
                courtsObj[court.id || index] = court
            })
            courtsData.value = courtsObj
        } else {
            courtsData.value = data
        }
    } catch (e) {
        console.warn('Failed to load courts data for recommendations:', e)
        courtsData.value = {}
    }
}

// Create a test match for recommendation debugging
async function createTestRecommendationMatch() {
    try {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const dateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
        
        const testMatch = {
            title: 'Test Recommendation Match',
            court: 'Marina Bay Court', // Central region
            date: dateStr,
            startTime: '14:00',
            endTime: '16:00',
            startAtISO: `${dateStr}T06:00:00.000Z`, // 2PM Singapore time in UTC
            endAtISO: `${dateStr}T08:00:00.000Z`,   // 4PM Singapore time in UTC
            type: 'Intermediate', // Intermediate skill level for testing
            gender: 'All', // All genders
            maxPlayers: 10,
            players: [],
            joinedBy: {
                'test-player-1': true,
                'test-player-2': true
            },
            playersMap: {
                'test-player-1': 'Alex Chen',
                'test-player-2': 'Maya Singh'
            },
            createdAt: new Date().toISOString(),
            createdby: 'test-user-id', // Different from current user
            ownerId: 'test-user-id'
        }
        
        // Also create some test user profiles for age compatibility testing
        const testUsers = {
            'test-player-1': {
                name: 'Alex Chen',
                age: 25,
                skillLevel: 'Intermediate',
                gender: 'Male'
            },
            'test-player-2': {
                name: 'Maya Singh', 
                age: 27,
                skillLevel: 'Intermediate',
                gender: 'Female'
            }
        }
        
        console.log('Creating test match with players:', testMatch)
        console.log('Creating test user profiles:', testUsers)
        
        // Save the match
        await pushDataToFirebase(`matches/Marina Bay Court/${dateStr}`, testMatch)
        
        // Save the test user profiles
        for (const [uid, profile] of Object.entries(testUsers)) {
            await pushDataToFirebase(`users/${uid}`, profile)
        }
        
        console.log('Test match and user profiles created successfully')
        
        // Reload data to see the new test match and users
        await loadMatches()
        await loadUsers()
        
        console.log('Data reloaded. The test match should now appear in recommendations with:')
        console.log('- Court in Central region (good location match if you\'re in Central)')
        console.log('- Intermediate skill level')
        console.log('- Players aged 25-27 (good age match if you\'re in this range)')
        console.log('- Gender: All (perfect gender match)')
        
    } catch (e) {
        console.error('Failed to create test match:', e)
    }
}

onMounted(async () => {
    // subscribe to users realtime so profile/name changes propagate immediately
    subscribeUsersRealtime()
    // load previously persisted playing state from localStorage
    try { loadPlayingMatchesFromStorage() } catch (e) { /* ignore */ }
    await loadMatches()
    // subscribe to realtime matches updates so lists update without navigation
    try { subscribeMatchesRealtime() } catch (e) { console.warn('subscribeMatchesRealtime failed', e) }
    await loadCourts()
    await loadCourtsData()
    
    // Try to get user location for recommendations
    if (navigator.geolocation) {
        getUserLocation()
    }
    
    // listen for auth state and load user profile
    onUserStateChanged(async (u) => {
        currentUser.value = u
        if (u) showPopup.value = false
        if (!u) {
            invitations.value = []
            subscribeInvitationsRealtime(null)
            return
        }
        // load profile from Realtime DB
        try {
            const users = await getDataFromFirebase('users')
            if (users && users[u.uid]) {
                currentUserProfile.value = users[u.uid]
            }
        } catch (e) {
            console.warn('Failed to load user profile', e)
        }
        // Load invitations for the signed-in user
        await loadInvitations()
        // Start realtime subscription so new invites appear without refresh
        subscribeInvitationsRealtime(u.uid)
    })
})

// also refresh matches when auth state changes (so hosts see updated joined lists)
onUserStateChanged(async (u) => {
    currentUser.value = u
    if (u) showPopup.value = false
    // reload users and matches to reflect any joinedBy changes made while signed out
    try {
        // ensure we have realtime users subscription active
        subscribeUsersRealtime()
        await loadMatches()
        if (u) {
            await loadInvitations()
            subscribeInvitationsRealtime(u.uid)
        } else {
            invitations.value = []
            subscribeInvitationsRealtime(null)
        }
    } catch (e) {
        console.warn('Failed to refresh matches on auth change', e)
    }
})

// Clean up realtime listeners when component unmounts
onUnmounted(() => {
    if (invitesUnsub) {
        try { invitesUnsub() } catch (e) {}
        invitesUnsub = null
    }
    if (matchesUnsub) {
        try { matchesUnsub() } catch (e) {}
        matchesUnsub = null
    }
    if (usersUnsub) {
        try { usersUnsub() } catch (e) {}
        usersUnsub = null
    }
})

// Handler called when AddMatchModal emits 'created'
async function onMatchCreated() {
    try {
        await loadMatches()
    } catch (e) {
        console.warn('onMatchCreated: failed to reload matches', e)
    } finally {
        showAddMatchModal.value = false
        // show success popup briefly
        showCreatedPopup.value = true
        setTimeout(() => { showCreatedPopup.value = false }, 2500)
    }
}

async function loadMatches() {
    try {
        const data = await getDataFromFirebase('matches')
        const out = []
        if (!data) {
            matches.value = []
            return
        }
        // detect nested structure matches/{court}/{date}/{id}
        if (typeof data === 'object') {
            for (const [k1, v1] of Object.entries(data)) {
                if (!v1) continue
                // v1 could be { '2025-10-19': { id1: {...}, id2: {...} }, ... }
                if (typeof v1 === 'object') {
                    for (const [k2, v2] of Object.entries(v1)) {
                        if (!v2) continue
                        // v2 may be an object of matches
                        if (typeof v2 === 'object') {
                            for (const [mid, mv] of Object.entries(v2)) {
                                // k1 is the court key as stored in the DB; do not re-encode here
                                const copy = { id: mid, __dbPath: `matches/${k1}/${k2}/${mid}`, ...mv }
                                out.push(copy)
                            }
                        }
                    }
                }
            }
        }
        matches.value = out
        // Sync persisted playing flags with loaded matches: prune past matches, set live-joined matches
        try {
            const copy = { ...(playingMatches.value || {}) }
            let changed = false
            const outById = new Map(out.map(m => [String(m.id), m]))
            // prune past matches
            for (const pk of Object.keys(copy)) {
                const m = outById.get(String(pk))
                if (m && isPast(m)) { delete copy[pk]; changed = true }
            }
            // auto-set playing for live matches the user has joined
            if (currentUser.value) {
                const uid = currentUser.value.uid
                for (const m of out) {
                    const mid = String(m.id)
                    if ((m.started || m._started) && m.joinedBy && m.joinedBy[uid]) {
                        if (!copy[mid]) { copy[mid] = true; changed = true }
                    }
                }
            }
            if (changed) { playingMatches.value = copy; savePlayingMatchesToStorage() }
        } catch (e) { console.warn('Failed to sync playingMatches after loadMatches', e) }
    } catch (err) {
        console.error('Failed to load matches', err)
        matches.value = []
    }
}

// Subscribe to matches node for realtime updates and keep matches.value in sync
function subscribeMatchesRealtime() {
    if (matchesUnsub) {
        try { matchesUnsub() } catch (e) {}
        matchesUnsub = null
    }
    matchesUnsub = onDataChange('matches', (data) => {
        try {
            const out = []
            if (!data) { matches.value = []; return }
            if (typeof data === 'object') {
                for (const [k1, v1] of Object.entries(data)) {
                    if (!v1 || typeof v1 !== 'object') continue
                    for (const [k2, v2] of Object.entries(v1)) {
                        if (!v2 || typeof v2 !== 'object') continue
                        for (const [mid, mv] of Object.entries(v2)) {
                            out.push({ id: mid, __dbPath: `matches/${k1}/${k2}/${mid}`, ...mv })
                        }
                    }
                }
            }
            matches.value = out
            // Update playing flags:
            //  - clear playing flags for matches that became past
            //  - set playing flags for matches that are live and the current user has joined
            try {
                const copy = { ...(playingMatches.value || {}) }
                let changed = false
                const outById = new Map(out.map(m => [String(m.id), m]))
                // prune past matches
                for (const pk of Object.keys(copy)) {
                    const m = outById.get(String(pk))
                    if (m && isPast(m)) {
                        delete copy[pk]
                        changed = true
                    }
                }
                // set playing for live matches the user has joined
                if (currentUser.value) {
                    const uid = currentUser.value.uid
                    for (const m of out) {
                        const mid = String(m.id)
                        if ((m.started || m._started) && m.joinedBy && m.joinedBy[uid]) {
                            if (!copy[mid]) { copy[mid] = true; changed = true }
                        }
                    }
                }
                if (changed) {
                    playingMatches.value = copy
                    savePlayingMatchesToStorage()
                }
            } catch (e) { console.warn('Failed to sync playingMatches after matches update', e) }
        } catch (err) {
            console.error('subscribeMatchesRealtime handler error', err)
        }
    })
}

async function loadCourts() {
    try {
        const cdata = await getDataFromFirebase('courts')
        if (!cdata) courts.value = []
        else if (Array.isArray(cdata)) courts.value = cdata
        else courts.value = Object.entries(cdata).map(([id, v]) => ({ id, ...v }))
    } catch (e) {
        courts.value = []
        console.warn('Failed to load courts', e)
    }
}


//use an input data field, add event listener to push to firebase
// pushDataToFirebase('matches', {
//     id: 3,
//     title: '3v3 King of the Court',
//     location: 'Jurong West Rooftop Court',
//     time: 'Sat, 2:00 PM',
//     level: 'Intermediate',
//     visibility: 'Public',
//     players: ['Liam Moon', 'Maya Noor', 'Nate Owen', 'Omar Park', 'Pia Quinn'],
//     maxPlayers: 6,
//     owner: 'alice'
// })

function isHost(match) {
    if (!currentUser.value || !match) return false
    const uid = currentUser.value.uid
    // owner may be stored as ownerId/owner/ownerUid/name
    const owner = match.ownerId || match.ownerUid || match.owner
    if (!owner) return false
    if (owner === uid) return true
    // sometimes owner stored as display name
    const name = (currentUserProfile.value && (currentUserProfile.value.name || currentUser.value.displayName)) || ''
    if (name && owner === name) return true
    return false
}

function getMatchStartEnd(match) {
    if (!match) return { start: null, end: null }
    // prefer ISO fields
    try {
        if (match.startAtISO) {
            const s = new Date(match.startAtISO)
            let e = match.endAtISO ? new Date(match.endAtISO) : null
            if (!e || isNaN(e.getTime())) e = new Date(s.getTime() + 90 * 60 * 1000) // default 90min
            return { start: s, end: e }
        }
        // fallback to startAt / endAt which may be stored as ISO-like
        if (match.startAt) {
            const s = new Date(match.startAt)
            let e = match.endAt ? new Date(match.endAt) : null
            if (!e || isNaN(e.getTime())) e = new Date(s.getTime() + 90 * 60 * 1000)
            return { start: s, end: e }
        }
        // try to combine date + startTime / endTime
        if (match.date && match.startTime) {
            // if date is ISO-like, use it
            let base = new Date(match.date)
            if (isNaN(base.getTime())) base = new Date()
            const t = ('' + match.startTime).trim()
            // parse hh:mm or hh:mm:ss
            const m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || []
            if (m.length) {
                base.setHours(Number(m[1]), Number(m[2]) || 0, Number(m[3]) || 0, 0)
                const s = base
                let e = null
                if (match.endTime) {
                    const mbe = ('' + match.endTime).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) || []
                    if (mbe.length) {
                        const be = new Date(base)
                        be.setHours(Number(mbe[1]), Number(mbe[2]) || 0, Number(mbe[3]) || 0, 0)
                        // If end time is earlier than start time, it crosses midnight - add 24 hours
                        if (be <= s) {
                            be.setDate(be.getDate() + 1)
                        }
                        e = be
                    }
                }
                if (!e) e = new Date(s.getTime() + 90 * 60 * 1000)
                return { start: s, end: e }
            }
        }
    } catch (err) {
        // parsing failed
    }
    return { start: null, end: null }
}

const matchesForTab = computed(() => {
    // filter by courtFilter first (if provided)
    const q = (courtFilter || '')
    const qlc = (q || '').toLowerCase()
    const base = matches.value.filter(m => {
        if (!qlc) return true
        const court = (m && (m.court || m.location || m.venue || '')).toString().toLowerCase()
        return court.indexOf(qlc) !== -1
    })

    // By default, non-past tabs should exclude past matches so Past Matches tab becomes the single source
    // of truth for historical games.
    if (selectedTab.value === 'all') return base.filter(m => !isPast(m))
    if (selectedTab.value === 'past') {
        // only show past matches that the current user hosted or joined and exclude soft-deleted records
        if (!currentUser.value) return []
        const uid = currentUser.value.uid
        return base.filter(m => {
            if (!isPast(m)) return false
            if (m.deleted || m.removed || m.deletedAt) return false
            const joined = Boolean(m.joinedBy && m.joinedBy[uid])
            return isHost(m) || joined
        })
    }
    if (!currentUser.value) {
        // For the invites tab we don't show matches at all; it's a separate list
        if (selectedTab.value === 'invites') return []
        return []
    }
    if (selectedTab.value === 'hosts') return base.filter(m => isHost(m) && !isPast(m))
    if (selectedTab.value === 'joined') return base.filter(m => !isHost(m) && Boolean(m.joinedBy && currentUser.value && m.joinedBy[currentUser.value.uid]) && !isPast(m))
    if (selectedTab.value === 'recommended') {
        if (!currentUser.value) return []
        const uid = currentUser.value.uid
        
        // Filter out user's own matches, past matches, gender-incompatible matches, and skill-inappropriate matches
        const availableMatches = base.filter(m => {
            // Basic filters
            if (isPast(m) || isHost(m) || (m.joinedBy && m.joinedBy[uid])) {
                return false
            }
            
            // Gender compatibility: exclude if match has specific gender requirement that doesn't match user
            if (m.gender && m.gender !== 'All' && currentUserProfile.value?.gender) {
                const userGender = currentUserProfile.value.gender.toLowerCase().trim()
                const matchGender = m.gender.toLowerCase().trim()
                
                // If match requires specific gender and user doesn't match, exclude completely
                if (matchGender !== 'all' && matchGender !== userGender) {
                    return false
                }
            }
            
            // Skill level compatibility: exclude matches above user's skill level
            if (m.type && currentUserProfile.value?.skillLevel) {
                const userSkill = normalizeSkill(currentUserProfile.value.skillLevel)
                const matchSkill = normalizeSkill(m.type)
                
                const skillLevels = ['Open', 'Beginner', 'Intermediate', 'Professional']
                const userIndex = skillLevels.indexOf(userSkill)
                const matchIndex = skillLevels.indexOf(matchSkill)
                
                // If we can determine skill levels and match is above user's level, exclude it
                if (userIndex !== -1 && matchIndex !== -1 && matchIndex > userIndex) {
                    // Exception: Open matches are always accessible to everyone
                    if (matchSkill !== 'Open') {
                        return false
                    }
                }
            }
            
            // Region compatibility: exclude courts outside user's region
            const userRegion = getRegionFromLocation(userLocation.value) || getRegionFromLocation(currentUserProfile.value?.location)
            if (userRegion) {
                let courtRegion = null
                
                // Try to get court region from various sources
                if (m.courtId && courtsData.value[m.courtId]) {
                    // Use enhanced court data if available
                    courtRegion = getRegionFromLocation(courtsData.value[m.courtId])
                } else if (m.court && typeof m.court === 'object') {
                    // Match already has enhanced court data
                    courtRegion = getRegionFromLocation(m.court)
                } else if (m.court && typeof m.court === 'string') {
                    // Try to find court by name in courtsData
                    const courtName = m.court.toLowerCase().trim()
                    for (const [id, courtData] of Object.entries(courtsData.value)) {
                        if (courtData && courtData.name && courtData.name.toLowerCase().trim() === courtName) {
                            courtRegion = getRegionFromLocation(courtData)
                            break
                        }
                    }
                }
                
                // If we can determine both regions and they don't match, exclude the match
                if (courtRegion && userRegion) {
                    const userReg = userRegion.toLowerCase().trim()
                    const courtReg = courtRegion.toLowerCase().trim()
                    
                    if (userReg !== courtReg) {
                        return false // Exclude courts outside user's region
                    }
                }
            }
            
            return true
        })
        
        // If no user profile or location data, return basic filtering
        if (!currentUserProfile.value) return availableMatches
        
        // Calculate recommendation scores and sort by score
        const recommendedMatches = availableMatches.map(match => {
            // Enhance match data with court information for location calculations
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
            
            // Debug logging
            console.log('Recommendation Debug:', {
                matchTitle: match.title,
                matchCourt: match.court,
                enhancedCourt: enhancedMatch.court,
                userProfile: currentUserProfile.value,
                userLocation: userLocation.value,
                score: score
            })
            
            return { match, score }
        })
        .filter(item => item.score > 0.1) // Lowered threshold for debugging
        .sort((a, b) => b.score - a.score) // Sort by highest score first
        .map(item => item.match) // Extract the match objects
        
        return recommendedMatches
    }
    // Pending Invites tab renders its own container; do not show matches here
    if (selectedTab.value === 'invites') return []
    return base.filter(m => !isPast(m))
})

const groupedMatches = computed(() => {
    const now = new Date()
    const out = { ongoing: [], scheduled: [], past: [] }
    const list = (matchesForTab.value || []).slice()
    // sort by start time where possible (earliest first for ongoing/scheduled)
    list.sort((a, b) => {
        const aa = getMatchStartEnd(a).start
        const bb = getMatchStartEnd(b).start
        if (!aa && !bb) return 0
        if (!aa) return 1
        if (!bb) return -1
        return aa - bb
    })
    for (const m of list) {
        // First check if match was manually ended
        if (isPast(m)) {
            out.past.push(m)
            continue
        }
        
        const { start, end } = getMatchStartEnd(m)
        if (start && end) {
            // Additional check: if end time has passed, it's a past match
            if (end < now) {
                out.past.push(m)
            } else if (now >= start && now <= end) {
                out.ongoing.push(m)
            } else if (start > now) {
                out.scheduled.push(m)
            } else {
                out.past.push(m)
            }
        } else if (start && !end) {
            if (start > now) out.scheduled.push(m)
            else out.ongoing.push(m)
        } else {
            // unknown times go to scheduled by default
            out.scheduled.push(m)
        }
    }
    
    // For recommended tab, limit to top 6 matches (3 ongoing, 3 scheduled)
    // Also ensure no past matches leak through
    if (selectedTab.value === 'recommended') {
        // Double-check to filter out any matches that became past since initial filtering
        out.ongoing = out.ongoing.filter(m => !isPast(m)).slice(0, 3)
        out.scheduled = out.scheduled.filter(m => !isPast(m)).slice(0, 3)
        // Don't show past matches in recommended tab at all
        out.past = []
    }
    
    // Sort past matches by most recent first (reverse chronological order)
    out.past.sort((a, b) => {
        const aa = getMatchStartEnd(a).start
        const bb = getMatchStartEnd(b).start
        if (!aa && !bb) return 0
        if (!aa) return 1
        if (!bb) return -1
        return bb - aa  // Reversed: most recent first
    })
    
    return out
})

const isTabEmpty = computed(() => {
    // For the invites tab, emptiness depends on active invitations (excluding past matches)
    if (selectedTab.value === 'invites') {
        return !(activeInvitations.value && activeInvitations.value.length)
    }
    // matchesForTab already applies the selectedTab logic and excludes past where appropriate
    try {
        return !(matchesForTab.value && matchesForTab.value.length)
    } catch (e) {
        return true
    }
})

const emptyMessage = computed(() => {
    const t = selectedTab.value
    if (t === 'hosts') return "You haven't created any upcoming matches."
    if (t === 'joined') return "You haven't joined any upcoming matches."
    if (t === 'past') return 'You have no past matches.'
    if (t === 'invites') return 'You have no pending invitations.'
    if (t === 'recommended') {
        if (!currentUserProfile.value) {
            return 'Complete your profile to see personalized match recommendations.'
        }
        if (!userLocation.value && !locationPermissionGranted.value) {
            return 'Enable location access to see matches in your area. Allow location permission when prompted.'
        }
        return 'No recommended matches available in your area. Check back later or explore other regions.'
    }
    return 'No upcoming matches found.'
})

const now = ref(new Date())

const ongoingMatches = computed(() =>
  filteredMatches.value
    .filter(m => {
      if (!m.startAtISO || !m.endAtISO) return false
      const start = new Date(m.startAtISO)
      const end = new Date(m.endAtISO)
      return start <= now.value && end >= now.value
    })
    .sort((a, b) => new Date(a.startAtISO) - new Date(b.startAtISO))
)

const scheduledMatches = computed(() =>
  filteredMatches.value
    .filter(m => {
      if (!m.startAtISO) return false
      const start = new Date(m.startAtISO)
      return start > now.value
    })
    .sort((a, b) => new Date(a.startAtISO) - new Date(b.startAtISO))
)

const pastMatches = computed(() =>
  filteredMatches.value
    .filter(m => {
      if (!m.endAtISO) return false
      const end = new Date(m.endAtISO)
      return end < now.value
    })
    .sort((a, b) => new Date(b.startAtISO) - new Date(a.startAtISO))
)

// update 'now' every minute to refresh categories live
setInterval(() => { now.value = new Date() }, 60000)


function visiblePlayers(arr) {
    if (!arr) return []
    return arr.slice(0, maxAvatars)
}

function displayedPlayers(match) {
    if (!match) return []
    const out = []
    // Prefer deriving players from joinedBy map (uids) so we always show distinct users
    if (match.joinedBy && typeof match.joinedBy === 'object') {
        for (const uid of Object.keys(match.joinedBy)) {
            let raw = (match.playersMap && match.playersMap[uid])
            let name = ''
            if (raw) {
                if (typeof raw === 'string') name = raw
                else if (typeof raw === 'object') name = raw.name || raw.displayName || raw.username || raw.uid || ''
            }
            if (!name && usersCache.value && usersCache.value[uid]) {
                const u = usersCache.value[uid]
                name = u.name || u.username || u.displayName || (u.email && u.email.split('@')[0]) || ''
            }
            if (!name) name = uid
            // Use avatarForUser with uid to ensure consistent avatar across all pages
            const userObj = { uid, ...(usersCache.value && usersCache.value[uid] ? usersCache.value[uid] : {}) }
            const avatar = avatarForUser(userObj)
            out.push({ uid, name, avatar, profilepicture: avatar })
        }
    } else if (Array.isArray(match.players)) {
        for (const name of match.players) {
            const avatar = seededAvatar(name)
            out.push({ name, avatar, profilepicture: avatar })
        }
    }

    // ensure host appears in player list (hosts are implicitly joined)
    try {
        if (isHost(match)) {
            const uid = currentUser.value && currentUser.value.uid
            // if host has uid and isn't already listed, prepend
            if (uid) {
                const exists = out.find(p => p.uid === uid)
                if (!exists) {
                    const displayName = (currentUserProfile.value && (currentUserProfile.value.name || currentUser.value.displayName)) || uid
                    // Use avatarForUser with uid to ensure consistent avatar
                    const userObj = { uid, ...(usersCache.value && usersCache.value[uid] ? usersCache.value[uid] : {}) }
                    const avatar = avatarForUser(userObj)
                    out.unshift({ uid, name: displayName, avatar, profilepicture: avatar })
                }
            }
        }
    } catch (err) {
        // ignore
    }

    return out
}

const skillOrder = ['Open', 'Beginner', 'Intermediate', 'Professional']

function normalizeSkill(skill) {
    if (!skill) return 'Open'
    const s = ('' + skill).trim().toLowerCase()
    if (s.startsWith('pro')) return 'Professional'
    if (s.startsWith('inter')) return 'Intermediate'
    if (s.startsWith('beg')) return 'Beginner'
    if (s.startsWith('open')) return 'Open'
    // fallback: try to match exact casing from list
    for (const v of skillOrder) if (v.toLowerCase() === s) return v
    return 'Open'
}

function skillRank(skill) {
    const normalized = normalizeSkill(skill)
    const idx = skillOrder.indexOf(normalized)
    return idx === -1 ? 0 : idx
}

// Match types should be Open / Beginner / Intermediate / Professional
function normalizeMatchType(type) {
    return normalizeSkill(type)
}

function canJoin(match) {
    if (!currentUser.value) return false
    // Gender restriction: if match specifies a gender (not 'All'), require user's profile gender to match
    try {
        const mg = (match && match.gender) ? ('' + match.gender).toLowerCase() : 'all'
        if (mg && mg !== 'all') {
            const ug = (currentUserProfile.value && currentUserProfile.value.gender) ? ('' + currentUserProfile.value.gender).toLowerCase() : ''
            // If we don't know user's gender, disallow joining (require profile)
            if (!ug) return false
            // Basic match: compare first letter (male/female) to be tolerant of variants like 'Male'/'Males' etc.
            if (mg.charAt(0) !== ug.charAt(0)) return false
        }
    } catch (e) {
        // conservative default: if something goes wrong, disallow join
        return false
    }

    // prefer ranking field first, then legacy skill
    const userSkill = normalizeSkill((currentUserProfile.value && (currentUserProfile.value.ranking || currentUserProfile.value.skill)) || '')
    const matchSkill = normalizeMatchType(match && (match.type || match.level || match.skill))
    // Everyone may join 'Open' matches. For 'Intermediate' require Intermediate or Professional.
    // For 'Professional' require Professional only.
    return skillRank(userSkill) >= skillRank(matchSkill)
}

function playersCount(match) {
    if (!match) return 0
    if (match.joinedBy && typeof match.joinedBy === 'object') return Object.keys(match.joinedBy).length
    if (Array.isArray(match.players)) return match.players.length
    return 0
}

function isPast(match) {
    // If an explicit endedAt/endedAtISO or matchEnded flag exists, treat as past immediately
    try {
        if (match && (match.matchEnded || match.endedAt || match.endedAtISO)) return true
    } catch (e) {}
    const { start, end } = getMatchStartEnd(match)
    const now = new Date()
    if (end && end instanceof Date && !isNaN(end.getTime())) return end < now
    // if only start exists and is in the past and there's no end, treat as past
    if (start && start instanceof Date && !isNaN(start.getTime()) && (!end || isNaN((end && end.getTime) ? end.getTime() : NaN))) return start < now
    return false
}

function joinDisabledReason(match) {
    // returns a string reason or empty if join allowed
    if (isPast(match)) return 'Match is over'
    if (!currentUser.value) return 'Sign in to join'
    const count = playersCount(match)
    const max = match.maxPlayers || 10
    if (count >= max) return 'Match is full'
    // Gender restriction check
    let genderFail = false
    let rankFail = false
    let mg = ''
    try {
        if (match && match.gender && ('' + match.gender).toLowerCase() !== 'all') {
            mg = ('' + match.gender)
            const ug = (currentUserProfile.value && currentUserProfile.value.gender) ? ('' + currentUserProfile.value.gender) : ''
            if (!ug) genderFail = true // profile incomplete
            else if (mg.charAt(0).toLowerCase() !== ug.charAt(0).toLowerCase()) genderFail = true
        }
    } catch (e) {
        genderFail = true
    }

    // Skill/rank restriction check
    const userSkill = normalizeSkill((currentUserProfile.value && (currentUserProfile.value.ranking || currentUserProfile.value.skill)) || '')
    const matchSkill = normalizeMatchType(match && (match.type || match.level || match.skill))
    if (skillRank(userSkill) < skillRank(matchSkill)) rankFail = true

    // If both gender and rank fail, show combined message (sentence case)
    if (genderFail && rankFail) {
        const mgCap = mg ? (mg.charAt(0).toUpperCase() + mg.slice(1).toLowerCase()) : mg
        return `Only ${mgCap} and ${matchSkill} players may join`
    }

    if (genderFail) {
        const mgCap = mg ? (mg.charAt(0).toUpperCase() + mg.slice(1).toLowerCase()) : mg
        return `Only ${mgCap} players may join`
    }
    if (rankFail) return `Requires ${matchSkill} rank`
    return ''
}

async function joinMatch(match) {
    if (!currentUser.value) { showAlert('Please sign in to join'); return }
    const disabled = joinDisabledReason(match)
    if (disabled) { showAlert(disabled); return }
    const uid = currentUser.value.uid
    match.joinedBy = match.joinedBy || {}
    if (match.joinedBy[uid]) return // already joined
    // optimistic local update: mark joinedBy (do not mutate legacy players array)
    match.joinedBy = { ...(match.joinedBy || {}), [uid]: true }
    // persist only the joinedBy child and a playersMap entry to avoid race conditions and enable display names
    if (match.__dbPath) {
        try {
            const parts = match.__dbPath.split('/')
            const id = parts.pop()
            const path = parts.join('/')
            const displayName = currentUserProfile.value.name || currentUser.value.displayName || uid
            await setChildData(`${path}/${id}/joinedBy`, uid, true)
            await setChildData(`${path}/${id}/playersMap`, uid, displayName)
            
            // Remove any pending invitation for this match
            if (match.id) {
                await deleteChildData(`users/${uid}/invitations`, match.id)
                // Reload invitations to update UI
                await loadInvitations()
            }
        } catch (e) {
            console.error('Failed to join match', e)
            showAlert('Failed to join — try again')
        }
    }
}

async function leaveMatch(match) {
    if (!currentUser.value) { showAlert('Please sign in'); return }
    if (isHost(match)) { showAlert('You are the host of this match and cannot leave it. You may delete it instead.'); return }
    if (isPast(match)) { showAlert('This match is already over — you cannot leave past matches.'); return }
    const uid = currentUser.value.uid
    match.joinedBy = match.joinedBy || {}
    if (!match.joinedBy[uid]) return
    // optimistic local update: remove from joinedBy; do not mutate legacy players array
    const copyJoined = { ...(match.joinedBy || {}) }
    delete copyJoined[uid]
    match.joinedBy = copyJoined
    if (match.__dbPath) {
        try {
            const parts = match.__dbPath.split('/')
            const id = parts.pop()
            const path = parts.join('/')
            await deleteChildData(`${path}/${id}/joinedBy`, uid)
            await deleteChildData(`${path}/${id}/playersMap`, uid)
        } catch (e) {
            console.error('Failed to leave match', e)
            showAlert('Failed to leave — try again')
        }
    }
}

function isJoined(match) {
    if (!currentUser.value) return false
    // hosts are implicitly joined
    if (isHost(match)) return true
    return Boolean(match && match.joinedBy && match.joinedBy[currentUser.value.uid])
}

async function deleteMatch(match) {
    if (!currentUser.value) { showAlert('Please sign in'); return }
    if (!isHost(match)) { showAlert('Only the host may delete this match'); return }
    // show themed confirm modal
    openConfirm('delete', match)
}

async function deleteMatchConfirmed(match) {
    if (!match) return
    if (!match.__dbPath) {
        // fallback: remove locally
        matches.value = matches.value.filter(m => m !== match)
        return
    }
    try {
        const parts = match.__dbPath.split('/')
        const id = parts.pop()
        const path = parts.join('/')
        await deleteChildData(path, id)
        // remove locally
        matches.value = matches.value.filter(m => m.id !== match.id)
    } catch (e) {
        console.error('Failed to delete match', e)
        showAlert('Failed to delete — try again')
    }
}

async function startMatch(match) {
    if (!currentUser.value) { showAlert('Please sign in'); return }
    if (!isHost(match)) { showAlert('Only the host may start this match'); return }
    openConfirm('start', match)
}

async function startMatchConfirmed(match) {
    if (!match) return
    // optimistic local flag
    match._started = true
    if (match.__dbPath) {
        try {
            const parts = match.__dbPath.split('/')
            const id = parts.pop()
            const path = parts.join('/')
            await setChildData(`${path}/${id}`, 'started', true)
            await setChildData(`${path}/${id}`, 'startedAt', new Date().toISOString())
            // after successfully starting, navigate to the MatchRoom
            const query = { path: match.__dbPath }
            try { router.push({ name: 'MatchRoom', params: { id: match.id }, query }) } catch(e) { router.push({ path: `/match/${match.id}`, query }) }
        } catch (e) {
            console.error('Failed to set started flag', e)
            showAlert('Failed to start match — try again')
            match._started = false
        }
    } else {
        // no DB path: still navigate to match room
        try { router.push({ name: 'MatchRoom', params: { id: match.id } }) } catch(e) { router.push(`/match/${match.id}`) }
    }
}

async function endMatch(match) {
    if (!currentUser.value) { showAlert('Please sign in'); return }
    if (!isHost(match)) { showAlert('Only the host may end this match'); return }
    openConfirm('end', match)
}

async function endMatchConfirmed(match) {
    if (!match) return
    // optimistic local update
    match._started = false
    match.started = false
    // mark ended locally so UI treats it as past immediately
    try { match.endedAt = new Date().toISOString(); match.endAtISO = match.endedAt } catch (_) {}
    if (match.__dbPath) {
        try {
            const parts = match.__dbPath.split('/')
            const id = parts.pop()
            const path = parts.join('/')
            await setChildData(`${path}/${id}`, 'started', false)
            await setChildData(`${path}/${id}`, 'endedAt', new Date().toISOString())
            await setChildData(`${path}/${id}`, 'matchEnded', true)
        } catch (e) {
            console.error('Failed to end match', e)
            showAlert('Failed to end match — try again')
            // if the write failed, we may want to revert optimistic change
            try { match.started = true } catch(_){ }
            return
        }
    }
    // Clear any local "playing" state for this match so UI updates across clients
    try {
        const parts2 = (match && match.__dbPath) ? String(match.__dbPath).split('/') : []
        const mid = match && match.id ? String(match.id) : (parts2.length ? parts2.pop() : '')
        if (mid) clearPlayingForId(String(mid))
    } catch (e) { /* ignore */ }
    // After successfully ending the match, navigate to Forum and open the Create Post modal
        try {
            const courtName = (match && (match.court || match.location)) ? encodeURIComponent((match.court || match.location)) : ''
            const matchId = match && match.id ? String(match.id) : ''
            const matchTitle = (match && match.title) ? encodeURIComponent(match.title) : ''
            const matchPath = match && match.__dbPath ? encodeURIComponent(match.__dbPath) : ''
            // use query params `openCreate=1`, `tag=Matches`, and pass court/match info so forum can prefill and attach metadata
            await router.push({ path: '/forum', query: { openCreate: '1', court: courtName, tag: 'Matches', matchId, matchTitle, matchPath } })
        } catch (e) {
        // ignore navigation failures
    }
    // After successfully ending the match, show the match summary modal
    openMatchSummary(match)
}

function playMatch(match) {
    // only allowed when started
    if (!(match.started || match._started)) { showAlert('Match has not been started by the host yet'); return }
    if (!currentUser.value) { showPopup.value = true; return }
    // mark this match as playing in local transient state so the UI updates (card turns primary, Play button hidden)
    const id = String(match.id || match.key || match._id || (match.__dbPath ? String(match.__dbPath).split('/').pop() : ''))
    playingMatches.value = { ...(playingMatches.value || {}), [id]: true }
    try { savePlayingMatchesToStorage() } catch (e) { /* ignore */ }
}

function initials(name) {
    if (!name) return ''
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
}

const formatTimeRange = (match) => {
    if (!match) return ''
    const opts = { hour: 'numeric', minute: '2-digit', hour12: true }

    // helper: convert a time-only string (HH:mm or HH:mm:ss) into a localized 12h string
    function formatTimeString(t, isoDate) {
        if (!t) return ''
        const raw = ('' + t).trim()
        // already contains am/pm
        if (/[ap]m$/i.test(raw)) return raw
        // ISO datetime
        if (/\d{4}-\d{2}-\d{2}T/.test(raw)) {
            try { return new Date(raw).toLocaleTimeString([], opts) } catch (e) { return raw }
        }
        // time-only like HH:mm or HH:mm:ss
        const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
        if (m) {
            try {
                let base = isoDate ? new Date(isoDate) : (match.startAtISO ? new Date(match.startAtISO) : null)
                if (!base) base = new Date()
                base.setHours(Number(m[1]), Number(m[2]) || 0, Number(m[3]) || 0, 0)
                return base.toLocaleTimeString([], opts)
            } catch (e) {
                return raw
            }
        }
        return raw
    }

    // If explicit startTime/endTime provided (possibly 24h), convert both
    if (match.startTime && match.endTime) {
        const s = formatTimeString(match.startTime, match.startAtISO || match.date)
        const e = formatTimeString(match.endTime, match.endAtISO || match.date)
        return `${s} — ${e}`
    }

    // If ISO timestamps exist, format them
    if (match.startAtISO && match.endAtISO) {
        try {
            const s = new Date(match.startAtISO)
            const e = new Date(match.endAtISO)
            return `${s.toLocaleTimeString([], opts)} — ${e.toLocaleTimeString([], opts)}`
        } catch (err) { console.warn('formatTimeRange parse error', err) }
    }

    // If legacy match.time is a range like '16:00 — 17:00', try to parse both sides
    if (match.time && typeof match.time === 'string') {
        const parts = match.time.split('—').map(s => s.trim())
        if (parts.length === 2) {
            const s = formatTimeString(parts[0], match.startAtISO || match.date)
            const e = formatTimeString(parts[1], match.endAtISO || match.date)
            return `${s} — ${e}`
        }
        return match.time
    }

    return ''
}

function formatDate(match) {
    if (!match) return ''
    // prefer ISO timestamp
    const iso = match.startAtISO || match.startAt || match.date
    if (iso) {
        try {
            const d = new Date(iso)
            return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
        } catch (err) {
            // fall through
        }
    }
    // fallback: if match.time contains a day name, try to return that
    if (match.time) return match.time
    return ''
}

// DEBUG: Expose test function globally for console access
window.createTestRecommendationMatch = createTestRecommendationMatch

// pushDataToFirebase('TEST', 123);
</script>

<style scoped>
.page-bg {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden; /* guard against any accidental horizontal scroll */
}

.page-bg::before {
        content: '';
        position: fixed; /* pin to the viewport, independent of content height */
        inset: 0;
        background:
            linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
            url('../assets/matchBG.jpg') center / cover no-repeat;
        z-index: 0; /* keep it beneath the content */
        pointer-events: none;
}

.page-bg > * {
    position: relative;
    z-index: 1;
}

/* Provide a consistent outer gutter so content isn’t flush to the viewport
     when the sidebar is collapsed. Keep it subtle to match other pages. */
.page-bg {
        padding-left: 16px;
        padding-right: 16px;
}
@media (min-width: 768px) {
    .page-bg { padding-left: 20px; padding-right: 20px; }
}

/* When layout is wide (including sidebar collapsed), center the main card horizontally */
@media (min-width: 900px) {
    .page-bg {
        display: flex;
        justify-content: center;
    }
    .page-bg > .large-card {
        width: 100%;
    }
}

.large-card {
    padding: 28px;
    border-radius: 14px;
    /* glass effect: subtle translucent gradient + backdrop blur */
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008));
    -webkit-backdrop-filter: blur(8px) saturate(120%);
    backdrop-filter: blur(8px) saturate(120%);
    border: 1px solid rgba(255,255,255,0.04);
    box-shadow: 0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
    color: inherit;
    /* Center the card within the main-content and avoid extra horizontal offsets */
    margin: 0 auto;
    max-width: 1400px;
    width: 100%;
    box-sizing: border-box;
}

/* Adjust positioning based on parent container's collapsed state */
/* App.vue already applies the correct left margin when the sidebar collapses.
   Avoid adding any extra offset here so the card remains centered. */
.collapsed .large-card { margin-left: -5px; margin-right: -35px; }

/* Provide a little extra left gutter when the sidebar is collapsed so the card visually centers */
@media (min-width: 900px) {
        .collapsed .page-bg { padding-left: 0px; padding-right: 25px; }
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px
}

.matches-header { align-items: flex-start }
.matches-title { color: #ffa733; font-size: 48px; margin: 0; font-weight: 800; font-family: "Segoe UI", Arial, Helvetica, sans-serif; }
.matches-desc { color: #9fb0bf; margin-top: 8px; font-size: 18px; font-family: "Segoe UI", Arial, Helvetica, sans-serif; }

.btn-create-match {
    background: #ff9a3c;
    color: #111;
    border: none;
    padding: 12px 18px;
    border-radius: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(255, 154, 60, 0.3);
    transition: all 0.2s ease;
    cursor: pointer;
}

.btn-create-match:not(:disabled):hover,
.btn-create-match:not(:disabled):focus {
    background: #ffb14d;
    box-shadow: 0 6px 20px rgba(255, 177, 77, 0.4);
    transform: translateY(-2px);
}

.btn-create-match:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.btn-create-match .icon-circle { background: rgba(0,0,0,0.08); padding: 6px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center }

/* Small-screen: stack header and make Create Match button full-width so it doesn't overlap */
@media (max-width: 700px) {
    .page-header.matches-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
    .page-header.matches-header > div:last-child {
        width: 100%;
    }
    .page-header.matches-header .btn-create-match {
        width: 100%;
        justify-content: center;
    }
    .matches-title { font-size: 36px; }
    .matches-desc { font-size: 16px; }
}

.tabs-pill { display: inline-flex; gap: 6px; background: rgba(255,255,255,0.02); padding: 6px; border-radius: 10px; flex-wrap: wrap }
.tab-pill { background: transparent; border: none; color: #9fb0bf; padding: 10px 18px; border-radius: 10px; cursor: pointer; white-space: nowrap; flex: 0 0 auto }
.tab-pill.active { background: #0b1220; color: #fff }

.tabs {
    margin-top: 18px;
    display: flex;
    gap: 12px
}

.tab {
    background: rgba(195, 67, 67, 0.03);
    color: #d7e3f6;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer
}

.tab.active {
    background: rgba(255, 255, 255, 0.06)
}

/* responsive grid using Bootstrap-like breakpoints */
.matches-grid {
    margin-top: 20px;
    /* use Bootstrap row/col for layout — do not override with CSS grid */
}


.match-card {
    background: linear-gradient(180deg,#0f1418 0%, #0d1114 100%);
    border: 1px solid rgba(255,154,60,0.06);
    border-radius: 12px;
    color: #fff;
}
.match-card {
    display: flex;
    flex-direction: column;
    min-height: 340px;
}
.match-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}
.match-card .card-body { padding: 20px; display:flex; flex-direction:column; gap:12px; flex:1 }
.match-card .card-body { box-sizing: border-box }
.match-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.45); transform: translateY(-6px); transition: all 180ms ease }

.match-left {
    margin-bottom: 14px
}

.match-right {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px
}

.match-title {
    margin: 0;
    color: #fff;
    font-size: 1.25rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.match-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); }
.match-people { display: flex; align-items: center; gap: 6px }

/* header right area that contains the STARTED badge and people count */
.match-header-right { display:flex; align-items:center; gap:12px }

.match-started-badge {
    display: inline-block;
    background: linear-gradient(180deg, #a83a3a 0%, #c84b4b 100%);
    color: rgba(255, 210, 210, 0.95);
    padding: 6px 12px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border: 1px solid rgba(0,0,0,0.4);
    box-shadow: inset 0 2px 0 rgba(255,255,255,0.03), 0 6px 18px rgba(200,50,50,0.12);
    animation: live-blink 2.6s ease-in-out infinite;
}

/* reuse previously defined keyframes name to keep animation across badges */
@keyframes live-blink {
    0% { opacity: 1; transform: translateZ(0) scale(1); }
    45% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
    55% { opacity: 0.5; transform: translateZ(0) scale(0.995); }
    100% { opacity: 1; transform: translateZ(0) scale(1); }
}

.match-sub {
    color: #cbd6df;
    margin-top: 6px;
    font-size: 0.95rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.match-date { color: #ffffff; margin-top: 6px; font-size: 1.05rem; font-weight: 700 }

.match-meta {
    margin-top: 12px;
    color: #cbd6df
}

.match-meta-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; color:#cbd6df }
.match-meta-row .time-range { font-weight:600; color:#fff }
.meta-pill { background: rgba(255,255,255,0.03); padding:6px 10px; border-radius:8px; font-size:0.85rem; color:#cbd6df }
.meta-pill.badge-type { background: rgba(255,154,60,0.12); color:#ffb26a }

.badges {
    margin-top: 12px
}

.pill {
    background: rgba(255, 255, 255, 0.03);
    padding: 6px 8px;
    border-radius: 999px;
    margin-right: 6px;
    color: #cfd9e3
}

.pill.yellow {
    background: #2b1a00;
    color: #ffb14d
}


.avatars { margin-top: 12px }
.avatar-stack { display:flex; align-items:center }
.avatar-stack .avatar-initial { width:36px; height:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; font-weight:700; border:2px solid rgba(0,0,0,0.6); margin-left:-12px; font-size:0.85rem; flex-shrink:0 }
.avatar-stack .avatar-initial:first-child { margin-left:0 }
.avatar-stack .avatar.extra { margin-left:8px; background:#2b2f33; width:36px; height:36px; min-width:36px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:0.85rem; flex-shrink:0 }

/* image avatar style (match initials look) */
.avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(0,0,0,0.6); margin-left:-12px; flex-shrink:0 }


.players {
    color: #ffb14d;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px
}

.join { background: #ff9a3c; color:#111 }
.view { color: rgba(255,255,255,0.7) }

.btn-join {
    background: #ff9a3c;
    color: #111;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 700;
    border: none;
}
.btn-join[disabled] {
    /* Match the match-card background for a seamless look and add a subtle grey outline.
       Keeps the button visible but signals disabled state via the border. */
    opacity: 1;
    cursor: not-allowed;
    border: 1px solid rgba(128,128,128,0.55); /* subtle gray outline */
    /* Use the same gradient as .match-card so the button visually blends with the card */
    background: linear-gradient(180deg,#0f1418 0%, #0d1114 100%);
    color: #464749; /* gray text when disabled */
    box-shadow: none;
}

.btn-invite {
    background: #ff9a3c;
    color: #111;
    border: 2px solid #111;
    font-weight: 700;
    transition: all 0.2s ease;
}

.btn-invite:hover {
    background: #ffb26a;
    border-color: #111;
    color: #111;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 154, 60, 0.3);
}

.summary-btn {
    border: none;
    background: #2b6baf;
    color: #fff;
    border-radius: 8px;
    padding: 6px 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.summary-btn:hover {
    background: #3a7bc8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(43, 107, 175, 0.3);
}

@media (min-width: 768px) {
    .match-card {
        flex-direction: column
    }

    .match-right {
        align-items: flex-end
    }
}

/* Responsive behavior for tabs: prevent label wrapping and allow horizontal scroll on narrow screens */
@media (max-width: 900px) {
    .tabs { overflow: visible; }
    .tabs-pill {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        max-width: 100%;
        scroll-snap-type: x mandatory;
        gap: 6px;
    }
    .tab-pill { scroll-snap-align: start; }
}

@media (max-width: 600px) {
    .tab-pill { padding: 8px 12px; font-size: 0.95rem; }
}

/* Ensure bootstrap column wrappers become flex containers so children stretch to full height/width */
.matches-grid [class*="col-"] {
    display: flex;
    align-items: stretch;
}

/* Host-created matches use the same visual highlight as the Create Match button */
.match-card.host-match {
    /* Keep bright orange background, improve foreground contrast */
    background: linear-gradient(180deg, #ff9a3c 0%, #ff9a3c 100%);
    color: #111;
    border-color: rgba(0,0,0,0.12);
}
.match-card.host-match .match-title { color: #111 }
/* Improve readability on bright orange: use dark text and darker pill backgrounds */
.match-card.host-match .match-sub { color: #1a1a1a }
.match-card.host-match .match-date { color: #111 }
.match-card.host-match .match-meta-row .time-range { color: #111 }
.match-card.host-match .meta-pill { background: rgba(0,0,0,0.10); color: #111 }
.match-card.host-match .meta-pill.badge-type { background: rgba(0,0,0,0.18); color: #111 }
.match-card.host-match .match-people { color: #fff; background: rgba(0,0,0,0.25); padding: 4px 10px; border-radius: 12px; }

/* Playing match state: visually indicate an active/playing match (same treatment as host-match) */
.match-card.playing-match {
    /* Use Bootstrap primary color to match the Play button */
    background: linear-gradient(180deg, #0d6efd 0%, #0b5ed7 100%);
    color: #fff;
    border-color: rgba(11,94,215,0.12);
}
.match-card.playing-match .match-title { color: #fff }
.match-card.playing-match .match-sub { color: rgba(255,255,255,0.9) }
.match-card.playing-match .match-date { color: #fff }
.match-card.playing-match .match-meta-row .time-range { color: #fff }
.match-card.playing-match .meta-pill { background: rgba(255,255,255,0.06); color: #fff }
.match-card.playing-match .meta-pill.badge-type { background: rgba(255,255,255,0.08); color: #fff }
.match-card.playing-match .match-people { color: #fff }

.section-heading { color: #ff9a3c; font-weight: 800; margin-top: 18px; margin-bottom: 12px }

/* Allow cards to render edge shadows without clipping while preventing x-overflow globally */
.large-card { overflow: visible; }
.matches-grid { overflow: visible; }

/* Embedded compact header & empty state */
.embedded-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding: 10px 6px;
    margin-top: 8px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.02);
    flex-wrap: wrap;
    gap: 12px;
}
.embedded-title { 
    font-size: 1.25rem; 
    font-weight: 800; 
    color: #fff;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.embedded-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

/* Responsive adjustments for embedded header */
@media (max-width: 600px) {
    .embedded-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
    
    .embedded-title {
        width: 100%;
        white-space: normal;
        word-break: break-word;
    }
    
    .embedded-header-actions {
        width: 100%;
        justify-content: stretch;
    }
    
    .btn-create-match.small {
        width: 100%;
        justify-content: center;
    }
}

.embedded-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255,154,60,0.12);
    border: 1px solid rgba(255,154,60,0.3);
    border-radius: 8px;
    color: #ffa733;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.embedded-close-btn:hover {
    background: rgba(255,154,60,0.2);
    border-color: #ffa733;
    transform: scale(1.05);
}

.embedded-close-btn i {
    font-weight: 700;
}

.btn-create-match.small { padding: 8px 12px; font-size: 0.95rem }
.embedded-empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px; /* even padding around empty state */
}
.embedded-empty-state .empty-card {
    background: linear-gradient(180deg,#0f1418 0%, #0c0f12 100%);
    border: 1px solid rgba(255,255,255,0.03);
    margin: 0;
    width: 100%;
    max-width: 760px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.45);
    border-radius: 12px;
}
.embedded-empty-state .card-body {
    padding: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
}
.embedded-empty-state .empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,154,60,0.08);
    color: #ff9a3c;
    font-size: 26px;
}
.embedded-empty-state p { color: #e8edf2; margin: 0 }
.embedded-empty-state p.lead { color: #ffffff; font-weight: 700; font-size: 1.05rem }
.embedded-empty-state .empty-subtitle { 
    color: #5b636b !important; 
    margin: 0; 
    font-size: 0.9rem;
}

/* Popup styles */
.success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(24, 28, 35, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.success-popup {
    background-color: #000000;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 400px;
    margin: 0 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.success-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
    font-size: 1.5rem;
    color: white;
    background-color: #EF4444;
}

.success-popup h3 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.75rem;
}

.success-popup p {
    color: #747d89;
    margin-bottom: 1.5rem;
    font-size: 1rem;
}

.popup-buttons {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
}

.sign-in-btn {
    background-color: #FFAD1D;
    color: #181C23;
    font-weight: 600;
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.875rem;
}

.sign-in-btn:hover {
    background-color: #FFB751;
}

.close-btn {
    background-color: #374151;
    color: white;
    font-weight: 500;
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 0.875rem;
}

.close-btn:hover {
    background-color: #4B5563;
}

/* Invitations Section */
.invitations-wrapper {
    width: 100%;
}

.invitations-section {
    padding: 16px;
    background: rgba(255, 154, 60, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 154, 60, 0.15);
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
    text-align: center;
}

.invitations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
    gap: 20px;
    width: 100%;
    align-items: stretch;
}

.invitation-card-wrapper {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;
}

.invitation-card {
    background: linear-gradient(180deg, #0b0f12, #0d1114);
    border: 1px solid rgba(255, 154, 60, 0.2);
    border-radius: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
    width: 100%;
    max-width: 100%;
}

.invitation-card .card-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.invitation-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 154, 60, 0.15);
}

.invitation-title {
    color: #ff9a3c;
    font-weight: 700;
    font-size: 1.15rem;
    text-align: left;
    margin: 0;
}

.invitation-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.invitation-detail-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    color: #9fb0bf;
    font-size: 0.9rem;
}

.invitation-detail-item i {
    color: #ff9a3c;
    font-size: 1rem;
}

.inviter-info {
    transition: color 0.2s;
}

.inviter-info:hover {
    color: #ff9a3c !important;
}

.inviter-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #ff9a3c;
}

.invitation-actions {
    display: flex;
    gap: 12px;
    margin-top: 4px;
}

.invitation-actions button {
    flex: 1;
    padding: 10px 16px;
    font-weight: 600;
}

/* Responsive tweaks for invitation cards on narrow screens */
@media (max-width: 600px) {
    .invitations-section {
        padding: 12px;
    }
    
    .invitation-card .card-body {
        padding: 14px;
    }
    
    .invitation-title { 
        font-size: 0.95rem;
    }
    
    .invitation-detail-item { 
        font-size: 0.8rem;
    }
    
    .invitation-detail-item i {
        font-size: 0.9rem;
    }
    
    .invitation-actions {
        flex-direction: column;
        gap: 8px;
    }
    
    .invitation-actions button { 
        width: 100%;
        padding: 10px;
        font-size: 0.85rem;
    }
}

@media (max-width: 480px) {
    .invitations-section { 
        padding: 10px; 
    }
    
    .invitation-card .card-body { 
        padding: 12px; 
    }
    
    .invitation-title { 
        font-size: 0.9rem;
        line-height: 1.2;
    }
    
    .invitation-detail-item { 
        font-size: 0.75rem; 
        gap: 6px; 
    }
    
    .invitation-detail-item i {
        font-size: 0.85rem;
    }
    
    .invitation-actions { 
        gap: 8px; 
    }
    
    .invitation-actions button { 
        padding: 9px 12px; 
        font-size: 0.8rem; 
    }
}

@media (max-width: 360px) {
    .invitations-section { 
        padding: 8px; 
    }
    
    .invitation-card .card-body { 
        padding: 10px; 
    }
    
    .invitation-title { 
        font-size: 0.85rem;
    }
    
    .invitation-detail-item { 
        font-size: 0.7rem;
        gap: 4px;
    }
    
    .invitation-detail-item i {
        font-size: 0.8rem;
    }
    
    .invitation-actions button { 
        padding: 8px 10px; 
        font-size: 0.75rem; 
    }
}

/* Responsive breakpoints: keep auto-fit behavior; no hard-coded column count */

/* Notification Badge */
.notification-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ff3c3c;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    margin-left: 8px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}
</style>