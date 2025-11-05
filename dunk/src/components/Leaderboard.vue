<template>
  <div class="lb-wrap container text-white py-3" style="max-width: 1040px;">
    <div class="d-flex align-items-center mb-1">
      <Crown :size="22" class="me-2 text-warning" />
      <h2 class="mb-0 fw-bold text-warning">Leaderboard</h2>
    </div>
    <p class="text-light mb-3 small">See who's at the top of their game.</p>

    <!-- Segmented tabs -->
    <div class="segmented mb-3" role="tablist" aria-label="Leaderboard filter">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        role="tab"
        class="seg-btn"
        :class="{ active: selectedTab === tab.key }"
        @click="selectedTab = tab.key"
      >{{ tab.label }}</button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Loading…</span></div>
    </div>

    <div v-else>
      <!-- Top 3 Podium -->
      <div v-if="displayed.length >= 3" class="podium-container mb-4">
        <div class="podium">
          <!-- 2nd Place (Left) -->
          <div class="podium-place second">
            <div class="podium-player clickable" @click="$router.push(`/profile/${displayed[1].uid}`)">
              <img :src="displayed[1].photoURL || avatarFor(displayed[1])" class="podium-avatar" alt="avatar" />
              <div class="podium-medal m-2"><Crown :size="18" /></div>
              <div class="podium-name">{{ displayed[1].name || displayed[1].username || 'Anonymous' }}</div>
              <div class="podium-score">{{ Number(displayed[1].tabWins||0) }}</div>
            </div>
            <div class="podium-bar second-bar">
              <div class="podium-rank">2</div>
            </div>
          </div>
          
          <!-- 1st Place (Center) -->
          <div class="podium-place first">
            <div class="podium-player clickable" @click="$router.push(`/profile/${displayed[0].uid}`)">
              <img :src="displayed[0].photoURL || avatarFor(displayed[0])" class="podium-avatar" alt="avatar" />
              <div class="podium-medal m-1"><Crown :size="20" /></div>
              <div class="podium-name">{{ displayed[0].name || displayed[0].username || 'Anonymous' }}</div>
                <div class="podium-score">{{ Number(displayed[0].tabWins||0) }}</div>
            </div>
            <div class="podium-bar first-bar">
              <div class="podium-rank">1</div>
            </div>
          </div>
          
          <!-- 3rd Place (Right) -->
          <div class="podium-place third">
            <div class="podium-player clickable" @click="$router.push(`/profile/${displayed[2].uid}`)">
              <img :src="displayed[2].photoURL || avatarFor(displayed[2])" class="podium-avatar" alt="avatar" />
              <div class="podium-medal m-3"><Crown :size="16" /></div>
              <div class="podium-name">{{ displayed[2].name || displayed[2].username || 'Anonymous' }}</div>
                <div class="podium-score">{{ Number(displayed[2].tabWins||0) }}</div>
            </div>
            <div class="podium-bar third-bar">
              <div class="podium-rank">3</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboard Table -->
      <div class="leaderboard-card rounded-3">
        <div class="lb-header small text-secondary d-flex py-2 px-3">
          <div class="col-rank">Rank</div>
          <div class="flex-grow-1">Player</div>
          <div class="col-score text-end">Score</div>
        </div>

        <div class="lb-rows">
          <div
            v-for="(p, idx) in displayed.slice(3)"
            :key="p.uid"
            class="lb-row d-flex align-items-center px-3"
          >
            <div class="col-rank">
              <span class="rank-num">{{ idx + 4 }}</span>
            </div>
            <div class="flex-grow-1 d-flex align-items-center gap-3 py-2">
              <img :src="p.photoURL || avatarFor(p)" class="avatar" alt="avatar" />
              <div>
                <div class="fw-semibold text-warning">{{ p.name || p.username || 'Anonymous' }}</div>
                <div class="text-secondary small">{{ p.email || '—' }}</div>
              </div>
            </div>
            <div class="col-score text-end fw-bold text-warning">{{ Number(p.tabWins||0) }}</div>
          </div>

          <div v-if="displayed.length === 0" class="text-center text-light py-4">No players for this tab yet.</div>
          <div v-else-if="displayed.length < 4" class="text-center text-light py-4">Not enough players to display more rankings.</div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { avatarForUser } from '../utils/avatar.js'
import { Crown } from 'lucide-vue-next'
import { getDataFromFirebase } from '../firebase/firebase'

const loading = ref(true)
const usersArr = ref([])

const tabs = [
  // statKey refers to the camelCase flat win fields on the user object
  { key: 'professional', label: 'Professional', statKey: 'professionalWins' },
  { key: 'intermediate', label: 'Intermediate', statKey: 'intermediateWins' },
  { key: 'open', label: 'Open', statKey: 'openWins' }
]
const selectedTab = ref('professional')

function totalWinsOf(u) {
  // Use the flat camelCase fields directly
  const o = Number(u?.openWins ?? 0)
  const i = Number(u?.intermediateWins ?? 0)
  const p = Number(u?.professionalWins ?? 0)
  return o + i + p
}
function winsOf(u, key) {
  // key is expected to be a camelCase field name like 'openWins'
  return Number(u?.[key] ?? 0)
}

