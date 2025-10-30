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
                <div>
                    <button class="btn-create-match small" :title="currentUser ? 'Create a match' : 'Sign in to create matches'" @click="handleCreateMatch"><span class="icon-circle"><i class="bi bi-plus-lg"></i></span> Create Match</button>
                </div>
            </div>

            <div class="tabs mb-3">
                <div class="tabs-pill" role="tablist" aria-label="Match tabs">
                    <button :class="['tab-pill', selectedTab === 'all' ? 'active' : '']" @click="selectedTab = 'all'">All Matches</button>
                    <button :class="['tab-pill', selectedTab === 'hosts' ? 'active' : '']" @click="selectedTab = 'hosts'">My Matches</button>
                    <button :class="['tab-pill', selectedTab === 'joined' ? 'active' : '']" @click="selectedTab = 'joined'">Joined Matches</button>
                    <button :class="['tab-pill', selectedTab === 'past' ? 'active' : '']" @click="selectedTab = 'past'">Past Matches</button>
                </div>
            </div>

            <!-- Grouped sections: Ongoing / Scheduled / Past -->
            <!-- Empty state when the selected tab has no matches -->
            <div v-if="isTabEmpty" class="embedded-empty-state" v-cloak>
                <div class="empty-card card">
                    <div class="card-body">
                        <div class="empty-icon">🏀</div>
                        <p class="lead mb-2">{{ emptyMessage }}</p>
                        <p class="text-muted small">Try switching tabs or create a match for this court.</p>
                    </div>
                </div>
            </div>
            <div v-if="selectedTab !== 'past' && groupedMatches && groupedMatches.ongoing && groupedMatches.ongoing.length">
                <h3 class="section-heading">Ongoing</h3>
                <div class="row g-3 matches-grid">
                    <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in (groupedMatches && groupedMatches.ongoing ? groupedMatches.ongoing : [])" :key="match?.id || idx">
                        <div :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : '']">
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
                                    <div class="meta-pill badge-type">{{ match.type || match.level || 'Open' }}</div>
                                </div>

                                <div class="avatars mb-3">
                                    <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                                        <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                                            <img v-if="p && p.avatar" :src="p.avatar" class="avatar-img" />
                                            <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                                        </template>
                                        <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
                                    </div>
                                </div>

                                <div class="mt-auto d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        <template v-if="isHost(match)">
                                            <!-- Host: Show End Match when started, otherwise Start Match -->
                                            <template v-if="match.started || match._started">
                                                <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" @click.prevent="endMatch(match)"><i class="bi bi-slash-square me-2"></i>End Match</button>
                                            </template>
                                            <template v-else>
                                                <button type="button" class="btn btn-success btn-sm ms-2 d-flex align-items-center" @click.prevent="startMatch(match)"><i class="bi bi-play-fill me-2"></i>Start Match</button>
                                            </template>
                                        </template>
                                        <template v-else-if="isJoined(match)">
                                            <template v-if="match.started || match._started">
                                                <button type="button" class="btn btn-primary btn-sm d-flex align-items-center" @click.prevent="playMatch(match)"><i class="bi bi-controller me-2"></i>Play</button>
                                            </template>
                                            <template v-else>
                                                <button type="button" class="btn btn-danger btn-sm d-flex align-items-center" :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : 'Leave match'" @click.prevent="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                                            </template>
                                        </template>
                                        <template v-else>
                                            <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" :title="joinDisabledReason(match) || 'Join match'" @click.prevent="joinMatch(match)">Join</button>
                                        </template>
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="selectedTab !== 'past' && groupedMatches && groupedMatches.scheduled && groupedMatches.scheduled.length">
                <h3 class="section-heading">Scheduled</h3>
                <div class="row g-3 matches-grid">
                    <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in (groupedMatches && groupedMatches.scheduled ? groupedMatches.scheduled : [])" :key="match?.id || idx">
                        <!-- reuse same card markup -->
                        <div :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : '']">
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
                                    <div class="meta-pill badge-type">{{ match.type || match.level || 'Open' }}</div>
                                </div>

                                <div class="avatars mb-3">
                                    <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                                        <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                                            <img v-if="p && p.avatar" :src="p.avatar" class="avatar-img" />
                                            <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                                        </template>
                                        <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
                                    </div>
                                </div>

                                <div class="mt-auto d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        <template v-if="isHost(match)">
                                            <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent="openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center" @click.prevent="deleteMatch(match)"><i class="bi bi-trash me-2"></i>Delete</button>
                                        </template>
                                        <template v-else-if="isJoined(match)">
                                            <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent="openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                            <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : 'Leave match'" @click.prevent="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                                        </template>
                                        <template v-else>
                                            <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" :title="joinDisabledReason(match) || 'Join match'" @click.prevent="joinMatch(match)">Join</button>
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
                        <div :class="['card', 'match-card', 'h-100', 'text-reset', 'text-decoration-none', isHost(match) ? 'host-match' : '']">
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
                                    <div class="meta-pill badge-type">{{ match.type || match.level || 'Open' }}</div>
                                </div>

                                <div class="avatars mb-3">
                                    <div class="avatar-stack me-2" @click.stop.prevent="openPlayersModal(match)" style="cursor:pointer">
                                        <template v-for="(p, i) in visiblePlayers(displayedPlayers(match))" :key="i">
                                            <img v-if="p && p.avatar" :src="p.avatar" class="avatar-img" />
                                            <span v-else class="avatar-initial">{{ initials(p && (p.name || p)) }}</span>
                                        </template>
                                        <span v-if="displayedPlayers(match).length > maxAvatars" class="avatar extra">+{{ displayedPlayers(match).length - maxAvatars }}</span>
                                    </div>
                                </div>

                                <div class="mt-auto d-flex justify-content-between align-items-center">
                                    <div class="btn-group">
                                        <template v-if="isHost(match)">
                                            <button type="button" class="btn btn-danger btn-sm d-flex align-items-center" @click.prevent="deleteMatch(match)"><i class="bi bi-trash me-2"></i>Delete</button>
                                        </template>
                                        <template v-else-if="isJoined(match)">
                                            <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center" @click.prevent="openInvite(match)"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                            <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" :disabled="isPast(match)" :title="isPast(match) ? 'Match is over' : 'Leave match'" @click.prevent="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                                        </template>
                                        <template v-else>
                                            <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!!joinDisabledReason(match)" :title="joinDisabledReason(match) || 'Join match'" @click.prevent="joinMatch(match)">Join</button>
                                        </template>
                                    </div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Empty state for Past Matches when user has none -->
            <div v-if="selectedTab === 'past' && groupedMatches && (!groupedMatches.past || groupedMatches.past.length === 0)" class="past-empty-state">
                <h3 class="section-heading">Past</h3>
                <div class="empty-card card">
                    <div class="card-body">
                        <div class="empty-icon">🏀</div>
                        <p class="lead mb-2">You have no past matches.</p>
                        <p class="text-muted small">Past matches you hosted or joined will appear here. Try checking <strong>All Matches</strong> to find upcoming games.</p>
                    </div>
                </div>
            </div>
        </div>

    <!-- render modal inside template so Vue can mount it -->
    <AddMatchModal v-if="showAddMatchModal" :courtList="courts" :courtName="courtFilter || ''" @close="showAddMatchModal = false" @created="onMatchCreated" />
    <InviteModal v-if="showInviteModal" :match="inviteMatch" :users="usersCache.value" :me="currentUser" @close="showInviteModal = false" @sent="onInvitesSent" />
    <JoinedPlayersModal v-if="showPlayersModal" :players="activePlayers" :title="activeTitle" @close="closePlayersModal" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
