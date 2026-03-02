<template>
  <transition name="wd-window-minimize">
    <v-sheet v-show="!isMinimized && !isPeekHidden" :class="windowClasses" :color="windowColor" :elevation="windowElevation"
      :style="windowStyle" tag="article" @pointerdown="bringToFront">
      <header v-if="!isMobileFullscreen" :class="titlebarClasses" @pointerdown="startDrag">
        <div v-if="$slots['titlebar-start'] || !!icon" class="wd-window__titlebar-start">
          <slot name="titlebar-start" />
          <v-icon v-if="icon" :icon="icon" size="18" />
        </div>

        <div :class="titleClasses" class="flex-fill">
          <slot name="title">{{ title }}</slot>
        </div>

        <div class="wd-window__titlebar-end" @pointerdown.stop>
          <slot name="titlebar-end">
            <v-btn-group class="wd-window__titlebar-actions" variant="text">
              <v-btn density="comfortable" icon="mdi-minus" size="small" @click.stop="onMinimizeClick" />
              <v-btn v-if="!isMobileFullscreen" density="comfortable"
                :icon="isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize'" size="small"
                @click.stop="onMaximizeClick" />
              <v-btn class="wd-window__close-btn" density="comfortable" icon="mdi-close" size="small"
                @click.stop="onCloseClick" />
            </v-btn-group>
          </slot>
        </div>
      </header>

      <section class="wd-window__content">
        <wd-container no-padding fluid>
          <slot />
        </wd-container>
      </section>

      <footer v-if="$slots.footer" :class="footerClasses">
        <slot name="footer" />
      </footer>

      <v-overlay :model-value="!isFocused" attach persistent class="wd-window__dim-overlay"></v-overlay>

      <span v-if="!isMobileFullscreen" v-for="handle in resizeHandles" :key="handle" class="wd-window__resize-handle"
        :class="`is-${handle}`" @pointerdown="(event) => startResize(event, handle)" />
    </v-sheet>
  </transition>
  <teleport :to="snapPreviewTeleportTarget">
    <transition name="wd-window-snap-preview">
      <div v-if="snapPreviewStyle" class="wd-window__snap-preview" :style="snapPreviewStyle" />
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { wdDesktopContextKey, type WdDesktopContext } from './WdDesktopContext'
import { useTopMenu, type WdTopMenuItem } from '@/composables/useTopMenu'

type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
type SnapSide = 'left' | 'right' | 'maximized' | null
type DesktopRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> & {
  offsetX: number
  offsetY: number
}
type WindowBounds = { x: number, y: number, width: number, height: number }
type WdWindowEventState = {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isFocused: boolean
  isMinimized: boolean
  isMaximized: boolean
  isMobileFullscreen: boolean
  snappedSide: SnapSide
  restoreBounds: WindowBounds | null
}
type SnapPreviewBounds = {
  x: number
  y: number
  width: number
  height: number
}
const WINDOW_ID_COUNTER_KEY = '__wdWindowIdCounter__'

const getNextWindowId = () => {
  const globalState = globalThis as typeof globalThis & Record<string, number | undefined>
  const nextWindowId = globalState[WINDOW_ID_COUNTER_KEY] ?? 1
  globalState[WINDOW_ID_COUNTER_KEY] = nextWindowId + 1
  return nextWindowId
}

