<template>
  <v-app class="webdesk-app">
    <v-main class="webdesk-main">
      <wd-desktop :background="desktopBackground">
        <wd-top-menu>
          <template #start>
            <span class="text-caption font-weight-bold">WebDesk</span>

            <v-btn-group>
              <v-btn density="comfortable" variant="text">File</v-btn>
              <v-btn density="comfortable" variant="text">Edit</v-btn>
              <v-btn density="comfortable" variant="text"
                @click="windowManager.openWindow('HelloWorldWindow', { id: 'hello-world-' + windowManager.windows.value.length + 1, props: { testParameter: uuidNoDash() } })">Add
                window...</v-btn>
            </v-btn-group>
          </template>

          <span class="text-caption">{{ focusedWindowTitle }}</span>

          <template #end>
            <span class="text-caption">{{ currentTime }}</span>
          </template>
        </wd-top-menu>

        <wd-taskbar>
          <!-- <template #start>
            <v-btn icon="mdi-windows" size="small" variant="text" />
          </template> -->

          <!-- <v-btn-group> -->
          <template v-for="window in windowManager.windows.value" :key="window.id">
            <v-tooltip location="top" :text="window.wdProps.title">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="window.wdProps.icon"
                  :variant="window.id === windowManager.focusedWindow.value?.id ? 'elevated' : 'text'" rounded
                  @click="windowManager.focusWindow(window.id)"></v-btn>
              </template>
            </v-tooltip>
          </template>
          <!-- </v-btn-group> -->

          <!-- <v-btn icon="mdi-folder-outline" size="small" variant="text"/>
          <v-btn icon="mdi-microsoft-edge" size="small" variant="text" /> -->

          <!-- <template #end>
            <v-btn icon="mdi-wifi" size="small" variant="text" />
            <v-btn icon="mdi-volume-high" size="small" variant="text" />
            <v-btn icon="mdi-bell-outline" size="small" variant="text" />
          </template> -->
        </wd-taskbar>
      </wd-desktop>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import vintageBackground from '@/assets/backgrounds/vintage.png'
import { useWindowManager } from '@/composables/useWindowManager'
import { uuidNoDash } from './utils/uuitHelper'
import { format } from 'date-fns';

const desktopBackground = `url(${vintageBackground}) center / cover no-repeat`
const windowManager = useWindowManager()
const now = ref(new Date())
const currentTime = computed(() => format(now.value, 'HH:mm'))

const clockInterval = setInterval(() => {
  now.value = new Date()
}, 1000)

const focusedWindowTitle = computed(() => {
  const rawTitle = windowManager.focusedWindow.value?.wdProps?.title
  return typeof rawTitle === 'string' && rawTitle.trim() ? rawTitle : 'Desktop'
})

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
