<template>
  <v-app class="webdesk-app">
    <v-main class="webdesk-main">
      <wd-desktop :background="desktopBackground">
        <template #icons>
          <wd-desktop-icon label="Hello World" icon="mdi-file-document-outline"
            @open="windowManager.openWindow('HelloWorldWindow', { id: 'hello-world-' + windowManager.windows.value.length + 1, props: { testParameter: uuidNoDash() } })" />
          <wd-desktop-icon label="Projects" icon="mdi-folder-outline"
            @open="windowManager.openWindow('projects-window', { id: 'projects-window' })" />
        </template>

        <wd-top-menu>
          <template #start>
            <v-menu location="bottom start">
              <template #activator="{ props: activatorProps }">
                <v-btn v-if="!$slots.activator" v-bind="activatorProps" class="px-2" density="comfortable" rounded="0"
                  variant="text">
                  <span class="text-body-large font-weight-bold">WebDesk</span>
                </v-btn>

                <slot name="activator" v-bind="activatorProps"></slot>
              </template>

              <wd-top-menu-dropdown :items="mainMenuItems" />
            </v-menu>
          </template>
        </wd-top-menu>

        <wd-taskbar></wd-taskbar>
      </wd-desktop>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import vintageBackground from '@/assets/backgrounds/vintage.png'
import WdDesktopIcon from '@/components/framework/WdDesktopIcon.vue'
import type { WdTopMenuItem } from '@/composables/useTopMenu'
import { useWindowManager, type WdManagedWindow } from '@/composables/useWindowManager'
import { uuidNoDash } from './utils/uuitHelper'
import { format } from 'date-fns';

const desktopBackground = `url(${vintageBackground}) center / cover no-repeat`
const windowManager = useWindowManager()
const now = ref(new Date())
const currentTime = computed(() => format(now.value, 'HH:mm'))

const clockInterval = setInterval(() => {
  now.value = new Date()
}, 1000)
const updateAppViewportHeight = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const viewportHeight = Math.round(window.visualViewport?.height ?? window.innerHeight)
  document.documentElement.style.setProperty('--wd-app-height', `${viewportHeight}px`)
}

const mainMenuItems = computed<WdTopMenuItem[]>(() => [
  {
    id: '1', label: 'Hello',
    children: [],
    onClick: () => {
      windowManager.openWindow('HelloWorldWindow', { id: 'hello-world-' + windowManager.windows.value.length + 1, props: { testParameter: uuidNoDash() } })
    }
  },
  {
    id: 'project', label: 'Projekt',
    children: [],
    onClick: () => {
      windowManager.openWindow('projects-window', { id: 'projects-window' })
    }
  },
  {
    id: 'blank', label: 'Blankt fönster',
    children: [],
    onClick: () => {
      windowManager.openWindow('blank-window', { id: 'blank-window-' + windowManager.windows.value.length + 1 })
    }
  }
]);

onBeforeUnmount(() => {
  clearInterval(clockInterval)
  window.removeEventListener('resize', updateAppViewportHeight)
  window.removeEventListener('orientationchange', updateAppViewportHeight)
  window.visualViewport?.removeEventListener('resize', updateAppViewportHeight)
  window.visualViewport?.removeEventListener('scroll', updateAppViewportHeight)
})

onMounted(() => {
  updateAppViewportHeight()
  window.addEventListener('resize', updateAppViewportHeight)
  window.addEventListener('orientationchange', updateAppViewportHeight)
  window.visualViewport?.addEventListener('resize', updateAppViewportHeight)
  window.visualViewport?.addEventListener('scroll', updateAppViewportHeight)
  windowManager.openPersistedWindows()
})
</script>

<style scoped>
:global(:root) {
  --wd-app-height: 100svh;
  --wd-safe-top: env(safe-area-inset-top, 0px);
  --wd-safe-bottom: env(safe-area-inset-bottom, 0px);
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  height: var(--wd-app-height);
  min-height: 100svh;
  margin: 0;
  overflow: hidden;
}

.webdesk-app,
.webdesk-main {
  height: 100%;
  min-height: 100%;
  overflow: hidden;
}
</style>
