<template>
  <v-sheet :class="windowClasses" :color="windowColor" :elevation="windowElevation" :style="windowStyle" tag="article"
    @pointerdown="bringToFront">
    <header :class="titlebarClasses" @pointerdown="startDrag">
      <div class="wd-window__titlebar-start">
        <slot name="titlebar-start" />
      </div>

      <div :class="titleClasses">
        <slot name="title">{{ title }}</slot>
      </div>

      <div class="wd-window__titlebar-end" @pointerdown.stop>
        <slot name="titlebar-end">
          <v-btn-group class="wd-window__titlebar-actions" variant="text">
            <v-btn density="comfortable" icon="mdi-minus" size="small" @click.stop="onMinimizeClick" />
            <v-btn density="comfortable" :icon="isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize'" size="small"
              @click.stop="onMaximizeClick" />
            <v-btn class="wd-window__close-btn" density="comfortable" icon="mdi-close" size="small" @click.stop="onCloseClick" />
          </v-btn-group>
        </slot>
      </div>
    </header>

    <section class="wd-window__content">
      <slot />
    </section>

    <footer v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </footer>

    <v-overlay :model-value="!isFocused" attach persistent class="wd-window__dim-overlay"></v-overlay>

    <span v-for="handle in resizeHandles" :key="handle" class="wd-window__resize-handle" :class="`is-${handle}`"
      @pointerdown="(event) => startResize(event, handle)" />
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'
import { wdDesktopContextKey, type WdDesktopContext } from './WdDesktopContext'

type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
type SnapSide = 'left' | 'right' | 'maximized' | null
type DesktopRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
let nextWindowId = 1

const props = withDefaults(
  defineProps<{
    title?: string
    x?: number
    y?: number
    width?: number
    height?: number
    minWidth?: number
    minHeight?: number
    zIndex?: number
  }>(),
  {
    title: 'Window',
    x: 100,
    y: 80,
    width: 520,
    height: 360,
    minWidth: 260,
    minHeight: 180,
    zIndex: 1,
  },
)
const emit = defineEmits<{
  close: []
  minimize: []
  maximizeToggle: [maximized: boolean]
}>()

const desktop = inject<WdDesktopContext | null>(wdDesktopContextKey, null)
const windowId = nextWindowId++

const posX = ref(props.x)
const posY = ref(props.y)
const winWidth = ref(props.width)
const winHeight = ref(props.height)
const activeZIndex = ref(props.zIndex)
const snappedSide = ref<SnapSide>(null)
const restoreBounds = ref<{ x: number, y: number, width: number, height: number } | null>(null)
const isInteracting = ref(false)
const isFocused = computed(() => !desktop || desktop.activeWindowId.value === windowId)
const isMaximized = computed(() => snappedSide.value === 'maximized')

const windowClasses = computed(() => [
  'wd-window',
  'rounded-lg',
  !isInteracting.value && 'wd-window--animated',
  isMaximized.value && 'wd-window--maximized',
  isFocused.value ? 'wd-window--focused' : 'wd-window--unfocused',
])
const windowColor = computed(() => 'surface')
const windowElevation = computed(() => (isMaximized.value ? 0 : isFocused.value ? 5 : 1))

const titlebarClasses = computed(() => [
  'wd-window__titlebar',
  'text-high-emphasis',
])

const titleClasses = computed(() => [
  'wd-window__title',
  'text-high-emphasis',
])

const footerClasses = computed(() => [
  'wd-window__footer',
  'text-high-emphasis',
])

