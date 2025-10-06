import { createWebHistory, createRouter } from 'vue-router'
import MainMenu from '../components/MainMenu.vue'
import HelloWorld from '../components/HelloWorld.vue'
import Home from '../components/Home.vue'
import Upload from '../components/FileUpload.vue'
import CourtFinder from '../components/CourtFinder.vue'
import LoginPage from '../components/LoginPage.vue'
// Placeholder pages (added so sidebar links resolve)
import Matches from '../components/Matches.vue'
import Teams from '../components/Teams.vue'
import News from '../components/News.vue'
import Skills from '../components/Skills.vue'

const history = createWebHistory()

const routes = [
    { path: '/', component: MainMenu },
    { path: '/hello', component: HelloWorld },
    { path: '/home', component: Home },
    { path: '/upload', component: Upload },
    { path: '/court-finder', component: CourtFinder },
    { path: '/matches', component: Matches },
    { path: '/teams', component: Teams },
    { path: '/news', component: News },
    { path: '/skills', component: Skills },
    { path: '/login', component: LoginPage },
]

const router = createRouter({ history, routes })
export default router