const props = withDefaults(
  defineProps<{
    title?: string
    x?: number
    y?: number
    width?: number
    height?: number
    initialWidth?: number
    initialHeight?: number
    minWidth?: number
    minHeight?: number
    zIndex?: number
    maximized?: boolean
    snappedSide?: SnapSide
    restoreBounds?: WindowBounds | null
    icon?: string
    windowId?: string
    menuItems?: readonly WdTopMenuItem[]
    minimized?: boolean
    mobileFullscreen?: boolean
    peekedWindowId?: string | null
  }>(),
  {
    title: 'Window',
    x: 100,
    y: 80,
    width: 520,
    height: 360,
    initialWidth: undefined,
    initialHeight: undefined,
    minWidth: 260,
    minHeight: 180,
    zIndex: 1,
    maximized: false,
    snappedSide: null,
    restoreBounds: null,
    icon: undefined,
    windowId: undefined,
    menuItems: undefined,
    minimized: false,
    mobileFullscreen: false,
    peekedWindowId: null,
  },
)
const emit = defineEmits<{
  close: []
  minimize: []
  open: [state: WdWindowEventState]
  closed: [state: WdWindowEventState]
  gainFocus: [state: WdWindowEventState]
  lostFocus: [state: WdWindowEventState]
  minimized: [state: WdWindowEventState]
  maximized: [state: WdWindowEventState]
  restored: [state: WdWindowEventState & { from: 'minimized' | 'maximized' | 'fullscreen' }]
  enterFullscreen: [state: WdWindowEventState]
  leaveFullscreen: [state: WdWindowEventState]
  moved: [state: WdWindowEventState]
  resized: [state: WdWindowEventState]
  snapped: [state: WdWindowEventState & { side: Exclude<SnapSide, null> }]
  unsnapped: [state: WdWindowEventState & { from: Exclude<SnapSide, null> }]
  maximizeToggle: [maximized: boolean]
  propsChange: [props: Record<string, unknown>]
  stateChange: [state: {
    x: number
    y: number
    width: number
    height: number
    zIndex: number
    isFocused: boolean
    isMinimized: boolean
    isMaximized: boolean
    snappedSide: SnapSide
    restoreBounds: WindowBounds | null
  }]
}>()

const desktop = inject<WdDesktopContext | null>(wdDesktopContextKey, null)
const topMenu = useTopMenu()
const runtimeWindowId = getNextWindowId()

const isManagedWindow = Boolean(props.windowId?.trim())
const posX = ref(props.x)
const posY = ref(props.y)
const winWidth = ref(isManagedWindow ? props.width : (props.initialWidth ?? props.width))
const winHeight = ref(isManagedWindow ? props.height : (props.initialHeight ?? props.height))
const activeZIndex = ref(props.zIndex)
const snappedSide = ref<SnapSide>(props.snappedSide ?? (props.maximized ? 'maximized' : null))
const restoreBounds = ref<WindowBounds | null>(props.restoreBounds ?? null)
const isInteracting = ref(false)
const isFocused = computed(() => desktop?.activeWindowId.value === runtimeWindowId)
const isMinimized = computed(() => !!props.minimized)
const isPeekHidden = computed(() => {
  const peekedId = typeof props.peekedWindowId === 'string' ? props.peekedWindowId.trim() : ''
  const thisId = typeof props.windowId === 'string' ? props.windowId.trim() : ''
  if (!peekedId || !thisId) return false
  return peekedId !== thisId
})
const isMobileFullscreen = computed(() => !!props.mobileFullscreen)
const isMaximized = computed(() => snappedSide.value === 'maximized')
const registeredMenuWindowId = ref<string | null>(null)
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)
const layoutVersion = ref(0)
const isLifecycleReady = ref(false)
const snapPreview = ref<SnapPreviewBounds | null>(null)
let layoutObserver: ResizeObserver | null = null
const onViewportResize = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
  syncLayoutToWorkArea()
}