const resizeHandles: ResizeDirection[] = [
  'top',
  'right',
  'bottom',
  'left',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const SNAP_THRESHOLD_PX = 16

const getDesktopRect = (): DesktopRect | null => {
  const workAreaEl = desktop?.workAreaRef?.value ?? desktop?.desktopRef.value
  if (!workAreaEl) return null

  return workAreaEl.getBoundingClientRect()
}

const bringToFront = () => {
  if (!desktop) return
  if (typeof desktop.requestFocus === 'function') {
    activeZIndex.value = desktop.requestFocus(windowId)
    return
  }

  if (typeof desktop.requestZIndex === 'function') {
    activeZIndex.value = desktop.requestZIndex()
  }
}

const windowStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  width: `${winWidth.value}px`,
  height: `${winHeight.value}px`,
  zIndex: activeZIndex.value,
}))

const onCloseClick = () => {
  emit('close')
}

const onMinimizeClick = () => {
  emit('minimize')
}

const onMaximizeClick = () => {
  const desktopRect = getDesktopRect()
  if (!desktopRect) return

  bringToFront()

  if (snappedSide.value === 'maximized' && restoreBounds.value) {
    const restore = restoreBounds.value
    posX.value = restore.x
    posY.value = restore.y
    winWidth.value = restore.width
    winHeight.value = restore.height
    snappedSide.value = null
    restoreBounds.value = null
    emit('maximizeToggle', false)
    return
  }

  if (!restoreBounds.value) {
    restoreBounds.value = {
      x: posX.value,
      y: posY.value,
      width: winWidth.value,
      height: winHeight.value,
    }
  }

  snappedSide.value = 'maximized'
  posX.value = 0
  posY.value = 0
  winWidth.value = desktopRect.width
  winHeight.value = desktopRect.height
  emit('maximizeToggle', true)
}

const startDrag = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const target = event.target as HTMLElement
  if (target.closest('.wd-window__resize-handle')) return

  event.preventDefault()
  bringToFront()
  isInteracting.value = true
    ; (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)

  const startMouseX = event.clientX
  const startMouseY = event.clientY
  let dragStartMouseX = event.clientX
  let dragStartMouseY = event.clientY
  let dragStartX = posX.value
  let dragStartY = posY.value
  let didDrag = false
  const pointerRatioX = winWidth.value > 0 ? (event.clientX - posX.value) / winWidth.value : 0.5
  const pointerRatioY = winHeight.value > 0 ? (event.clientY - posY.value) / winHeight.value : 0.1

  const desktopRect = getDesktopRect()

  const onMove = (moveEvent: PointerEvent) => {
    if (!didDrag && Math.hypot(moveEvent.clientX - startMouseX, moveEvent.clientY - startMouseY) > 4) {
      didDrag = true
    }

    if (desktopRect && snappedSide.value && restoreBounds.value) {
      const localMouseX = moveEvent.clientX - desktopRect.left
      const localMouseY = moveEvent.clientY - desktopRect.top
      const movedEnough = Math.hypot(moveEvent.clientX - startMouseX, moveEvent.clientY - startMouseY) > 8
      const movedAwayFromEdge = snappedSide.value === 'left'
        ? localMouseX > SNAP_THRESHOLD_PX * 2
        : snappedSide.value === 'right'
          ? localMouseX < desktopRect.width - SNAP_THRESHOLD_PX * 2
          : localMouseY > SNAP_THRESHOLD_PX * 2

      if (movedEnough && movedAwayFromEdge) {
        const restore = restoreBounds.value
        const restoredWidth = restore.width
        const restoredHeight = restore.height

        winWidth.value = restoredWidth
        winHeight.value = restoredHeight
        snappedSide.value = null

        const restoredX = clamp(
          localMouseX - (pointerRatioX * restoredWidth),
          0,
          Math.max(0, desktopRect.width - restoredWidth),
        )
        const restoredY = clamp(
          (moveEvent.clientY - desktopRect.top) - (pointerRatioY * restoredHeight),
          0,
          Math.max(0, desktopRect.height - restoredHeight),
        )

        posX.value = restoredX
        posY.value = restoredY
        dragStartX = restoredX
        dragStartY = restoredY
        dragStartMouseX = moveEvent.clientX
        dragStartMouseY = moveEvent.clientY
      }
    }

    const nextX = dragStartX + (moveEvent.clientX - dragStartMouseX)
    const nextY = dragStartY + (moveEvent.clientY - dragStartMouseY)
    const maxX = desktopRect ? desktopRect.width - winWidth.value : Number.POSITIVE_INFINITY
    const maxY = desktopRect ? desktopRect.height - winHeight.value : Number.POSITIVE_INFINITY

    posX.value = desktopRect ? clamp(nextX, 0, Math.max(0, maxX)) : nextX
    posY.value = desktopRect ? clamp(nextY, 0, Math.max(0, maxY)) : nextY
  }

  const onUp = (upEvent: PointerEvent) => {
    let pendingSnap: { side: Exclude<SnapSide, null>, x: number, y: number, width: number, height: number } | null = null

    if (desktopRect && didDrag) {
      const localUpX = upEvent.clientX - desktopRect.left
      const localUpY = upEvent.clientY - desktopRect.top
      const isAtLeftEdge = localUpX <= SNAP_THRESHOLD_PX
      const isAtRightEdge = localUpX >= desktopRect.width - SNAP_THRESHOLD_PX
      const isAtTopEdge = localUpY <= SNAP_THRESHOLD_PX

      if (isAtLeftEdge || isAtRightEdge || isAtTopEdge) {
        if (!snappedSide.value || !restoreBounds.value) {
          restoreBounds.value = {
            x: posX.value,
            y: posY.value,
            width: winWidth.value,
            height: winHeight.value,
          }
        }

        pendingSnap = {
          side: isAtTopEdge ? 'maximized' : isAtLeftEdge ? 'left' : 'right',
          x: isAtTopEdge ? 0 : isAtLeftEdge ? 0 : desktopRect.width / 2,
          y: 0,
          width: isAtTopEdge ? desktopRect.width : desktopRect.width / 2,
          height: desktopRect.height,
        }
      } else {
        snappedSide.value = null
        restoreBounds.value = null
      }
    }

    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)

    if (pendingSnap) {
      isInteracting.value = false
      requestAnimationFrame(() => {
        snappedSide.value = pendingSnap!.side
        posX.value = pendingSnap!.x
        posY.value = pendingSnap!.y
        winWidth.value = pendingSnap!.width
        winHeight.value = pendingSnap!.height
      })
      return
    }

    requestAnimationFrame(() => {
      isInteracting.value = false
    })
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
}

