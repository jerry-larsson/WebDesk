import type { App, Plugin } from 'vue'

import WdDesktop from '@/components/framework/WdDesktop.vue'
import WdDialog from '@/components/framework/WdDialog.vue'
import WdTaskbar from '@/components/framework/WdTaskbar.vue'
import WdTopMenu from '@/components/framework/WdTopMenu.vue'
import WdTopMenuDropdown from '@/components/framework/WdTopMenuDropdown.vue'
import WdTopMenuItems from '@/components/framework/WdTopMenuItems.vue'
import WdWindow from '@/components/framework/WdWindow.vue'

export { useWindowManager } from '@/composables/useWindowManager'
export type {
  WdManagedWindow,
  WdManagedWindowState,
  WdOpenWindowOptions,
} from '@/composables/useWindowManager'
export { useTopMenu } from '@/composables/useTopMenu'
export type { WdTopMenuItem } from '@/composables/useTopMenu'

export {
  WdDesktop,
  WdDialog,
  WdTaskbar,
  WdTopMenu,
  WdTopMenuDropdown,
  WdTopMenuItems,
  WdWindow,
}

const components: Array<[string, object]> = [
  ['WdDesktop', WdDesktop],
  ['WdDialog', WdDialog],
  ['WdTaskbar', WdTaskbar],
  ['WdTopMenu', WdTopMenu],
  ['WdTopMenuDropdown', WdTopMenuDropdown],
  ['WdTopMenuItems', WdTopMenuItems],
  ['WdWindow', WdWindow],
]

export const WebDeskPlugin: Plugin = {
  install(app: App) {
    for (const [name, component] of components) {
      app.component(name, component)
    }
  },
}

export default WebDeskPlugin