const windowClasses = computed(() => [
  'wd-window',
  'rounded-lg',
  !isInteracting.value && 'wd-window--animated',
  isMaximized.value && 'wd-window--maximized',
  isMobileFullscreen.value && 'wd-window--mobile',
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

const SNAP_THRESHOLD_PX = 16
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const getEventState = (): WdWindowEventState => ({
  x: posX.value,
  y: posY.value,
  width: winWidth.value,
  height: winHeight.value,
  zIndex: activeZIndex.value,
  isFocused: isFocused.value,
  isMinimized: isMinimized.value,
  isMaximized: isMaximized.value,
  isMobileFullscreen: isMobileFullscreen.value,
  snappedSide: snappedSide.value,
  restoreBounds: restoreBounds.value ? { ...restoreBounds.value } : null,
})

const getDesktopRect = (): DesktopRect | null => {
  const desktopEl = desktop?.desktopRef.value
  const workAreaEl = desktop?.workAreaRef?.value ?? desktopEl
  if (!workAreaEl) return null

  const workAreaRect = workAreaEl.getBoundingClientRect()
  const desktopRect = desktopEl?.getBoundingClientRect() ?? workAreaRect

  return {
    left: workAreaRect.left,
    top: workAreaRect.top,
    width: workAreaRect.width,
    height: workAreaRect.height,
    offsetX: workAreaRect.left - desktopRect.left,
    offsetY: workAreaRect.top - desktopRect.top,
  }
}

const bringToFront = () => {
  if (!desktop) return
  if (typeof desktop.requestFocus === 'function') {
    activeZIndex.value = desktop.requestFocus(runtimeWindowId)
    return
  }

  if (typeof desktop.requestZIndex === 'function') {
    activeZIndex.value = desktop.requestZIndex()
  }
}

const windowStyle = computed(() => {
  layoutVersion.value

  if (isMobileFullscreen.value) {
    const rect = getDesktopRect()
    const left = rect?.offsetX ?? 0
    const top = rect?.offsetY ?? 0
    const width = rect?.width ?? viewportWidth.value
    const height = rect?.height ?? viewportHeight.value
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: activeZIndex.value,
    }
  }

  return {
    left: `${posX.value}px`,
    top: `${posY.value}px`,
    width: `${winWidth.value}px`,
    height: `${winHeight.value}px`,
    zIndex: activeZIndex.value,
  }
})
const snapPreviewStyle = computed(() => {
  if (!snapPreview.value) return null
  return {
    left: `${snapPreview.value.x}px`,
    top: `${snapPreview.value.y}px`,
    width: `${snapPreview.value.width}px`,
    height: `${snapPreview.value.height}px`,
    zIndex: Math.max(1, activeZIndex.value - 1),
  }
})
const snapPreviewTeleportTarget = computed<HTMLElement | string>(() => desktop?.desktopRef.value ?? 'body')

const applySnappedLayout = () => {
  if (isMobileFullscreen.value) return
  if (!snappedSide.value) return

  const rect = getDesktopRect()
  if (!rect) return

  if (snappedSide.value === 'maximized') {
    posX.value = rect.offsetX
    posY.value = rect.offsetY
    winWidth.value = rect.width
    winHeight.value = rect.height
    return
  }

  const halfWidth = rect.width / 2
  posX.value = snappedSide.value === 'left'
    ? rect.offsetX
    : rect.offsetX + halfWidth
  posY.value = rect.offsetY
  winWidth.value = halfWidth
  winHeight.value = rect.height
}

const syncLayoutToWorkArea = () => {
  if (!snappedSide.value) return
  applySnappedLayout()
}

const onCloseClick = () => {
  emit('close')
}

const onMinimizeClick = () => {
  emit('minimize')
  if (desktop?.activeWindowId.value === runtimeWindowId) {
    desktop.activeWindowId.value = null
  }
}

const onMaximizeClick = () => {
  if (isMobileFullscreen.value) return
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
  posX.value = desktopRect.offsetX
  posY.value = desktopRect.offsetY
  winWidth.value = desktopRect.width
  winHeight.value = desktopRect.height
  emit('maximizeToggle', true)
}

const getSnapPreviewBounds = (desktopRect: DesktopRect, localX: number, localY: number): SnapPreviewBounds | null => {
  const isAtLeftEdge = localX <= SNAP_THRESHOLD_PX
  const isAtRightEdge = localX >= desktopRect.width - SNAP_THRESHOLD_PX
  const isAtTopEdge = localY <= SNAP_THRESHOLD_PX

  if (!isAtLeftEdge && !isAtRightEdge && !isAtTopEdge) {
    return null
  }

  return {
    x: isAtTopEdge ? desktopRect.left : isAtLeftEdge ? desktopRect.left : desktopRect.left + (desktopRect.width / 2),
    y: desktopRect.top,
    width: isAtTopEdge ? desktopRect.width : desktopRect.width / 2,
    height: desktopRect.height,
  }
}

const startDrag = (event: PointerEvent) => {
  if (isMobileFullscreen.value) return
  if (event.pointerType === 'mouse' && event.button !== 0) return

  const target = event.target as HTMLElement
  if (target.closest('.wd-window__resize-handle')) return

  event.preventDefault()
  bringToFront()
  snapPreview.value = null
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

    if (desktopRect && didDrag) {
      const localMouseX = moveEvent.clientX - desktopRect.left
      const localMouseY = moveEvent.clientY - desktopRect.top
      snapPreview.value = getSnapPreviewBounds(desktopRect, localMouseX, localMouseY)
    } else {
      snapPreview.value = null
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

        posX.value = desktopRect.offsetX + restoredX
        posY.value = desktopRect.offsetY + restoredY
        dragStartX = posX.value
        dragStartY = posY.value
        dragStartMouseX = moveEvent.clientX
        dragStartMouseY = moveEvent.clientY
      }
    }

    const nextX = dragStartX + (moveEvent.clientX - dragStartMouseX)
    const nextY = dragStartY + (moveEvent.clientY - dragStartMouseY)

    if (desktopRect) {
      const minX = desktopRect.offsetX
      const minY = desktopRect.offsetY
      const maxX = desktopRect.offsetX + Math.max(0, desktopRect.width - winWidth.value)
      const maxY = desktopRect.offsetY + Math.max(0, desktopRect.height - winHeight.value)
      posX.value = clamp(nextX, minX, maxX)
      posY.value = clamp(nextY, minY, maxY)
      return
    }

    posX.value = nextX
    posY.value = nextY
  }

  const onUp = (upEvent: PointerEvent) => {
    let pendingSnap: { side: Exclude<SnapSide, null>, x: number, y: number, width: number, height: number } | null = null
    snapPreview.value = null

    if (desktopRect && didDrag) {
      const localUpX = upEvent.clientX - desktopRect.left
      const localUpY = upEvent.clientY - desktopRect.top
      const preview = getSnapPreviewBounds(desktopRect, localUpX, localUpY)

      if (preview) {
        if (!snappedSide.value || !restoreBounds.value) {
          restoreBounds.value = {
            x: posX.value,
            y: posY.value,
            width: winWidth.value,
            height: winHeight.value,
          }
        }

        pendingSnap = {
          side: localUpY <= SNAP_THRESHOLD_PX ? 'maximized' : localUpX <= SNAP_THRESHOLD_PX ? 'left' : 'right',
          x: localUpY <= SNAP_THRESHOLD_PX ? desktopRect.offsetX : localUpX <= SNAP_THRESHOLD_PX ? desktopRect.offsetX : desktopRect.offsetX + (desktopRect.width / 2),
          y: desktopRect.offsetY,
          width: localUpY <= SNAP_THRESHOLD_PX ? desktopRect.width : desktopRect.width / 2,
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
  if (isMobileFullscreen.value) return
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
  window.addEventListener('resize', onViewportResize)
  const workAreaEl = desktop?.workAreaRef?.value
  const desktopEl = desktop?.desktopRef.value
  if (typeof ResizeObserver !== 'undefined') {
    layoutObserver = new ResizeObserver(() => {
      layoutVersion.value += 1
      syncLayoutToWorkArea()
    })
    if (workAreaEl) layoutObserver.observe(workAreaEl)
    if (desktopEl && desktopEl !== workAreaEl) layoutObserver.observe(desktopEl)
  }

  if (props.maximized) {
    const desktopRect = getDesktopRect()
    if (desktopRect) {
      posX.value = desktopRect.offsetX
      posY.value = desktopRect.offsetY
      winWidth.value = desktopRect.width
      winHeight.value = desktopRect.height
    }
  }
  if (!props.minimized) {
    bringToFront()
  }
  syncLayoutToWorkArea()
  emit('open', getEventState())
  isLifecycleReady.value = true
})

const syncMenuRegistration = () => {
  const nextWindowId = props.windowId?.trim() ?? ''
  const prevWindowId = registeredMenuWindowId.value

  if (prevWindowId && prevWindowId !== nextWindowId) {
    topMenu.clearWindowMenuItems(prevWindowId)
  }

  if (!nextWindowId) {
    registeredMenuWindowId.value = null
    return
  }

  if (props.menuItems && props.menuItems.length > 0) {
    topMenu.setWindowMenuItems(nextWindowId, props.menuItems)
    registeredMenuWindowId.value = nextWindowId
    return
  }

  topMenu.clearWindowMenuItems(nextWindowId)
  registeredMenuWindowId.value = nextWindowId
}

watch(() => props.windowId, syncMenuRegistration, { immediate: true })
watch(() => props.menuItems, syncMenuRegistration, { deep: true })

onBeforeUnmount(() => {
  snapPreview.value = null
  emit('closed', getEventState())
  window.removeEventListener('resize', onViewportResize)
  layoutObserver?.disconnect()
  layoutObserver = null
  const activeMenuWindowId = registeredMenuWindowId.value ?? props.windowId?.trim()
  if (activeMenuWindowId) {
    topMenu.clearWindowMenuItems(activeMenuWindowId)
  }
})

watch(
  () => ({ ...props }),
  nextProps => {
    emit('propsChange', nextProps)
  },
  { immediate: true },
)

watch(
  [posX, posY, winWidth, winHeight, activeZIndex, isFocused, isMinimized, isMaximized, snappedSide, restoreBounds],
  () => {
    emit('stateChange', {
      x: posX.value,
      y: posY.value,
      width: winWidth.value,
      height: winHeight.value,
      zIndex: activeZIndex.value,
      isFocused: isFocused.value,
      isMinimized: isMinimized.value,
      isMaximized: isMaximized.value,
      snappedSide: snappedSide.value,
      restoreBounds: restoreBounds.value ? { ...restoreBounds.value } : null,
    })
  },
  { immediate: true },
)

watch(
  () => isMobileFullscreen.value,
  (isMobile, wasMobile) => {
    if (isLifecycleReady.value && isMobile !== wasMobile) {
      if (isMobile) {
        emit('enterFullscreen', getEventState())
      } else {
        emit('leaveFullscreen', getEventState())
        emit('restored', { ...getEventState(), from: 'fullscreen' })
      }
    }

    if (!isMobile) {
      syncLayoutToWorkArea()
    }
  },
)

watch(
  () => isFocused.value,
  (next, prev) => {
    if (!isLifecycleReady.value || next === prev) return
    if (next) {
      emit('gainFocus', getEventState())
      return
    }
    emit('lostFocus', getEventState())
  },
)

watch(
  () => isMinimized.value,
  (next, prev) => {
    if (!isLifecycleReady.value || next === prev) return
    if (next) {
      emit('minimized', getEventState())
      return
    }
    emit('restored', { ...getEventState(), from: 'minimized' })
  },
)

watch(
  () => isMaximized.value,
  (next, prev) => {
    if (!isLifecycleReady.value || next === prev) return
    if (next) {
      emit('maximized', getEventState())
      return
    }
    emit('restored', { ...getEventState(), from: 'maximized' })
  },
)

watch(
  [posX, posY],
  ([nextX, nextY], [prevX, prevY]) => {
    if (!isLifecycleReady.value) return
    if (nextX === prevX && nextY === prevY) return
    emit('moved', getEventState())
  },
)

watch(
  [winWidth, winHeight],
  ([nextWidth, nextHeight], [prevWidth, prevHeight]) => {
    if (!isLifecycleReady.value) return
    if (nextWidth === prevWidth && nextHeight === prevHeight) return
    emit('resized', getEventState())
  },
)

watch(
  () => snappedSide.value,
  (next, prev) => {
    if (!isLifecycleReady.value || next === prev) return
    if (next) {
      emit('snapped', { ...getEventState(), side: next })
      return
    }
    if (prev) {
      emit('unsnapped', { ...getEventState(), from: prev })
    }
  },
)

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
  border-color: rgb(var(--v-theme-primary));
}

.wd-window--unfocused {
  border-color: rgba(var(--v-theme-on-surface), 0.22);
}

.wd-window--maximized {
  border-color: transparent;
  border-radius: 0 !important;
}

.wd-window--mobile {
  border-radius: 0 !important;
  border-color: transparent;
}

.wd-window__titlebar {
  height: 42px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  // background-color: inherit;
  // border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  // cursor: move;
  touch-action: none;
}

.wd-window--mobile .wd-window__titlebar {
  cursor: default;
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
  position: relative;
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

.wd-window-minimize-enter-active,
.wd-window-minimize-leave-active {
  transition:
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 180ms ease;
}

.wd-window-minimize-enter-from,
.wd-window-minimize-leave-to {
  opacity: 0;
  transform: translateY(160px) scale(0.35);
}

.wd-window__snap-preview {
  position: fixed;
  z-index: 2000;
  pointer-events: none;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.55);
  background-color: rgba(var(--v-theme-primary), 0.16);
  backdrop-filter: blur(14px) saturate(135%);
  -webkit-backdrop-filter: blur(14px) saturate(135%);
  box-shadow:
    inset 0 0 0 1px rgba(var(--v-theme-on-primary), 0.15),
    0 14px 32px rgba(0, 0, 0, 0.18);
  transition:
    left 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
    top 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
    width 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
    height 120ms cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 120ms ease;
}

.wd-window-snap-preview-enter-active,
.wd-window-snap-preview-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.wd-window-snap-preview-enter-from,
.wd-window-snap-preview-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
