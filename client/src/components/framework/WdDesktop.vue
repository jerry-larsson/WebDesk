<template>
  <div ref="desktopRef" class="wd-desktop" :style="desktopStyle" @pointerdown="handlePointerDown">
    <div ref="workAreaRef" class="wd-desktop__workarea" aria-hidden="true" />
    <div class="wd-desktop__icons">
      <slot name="icons" />
    </div>
    <div
      v-for="window in managedWindows"
      :key="window.id"
      class="wd-desktop__managed-window"
      :data-wd-managed-window-id="window.id"
    >
      <component
        :is="window.component"
        v-bind="{ ...window.props, windowId: window.id }"
        @close="windowManager.closeWindow(window.id)"
        @minimize="windowManager.minimizeWindow(window.id)"
        @props-change="handleWindowPropsChange(window.id, $event)"
        @state-change="handleWindowStateChange(window.id, $event)"
      />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { wdDesktopContextKey, type WdDesktopContext } from './WdDesktopContext'
import { useWindowManager, type WdManagedWindowState } from '@/composables/useWindowManager'

const props = withDefaults(
  defineProps<{
    background?: string
  }>(),
  {
    background:
      'radial-gradient(120% 80% at 15% 10%, rgba(255, 255, 255, 0.14) 0%, transparent 50%), linear-gradient(140deg, #1f2937 0%, #27364f 45%, #0f1c2f 100%)',
  },
)

const desktopRef = ref<HTMLElement | null>(null)
const workAreaRef = ref<HTMLElement | null>(null)
const zCounter = ref(10)
const activeWindowId = ref<number | null>(null)
const windowManager = useWindowManager()

const managedWindows = computed(() => {
  return windowManager.windows.value
    .map(window => ({
      ...window,
      component: windowManager.resolveWindowComponent(window.name),
    }))
    .filter(window => window.component)
})

const desktopStyle = computed(() => ({
  background: props.background,
}))

const requestFocus = (windowId: number) => {
  activeWindowId.value = windowId
  zCounter.value += 1
  return zCounter.value
}

const requestZIndex = () => {
  zCounter.value += 1
  return zCounter.value
}

const handlePointerDown = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null
  if (!target) return

  const clickedWindow = target.closest('.wd-window')
  const clickedTopMenu = target.closest('.wd-top-menu')
  const clickedTaskbar = target.closest('.wd-taskbar')
  if (!clickedWindow && !clickedTopMenu && !clickedTaskbar) {
    activeWindowId.value = null
  }
}

const handleWindowStateChange = (id: string, state: WdManagedWindowState) => {
  windowManager.updateWindowState(id, state)
  if (state.isMinimized && state.isFocused) {
    activeWindowId.value = null
  }
}

const handleWindowPropsChange = (id: string, props: Record<string, unknown>) => {
  windowManager.updateWindowProps(id, props)
}

const focusManagedWindow = (id: string) => {
  const root = desktopRef.value
  if (!root) return false

  const host = Array.from(root.querySelectorAll<HTMLElement>('[data-wd-managed-window-id]'))
    .find(element => element.dataset.wdManagedWindowId === id)
  const windowEl = host?.querySelector<HTMLElement>('.wd-window')
  if (!windowEl) return false

  windowEl.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true,
    cancelable: true,
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
  }))

  return true
}

onMounted(() => {
  windowManager.setFocusWindowHandler(focusManagedWindow)
})

onBeforeUnmount(() => {
  windowManager.setFocusWindowHandler(null)
})

provide<WdDesktopContext>(wdDesktopContextKey, {
  desktopRef,
  workAreaRef,
  activeWindowId,
  requestFocus,
  requestZIndex,
})
</script>

<style scoped>
.wd-desktop {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.wd-desktop__workarea {
  position: absolute;
  inset: 0;
  top: var(--wd-top-menu-space, 0px);
  bottom: var(--wd-taskbar-space, 0px);
  pointer-events: none;
}

.wd-desktop__icons {
  position: absolute;
  inset: 0;
  top: var(--wd-top-menu-space, 0px);
  bottom: var(--wd-taskbar-space, 0px);
  z-index: 1;
  pointer-events: none;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 10px 10px;
  align-content: start;
  justify-content: flex-start;
}

.wd-desktop__icons :deep(*) {
  pointer-events: auto;
}
</style>
