<template>
  <v-sheet ref="taskbarRef" class="wd-taskbar d-flex align-center px-3" color="surface" elevation="0" rounded="0"
    :style="taskbarStyle">
    <div class="wd-taskbar__section wd-taskbar__section--start d-flex align-center ga-1">
      <slot name="start" />
    </div>

    <div class="wd-taskbar__section wd-taskbar__section--center d-flex align-center justify-center ga-1">
      <template v-for="group in groupedWindowEntries" :key="group.key">
        <v-menu location="top center" open-delay="120" open-on-hover close-delay="80">
          <template #activator="{ props: activatorProps }">
            <v-badge class="wd-taskbar__group-badge" :content="group.windows.length > 1 ? group.windows.length : undefined"
              :model-value="group.windows.length > 1" floating location="right top">
              <v-btn v-bind="activatorProps" :icon="group.icon || true" :variant="group.isFocused ? 'elevated' : 'text'"
                rounded @click="taskbarGroupClick(group)" />
            </v-badge>
          </template>

          <v-card class="wd-taskbar__preview" elevation="8" rounded="lg" @mouseleave="windowManager.clearPeekWindow()">
            <v-card-item class="py-2 px-3">
              <v-card-subtitle class="text-caption pa-0">
                {{ group.windows.length > 1 ? `${group.windows.length} windows` : (group.topWindow?.state.isMinimized ?
                'Minimized' : 'Open') }}
              </v-card-subtitle>
            </v-card-item>

            <v-divider />

            <v-card-text class="py-2 px-3">
              <div class="wd-taskbar__preview-windows d-flex flex-row ga-2">
                <button v-for="window in group.windows" :key="window.id" type="button"
                  class="wd-taskbar__preview-window" @mouseenter="windowManager.beginPeekWindow(window.id)"
                  @mouseleave="windowManager.endPeekWindow(window.id)" @click="focusFromPreview(window.id)">
                  <div class="d-flex align-center ga-2 mb-1">
                    <v-icon :icon="window.wdProps.icon || 'mdi-application-outline'" size="16" />
                    <span class="text-caption text-truncate">{{ window.wdProps.title || 'Window' }}</span>
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    {{ window.state.isMinimized ? 'Minimized' : `${Math.round(window.state.width)} ×
                    ${Math.round(window.state.height)}` }}
                  </div>
                </button>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </template>

      <slot />
    </div>

    <div class="wd-taskbar__section wd-taskbar__section--end d-flex align-center justify-end ga-1">
      <slot name="end" />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowManager, type WdManagedWindow } from '@/composables/useWindowManager'

interface WdTaskbarWindowGroup {
  key: string
  title: string
  icon: string | null
  windows: WdManagedWindow[]
  topWindow: WdManagedWindow | null
  isFocused: boolean
}

const windowManager = useWindowManager()

const props = withDefaults(
  defineProps<{
    height?: number
    margin?: number
  }>(),
  {
    height: 48,
    margin: 0,
  },
)

const taskbarStyle = computed(() => ({
  height: `${props.height}px`,
  left: `${props.margin}px`,
  right: `${props.margin}px`,
  bottom: `calc(${props.margin}px + var(--wd-safe-bottom, 0px))`,
}))

const taskbarRef = ref<HTMLElement | { $el?: Element | null } | null>(null)

const getTaskbarElement = (): HTMLElement | null => {
  if (!taskbarRef.value) return null
  if (taskbarRef.value instanceof HTMLElement) return taskbarRef.value

  const rawEl = taskbarRef.value.$el
  return rawEl instanceof HTMLElement ? rawEl : null
}

const applyDesktopWorkAreaOffset = () => {
  const taskbarEl = getTaskbarElement()
  const desktopEl = taskbarEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  const reservedSpace = props.height + (props.margin * 2)
  desktopEl.style.setProperty('--wd-taskbar-space', `calc(${reservedSpace}px + var(--wd-safe-bottom, 0px))`)
}

const clearDesktopWorkAreaOffset = () => {
  const taskbarEl = getTaskbarElement()
  const desktopEl = taskbarEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  desktopEl.style.removeProperty('--wd-taskbar-space')
}

const byTopMost = (a: WdManagedWindow, b: WdManagedWindow) => b.state.zIndex - a.state.zIndex

const groupedWindowEntries = computed<WdTaskbarWindowGroup[]>(() => {
  const buckets = new Map<string, WdManagedWindow[]>()

  for (const window of windowManager.windows.value) {
    const key = window.name || 'window'
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.push(window)
    } else {
      buckets.set(key, [window])
    }
  }

  return Array.from(buckets.entries())
    .map(([key, windows]) => {
      const sorted = windows.slice().sort(byTopMost)
      const topWindow = sorted.find(item => !item.state.isMinimized) ?? sorted[0] ?? null
      const focusedWindowId = windowManager.focusedWindow.value?.id

      return {
        key,
        title: typeof topWindow?.wdProps?.title === 'string' && topWindow.wdProps.title
          ? topWindow.wdProps.title
          : key,
        icon: typeof topWindow?.wdProps?.icon === 'string' ? topWindow.wdProps.icon : null,
        windows: sorted,
        topWindow,
        isFocused: Boolean(focusedWindowId && sorted.some(window => window.id === focusedWindowId)),
      }
    })
})

watch(() => [props.height, props.margin], applyDesktopWorkAreaOffset, { immediate: true })

onMounted(() => {
  applyDesktopWorkAreaOffset()
})

onBeforeUnmount(() => {
  clearDesktopWorkAreaOffset()
})

const taskbarGroupClick = (group: WdTaskbarWindowGroup) => {
  windowManager.clearPeekWindow()
  const window = group.topWindow
  if (!window) return

  if (window.state.isMinimized) {
    windowManager.focusWindow(window.id)
    return
  }

  if (window.state.isFocused) {
    windowManager.minimizeWindow(window.id)
    return
  }

  windowManager.focusWindow(window.id)
}

const focusFromPreview = (id: string) => {
  windowManager.clearPeekWindow()
  windowManager.focusWindow(id)
}
</script>

<style scoped>
.wd-taskbar {
  position: absolute;
  z-index: 1000;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background-color: rgba(var(--v-theme-surface), 0.72) !important;
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
}

.wd-taskbar__section {
  min-width: 0;
  flex: 1 1 0;
}

.wd-taskbar__section--center {
  overflow-x: auto;
  scrollbar-width: none;
}

.wd-taskbar__section--center::-webkit-scrollbar {
  display: none;
}

.wd-taskbar__preview {
  background-color: rgba(var(--v-theme-surface), 0.94);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
}

.wd-taskbar__preview-windows {
  max-width: min(70vw, 560px);
  overflow-x: auto;
  padding-bottom: 4px;
}

.wd-taskbar__preview-window {
  min-width: 180px;
  max-width: 180px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 10px;
  background: rgba(var(--v-theme-surface), 0.85);
  color: inherit;
  text-align: left;
  padding: 10px;
}

.wd-taskbar__preview-window:hover {
  border-color: rgba(var(--v-theme-primary), 0.7);
  background: rgba(var(--v-theme-primary), 0.12);
}

.wd-taskbar__group-badge :deep(.v-badge__badge) {
  top: 2px !important;
  right: 2px !important;
  left: auto !important;
  bottom: auto !important;
  transform: translate(0, 0) !important;
  pointer-events: none;
}
</style>