// adapter used in template
function avatarFor(u) { return avatarForUser(u) }

const displayed = computed(() => {
  const tab = tabs.find(t => t.key === selectedTab.value) || tabs[0]
  const bySkill = (u) => (u?.skill || '').toString().toLowerCase() === tab.label.toLowerCase()
  const byWins = (u) => winsOf(u, tab.statKey) > 0
  const filtered = usersArr.value
    .map(u => ({ ...u, totalWins: totalWinsOf(u), tabWins: winsOf(u, tab.statKey) }))
    .filter(u => bySkill(u) || byWins(u))

  // Primary sort by wins for the selected tab, then by totalWins, then name
  filtered.sort((a,b) => (Number(b.tabWins||0) - Number(a.tabWins||0)) || (Number(b.totalWins||0) - Number(a.totalWins||0)) || ((b.name||'').localeCompare(a.name||'')))
  return filtered.slice(0, 50)
})

onMounted(async () => {
  try {
    const users = await getDataFromFirebase('users')
    const arr = Object.entries(users || {}).map(([uid, u]) => ({ uid, ...u }))
    // Do not inject demo scores; rely on flat win fields (professionalWins, intermediateWins, openWins) from the DB.
    usersArr.value = arr
  } catch (e) {
    usersArr.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.lb-wrap { background: transparent; }
.segmented { display:flex; gap:8px; background:#12161b; padding:6px; border:1px solid rgba(255,255,255,0.06); border-radius:10px; }
.seg-btn { flex:1; background:#1c2229; color:#cbd5e1; border:1px solid transparent; padding:10px 14px; border-radius:8px; font-weight:600; }
.seg-btn.active { background:#0f1318; color:#ffd27a; border-color:#ffad1d; box-shadow: 0 0 0 2px rgba(255,173,29,0.15) inset; }

.leaderboard-card { border:1px solid rgba(255,255,255,0.06); background:#0b1015; overflow:hidden; }
.lb-header { border-bottom:1px solid rgba(255,255,255,0.06); letter-spacing:.02em; }
.lb-rows { display:block; }
.lb-row { padding-top:10px; padding-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.06); }
.lb-row:hover { background: rgba(255,255,255,0.02); }
.col-rank { width:60px; text-align:center; }
.col-score { width:140px; }
.rank-num { color:#94a3b8; font-weight:700; display:inline-block; }
.avatar { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #FFAD1D; }

/* medals */
.medal { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; color:#0b1015; vertical-align:middle; }
.m-1 { background: linear-gradient(180deg,#ffd27a,#ffad1d); color:#0b1015; }
.m-2 { background: linear-gradient(180deg,#e5e7eb,#c9cdd6); color:#0b1015; }
.m-3 { background: linear-gradient(180deg,#eab58e,#b87333); color:#0b1015; }

/* Podium styles */
.podium-container { padding: 20px 0; }
.podium { display:flex; justify-content:center; align-items:flex-end; gap:16px; max-width:600px; margin:0 auto; }
.podium-place { display:flex; flex-direction:column; align-items:center; flex:1; max-width:180px; }
.podium-player { display:flex; flex-direction:column; align-items:center; margin-bottom:12px; }
.podium-avatar { width:64px; height:64px; border-radius:50%; object-fit:cover; border:3px solid; margin-bottom:8px; }
.first .podium-avatar { border-color:#ffad1d; width:72px; height:72px; }
.second .podium-avatar { border-color:#c9cdd6; }
.third .podium-avatar { border-color:#b87333; }
.podium-medal { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; margin-bottom:6px; }
.first .podium-medal { width:36px; height:36px; }
.podium-name { font-weight:700; font-size:0.95rem; text-align:center; margin-bottom:4px; color:#fff; }
.podium-score { font-weight:700; font-size:1.1rem; color:#ffad1d; }
.first .podium-score { font-size:1.3rem; }
.podium-bar { width:100%; border-radius:8px 8px 0 0; display:flex; align-items:center; justify-content:center; padding:12px 0; position:relative; }
.first-bar { height:140px; background:linear-gradient(180deg,rgba(255,210,122,0.15),rgba(255,173,29,0.08)); border:2px solid rgba(255,173,29,0.3); }
.second-bar { height:110px; background:linear-gradient(180deg,rgba(229,231,235,0.12),rgba(201,205,214,0.06)); border:2px solid rgba(201,205,214,0.25); }
.third-bar { height:90px; background:linear-gradient(180deg,rgba(234,181,142,0.12),rgba(184,115,51,0.06)); border:2px solid rgba(184,115,51,0.25); }
.podium-rank { position:absolute; top:12px; font-size:1.5rem; font-weight:800; color:rgba(255,255,255,0.15); }

@media (max-width: 640px) {
  .podium { gap:8px; }
  .podium-place { max-width:140px; }
  .podium-avatar { width:48px; height:48px; }
  .first .podium-avatar { width:56px; height:56px; }
  .podium-name { font-size:0.85rem; }
  .podium-score { font-size:0.95rem; }
  .first .podium-score { font-size:1.1rem; }
  .first-bar { height:120px; }
  .second-bar { height:95px; }
  .third-bar { height:75px; }
}
</style>
