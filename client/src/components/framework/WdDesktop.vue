<template>
  <div ref="desktopRef" class="wd-desktop" :style="desktopStyle" @pointerdown="handlePointerDown">
    <div ref="workAreaRef" class="wd-desktop__workarea" aria-hidden="true" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { wdDesktopContextKey, type WdDesktopContext } from './WdDesktopContext'

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
  if (!target?.closest('.wd-window')) {
    activeWindowId.value = null
  }
}

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
  bottom: var(--wd-taskbar-space, 0px);
  pointer-events: none;
}
</style>
