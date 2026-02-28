<template>
  <component :is="tag" class="wd-row" :class="rowClasses" :style="rowStyle">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type SizeValue = string | number
type AlignValue = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type JustifyValue = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly'
type AlignContentValue = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly' | 'stretch'

interface Props {
  tag?: string
  noGutters?: boolean
  dense?: boolean
  gap?: SizeValue
  rowGap?: SizeValue
  columnGap?: SizeValue
  align?: AlignValue
  justify?: JustifyValue
  alignContent?: AlignContentValue
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  noGutters: false,
  dense: false,
  gap: undefined,
  rowGap: undefined,
  columnGap: undefined,
  align: 'stretch',
  justify: 'start',
  alignContent: 'stretch',
})

const normalizeSize = (value: SizeValue | undefined) => {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

const toFlexValue = (value: string) => {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  return value
}

const defaultGutter = computed(() => {
  if (props.noGutters) return '0px'
  return props.dense ? '8px' : '24px'
})

const gutterX = computed(() => normalizeSize(props.columnGap ?? props.gap) ?? defaultGutter.value)
const gutterY = computed(() => normalizeSize(props.rowGap ?? props.gap) ?? defaultGutter.value)

const rowClasses = computed(() => ({
  'wd-row--no-gutters': props.noGutters,
}))

const rowStyle = computed(() => ({
  '--wd-row-gutter-x': gutterX.value,
  '--wd-row-gutter-y': gutterY.value,
  '--wd-row-align': toFlexValue(props.align),
  '--wd-row-justify': toFlexValue(props.justify),
  '--wd-row-align-content': toFlexValue(props.alignContent),
}))
</script>

<style scoped>
.wd-row {
  container-type: inline-size;
  container-name: wd-grid;
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
  align-items: var(--wd-row-align, stretch);
  justify-content: var(--wd-row-justify, flex-start);
  align-content: var(--wd-row-align-content, stretch);
  margin-inline: calc(var(--wd-row-gutter-x, 24px) / -2);
  margin-block: calc(var(--wd-row-gutter-y, 24px) / -2);
}

.wd-row--no-gutters {
  margin: 0;
}
</style>
