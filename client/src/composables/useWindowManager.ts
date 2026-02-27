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
const DEFAULT_WINDOW_STATE: WdManagedWindowState = {
  x: 100,
  y: 80,
  width: 520,
  height: 360,
  zIndex: 1,
  isFocused: false,
  isMaximized: false,
  restoreBounds: null,
}

const registry = new Map<string, Component>()
const windowsRef = ref<WdManagedWindow[]>([])
const persistedWindows = new Map<string, WdPersistedWindowRecord>()
let persistTimer: ReturnType<typeof setTimeout> | null = null
let focusWindowHandler: ((id: string) => boolean) | null = null

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
          props: (maybeRecord.props ?? {}) as Record<string, unknown>,
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

const openWindow = (name: string, options: WdOpenWindowOptions) => {
  const key = normalizeName(name)
  if (!resolveWindowComponent(name)) {
    throw new Error(`Window "${name}" was not found`)
  }

  const id = options.id.trim()
  if (!id) {
    throw new Error('Window id must be a non-empty string')
  }
  if (windowsRef.value.some(window => window.id === id)) {
    throw new Error(`Window id "${id}" already exists`)
  }

  const restoredWindow = persistedWindows.get(id)
  const restoredState = restoredWindow?.state
  const baseProps: Record<string, unknown> = {
    ...(restoredWindow?.props ?? {}),
    ...(options.props ?? {}),
  }
  const initialState: WdManagedWindowState = {
    ...DEFAULT_WINDOW_STATE,
    ...restoredState,
    isFocused: false,
  }

  const initialProps: Record<string, unknown> = {
    ...baseProps,
    x: initialState.x,
    y: initialState.y,
    width: initialState.width,
    height: initialState.height,
    zIndex: initialState.zIndex,
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
    props: baseProps,
    state: {
      ...initialState,
      isFocused: false,
    },
  })
  schedulePersistedStatesWrite()
  return window
}

const closeWindow = (id: string) => {
  windowsRef.value = windowsRef.value.filter(window => window.id !== id)
  persistedWindows.delete(id)
  schedulePersistedStatesWrite()
}

const closeAllWindows = () => {
  const openIds = windowsRef.value.map(window => window.id)
  windowsRef.value = []
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
  const previous = persistedWindows.get(id)
  if (previous) {
    persistedWindows.set(id, {
      ...previous,
      props: {
        ...previous.props,
        ...window.wdProps,
      },
    })
    schedulePersistedStatesWrite()
  }
}

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

  return { opened, skipped }
}

const setFocusWindowHandler = (handler: ((id: string) => boolean) | null) => {
  focusWindowHandler = handler
}

const focusWindow = (id: string) => {
  if (!id.trim()) return false
  if (!windowsRef.value.some(window => window.id === id)) return false
  return focusWindowHandler ? focusWindowHandler(id) : false
}

const windows = computed(() => windowsRef.value)
const focusedWindow = computed(() => windowsRef.value.find(window => window.state.isFocused) ?? null)

export const useWindowManager = () => {
  return {
    windows: readonly(windows),
    focusedWindow: readonly(focusedWindow),
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
    setFocusWindowHandler,
  }
}
