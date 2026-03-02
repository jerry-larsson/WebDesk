<template>
  <span ref="anchorRef" class="wd-dialog-anchor">
    <v-dialog
      v-model="modelValue"
      :width="width"
      :max-width="maxWidth"
      :persistent="persistent"
      :scrim="scrim"
      :attach="attachTarget"
      contained
      scrollable
    >
      <template #activator="{ props: activatorProps }">
        <slot name="activator" v-bind="activatorProps" />
      </template>

      <template v-if="$slots['default']" #default="{ isActive }">
        <slot :isActive="isActive" />
      </template>

      <v-card v-if="!$slots['default']" :width="width" :max-width="maxWidth">
        <v-card-title v-if="$slots.title || title">
          <slot name="title">{{ title }}</slot>
        </v-card-title>

        <v-card-text>
          <slot name="text" />
        </v-card-text>

        <v-card-actions v-if="$slots.actions">
          <slot name="actions" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'

const modelValue = defineModel({
  type: Boolean,
  default: false,
})

const props = withDefaults(
  defineProps<{
    title?: string
    width?: number | string
    maxWidth?: number | string
    persistent?: boolean
    scrim?: string | boolean
  }>(),
  {
    title: undefined,
    width: 420,
    maxWidth: 560,
    persistent: false,
    scrim: true,
  },
)

const emit = defineEmits<{ close: [] }>()
const anchorRef = ref<HTMLElement | null>(null)
const attachTarget = ref<HTMLElement | undefined>(undefined)

const resolveAttachTarget = async () => {
  await nextTick()
  const windowRoot = anchorRef.value?.closest('.wd-window')
  if (!(windowRoot instanceof HTMLElement)) {
    attachTarget.value = undefined
    return
  }

  const contentRoot = windowRoot.querySelector('.wd-window__content')
  attachTarget.value = contentRoot instanceof HTMLElement ? contentRoot : windowRoot
}

onMounted(() => {
  resolveAttachTarget()
})

watch(modelValue, (next, prev) => {
  if (next && !attachTarget.value) {
    resolveAttachTarget()
  }
  if (!next && prev) {
    emit('close')
  }
})
</script>

<style scoped>
.wd-dialog-anchor {
  display: contents;
}
</style>
