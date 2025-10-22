<template>
    <div class="page-bg">
        <div class="card large-card">
            <div class="page-header matches-header">
                <div>
                    <h1 class="matches-title">Match Organizer</h1>
                    <p class="matches-desc">Create and join public or private basketball games.</p>
                </div>
                <div>
                    <button class="btn-create-match" @click="showAddMatchModal = true"><span class="icon-circle"><i class="bi bi-plus-lg"></i></span> Create Match</button>
                </div>
            </div>

            <div class="tabs mb-3">
                <div class="tabs-pill" role="tablist" aria-label="Match tabs">
                    <button :class="['tab-pill', selectedTab === 'all' ? 'active' : '']" @click="selectedTab = 'all'">All Matches</button>
                    <button :class="['tab-pill', selectedTab === 'my' ? 'active' : '']" @click="selectedTab = 'my'">My Matches</button>
                </div>
            </div>

            <div class="row g-3 matches-grid">
                <div class="col-12 col-md-6 col-xl-4" v-for="(match, idx) in filteredMatches" :key="match?.id || idx">
                    <router-link v-if="match" :to="match && match.id ? `/matches/${match.id}` : '#'" class="card match-card h-100 text-reset text-decoration-none">
                        <div class="card-body d-flex flex-column h-100 p-4">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <h3 class="match-title mb-1">{{ match.title }}</h3>
                                    <div class="match-sub small">{{ match.location }}</div>
                                </div>
                                <div class="text-end text-warning fw-bold small">
                                    <i class="bi bi-people-fill me-1"></i> {{ (match.players || []).length }}/{{ match.maxPlayers || 0 }}
                                </div>
                            </div>

                            <div class="match-meta mb-3">{{ match.time }}</div>

                            <div class="mb-3">
                                <span class="badge bg-secondary me-2">{{ match.level }}</span>
                                <span class="badge bg-warning text-dark">{{ match.visibility }}</span>
                            </div>

                            <div class="avatars mb-3">
                                <div class="avatar-stack me-2">
                                    <template v-for="(name, i) in visiblePlayers(match.players || [])" :key="i">
                                        <span class="avatar-initial">{{ initials(name) }}</span>
                                    </template>
                                    <span v-if="(match.players || []).length > maxAvatars" class="avatar extra">+{{ (match.players || []).length - maxAvatars }}</span>
                                </div>
                            </div>

                            <div class="mt-auto d-flex justify-content-between align-items-center">
                                <div class="btn-group">
                                    <template v-if="isJoined(match)">
                                        <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center"><i class="bi bi-person-plus me-2"></i>Invite</button>
                                        <button type="button" class="btn btn-danger btn-sm ms-2 d-flex align-items-center" @click.prevent="leaveMatch(match)"><i class="bi bi-box-arrow-right me-2"></i>Leave</button>
                                    </template>
                                    <template v-else>
                                        <button type="button" :class="['btn', 'btn-join', 'btn-sm']" :disabled="!canJoin(match)" @click.prevent="joinMatch(match)">Join</button>
                                    </template>
                                </div>
                                <div>
                                    <button class="btn btn-link text-white-50 small">View</button>
                                </div>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>
    </div>

    <!-- render modal inside template so Vue can mount it -->
    <AddMatchModal v-if="showAddMatchModal" :courtList="courts" @close="showAddMatchModal = false" @created="(async () => { await loadMatches(); showAddMatchModal=false })()" />

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDataFromFirebase, pushDataToFirebase, overwriteDataToFirebase } from '../firebase/firebase'
import { onUserStateChanged } from '../firebase/auth'
import { getDataFromFirebase as getDb } from '../firebase/firebase'
import AddMatchModal from './AddMatchModal.vue'

const maxAvatars = 6

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

onMounted(async () => {
    await loadMatches()
    await loadCourts()
    // listen for auth state and load user profile
    onUserStateChanged(async (u) => {
        currentUser.value = u
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

async function loadMatches() {
    try {
        const data = await getDataFromFirebase('matches')
        if (!data) matches.value = []
        else if (Array.isArray(data)) matches.value = data
        else matches.value = Object.entries(data).map(([id, v]) => ({ id, ...v }))
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

const filteredMatches = computed(() => {
    if (selectedTab.value === 'all') return matches.value
    // 'my' matches: matches the current user owns or has joined
    if (!currentUser.value) return []
    return matches.value.filter(m => {
        const uid = currentUser.value && currentUser.value.uid
        const joined = m && m.joinedBy && uid && Boolean(m.joinedBy[uid])
        const ownerMatch = m && (m.owner === uid || m.owner === currentUserProfile.value.name || m.owner === (currentUser.value.displayName || ''))
        return joined || ownerMatch
    })
})

function visiblePlayers(arr) {
    return arr.slice(0, maxAvatars)
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

async function joinMatch(match) {
    if (!currentUser.value) { alert('Please sign in to join'); return }
    if (!canJoin(match)) { alert('Your skill level is below the match requirement'); return }
    const uid = currentUser.value.uid
    match.players = match.players || []
    match.joinedBy = match.joinedBy || {}
    if (match.joinedBy[uid]) return // already joined
    match.players.push(currentUserProfile.value.name || currentUser.value.displayName || uid)
    match.joinedBy[uid] = true
    // persist
    if (match.id) {
        try {
            await overwriteDataToFirebase(match.id, 'matches', match)
        } catch (e) {
            console.error('Failed to join match', e)
            alert('Failed to join — try again')
        }
    }
}

async function leaveMatch(match) {
    if (!currentUser.value) { alert('Please sign in'); return }
    const uid = currentUser.value.uid
    match.joinedBy = match.joinedBy || {}
    if (!match.joinedBy[uid]) return
    delete match.joinedBy[uid]
    match.players = (match.players || []).filter(p => p !== (currentUserProfile.value.name || currentUser.value.displayName || uid))
    if (match.id) {
        try {
            await overwriteDataToFirebase(match.id, 'matches', match)
        } catch (e) {
            console.error('Failed to leave match', e)
            alert('Failed to leave — try again')
        }
    }
}

function isJoined(match) {
    if (!currentUser.value) return false
    return Boolean(match && match.joinedBy && match.joinedBy[currentUser.value.uid])
}

function initials(name) {
    if (!name) return ''
    return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
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

.match-meta {
    margin-top: 12px;
    color: #cbd6df
}

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

/* Prevent container overflow from accidental wide children */
.large-card, .matches-grid {
    overflow: hidden;
}
</style>