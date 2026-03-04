<template>
  <v-navigation-drawer v-model="isMainMenuDrawerOpen" class="wd-top-menu__main-drawer" style="user-select: none" location="start" temporary
    width="280" :style="mainMenuDrawerStyle" :attach="drawerAttachTarget" absolute>
    <wd-top-menu-dropdown :items="mainMenuItems ?? []" :on-item-invoked="closeMainMenuDrawer" />
  </v-navigation-drawer>

  <v-sheet ref="topMenuRef" class="wd-top-menu d-flex align-center pr-0 overflow-hidden" color="surface" elevation="0"
    rounded="0" :style="topMenuStyle">
    <div class="wd-top-menu__section wd-top-menu__section--start d-flex align-center ga-0">
      <div v-if="showFullscreenWindowIcon" class="wd-top-menu__window-info d-flex align-center px-2">
        <v-icon :icon="focusedWindowIcon" size="18" />
      </div>

      <v-btn v-if="!$slots.activator" v-bind="mainMenuActivatorProps" class="px-2" density="comfortable" rounded="0"
        variant="text">
        <span class="text-body-large font-weight-bold">{{ mainMenuLabel }}</span>
      </v-btn>

      <slot name="activator" v-bind="mainMenuActivatorProps"></slot>

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

    <div class="wd-top-menu__section wd-top-menu__section--center d-flex align-center justify-center ga-0">
      <span class="text-caption text-center w-100">{{ focusedWindowTitle }}</span>
      <slot />
    </div>

    <div class="wd-top-menu__section wd-top-menu__section--end d-flex align-center justify-end ga-0">
      <div class="wd-top-menu__window-actions d-flex align-center">
        <template v-if="showFullscreenWindowChrome">
          <v-btn icon="mdi-minus" size="small" variant="text" rounded @click.stop="onMinimizeFocusedWindow" />
          <v-btn class="wd-top-menu__close-btn" icon="mdi-close" size="small" variant="text" rounded
            @click.stop="onCloseFocusedWindow" />
        </template>

        <v-btn v-if="!isMobile" @click="windowManager.toggleFullscreenMode()" icon="mdi-fullscreen" rounded
          variant="text" size="small"></v-btn>
      </div>

      <slot name="end" />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowManager } from '../../composables/useWindowManager'
import { useTopMenu, type WdTopMenuItem } from '../../composables/useTopMenu'
import { useResponsiveMode } from '../../composables/useResponsiveMode'

const props = withDefaults(
  defineProps<{
    height?: number
    mainMenuItems?: readonly WdTopMenuItem[]
    mainMenuLabel?: string
  }>(),
  {
    height: 30,
    mainMenuLabel: 'WebDesk',
  },
)

const topMenuStyle = computed(() => ({
  height: `calc(${props.height}px + var(--wd-safe-top, 0px))`,
  paddingTop: 'var(--wd-safe-top, 0px)',
}))
const mainMenuDrawerStyle = computed(() => ({
  top: `calc(${props.height}px + var(--wd-safe-top, 0px))`,
  height: `calc(100% - (${props.height}px + var(--wd-safe-top, 0px)) - var(--wd-taskbar-space, 0px))`,
}))
const windowManager = useWindowManager()
const topMenu = useTopMenu()
const { isMobile } = useResponsiveMode()
const isMainMenuDrawerOpen = ref(false)
const focusedWindow = computed(() => windowManager.focusedWindow.value)
const focusedMenuItems = computed(() => topMenu.focusedMenuItems.value)
const showCollapsedFocusedMenuItems = computed(() => isMobile.value && focusedMenuItems.value.length > 0)
const showFullscreenWindowChrome = computed(() => Boolean(focusedWindow.value?.wdProps?.mobileFullscreen))
const showFullscreenWindowIcon = computed(() => showFullscreenWindowChrome.value && !isMobile.value)
const focusedWindowIcon = computed(() => {
  const icon = focusedWindow.value?.wdProps?.icon
  return typeof icon === 'string' && icon ? icon : 'mdi-application-outline'
})

const focusedWindowTitle = computed(() => {
  const rawTitle = windowManager.focusedWindow.value?.wdProps?.title
  return typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle : 'Desktop'
})

const topMenuRef = ref<HTMLElement | { $el?: Element | null } | null>(null)
const drawerAttachTarget = ref<HTMLElement | null>(null)
const mainMenuActivatorProps = computed(() => ({
  onClick: () => {
    isMainMenuDrawerOpen.value = !isMainMenuDrawerOpen.value
  },
}))
const mainMenuLabel = computed(() => props.mainMenuLabel)

const closeMainMenuDrawer = () => {
  isMainMenuDrawerOpen.value = false
}

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

  desktopEl.style.setProperty('--wd-top-menu-space', `calc(${props.height}px + var(--wd-safe-top, 0px))`)
  desktopEl.dispatchEvent(new CustomEvent('wd-workarea-change'))
}

const clearDesktopWorkAreaOffset = () => {
  const topMenuEl = getTopMenuElement()
  const desktopEl = topMenuEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  desktopEl.style.removeProperty('--wd-top-menu-space')
  desktopEl.dispatchEvent(new CustomEvent('wd-workarea-change'))
}

watch(() => props.height, applyDesktopWorkAreaOffset, { immediate: true })

onMounted(() => {
  applyDesktopWorkAreaOffset()
  drawerAttachTarget.value = getTopMenuElement()?.closest('.wd-desktop') as HTMLElement | null
})

onBeforeUnmount(() => {
  clearDesktopWorkAreaOffset()
  drawerAttachTarget.value = null
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
  /* margin-right: -8px; */
  gap: 2px;
}

.wd-top-menu__close-btn:hover,
.wd-top-menu__close-btn:focus-visible {
  background-color: #c42b1c !important;
  color: #ffffff !important;
}
</style>

<style>
.wd-top-menu__main-drawer.v-navigation-drawer {
  border-top: 0 !important;
  border-bottom: 0 !important;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-surface), 0.72) 0%,
    rgba(var(--v-theme-surface), 0.58) 100%
  ) !important;
  backdrop-filter: blur(26px) saturate(165%);
  -webkit-backdrop-filter: blur(26px) saturate(165%);
  box-shadow:
    0 16px 30px rgba(0, 0, 0, 0.24),
    0 -10px 18px rgba(0, 0, 0, 0.1);
}

.wd-top-menu__main-drawer.v-navigation-drawer .v-navigation-drawer__content {
  background: transparent !important;
}
</style>
