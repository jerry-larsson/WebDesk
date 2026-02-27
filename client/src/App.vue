<template>
  <v-app class="webdesk-app">
    <v-main class="webdesk-main">
      <wd-desktop :background="desktopBackground">
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

            <wd-top-menu-items :items="focusedMenuItems" />
          </template>

          <span class="text-caption">{{ focusedWindowTitle }}</span>

          <template #end>
            <span class="text-caption">{{ currentTime }}</span>
          </template>
        </wd-top-menu>

        <wd-taskbar>
          <template v-for="window in windowManager.windows.value" :key="window.id">
            <v-tooltip location="top" :text="window.wdProps.title">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="window.wdProps.icon"
                  :variant="window.id === windowManager.focusedWindow.value?.id ? 'elevated' : 'text'" rounded
                  @click="windowManager.focusWindow(window.id)"></v-btn>
              </template>
            </v-tooltip>
          </template>
        </wd-taskbar>
      </wd-desktop>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import vintageBackground from '@/assets/backgrounds/vintage.png'
import { useTopMenu } from '@/composables/useTopMenu'
import type { WdTopMenuItem } from '@/composables/useTopMenu'
import { useWindowManager } from '@/composables/useWindowManager'
import { uuidNoDash } from './utils/uuitHelper'
import { format } from 'date-fns';

const desktopBackground = `url(${vintageBackground}) center / cover no-repeat`
const windowManager = useWindowManager()
const topMenu = useTopMenu()
const now = ref(new Date())
const currentTime = computed(() => format(now.value, 'HH:mm'))
const focusedMenuItems = computed(() => topMenu.focusedMenuItems.value)

const clockInterval = setInterval(() => {
  now.value = new Date()
}, 1000)

const focusedWindowTitle = computed(() => {
  const rawTitle = windowManager.focusedWindow.value?.wdProps?.title
  return typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle : 'Desktop'
})

const mainMenuItems = ref<WdTopMenuItem[]>([
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
  }
]);

onBeforeUnmount(() => {
  clearInterval(clockInterval)
})

onMounted(() => {
  windowManager.openPersistedWindows()
})
</script>

<style scoped>
.webdesk-app,
.webdesk-main {
  height: 100vh;
}
</style>
