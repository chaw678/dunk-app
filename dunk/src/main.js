import { createApp } from 'vue' 
import router from './route/routes.js' // for routing 
import './style.css' 
import App from './App.vue' 
import 'bootstrap/dist/css/bootstrap.min.css'

const app = createApp(App) 
app.use(router).mount('#app')