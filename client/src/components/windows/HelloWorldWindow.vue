<template>
  <wd-window :title="`Hello world - ${testParameter}`" icon="mdi-account" :initial-width="300" :initial-height="200">
    <p class="text-body-1 mb-2 mt-0">Your window content goes here.</p>
    <p class="text-body-2">
      Drag the titlebar to move. Drag any edge or corner to resize.
    </p>

    <p>Value: {{ testParameter }}</p>

    <template #footer>
      <div class="text-caption">Status: Ready</div>
    </template>
  </wd-window>
</template>

<script setup lang="ts">
defineProps({
  testParameter: { type: String, required: false }
});
</script>