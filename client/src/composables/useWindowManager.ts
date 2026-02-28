import { computed, markRaw, readonly, ref, type Component } from 'vue'

export interface WdManagedWindow {
  id: string
  name: string
  props: Record<string, unknown>
  wdProps: Record<string, any>
  state: WdManagedWindowState
}

export interface WdOpenWindowOptions {
  id: string
  props?: Record<string, unknown>
}

export interface WdManagedWindowState {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  isFocused: boolean
  isMinimized: boolean
  isMaximized: boolean
  restoreBounds: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

interface WdPersistedWindowRecord {
  name: string
  props: Record<string, unknown>
  state: WdManagedWindowState
}

const WINDOW_STATE_STORAGE_KEY = 'wd:window-states:v1'
const FULLSCREEN_MODE_STORAGE_KEY = 'wd:fullscreen-mode:v1'
const FOCUSED_WINDOW_STORAGE_KEY = 'wd:focused-window-id:v1'
const DEFAULT_WINDOW_STATE: WdManagedWindowState = {
  x: 100,
  y: 80,
  width: 520,
  height: 360,
  zIndex: 1,
  isFocused: false,
  isMinimized: false,
  isMaximized: false,
  restoreBounds: null,
}

const registry = new Map<string, Component>()
const windowsRef = ref<WdManagedWindow[]>([])
const fullscreenModeRef = ref(false)
const persistedFocusedWindowIdRef = ref<string | null>(null)
const peekedWindowIdRef = ref<string | null>(null)
const persistedWindows = new Map<string, WdPersistedWindowRecord>()
let persistTimer: ReturnType<typeof setTimeout> | null = null
let focusWindowHandler: ((id: string) => boolean) | null = null
const NON_PERSISTED_WINDOW_PROP_KEYS = new Set([
  'x',
  'y',
  'width',
  'height',
  'zIndex',
  'maximized',
  'minimized',
  'restoreBounds',
  'windowId',
  'menuItems',
  'minWidth',
  'minHeight',
  'title',
  'icon',
  'initialWidth',
  'initialHeight',
])

const normalizeName = (name: string) => name.trim().toLowerCase().replace(/[\s_-]/g, '')
const stripWindowSuffix = (name: string) => name.replace(/window$/i, '')
const pascalToKebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

const autoRegistry = new Map<string, Component>()
const windowModules = import.meta.glob('../components/windows/**/*.vue', { eager: true })

for (const [filePath, module] of Object.entries(windowModules)) {
  const component = (module as { default?: Component }).default
  if (!component) continue

  const fileName = filePath.split('/').pop()?.replace(/\.vue$/i, '') ?? ''
  const baseName = fileName.trim()
  if (!baseName) continue

  const aliases = [
    baseName,
    stripWindowSuffix(baseName),
    pascalToKebab(baseName),
    stripWindowSuffix(pascalToKebab(baseName)),
  ]

  for (const alias of aliases) {
    autoRegistry.set(normalizeName(alias), markRaw(component))
  }
}

const registerWindow = (name: string, component: Component) => {
  registry.set(normalizeName(name), markRaw(component))
}

const unregisterWindow = (name: string) => {
  registry.delete(normalizeName(name))
}

const resolveWindowComponent = (name: string) => {
  const key = normalizeName(name)
  return registry.get(key) ?? autoRegistry.get(key)
}

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
const loadPersistedFocusedWindowId = () => {
  if (!canUseStorage()) return
  const raw = window.localStorage.getItem(FOCUSED_WINDOW_STORAGE_KEY)
  persistedFocusedWindowIdRef.value = raw && raw.trim() ? raw : null
}

const persistFocusedWindowId = () => {
  if (!canUseStorage()) return
  if (!persistedFocusedWindowIdRef.value) {
    window.localStorage.removeItem(FOCUSED_WINDOW_STORAGE_KEY)
    return
  }
  window.localStorage.setItem(FOCUSED_WINDOW_STORAGE_KEY, persistedFocusedWindowIdRef.value)
}

const loadFullscreenMode = () => {
  if (!canUseStorage()) return
  const raw = window.localStorage.getItem(FULLSCREEN_MODE_STORAGE_KEY)
  if (raw === null) return
  fullscreenModeRef.value = raw === 'true'
}

const persistFullscreenMode = () => {
  if (!canUseStorage()) return
  window.localStorage.setItem(FULLSCREEN_MODE_STORAGE_KEY, String(fullscreenModeRef.value))
}

const sanitizePersistedProps = (props: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (NON_PERSISTED_WINDOW_PROP_KEYS.has(key)) continue
    clean[key] = value
  }
  return clean
}

