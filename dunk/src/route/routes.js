import { createWebHistory, createRouter } from 'vue-router'
import MainMenu from '../components/MainMenu.vue'
import Home from '../components/Home.vue'
import Upload from '../components/FileUpload.vue'
import CourtFinder from '../components/CourtFinder.vue'
import LoginPage from '../components/LoginPage.vue'
// Placeholder pages (added so sidebar links resolve)
import Matches from '../components/Matches.vue'
import Forum from '../components/Forum.vue'

const history = createWebHistory()

const routes = [
    { path: '/', component: MainMenu },
    { path: '/home', component: Home },
    { path: '/upload', component: Upload },
    { path: '/court-finder', component: CourtFinder },
    { path: '/matches', component: Matches },
    { path: '/forum', component: Forum },
    { path: '/login', component: LoginPage },
]

const router = createRouter({ history, routes })
export default router