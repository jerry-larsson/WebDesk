<template>
  <v-app>
    <v-main>
      <wd-desktop>
        <wd-top-menu :main-menu-items="mainMenuItems"></wd-top-menu>
      </wd-desktop>

      <wd-taskbar></wd-taskbar>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import type { WdTopMenuItem } from 'webdesk-ui'

const mainMenuItems: WdTopMenuItem[] = []
</script>
