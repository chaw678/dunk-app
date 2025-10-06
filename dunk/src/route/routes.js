import { createWebHistory, createRouter } from "vue-router"; 
import MainMenu from '../components/MainMenu.vue'; 
import HelloWorld from '../components/HelloWorld.vue'; 
import Home from '../components/Home.vue'; 
import Upload from '../components/FileUpload.vue'; 
const history = createWebHistory() 
const routes = [ { path: '/', component: MainMenu }, 
    { path: '/Hello/', component: HelloWorld }, 
    { path: '/Home/', component: Home }, 
    {path: '/Upload/', component: Upload }, ] 
const router = createRouter({ history, routes }); 
export default router;