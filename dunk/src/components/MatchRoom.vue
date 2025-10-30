<template>
  <div class="matchroom-container">
    <header>
      <button @click="goBack" class="back-btn">← Back</button>
      <h1>{{ matchData.title || 'Current Match' }}</h1>
      <button @click="onEndMatch" class="end-match-btn">End Match</button>
    </header>

    <!-- Bench Section -->
    <section class="bench-section">
      <h2>Bench</h2>
      <p>Players who are ready to play. Drag them to a team.</p>
      <draggable
        v-model="bench"
        :group="'players'"
        :disabled="teamsLocked"
        class="bench-list"
        item-key="uid"
      >
        <template #item="{ element }">
          <div class="player-avatar">
            <img :src="element.avatar" class="avatar-img" />
            <span class="player-name">{{ element.name }}</span>
          </div>
        </template>
      </draggable>
    </section>

    <!-- Teams Grid -->
    <section class="teams-grid">
      <div :class="['team-card', teamAOutlineClass]" @click="!teamsLocked && selectWinner('A')">
        <h2>Team A</h2>
        <draggable v-model="teamA" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
          <template #item="{ element }">
            <div class="player-avatar">
              <img :src="element.avatar" class="avatar-img" />
              <span class="player-name">{{ element.name }}</span>
            </div>
          </template>
        </draggable>
      </div>
      <div :class="['team-card', teamBOutlineClass]" @click="!teamsLocked && selectWinner('B')">
        <h2>Team B</h2>
        <draggable v-model="teamB" :group="'players'" :disabled="teamsLocked" item-key="uid" class="team-drop-list">
          <template #item="{ element }">
            <div class="player-avatar">
              <img :src="element.avatar" class="avatar-img" />
              <span class="player-name">{{ element.name }}</span>
            </div>
          </template>
        </draggable>
      </div>
    </section>

    <!-- Match Controls -->
    <footer class="actions-row">
      <button @click="randomizeTeams" :disabled="teamsLocked">Randomize Teams</button>
      <button @click="confirmTeams" :disabled="teamsLocked || !(teamA.length && teamB.length)">Confirm Teams</button>
      <button v-if="teamsLocked && !roundActive" @click="startRound">Start Round</button>
      <button v-if="roundActive" @click="endRound">End Round</button>
      <button @click="addRound" :disabled="roundActive">Add Round</button>
    </footer>

    <!-- Stats Modal -->
    <StatisticsModal v-if="showStats" :stats="computedStats" @close="showStats=false" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import draggable from 'vuedraggable'
import { useRouter } from 'vue-router'
import { getDataFromFirebase, setChildData } from '../firebase/firebase'
// import your StatisticsModal if you want fancy end-of-match stats

const router = useRouter()

/** Initial player data */
const allPlayers = [
  // Example: { uid: 'p1', name: 'Wei_Ken', avatar: '/avatars/wei_ken.jpg' }
  // Populate from your match info/Firebase
]

const matchData = ref({ title: 'Lions Practice' }) // Replace with actual match loading
const bench = ref([...allPlayers])
const teamA = ref([])
const teamB = ref([])

const teamsLocked = ref(false)
const roundActive = ref(false)
const showStats = ref(false)

/** Computed classes for team outlines */
const teamAOutlineClass = computed(() =>
  teamA.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)
const teamBOutlineClass = computed(() =>
  teamB.value.length ? (roundActive.value ? 'active-pulse' : 'active-outline') : 'inactive-outline'
)

/** Shuffle bench/randomise teams and assign */
function randomizeTeams() {
  const shuffled = [...bench.value, ...teamA.value, ...teamB.value].sort(() => Math.random() - 0.5)
  teamA.value = []
  teamB.value = []
  shuffled.forEach((p, i) => {
    (i % 2 === 0 ? teamA.value : teamB.value).push(p)
  })
  bench.value = []
}
// You can annotate: "randomizeTeams() splits all players randomly between Team A and Team B"

function confirmTeams() {
  // Lock assignment
  teamsLocked.value = true;
  // Save to Firebase if needed: setChildData('matches/<matchid>/teams', { teamA: [...], teamB: [...] })
}

function startRound() {
  roundActive.value = true
  // Start Timer logic here (setInterval)
  // Animate border using CSS class
}
function endRound() {
  roundActive.value = false
  // End Timer logic (clearInterval)
  // Show controls for host to pick winner
}

function addRound() {
  // Setup for another round (unlock teams, reset timer, keep teams or clear)
  teamsLocked.value = false
}
function selectWinner(team) {
  // Only if not locked (ie, after round ended)
  if (!roundActive.value && teamsLocked.value) {
    // Increment stats for members of winning team both locally and with setChildData to Firebase!
    // Also increment user scores in Firebase
    // Record round result, update stats
    // Example:
    // if(team === 'A') { ... }
    // Use user uid and setChildData('users/<uid>/score', N+1)
    alert(`Team ${team} wins! (implement real logic here)`)
  }
}
function onEndMatch() {
  // End match, show modal with stats
  showStats.value = true
}
function goBack() { router.back() }
</script>

<style scoped>
.matchroom-container { background: #10121A; color: #fff; min-height: 100vh; padding: 32px; }
header { display: flex; align-items: center; justify-content: space-between; }
.bench-section, .team-card { background: #23262e; border-radius: 18px; padding: 20px 26px; margin-bottom: 22px; }
.bench-list, .team-drop-list { display: flex; gap: 28px; min-height: 100px; }
.player-avatar { display:flex; flex-direction:column; align-items:center; margin:0 10px; }
.avatar-img { width:60px; height:60px; border-radius:50%; border:3px solid #FFAD1D; object-fit:cover; }
.player-name { margin-top: 6px; color: #ffad1d; font-weight: 700; font-size: 0.95rem }
.team-card { min-width: 330px; flex: 1; border: 2.5px dashed #fff4d1; transition: border 0.3s; min-height: 200px; }
.active-outline { border: 2.5px solid #ffad1d !important; }
.inactive-outline { border: 2.5px dashed #ededed !important; }
.active-pulse { animation: pulseborder 1s infinite alternate; border: 2.5px solid #ffad1d !important; }
@keyframes pulseborder { from { box-shadow: 0 0 0 0 #ffad1d55; } to { box-shadow: 0 0 20px 8px #ffad1d90; } }
.actions-row { margin-top: 30px; display: flex; gap: 22px; justify-content: center; }
.back-btn, .end-match-btn { border:none; background:#B23B3B; color: #fff; border-radius: 8px; padding:9px 18px; font-weight:700; }
.bench-section p { font-size: 0.96rem; color: #ccc; margin-bottom:16px; }
.teams-grid { display: flex; gap: 34px; align-items: flex-start; justify-content: center; }
</style>
