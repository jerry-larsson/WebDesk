<template>
  <v-app class="webdesk-app">
    <v-main class="webdesk-main">
      <wd-desktop :background="desktopBackground">
        <hello-world-window />
        <wd-taskbar>
          <template #start>
            <v-btn icon="mdi-windows" size="small" variant="text" />
          </template>

          <v-btn icon="mdi-folder-outline" size="small" variant="text" />
          <v-btn icon="mdi-microsoft-edge" size="small" variant="text" />

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
import vintageBackground from '@/assets/backgrounds/vintage.png'

const desktopBackground = `url(${vintageBackground}) center / cover no-repeat`
</script>

<style scoped>
.webdesk-app,
.webdesk-main {
  height: 100vh;
}
</style>