const loadPersistedWindows = () => {
  if (!canUseStorage()) return
  const raw = window.localStorage.getItem(WINDOW_STATE_STORAGE_KEY)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const [id, payload] of Object.entries(parsed)) {
      if (!id || !payload || typeof payload !== 'object') continue

      const maybeRecord = payload as Partial<WdPersistedWindowRecord>
      if (typeof maybeRecord.name === 'string' && maybeRecord.name && maybeRecord.state) {
        persistedWindows.set(id, {
          name: normalizeName(maybeRecord.name),
          props: sanitizePersistedProps((maybeRecord.props ?? {}) as Record<string, unknown>),
          state: {
            ...DEFAULT_WINDOW_STATE,
            ...maybeRecord.state,
            isFocused: false,
          },
        })
        continue
      }

      const legacyState = payload as Partial<WdManagedWindowState>
      persistedWindows.set(id, {
        name: '',
        props: {},
        state: {
          ...DEFAULT_WINDOW_STATE,
          ...legacyState,
          isFocused: false,
        },
      })
    }
  } catch {
    window.localStorage.removeItem(WINDOW_STATE_STORAGE_KEY)
  }
}

const flushPersistedStates = () => {
  if (!canUseStorage()) return

  const payload = Object.fromEntries(persistedWindows.entries())
  window.localStorage.setItem(WINDOW_STATE_STORAGE_KEY, JSON.stringify(payload))
}

const schedulePersistedStatesWrite = () => {
  if (!canUseStorage()) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    flushPersistedStates()
    persistTimer = null
  }, 120)
}

loadPersistedWindows()
loadFullscreenMode()
loadPersistedFocusedWindowId()

const openWindow = (name: string, options: WdOpenWindowOptions) => {
  const key = normalizeName(name)
  if (!resolveWindowComponent(name)) {
    throw new Error(`Window "${name}" was not found`)
  }

  const id = options.id.trim()
  if (!id) {
    throw new Error('Window id must be a non-empty string')
  }
  const existingWindow = windowsRef.value.find(window => window.id === id)
  if (existingWindow) {
    focusWindow(id)
    return existingWindow
  }

  const restoredWindow = persistedWindows.get(id)
  const restoredState = restoredWindow?.state
  const openProps = sanitizePersistedProps(options.props ?? restoredWindow?.props ?? {})
  const initialState: WdManagedWindowState = {
    ...DEFAULT_WINDOW_STATE,
    ...restoredState,
    isFocused: false,
  }

  const initialProps: Record<string, unknown> = {
    ...openProps,
    x: initialState.x,
    y: initialState.y,
    width: initialState.width,
    height: initialState.height,
    zIndex: initialState.zIndex,
    minimized: initialState.isMinimized,
    maximized: initialState.isMaximized,
    restoreBounds: initialState.restoreBounds ? { ...initialState.restoreBounds } : null,
  }

  const window: WdManagedWindow = {
    id,
    name: key,
    props: initialProps,
    wdProps: { ...initialProps },
    state: initialState,
  }
  windowsRef.value.push(window)

  persistedWindows.set(id, {
    name: key,
    props: openProps,
    state: {
      ...initialState,
      isFocused: false,
    },
  })
  schedulePersistedStatesWrite()
  return window
}

