<template>
  <wd-window title="Hello world">
    <template #titlebar-start>
      <v-icon icon="mdi-folder-outline" size="18" />
    </template>

    <p class="text-body-1 mb-2">Your window content goes here.</p>
    <p class="text-body-2">
      Drag the titlebar to move. Drag any edge or corner to resize.
    </p>

    <template #footer>
      <div class="text-caption">Status: Ready</div>
    </template>
  </wd-window>
</template>
