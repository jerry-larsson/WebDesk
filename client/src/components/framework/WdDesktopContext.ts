import type { Ref } from 'vue'

export interface WdDesktopContext {
  desktopRef: Ref<HTMLElement | null>
  workAreaRef: Ref<HTMLElement | null>
  activeWindowId: Ref<number | null>
  requestFocus: (windowId: number) => number
  requestZIndex?: () => number
}

export const wdDesktopContextKey = Symbol('wdDesktopContext')