const closeWindow = (id: string) => {
  const targetWindow = windowsRef.value.find(window => window.id === id)
  const shouldRefocusTopWindow = targetWindow?.state.isFocused ?? false

  windowsRef.value = windowsRef.value.filter(window => window.id !== id)
  if (peekedWindowIdRef.value === id) {
    peekedWindowIdRef.value = null
  }
  if (persistedFocusedWindowIdRef.value === id) {
    persistedFocusedWindowIdRef.value = null
    persistFocusedWindowId()
  }
  persistedWindows.delete(id)
  schedulePersistedStatesWrite()

  if (shouldRefocusTopWindow) {
    requestAnimationFrame(() => {
      focusTopVisibleWindow()
    })
  }
}

const closeAllWindows = () => {
  const openIds = windowsRef.value.map(window => window.id)
  windowsRef.value = []
  peekedWindowIdRef.value = null
  if (persistedFocusedWindowIdRef.value && openIds.includes(persistedFocusedWindowIdRef.value)) {
    persistedFocusedWindowIdRef.value = null
    persistFocusedWindowId()
  }
  for (const id of openIds) {
    persistedWindows.delete(id)
  }
  schedulePersistedStatesWrite()
}

const closeWindowsByName = (name: string) => {
  const key = normalizeName(name)
  const removedIds = windowsRef.value
    .filter(window => window.name === key)
    .map(window => window.id)
  windowsRef.value = windowsRef.value.filter(window => window.name !== key)
  if (peekedWindowIdRef.value && removedIds.includes(peekedWindowIdRef.value)) {
    peekedWindowIdRef.value = null
  }
  if (persistedFocusedWindowIdRef.value && removedIds.includes(persistedFocusedWindowIdRef.value)) {
    persistedFocusedWindowIdRef.value = null
    persistFocusedWindowId()
  }
  for (const id of removedIds) {
    persistedWindows.delete(id)
  }
  schedulePersistedStatesWrite()
}

const updateWindowState = (id: string, state: Partial<WdManagedWindowState>) => {
  const window = windowsRef.value.find(item => item.id === id)
  if (!window) return
  const nextState = {
    ...window.state,
    ...state,
  }
  window.state = nextState
  if (nextState.isFocused) {
    persistedFocusedWindowIdRef.value = id
    persistFocusedWindowId()
  }
  const previous = persistedWindows.get(id)
  persistedWindows.set(id, {
    name: window.name,
    props: previous?.props ?? {},
    state: {
      ...DEFAULT_WINDOW_STATE,
      ...nextState,
      isFocused: false,
    },
  })
  schedulePersistedStatesWrite()
}

const updateWindowProps = (id: string, props: Record<string, unknown>) => {
  const window = windowsRef.value.find(item => item.id === id)
  if (!window) return

  window.wdProps = { ...props }
}

const setWindowMinimized = (id: string, minimized: boolean) => {
  const window = windowsRef.value.find(item => item.id === id)
  if (!window) return false
  const wasFocused = window.state.isFocused

  window.props = {
    ...window.props,
    minimized,
  }
  window.state = {
    ...window.state,
    isMinimized: minimized,
    isFocused: minimized ? false : window.state.isFocused,
  }

  const previous = persistedWindows.get(id)
  persistedWindows.set(id, {
    name: window.name,
    props: previous?.props ?? {},
    state: {
      ...DEFAULT_WINDOW_STATE,
      ...(previous?.state ?? {}),
      ...window.state,
      isFocused: false,
    },
  })
  schedulePersistedStatesWrite()

  if (minimized && wasFocused) {
    requestAnimationFrame(() => {
      focusTopVisibleWindow()
    })
  }
  return true
}

const minimizeWindow = (id: string) => setWindowMinimized(id, true)
const restoreWindow = (id: string) => setWindowMinimized(id, false)

