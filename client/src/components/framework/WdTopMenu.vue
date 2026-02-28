<template>
  <v-sheet ref="topMenuRef" class="wd-top-menu d-flex align-center pl-1 pr-0 overflow-hidden" color="surface" elevation="0"
    rounded="0" :style="topMenuStyle">
    <div class="wd-top-menu__section wd-top-menu__section--start d-flex align-center ga-2">
      <div v-if="showFullscreenWindowChrome" class="wd-top-menu__window-info d-flex align-center">
        <v-icon :icon="focusedWindowIcon" size="18" />
      </div>
      <slot name="start" />
      <v-menu v-if="showCollapsedFocusedMenuItems" location="bottom start">
        <template #activator="{ props: activatorProps }">
          <v-btn v-bind="activatorProps" class="px-2" density="comfortable" rounded="0" variant="text"
            icon="mdi-menu" />
        </template>

        <wd-top-menu-dropdown :items="focusedMenuItems" />
      </v-menu>
      <wd-top-menu-items v-else :items="focusedMenuItems" />
    </div>

    <div class="wd-top-menu__section wd-top-menu__section--center d-flex align-center justify-center ga-2">
      <span class="text-caption text-center w-100">{{ focusedWindowTitle }}</span>
      <slot />
    </div>

    <div class="wd-top-menu__section wd-top-menu__section--end d-flex align-center justify-end ga-2">
      <div v-if="showFullscreenWindowChrome" class="wd-top-menu__window-actions d-flex align-center">
        <v-btn icon="mdi-minus" size="small" variant="text" rounded @click.stop="onMinimizeFocusedWindow" />
        <v-btn class="wd-top-menu__close-btn" icon="mdi-close" size="small" variant="text" rounded
          @click.stop="onCloseFocusedWindow" />
      </div>

      <v-btn @click="windowManager.toggleFullscreenMode()" icon="mdi-fullscreen" rounded variant="text"></v-btn>
      <slot name="end" />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowManager } from '@/composables/useWindowManager'
import { useTopMenu } from '@/composables/useTopMenu'
import { useDisplay } from 'vuetify'

const props = withDefaults(
  defineProps<{
    height?: number
  }>(),
  {
    height: 30,
  },
)

const topMenuStyle = computed(() => ({
  height: `${props.height}px`,
}))
const windowManager = useWindowManager()
const topMenu = useTopMenu()
const display = useDisplay()
const focusedWindow = computed(() => windowManager.focusedWindow.value)
const focusedMenuItems = computed(() => topMenu.focusedMenuItems.value)
const showCollapsedFocusedMenuItems = computed(() => display.mdAndDown.value && focusedMenuItems.value.length > 0)
const showFullscreenWindowChrome = computed(() => Boolean(focusedWindow.value?.wdProps?.mobileFullscreen))
const focusedWindowIcon = computed(() => {
  const icon = focusedWindow.value?.wdProps?.icon
  return typeof icon === 'string' && icon ? icon : 'mdi-application-outline'
})

const focusedWindowTitle = computed(() => {
  const rawTitle = windowManager.focusedWindow.value?.wdProps?.title
  return typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle : 'Desktop'
})

const topMenuRef = ref<HTMLElement | { $el?: Element | null } | null>(null)

const getTopMenuElement = (): HTMLElement | null => {
  if (!topMenuRef.value) return null
  if (topMenuRef.value instanceof HTMLElement) return topMenuRef.value

  const rawEl = topMenuRef.value.$el
  return rawEl instanceof HTMLElement ? rawEl : null
}

const applyDesktopWorkAreaOffset = () => {
  const topMenuEl = getTopMenuElement()
  const desktopEl = topMenuEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  desktopEl.style.setProperty('--wd-top-menu-space', `${props.height}px`)
}

const clearDesktopWorkAreaOffset = () => {
  const topMenuEl = getTopMenuElement()
  const desktopEl = topMenuEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  desktopEl.style.removeProperty('--wd-top-menu-space')
}

watch(() => props.height, applyDesktopWorkAreaOffset, { immediate: true })

onMounted(() => {
  applyDesktopWorkAreaOffset()
})

onBeforeUnmount(() => {
  clearDesktopWorkAreaOffset()
})

const onMinimizeFocusedWindow = () => {
  const id = focusedWindow.value?.id
  if (!id) return
  windowManager.minimizeWindow(id)
}

const onCloseFocusedWindow = () => {
  const id = focusedWindow.value?.id
  if (!id) return
  windowManager.closeWindow(id)
}
</script>

<style scoped>
.wd-top-menu {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 1100;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background-color: rgba(var(--v-theme-surface), 0.62) !important;
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  user-select: none;
}

.wd-top-menu__section {
  min-width: 0;
  flex: 1 1 0;
}

.wd-top-menu__section--start,
.wd-top-menu__section--end {
  white-space: nowrap;
}

.wd-top-menu__section--center {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wd-top-menu__window-info {
  min-width: 22px;
}

.wd-top-menu__window-actions {
  margin-right: -8px;
  gap: 2px;
}

.wd-top-menu__close-btn:hover,
.wd-top-menu__close-btn:focus-visible {
  background-color: #c42b1c !important;
  color: #ffffff !important;
}
</style>