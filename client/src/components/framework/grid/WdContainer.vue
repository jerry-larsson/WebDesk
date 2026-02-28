<template>
  <component :is="tag" class="wd-container" :class="containerClasses" :style="containerStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SizeValue = string | number

interface Props {
  tag?: string
  fluid?: boolean
  noPadding?: boolean
  gutter?: SizeValue
  maxWidth?: SizeValue
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  fluid: false,
  noPadding: false,
  gutter: 16,
  maxWidth: 1280,
})

const normalizeSize = (value: SizeValue) => (typeof value === 'number' ? `${value}px` : value)

const containerClasses = computed(() => ({
  'wd-container--fluid': props.fluid,
  'wd-container--no-padding': props.noPadding,
}))

const containerStyle = computed(() => ({
  '--wd-container-gutter': normalizeSize(props.gutter),
  '--wd-container-max-width': normalizeSize(props.maxWidth),
}))
</script>

<style scoped>
.wd-container {
  width: 100%;
  box-sizing: border-box;
  margin-inline: auto;
  padding-inline: var(--wd-container-gutter, 16px);
  max-width: var(--wd-container-max-width, 1280px);
}

.wd-container--fluid {
  max-width: none;
}

.wd-container--no-padding {
  padding-inline: 0 !important;
}
</style>