const openPersistedWindows = () => {
  const opened: string[] = []
  const skipped: string[] = []

  for (const [id, persistedWindow] of Array.from(persistedWindows.entries())) {
    if (windowsRef.value.some(window => window.id === id)) {
      skipped.push(id)
      continue
    }
    if (!persistedWindow.name || !resolveWindowComponent(persistedWindow.name)) {
      skipped.push(id)
      continue
    }

    openWindow(persistedWindow.name, {
      id,
      props: persistedWindow.props,
    })
    opened.push(id)
  }

  const focusedId = persistedFocusedWindowIdRef.value
  if (focusedId && windowsRef.value.some(window => window.id === focusedId)) {
    requestAnimationFrame(() => {
      focusWindow(focusedId)
    })
  }

  return { opened, skipped }
}

const focusTopVisibleWindow = () => {
  const topVisibleWindow = windowsRef.value
    .filter(window => !window.state.isMinimized)
    .sort((a, b) => b.state.zIndex - a.state.zIndex)[0]

  if (!topVisibleWindow) return false
  return focusWindow(topVisibleWindow.id)
}

const setFocusWindowHandler = (handler: ((id: string) => boolean) | null) => {
  focusWindowHandler = handler
}

const focusWindow = (id: string) => {
  if (!id.trim()) return false
  peekedWindowIdRef.value = null
  const targetWindow = windowsRef.value.find(window => window.id === id)
  if (!targetWindow) return false

  if (targetWindow.state.isMinimized) {
    restoreWindow(id)
    requestAnimationFrame(() => {
      focusWindowHandler?.(id)
    })
    return true
  }

  return focusWindowHandler ? focusWindowHandler(id) : false
}

const beginPeekWindow = (id: string) => {
  const targetId = id.trim()
  if (!targetId) {
    peekedWindowIdRef.value = null
    return
  }

  const targetWindow = windowsRef.value.find(window => window.id === targetId)
  if (!targetWindow || targetWindow.state.isMinimized) {
    peekedWindowIdRef.value = null
    return
  }

  peekedWindowIdRef.value = targetId
}

const endPeekWindow = (id?: string) => {
  if (!id) {
    peekedWindowIdRef.value = null
    return
  }

  if (peekedWindowIdRef.value === id) {
    peekedWindowIdRef.value = null
  }
}

const clearPeekWindow = () => {
  peekedWindowIdRef.value = null
}

const windows = computed(() => windowsRef.value)
const focusedWindow = computed(() => windowsRef.value.find(window => window.state.isFocused) ?? null)

const setFullscreenMode = (enabled: boolean) => {
  const wasEnabled = fullscreenModeRef.value
  fullscreenModeRef.value = enabled
  persistFullscreenMode()
  if (!wasEnabled && enabled) {
    requestAnimationFrame(() => {
      focusTopVisibleWindow()
    })
  }
  return fullscreenModeRef.value
}

const toggleFullscreenMode = (nextValue?: boolean) => {
  const wasEnabled = fullscreenModeRef.value
  fullscreenModeRef.value = typeof nextValue === 'boolean'
    ? nextValue
    : !fullscreenModeRef.value
  persistFullscreenMode()
  if (!wasEnabled && fullscreenModeRef.value) {
    requestAnimationFrame(() => {
      focusTopVisibleWindow()
    })
  }
  return fullscreenModeRef.value
}

export const useWindowManager = () => {
  return {
    windows: readonly(windows),
    focusedWindow: readonly(focusedWindow),
    peekedWindowId: readonly(peekedWindowIdRef),
    isFullscreenMode: readonly(fullscreenModeRef),
    registerWindow,
    unregisterWindow,
    resolveWindowComponent,
    openWindow,
    closeWindow,
    closeAllWindows,
    closeWindowsByName,
    updateWindowState,
    updateWindowProps,
    openPersistedWindows,
    focusWindow,
    beginPeekWindow,
    endPeekWindow,
    clearPeekWindow,
    setFocusWindowHandler,
    minimizeWindow,
    restoreWindow,
    setFullscreenMode,
    toggleFullscreenMode,
  }
}