const props = defineProps({
    courtFilter: { type: String, default: '' },
    embedded: { type: Boolean, default: false }
})
// expose convenient local bindings for template/script
const { courtFilter, embedded } = props
import { getDataFromFirebase, pushDataToFirebase, overwriteDataToFirebase, setChildData, deleteChildData } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import AddMatchModal from './AddMatchModal.vue'
import JoinedPlayersModal from './JoinedPlayersModal.vue'
import InviteModal from './InviteModal.vue'

const showPopup = ref(false)
const isSigningIn = ref(false)
const auth = getAuth()

const maxAvatars = 6
const usersCache = ref({})

function seededAvatar(name) {
    const username = name || 'anon'
    return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`
}

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
            // prefer playersMap which stores name by uid
            let name = (match.playersMap && match.playersMap[uid])
            // fallback to user record in users cache (if available)
            if (!name && usersCache.value && usersCache.value[uid]) {
                const u = usersCache.value[uid]
                name = u.name || u.username || u.displayName || (u.email && u.email.split('@')[0])
            }
            // final fallback to uid
            if (!name) name = uid
            const avatar = (usersCache.value && usersCache.value[uid] && (usersCache.value[uid].photoURL || usersCache.value[uid].avatar)) || seededAvatar(name)
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
const currentUserProfile = ref({ skill: 'Open', gender: 'All' })
const showInviteModal = ref(false)
const inviteMatch = ref(null)

function openInvite(match) {
    if (!currentUser.value) {
        showPopup.value = true
        return
    }
    inviteMatch.value = match
    showInviteModal.value = true
}

function onInvitesSent(uids) {
    console.log('Invites sent to', uids)
}

onMounted(async () => {
    await loadUsers()
    await loadMatches()
    await loadCourts()
    // listen for auth state and load user profile
    onUserStateChanged(async (u) => {
        currentUser.value = u
        if (u) showPopup.value = false
        if (!u) return
        // load profile from Realtime DB
        try {
            const users = await getDataFromFirebase('users')
            if (users && users[u.uid]) {
                currentUserProfile.value = users[u.uid]
            }
        } catch (e) {
            console.warn('Failed to load user profile', e)
        }
    })
})

// also refresh matches when auth state changes (so hosts see updated joined lists)
onUserStateChanged(async (u) => {
    currentUser.value = u
    if (u) showPopup.value = false
    // reload users and matches to reflect any joinedBy changes made while signed out
    try {
        await loadUsers()
        await loadMatches()
    } catch (e) {
        console.warn('Failed to refresh matches on auth change', e)
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
    } catch (err) {
        console.error('Failed to load matches', err)
        matches.value = []
    }
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

const selectedTab = ref('all')

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
    if (!currentUser.value) return []
    if (selectedTab.value === 'hosts') return base.filter(m => isHost(m) && !isPast(m))
    if (selectedTab.value === 'joined') return base.filter(m => !isHost(m) && Boolean(m.joinedBy && currentUser.value && m.joinedBy[currentUser.value.uid]) && !isPast(m))
    return base.filter(m => !isPast(m))
})

const groupedMatches = computed(() => {
    const now = new Date()
    const out = { ongoing: [], scheduled: [], past: [] }
    const list = (matchesForTab.value || []).slice()
    // sort by start time where possible (earliest first)
    list.sort((a, b) => {
        const aa = getMatchStartEnd(a).start
        const bb = getMatchStartEnd(b).start
        if (!aa && !bb) return 0
        if (!aa) return 1
        if (!bb) return -1
        return aa - bb
    })
    for (const m of list) {
        const { start, end } = getMatchStartEnd(m)
        if (start && end) {
            if (now >= start && now <= end) out.ongoing.push(m)
            else if (start > now) out.scheduled.push(m)
            else out.past.push(m)
        } else if (start && !end) {
            if (start > now) out.scheduled.push(m)
            else out.ongoing.push(m)
        } else {
            // unknown times go to scheduled by default
            out.scheduled.push(m)
        }
    }
    return out
})

const isTabEmpty = computed(() => {
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
            let name = (match.playersMap && match.playersMap[uid])
            if (!name && usersCache.value && usersCache.value[uid]) {
                const u = usersCache.value[uid]
                name = u.name || u.username || u.displayName || (u.email && u.email.split('@')[0])
            }
            if (!name) name = uid
            const avatar = (usersCache.value && usersCache.value[uid] && (usersCache.value[uid].photoURL || usersCache.value[uid].avatar)) || seededAvatar(name)
            out.push({ uid, name, avatar })
        }
    } else if (Array.isArray(match.players)) {
        for (const name of match.players) out.push({ name, avatar: seededAvatar(name) })
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
                    const avatar = (usersCache.value && usersCache.value[uid] && (usersCache.value[uid].photoURL || usersCache.value[uid].avatar)) || seededAvatar(displayName)
                    out.unshift({ uid, name: displayName, avatar })
                }
            }
        }
    } catch (err) {
        // ignore
    }

    return out
}

const skillOrder = ['Open', 'Beginner', 'Intermediate', 'Professional']

function skillRank(skill) {
    const idx = skillOrder.indexOf(skill)
    return idx === -1 ? 0 : idx
}

function canJoin(match) {
    if (!currentUser.value) return false
    const userSkill = currentUserProfile.value.skill || 'Open'
    const matchSkill = match.type || 'Open'
    // user can join if their skill rank >= match required rank
    return skillRank(userSkill) >= skillRank(matchSkill)
}

function playersCount(match) {
    if (!match) return 0
    if (match.joinedBy && typeof match.joinedBy === 'object') return Object.keys(match.joinedBy).length
    if (Array.isArray(match.players)) return match.players.length
    return 0
}

function isPast(match) {
    // If an explicit endedAt/endedAtISO exists, treat as past immediately
    try {
        if (match && (match.endedAt || match.endedAtISO)) return true
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
    const userSkill = currentUserProfile.value.skill || 'Open'
    const matchSkill = match.type || match.level || 'Open'
    if (skillRank(userSkill) < skillRank(matchSkill)) return `Requires ${matchSkill} level`
    return ''
}

async function joinMatch(match) {
    if (!currentUser.value) { alert('Please sign in to join'); return }
    if (!canJoin(match)) { alert('Your skill level is below the match requirement'); return }
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
        } catch (e) {
            console.error('Failed to join match', e)
            alert('Failed to join — try again')
        }
    }
}

async function leaveMatch(match) {
    if (!currentUser.value) { alert('Please sign in'); return }
    if (isHost(match)) { alert('You are the host of this match and cannot leave it. You may delete it instead.'); return }
    if (isPast(match)) { alert('This match is already over — you cannot leave past matches.'); return }
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
            alert('Failed to leave — try again')
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
    if (!currentUser.value) { alert('Please sign in'); return }
    if (!isHost(match)) { alert('Only the host may delete this match'); return }
    if (!confirm('Delete this match? This action cannot be undone.')) return
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
        alert('Failed to delete — try again')
    }
}

async function startMatch(match) {
    if (!currentUser.value) { alert('Please sign in'); return }
    if (!isHost(match)) { alert('Only the host may start this match'); return }
    if (!confirm('Start this match now?')) return
    // optimistic local flag
    match._started = true
    if (match.__dbPath) {
        try {
            const parts = match.__dbPath.split('/')
            const id = parts.pop()
            const path = parts.join('/')
            await setChildData(`${path}/${id}`, 'started', true)
            await setChildData(`${path}/${id}`, 'startedAt', new Date().toISOString())
        } catch (e) {
            console.error('Failed to set started flag', e)
            alert('Failed to start match — try again')
            match._started = false
        }
    }
}

async function endMatch(match) {
    if (!currentUser.value) { alert('Please sign in'); return }
    if (!isHost(match)) { alert('Only the host may end this match'); return }
    if (!confirm('End this match now?')) return
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
        } catch (e) {
            console.error('Failed to end match', e)
            alert('Failed to end match — try again')
            // if the write failed, we may want to revert optimistic change
            try { match.started = true } catch(_){}
        }
    }
}

function playMatch(match) {
    // only allowed when started
    if (!(match.started || match._started)) { alert('Match has not been started by the host yet'); return }
    // placeholder: open match view or mark user as 'in play'
    alert('Entering match live view — implement actual play flow')
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

// pushDataToFirebase('TEST', 123);
</script>

<style scoped>
.large-card {
    padding: 28px;
    border:1px solid #22272e;
    background-color: transparent;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px
}

.matches-header { align-items: flex-start }
.matches-title { color: #ff9a3c; font-size: 48px; margin: 0; font-weight: 800 }
.matches-desc { color: #9fb0bf; margin-top: 8px; font-size: 18px }

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
}
.btn-create-match .icon-circle { background: rgba(0,0,0,0.08); padding: 6px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center }

.tabs-pill { display: inline-flex; gap: 0; background: rgba(255,255,255,0.02); padding: 6px; border-radius: 10px }
.tab-pill { background: transparent; border: none; color: #9fb0bf; padding: 10px 18px; border-radius: 10px; cursor: pointer }
.tab-pill.active { background: #0b1220; color: #fff }

.tabs {
    margin-top: 18px;
    display: flex;
    gap: 12px
}

.tab {
    background: rgba(255, 255, 255, 0.03);
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
.avatar-stack .avatar-initial { width:36px; height:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#1f262b; color:#fff; font-weight:700; border:2px solid rgba(0,0,0,0.6); margin-left:-12px; font-size:0.85rem }
.avatar-stack .avatar-initial:first-child { margin-left:0 }
.avatar-stack .avatar.extra { margin-left:8px; background:#2b2f33; width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:0.85rem }

/* image avatar style (match initials look) */
.avatar-img { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid rgba(0,0,0,0.6); margin-left:-12px }


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
.btn-join[disabled] { opacity: 0.45; cursor: not-allowed }

@media (min-width: 768px) {
    .match-card {
        flex-direction: column
    }

    .match-right {
        align-items: flex-end
    }
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
.match-card.host-match .match-people { color: #111 }

.section-heading { color: #ff9a3c; font-weight: 800; margin-top: 18px; margin-bottom: 12px }

/* Prevent container overflow from accidental wide children */
.large-card, .matches-grid {
    overflow: hidden;
}

/* Embedded compact header & empty state */
.embedded-header {
    display:flex;
    justify-content:space-between;
    align-items:center;
    padding: 10px 6px;
    margin-top: 8px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255,255,255,0.02);
}
.embedded-title { font-size: 1.25rem; font-weight: 800; color: #fff }
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
.embedded-empty-state p { color: #9fb0bf; margin: 0 }
.embedded-empty-state p.lead { color: #ffffff; font-weight: 700; font-size: 1.05rem }

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
</style>