const startResize = (event: PointerEvent, direction: ResizeDirection) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return

  event.preventDefault()
  event.stopPropagation()
  bringToFront()
  isInteracting.value = true
    ; (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(event.pointerId)
  snappedSide.value = null
  restoreBounds.value = null

  const startMouseX = event.clientX
  const startMouseY = event.clientY
  const startX = posX.value
  const startY = posY.value
  const startWidth = winWidth.value
  const startHeight = winHeight.value
  const desktopRect = getDesktopRect()

  const onMove = (moveEvent: PointerEvent) => {
    const deltaX = moveEvent.clientX - startMouseX
    const deltaY = moveEvent.clientY - startMouseY

    let nextX = startX
    let nextY = startY
    let nextWidth = startWidth
    let nextHeight = startHeight

    if (direction.includes('right')) {
      nextWidth = Math.max(props.minWidth, startWidth + deltaX)
    }
    if (direction.includes('bottom')) {
      nextHeight = Math.max(props.minHeight, startHeight + deltaY)
    }
    if (direction.includes('left')) {
      nextWidth = Math.max(props.minWidth, startWidth - deltaX)
      nextX = startX + (startWidth - nextWidth)
    }
    if (direction.includes('top')) {
      nextHeight = Math.max(props.minHeight, startHeight - deltaY)
      nextY = startY + (startHeight - nextHeight)
    }

    if (desktopRect) {
      if (nextX < 0) {
        nextWidth += nextX
        nextX = 0
      }
      if (nextY < 0) {
        nextHeight += nextY
        nextY = 0
      }

      if (nextX + nextWidth > desktopRect.width) {
        nextWidth = desktopRect.width - nextX
      }
      if (nextY + nextHeight > desktopRect.height) {
        nextHeight = desktopRect.height - nextY
      }

      nextWidth = Math.max(props.minWidth, nextWidth)
      nextHeight = Math.max(props.minHeight, nextHeight)
    }

    posX.value = nextX
    posY.value = nextY
    winWidth.value = nextWidth
    winHeight.value = nextHeight
  }

  const onUp = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    requestAnimationFrame(() => {
      isInteracting.value = false
    })
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
}

