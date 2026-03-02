/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'
import { createWebDeskAuth } from '@/auth/config'
import { demoAuthAdapter } from '@/auth/demoAdapter'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)

registerPlugins(app)
app.use(createWebDeskAuth({
  adapter: demoAuthAdapter,
  autoBootstrap: true,
  allowAnonymous: false,
}))

app.mount('#app')
