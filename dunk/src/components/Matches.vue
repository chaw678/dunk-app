<template>
    <div class="page-bg">
        <div class="card large-card">
            <div class="page-header">
                <div>
                    <h1 class="card-title">Match Organizer</h1>
                    <p class="card-desc">Create and join public or private basketball games.</p>
                </div>
                <div>
                    <button class="create-btn big">＋ Create Match</button>
                </div>
            </div>

            <div class="tabs">
                <button :class="['tab', { active: selectedTab === 'all' }]" @click="selectedTab = 'all'">All
                    Matches</button>
                <button :class="['tab', { active: selectedTab === 'my' }]" @click="selectedTab = 'my'">My
                    Matches</button>
            </div>

            <div class="matches-grid">
                <router-link v-for="match in filteredMatches" :key="match.id" :to="`/matches/${match.id}`"
                    class="match-card">
                    <div class="match-left">
                        <h2 class="match-title">{{ match.title }}</h2>
                        <div class="match-sub">{{ match.location }}</div>
                        <div class="match-meta">{{ match.time }}</div>
                        <div class="badges">
                            <span class="pill">{{ match.level }}</span>
                            <span class="pill yellow">{{ match.visibility }}</span>
                        </div>

                        <div class="avatars">
                            <template v-for="(name, i) in visiblePlayers(match.players)" :key="i">
                                <span class="avatar-initial">{{ initials(name) }}</span>
                            </template>
                            <span v-if="match.players.length > maxAvatars" class="avatar extra">+{{ match.players.length
                                - maxAvatars }}</span>
                        </div>
                    </div>

                    <div class="match-right">
                        <div class="players"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z" />
                                <path fill-rule="evenodd" d="M8 8a3 3 0 100-6 3 3 0 000 6z" />
                            </svg> {{ match.players.length }}/{{ match.maxPlayers }}</div>
                        <div>
                            <button class="join">Join Game</button>
                            <button class="view">View Players</button>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getDataFromFirebase, pushDataToFirebase } from '../firebase/firebase'

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
matches.value = getDataFromFirebase('matches')
console.log('Fetched matches:', matches.value)


//use an input data field, add event listener to push to firebase
pushDataToFirebase('matches', {
    id: 3,
    title: '3v3 King of the Court',
    location: 'Jurong West Rooftop Court',
    time: 'Sat, 2:00 PM',
    level: 'Intermediate',
    visibility: 'Public',
    players: ['Liam Moon', 'Maya Noor', 'Nate Owen', 'Omar Park', 'Pia Quinn'],
    maxPlayers: 6,
    owner: 'alice'
})

const selectedTab = ref('all')

const filteredMatches = computed(() => {
    if (selectedTab.value === 'all') return matches.value
    // simple demo: 'my' matches where owner === 'alice'
    return matches.value.filter(m => m.owner === 'alice')
})

function visiblePlayers(arr) {
    return arr.slice(0, maxAvatars)
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
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px
}

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
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px
}

@media (min-width: 768px) {

    /* md */
    .matches-grid {
        grid-template-columns: repeat(2, 1fr)
    }
}

@media (min-width: 992px) {

    /* lg */
    .matches-grid {
        grid-template-columns: repeat(3, 1fr)
    }
}

.match-card {
    padding: 22px;
    background: #181c23;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    color: #ffffff;
    text-decoration: none
}

.match-card:hover {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    transform: translateY(-4px);
    transition: all 160ms ease
}

.match-card:visited,
.match-card:link {
    color: inherit
}

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
    font-size: 1.6rem
}

.match-sub {
    color: #cbd6df;
    margin-top: 6px
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

.avatars {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    align-items: center
}

.avatar-initial {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #2c323a;
    color: #fff;
    font-weight: 700
}

.avatar.extra {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #2b2f33;
    color: #fff
}

.players {
    color: #ffb14d;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px
}

.join {
    background: #ff9a3c;
    color: #111;
    padding: 10px 14px;
    border-radius: 8px;
    border: none
}

.view {
    background: transparent;
    color: #d7e3f6;
    border: none
}

@media (min-width: 768px) {
    .match-card {
        flex-direction: column
    }

    .match-right {
        align-items: flex-end
    }
}
</style>
