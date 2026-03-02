import { computed, readonly, ref } from 'vue'
import { useWindowManager } from './useWindowManager'

export interface WdTopMenuItem {
  id: string
  label?: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  visible?: boolean
  type?: 'item' | 'divider'
  onClick?: () => void
  children?: readonly WdTopMenuItem[]
}

const menuByWindowId = ref<Record<string, readonly WdTopMenuItem[]>>({})

const setWindowMenuItems = (windowId: string, items: readonly WdTopMenuItem[]) => {
  const id = windowId.trim()
  if (!id) return
  menuByWindowId.value = {
    ...menuByWindowId.value,
    [id]: items,
  }
}

const clearWindowMenuItems = (windowId: string) => {
  const id = windowId.trim()
  if (!id) return

  const next = { ...menuByWindowId.value }
  delete next[id]
  menuByWindowId.value = next
}

const clearAllWindowMenus = () => {
  menuByWindowId.value = {}
}

export const useTopMenu = () => {
  const windowManager = useWindowManager()

  const focusedMenuItems = computed(() => {
    const focusedWindowId = windowManager.focusedWindow.value?.id
    if (!focusedWindowId) return []
    return menuByWindowId.value[focusedWindowId] ?? []
  })

  return {
    menuByWindowId: readonly(menuByWindowId),
    focusedMenuItems: readonly(focusedMenuItems),
    setWindowMenuItems,
    clearWindowMenuItems,
    clearAllWindowMenus,
  }
}
