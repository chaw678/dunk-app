import { createWebHistory, createRouter } from 'vue-router'
import MainMenu from '../components/MainMenu.vue'
import Home from '../components/Home.vue'
import HomePage from '../components/HomePage.vue'
import MatchRoom from '../components/MatchRoom.vue'
import Upload from '../components/FileUpload.vue'
import CourtFinder from '../components/CourtFinder.vue'
import LoginPage from '../components/LoginPage.vue'
import Leaderboard from '../components/Leaderboard.vue'
// Placeholder pages (added so sidebar links resolve)
import Matches from '../components/Matches.vue'
import Forum from '../components/Forum.vue'
import Profile from '../components/Profile.vue'

const history = createWebHistory()

const routes = [
    { path: '/', component: MainMenu },
    { path: '/home', component: Home },
    { path: '/homepage', component: HomePage },
    { path: '/match/:id', component: MatchRoom, name: 'MatchRoom' },
    { path: '/match/:id/round', component: () => import('../components/RoundStarted.vue'), name: 'RoundStarted' },
    { path: '/upload', component: Upload },
    { path: '/court-finder', component: CourtFinder },
    { path: '/matches', component: Matches },
    { path: '/forum', component: Forum },
  { path: '/leaderboard', component: Leaderboard },
    { path: '/profile/:uid', name: 'PublicProfile', component: Profile  },
    { path: '/login', component: LoginPage },
]

// const router = createRouter({ history, routes })
// export default router


const router = createRouter({
  history,
  routes,
  scrollBehavior(to, from, savedPosition) {
    // FORCE an instant jump to top-left corner — disables all animation/saved scroll
    return new Promise((resolve) => {
      // Wait for DOM paint to ensure route has mounted
      setTimeout(() => {
        resolve({ left: 0, top: 0 })
      }, 0)
    })
  }
})

export default router


