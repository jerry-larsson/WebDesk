<template>
  <v-sheet
    ref="taskbarRef"
    class="wd-taskbar d-flex align-center px-3"
    color="surface"
    elevation="0"
    rounded="0"
    :style="taskbarStyle"
  >
    <div class="wd-taskbar__section wd-taskbar__section--start d-flex align-center ga-1">
      <slot name="start" />
    </div>

    <div class="wd-taskbar__section wd-taskbar__section--center d-flex align-center justify-center ga-1">
      <slot />
    </div>

    <div class="wd-taskbar__section wd-taskbar__section--end d-flex align-center justify-end ga-1">
      <slot name="end" />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    height?: number
    margin?: number
  }>(),
  {
    height: 48,
    margin: 0,
  },
)

const taskbarStyle = computed(() => ({
  height: `${props.height}px`,
  left: `${props.margin}px`,
  right: `${props.margin}px`,
  bottom: `${props.margin}px`,
}))

const taskbarRef = ref<HTMLElement | { $el?: Element | null } | null>(null)

const getTaskbarElement = (): HTMLElement | null => {
  if (!taskbarRef.value) return null
  if (taskbarRef.value instanceof HTMLElement) return taskbarRef.value

  const rawEl = taskbarRef.value.$el
  return rawEl instanceof HTMLElement ? rawEl : null
}

const applyDesktopWorkAreaOffset = () => {
  const taskbarEl = getTaskbarElement()
  const desktopEl = taskbarEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  const reservedSpace = props.height + (props.margin * 2)
  desktopEl.style.setProperty('--wd-taskbar-space', `${reservedSpace}px`)
}

const clearDesktopWorkAreaOffset = () => {
  const taskbarEl = getTaskbarElement()
  const desktopEl = taskbarEl?.closest('.wd-desktop') as HTMLElement | null
  if (!desktopEl) return

  desktopEl.style.removeProperty('--wd-taskbar-space')
}

watch(() => [props.height, props.margin], applyDesktopWorkAreaOffset, { immediate: true })

onMounted(() => {
  applyDesktopWorkAreaOffset()
})

onBeforeUnmount(() => {
  clearDesktopWorkAreaOffset()
})
</script>

<style scoped>
.wd-taskbar {
  position: absolute;
  z-index: 1000;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.16);
  background-color: rgba(var(--v-theme-surface), 0.72) !important;
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
}

.wd-taskbar__section {
  min-width: 0;
  flex: 1 1 0;
}

.wd-taskbar__section--center {
  overflow-x: auto;
  scrollbar-width: none;
}

.wd-taskbar__section--center::-webkit-scrollbar {
  display: none;
}
</style>
