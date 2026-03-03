import WdAuthGate from '@/components/framework/WdAuthGate.vue'
import WdDesktop from '@/components/framework/WdDesktop.vue'
import WdDialog from '@/components/framework/WdDialog.vue'
import WdLoginForm from '@/components/framework/WdLoginForm.vue'
import WdTaskbar from '@/components/framework/WdTaskbar.vue'
import WdTopMenu from '@/components/framework/WdTopMenu.vue'
import WdTopMenuDropdown from '@/components/framework/WdTopMenuDropdown.vue'
import WdTopMenuItems from '@/components/framework/WdTopMenuItems.vue'
import WdWindow from '@/components/framework/WdWindow.vue'
export { createWebDeskAuth } from '@/auth/config'
export type { WebDeskAuthConfig } from '@/auth/config'
export type {
  AuthAdapter,
  AuthCredentials,
  AuthError,
  AuthSession,
  AuthStateSnapshot,
  AuthStatus,
  AuthUser,
  LoginFieldSpec,
} from '@/auth/types'
export { useAuth, useRequireAuth } from '@/composables/useAuth'

export { useWindowManager } from '@/composables/useWindowManager'
export type {
  WdManagedWindow,
  WdManagedWindowState,
  WdOpenWindowOptions,
} from '@/composables/useWindowManager'
export { useTopMenu } from '@/composables/useTopMenu'
export type { WdTopMenuItem } from '@/composables/useTopMenu'

export {
  WdAuthGate,
  WdDesktop,
  WdDialog,
  WdLoginForm,
  WdTaskbar,
  WdTopMenu,
  WdTopMenuDropdown,
  WdTopMenuItems,
  WdWindow,
}

const components: Array<[string, object]> = [
  ['WdAuthGate', WdAuthGate],
  ['WdDesktop', WdDesktop],
  ['WdDialog', WdDialog],
  ['WdLoginForm', WdLoginForm],
  ['WdTaskbar', WdTaskbar],
  ['WdTopMenu', WdTopMenu],
  ['WdTopMenuDropdown', WdTopMenuDropdown],
  ['WdTopMenuItems', WdTopMenuItems],
  ['WdWindow', WdWindow],
]

export const WebDeskPlugin = {
  install(app: any) {
    for (const [name, component] of components) {
      app.component(name, component)
    }
  },
}

export default WebDeskPlugin
