import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import BrandLink from './components/BrandLink.vue'

createApp(App).component('BrandLink', BrandLink).use(router).mount('#app')
