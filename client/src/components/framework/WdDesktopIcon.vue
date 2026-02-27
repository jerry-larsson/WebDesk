<template>
  <button
    :class="['wd-desktop-icon', hasManualPosition && 'wd-desktop-icon--manual']"
    type="button"
    :style="iconStyle"
    @dblclick.stop="emit('open')"
  >
    <v-icon :icon="icon" size="42" />
    <span class="wd-desktop-icon__label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    icon?: string
    x?: number
    y?: number
  }>(),
  {
    icon: 'mdi-file-outline',
    x: undefined,
    y: undefined,
  },
)

const emit = defineEmits<{
  open: []
}>()

const hasManualPosition = computed(() => props.x !== undefined || props.y !== undefined)

const iconStyle = computed(() => {
  if (!hasManualPosition.value) return {}
  return {
    left: `${props.x ?? 16}px`,
    top: `${props.y ?? 16}px`,
  }
})
</script>

<style scoped>
.wd-desktop-icon {
  width: 86px;
  min-height: 86px;
  padding: 8px 6px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgb(var(--v-theme-on-surface));
  background: transparent;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  cursor: default;
  user-select: none;
}

.wd-desktop-icon:hover {
  background: rgba(var(--v-theme-surface), 0.18);
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.wd-desktop-icon:focus-visible {
  outline: none;
  background: rgba(var(--v-theme-primary), 0.16);
  border-color: rgba(var(--v-theme-primary), 0.55);
}

.wd-desktop-icon__label {
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.15;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  word-break: break-word;
}

.wd-desktop-icon--manual {
  position: absolute;
}
</style>
