import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

console.log('main.js is loaded')

const app = createApp(App)
console.log('Vue app created')
app.use(router)
console.log('Router installed')
app.mount('#app')
console.log('Vue app mounted to #app')