onMounted(() => {
  bringToFront()
})

</script>

<style scoped lang="scss">
.wd-window {
  position: absolute;
  display: flex;
  flex-direction: column;
  border: 1px solid transparent;
  backdrop-filter: blur(16px) saturate(130%);
  overflow: hidden;
  user-select: none;
  transition: box-shadow 120ms ease, border-color 120ms ease, background-color 120ms ease;
}

.wd-window--animated {
  transition:
    left 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    top 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    width 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 120ms ease,
    border-color 120ms ease,
    background-color 120ms ease;
}

.wd-window--focused {
  border-color: rgba(var(--v-theme-on-surface), 0.22);
}

.wd-window--unfocused {
  border-color: rgba(var(--v-theme-on-surface), 0.22);
}

.wd-window--maximized {
  border-color: transparent;
  border-radius: 0 !important;
}

.wd-window__titlebar {
  height: 42px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  background-color: inherit;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  cursor: move;
  touch-action: none;
}

.wd-window__titlebar-start,
.wd-window__titlebar-end {
  display: flex;
  align-items: center;
  height: 100%;
}

.wd-window__titlebar-end {
  margin-right: -12px;
}

.wd-window__titlebar-actions {
  height: 100%;
  min-height: 0;
  align-self: stretch;
  border-radius: 0;
}

.wd-window__titlebar-actions :deep(.v-btn) {
  height: 100%;
  min-height: 0;
  min-width: 40px;
  border-radius: 0;
}

.wd-window__close-btn:hover,
.wd-window__close-btn:focus-visible {
  background-color: #c42b1c !important;
  color: #ffffff !important;
}

.wd-window__title {
  min-width: 0;
  font-size: 0.92rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wd-window__content {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: inherit;
}

.wd-window__footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  background-color: inherit;
}

.wd-window__dim-overlay {
  pointer-events: none;

  * {
    pointer-events: none;
  }

  /* position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: rgba(var(--v-theme-on-surface), 0.14); */
}

.wd-window__resize-handle {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.wd-window__resize-handle.is-top,
.wd-window__resize-handle.is-bottom {
  left: 8px;
  right: 8px;
  height: 8px;
}

.wd-window__resize-handle.is-left,
.wd-window__resize-handle.is-right {
  top: 8px;
  bottom: 8px;
  width: 8px;
}

.wd-window__resize-handle.is-top {
  top: -4px;
  cursor: n-resize;
}

.wd-window__resize-handle.is-right {
  right: -4px;
  cursor: e-resize;
}

.wd-window__resize-handle.is-bottom {
  bottom: -4px;
  cursor: s-resize;
}

.wd-window__resize-handle.is-left {
  left: -4px;
  cursor: w-resize;
}

.wd-window__resize-handle.is-top-left,
.wd-window__resize-handle.is-top-right,
.wd-window__resize-handle.is-bottom-left,
.wd-window__resize-handle.is-bottom-right {
  width: 12px;
  height: 12px;
}

.wd-window__resize-handle.is-top-left {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}

.wd-window__resize-handle.is-top-right {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.wd-window__resize-handle.is-bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: nesw-resize;
}

.wd-window__resize-handle.is-bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: nwse-resize;
}
</style>
