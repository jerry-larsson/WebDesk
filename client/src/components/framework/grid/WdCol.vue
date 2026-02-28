<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type ColValue = number | string | boolean | null | undefined
type AlignSelfValue = 'auto' | 'start' | 'end' | 'center' | 'stretch' | 'baseline'
type OrderValue = number | string | null | undefined

interface Props {
  cols?: ColValue
  sm?: ColValue
  md?: ColValue
  lg?: ColValue
  xl?: ColValue
  xxl?: ColValue
  offset?: number | string
  offsetSm?: number | string
  offsetMd?: number | string
  offsetLg?: number | string
  offsetXl?: number | string
  offsetXxl?: number | string
  order?: OrderValue
  orderSm?: OrderValue
  orderMd?: OrderValue
  orderLg?: OrderValue
  orderXl?: OrderValue
  orderXxl?: OrderValue
  alignSelf?: AlignSelfValue
}

const props = defineProps<Props>()

const parseSpan = (value: ColValue) => {
  if (value === undefined || value === null || value === false) return null
  if (value === true) return 'flex'
  if (value === 'auto') return 'auto'

  const num = Number(value)
  if (Number.isInteger(num) && num >= 1 && num <= 12) return String(num)
  return null
}

const parseOffset = (value: number | string | undefined) => {
  if (value === undefined) return null
  const num = Number(value)
  if (Number.isInteger(num) && num >= 0 && num <= 11) return String(num)
  return null
}

const parseOrder = (value: OrderValue) => {
  if (value === undefined || value === null) return null
  if (value === 'first' || value === 'last') return value
  const num = Number(value)
  if (Number.isInteger(num) && num >= 0 && num <= 12) return String(num)
  return null
}

const addSpanClass = (list: string[], bp: string, value: ColValue) => {
  const span = parseSpan(value)
  if (!span) return
  list.push(`wd-col--${bp}-${span}`)
}

const addOffsetClass = (list: string[], bp: string, value: number | string | undefined) => {
  const offset = parseOffset(value)
  if (offset === null) return
  list.push(`wd-col--offset-${bp}-${offset}`)
}

const addOrderClass = (list: string[], bp: string, value: OrderValue) => {
  const order = parseOrder(value)
  if (!order) return
  list.push(`wd-col--order-${bp}-${order}`)
}

const classes = computed(() => {
  const cls = ['wd-col']

  addSpanClass(cls, 'cols', props.cols)
  addSpanClass(cls, 'sm', props.sm)
  addSpanClass(cls, 'md', props.md)
  addSpanClass(cls, 'lg', props.lg)
  addSpanClass(cls, 'xl', props.xl)
  addSpanClass(cls, 'xxl', props.xxl)

  addOffsetClass(cls, 'cols', props.offset)
  addOffsetClass(cls, 'sm', props.offsetSm)
  addOffsetClass(cls, 'md', props.offsetMd)
  addOffsetClass(cls, 'lg', props.offsetLg)
  addOffsetClass(cls, 'xl', props.offsetXl)
  addOffsetClass(cls, 'xxl', props.offsetXxl)

  addOrderClass(cls, 'cols', props.order)
  addOrderClass(cls, 'sm', props.orderSm)
  addOrderClass(cls, 'md', props.orderMd)
  addOrderClass(cls, 'lg', props.orderLg)
  addOrderClass(cls, 'xl', props.orderXl)
  addOrderClass(cls, 'xxl', props.orderXxl)

  const hasSpanClass = cls.some(item => item.startsWith('wd-col--cols-'))
  if (!hasSpanClass) {
    cls.push('wd-col--cols-flex')
  }

  if (props.alignSelf) {
    cls.push(`wd-col--align-self-${props.alignSelf}`)
  }

  return cls
})
</script>

<style scoped>
.wd-col {
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 100%;
  max-width: 100%;
  padding-inline: calc(var(--wd-row-gutter-x, 24px) / 2);
  padding-block: calc(var(--wd-row-gutter-y, 24px) / 2);
}

.wd-col--cols-flex {
  flex: 1 1 0;
  max-width: 100%;
}

.wd-col--cols-auto {
  flex: 0 0 auto;
  width: auto;
  max-width: none;
}

.wd-col--cols-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
.wd-col--cols-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
.wd-col--cols-3 { flex-basis: 25%; max-width: 25%; }
.wd-col--cols-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
.wd-col--cols-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
.wd-col--cols-6 { flex-basis: 50%; max-width: 50%; }
.wd-col--cols-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
.wd-col--cols-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
.wd-col--cols-9 { flex-basis: 75%; max-width: 75%; }
.wd-col--cols-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
.wd-col--cols-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
.wd-col--cols-12 { flex-basis: 100%; max-width: 100%; }

.wd-col--offset-cols-0 { margin-inline-start: 0; }
.wd-col--offset-cols-1 { margin-inline-start: 8.3333%; }
.wd-col--offset-cols-2 { margin-inline-start: 16.6667%; }
.wd-col--offset-cols-3 { margin-inline-start: 25%; }
.wd-col--offset-cols-4 { margin-inline-start: 33.3333%; }
.wd-col--offset-cols-5 { margin-inline-start: 41.6667%; }
.wd-col--offset-cols-6 { margin-inline-start: 50%; }
.wd-col--offset-cols-7 { margin-inline-start: 58.3333%; }
.wd-col--offset-cols-8 { margin-inline-start: 66.6667%; }
.wd-col--offset-cols-9 { margin-inline-start: 75%; }
.wd-col--offset-cols-10 { margin-inline-start: 83.3333%; }
.wd-col--offset-cols-11 { margin-inline-start: 91.6667%; }

.wd-col--order-cols-first { order: -1; }
.wd-col--order-cols-last { order: 13; }
.wd-col--order-cols-0 { order: 0; }
.wd-col--order-cols-1 { order: 1; }
.wd-col--order-cols-2 { order: 2; }
.wd-col--order-cols-3 { order: 3; }
.wd-col--order-cols-4 { order: 4; }
.wd-col--order-cols-5 { order: 5; }
.wd-col--order-cols-6 { order: 6; }
.wd-col--order-cols-7 { order: 7; }
.wd-col--order-cols-8 { order: 8; }
.wd-col--order-cols-9 { order: 9; }
.wd-col--order-cols-10 { order: 10; }
.wd-col--order-cols-11 { order: 11; }
.wd-col--order-cols-12 { order: 12; }

.wd-col--align-self-auto { align-self: auto; }
.wd-col--align-self-start { align-self: flex-start; }
.wd-col--align-self-end { align-self: flex-end; }
.wd-col--align-self-center { align-self: center; }
.wd-col--align-self-stretch { align-self: stretch; }
.wd-col--align-self-baseline { align-self: baseline; }

@container wd-grid (min-width: 600px) {
  .wd-col--sm-flex { flex: 1 1 0; max-width: 100%; }
  .wd-col--sm-auto { flex: 0 0 auto; width: auto; max-width: none; }

  .wd-col--sm-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
  .wd-col--sm-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
  .wd-col--sm-3 { flex-basis: 25%; max-width: 25%; }
  .wd-col--sm-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
  .wd-col--sm-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
  .wd-col--sm-6 { flex-basis: 50%; max-width: 50%; }
  .wd-col--sm-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
  .wd-col--sm-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
  .wd-col--sm-9 { flex-basis: 75%; max-width: 75%; }
  .wd-col--sm-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
  .wd-col--sm-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
  .wd-col--sm-12 { flex-basis: 100%; max-width: 100%; }

  .wd-col--offset-sm-0 { margin-inline-start: 0; }
  .wd-col--offset-sm-1 { margin-inline-start: 8.3333%; }
  .wd-col--offset-sm-2 { margin-inline-start: 16.6667%; }
  .wd-col--offset-sm-3 { margin-inline-start: 25%; }
  .wd-col--offset-sm-4 { margin-inline-start: 33.3333%; }
  .wd-col--offset-sm-5 { margin-inline-start: 41.6667%; }
  .wd-col--offset-sm-6 { margin-inline-start: 50%; }
  .wd-col--offset-sm-7 { margin-inline-start: 58.3333%; }
  .wd-col--offset-sm-8 { margin-inline-start: 66.6667%; }
  .wd-col--offset-sm-9 { margin-inline-start: 75%; }
  .wd-col--offset-sm-10 { margin-inline-start: 83.3333%; }
  .wd-col--offset-sm-11 { margin-inline-start: 91.6667%; }

  .wd-col--order-sm-first { order: -1; }
  .wd-col--order-sm-last { order: 13; }
  .wd-col--order-sm-0 { order: 0; }
  .wd-col--order-sm-1 { order: 1; }
  .wd-col--order-sm-2 { order: 2; }
  .wd-col--order-sm-3 { order: 3; }
  .wd-col--order-sm-4 { order: 4; }
  .wd-col--order-sm-5 { order: 5; }
  .wd-col--order-sm-6 { order: 6; }
  .wd-col--order-sm-7 { order: 7; }
  .wd-col--order-sm-8 { order: 8; }
  .wd-col--order-sm-9 { order: 9; }
  .wd-col--order-sm-10 { order: 10; }
  .wd-col--order-sm-11 { order: 11; }
  .wd-col--order-sm-12 { order: 12; }
}

@container wd-grid (min-width: 960px) {
  .wd-col--md-flex { flex: 1 1 0; max-width: 100%; }
  .wd-col--md-auto { flex: 0 0 auto; width: auto; max-width: none; }

  .wd-col--md-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
  .wd-col--md-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
  .wd-col--md-3 { flex-basis: 25%; max-width: 25%; }
  .wd-col--md-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
  .wd-col--md-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
  .wd-col--md-6 { flex-basis: 50%; max-width: 50%; }
  .wd-col--md-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
  .wd-col--md-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
  .wd-col--md-9 { flex-basis: 75%; max-width: 75%; }
  .wd-col--md-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
  .wd-col--md-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
  .wd-col--md-12 { flex-basis: 100%; max-width: 100%; }

  .wd-col--offset-md-0 { margin-inline-start: 0; }
  .wd-col--offset-md-1 { margin-inline-start: 8.3333%; }
  .wd-col--offset-md-2 { margin-inline-start: 16.6667%; }
  .wd-col--offset-md-3 { margin-inline-start: 25%; }
  .wd-col--offset-md-4 { margin-inline-start: 33.3333%; }
  .wd-col--offset-md-5 { margin-inline-start: 41.6667%; }
  .wd-col--offset-md-6 { margin-inline-start: 50%; }
  .wd-col--offset-md-7 { margin-inline-start: 58.3333%; }
  .wd-col--offset-md-8 { margin-inline-start: 66.6667%; }
  .wd-col--offset-md-9 { margin-inline-start: 75%; }
  .wd-col--offset-md-10 { margin-inline-start: 83.3333%; }
  .wd-col--offset-md-11 { margin-inline-start: 91.6667%; }

  .wd-col--order-md-first { order: -1; }
  .wd-col--order-md-last { order: 13; }
  .wd-col--order-md-0 { order: 0; }
  .wd-col--order-md-1 { order: 1; }
  .wd-col--order-md-2 { order: 2; }
  .wd-col--order-md-3 { order: 3; }
  .wd-col--order-md-4 { order: 4; }
  .wd-col--order-md-5 { order: 5; }
  .wd-col--order-md-6 { order: 6; }
  .wd-col--order-md-7 { order: 7; }
  .wd-col--order-md-8 { order: 8; }
  .wd-col--order-md-9 { order: 9; }
  .wd-col--order-md-10 { order: 10; }
  .wd-col--order-md-11 { order: 11; }
  .wd-col--order-md-12 { order: 12; }
}

@container wd-grid (min-width: 1280px) {
  .wd-col--lg-flex { flex: 1 1 0; max-width: 100%; }
  .wd-col--lg-auto { flex: 0 0 auto; width: auto; max-width: none; }

  .wd-col--lg-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
  .wd-col--lg-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
  .wd-col--lg-3 { flex-basis: 25%; max-width: 25%; }
  .wd-col--lg-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
  .wd-col--lg-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
  .wd-col--lg-6 { flex-basis: 50%; max-width: 50%; }
  .wd-col--lg-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
  .wd-col--lg-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
  .wd-col--lg-9 { flex-basis: 75%; max-width: 75%; }
  .wd-col--lg-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
  .wd-col--lg-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
  .wd-col--lg-12 { flex-basis: 100%; max-width: 100%; }

  .wd-col--offset-lg-0 { margin-inline-start: 0; }
  .wd-col--offset-lg-1 { margin-inline-start: 8.3333%; }
  .wd-col--offset-lg-2 { margin-inline-start: 16.6667%; }
  .wd-col--offset-lg-3 { margin-inline-start: 25%; }
  .wd-col--offset-lg-4 { margin-inline-start: 33.3333%; }
  .wd-col--offset-lg-5 { margin-inline-start: 41.6667%; }
  .wd-col--offset-lg-6 { margin-inline-start: 50%; }
  .wd-col--offset-lg-7 { margin-inline-start: 58.3333%; }
  .wd-col--offset-lg-8 { margin-inline-start: 66.6667%; }
  .wd-col--offset-lg-9 { margin-inline-start: 75%; }
  .wd-col--offset-lg-10 { margin-inline-start: 83.3333%; }
  .wd-col--offset-lg-11 { margin-inline-start: 91.6667%; }

  .wd-col--order-lg-first { order: -1; }
  .wd-col--order-lg-last { order: 13; }
  .wd-col--order-lg-0 { order: 0; }
  .wd-col--order-lg-1 { order: 1; }
  .wd-col--order-lg-2 { order: 2; }
  .wd-col--order-lg-3 { order: 3; }
  .wd-col--order-lg-4 { order: 4; }
  .wd-col--order-lg-5 { order: 5; }
  .wd-col--order-lg-6 { order: 6; }
  .wd-col--order-lg-7 { order: 7; }
  .wd-col--order-lg-8 { order: 8; }
  .wd-col--order-lg-9 { order: 9; }
  .wd-col--order-lg-10 { order: 10; }
  .wd-col--order-lg-11 { order: 11; }
  .wd-col--order-lg-12 { order: 12; }
}

@container wd-grid (min-width: 1920px) {
  .wd-col--xl-flex { flex: 1 1 0; max-width: 100%; }
  .wd-col--xl-auto { flex: 0 0 auto; width: auto; max-width: none; }

  .wd-col--xl-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
  .wd-col--xl-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
  .wd-col--xl-3 { flex-basis: 25%; max-width: 25%; }
  .wd-col--xl-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
  .wd-col--xl-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
  .wd-col--xl-6 { flex-basis: 50%; max-width: 50%; }
  .wd-col--xl-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
  .wd-col--xl-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
  .wd-col--xl-9 { flex-basis: 75%; max-width: 75%; }
  .wd-col--xl-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
  .wd-col--xl-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
  .wd-col--xl-12 { flex-basis: 100%; max-width: 100%; }

  .wd-col--offset-xl-0 { margin-inline-start: 0; }
  .wd-col--offset-xl-1 { margin-inline-start: 8.3333%; }
  .wd-col--offset-xl-2 { margin-inline-start: 16.6667%; }
  .wd-col--offset-xl-3 { margin-inline-start: 25%; }
  .wd-col--offset-xl-4 { margin-inline-start: 33.3333%; }
  .wd-col--offset-xl-5 { margin-inline-start: 41.6667%; }
  .wd-col--offset-xl-6 { margin-inline-start: 50%; }
  .wd-col--offset-xl-7 { margin-inline-start: 58.3333%; }
  .wd-col--offset-xl-8 { margin-inline-start: 66.6667%; }
  .wd-col--offset-xl-9 { margin-inline-start: 75%; }
  .wd-col--offset-xl-10 { margin-inline-start: 83.3333%; }
  .wd-col--offset-xl-11 { margin-inline-start: 91.6667%; }

  .wd-col--order-xl-first { order: -1; }
  .wd-col--order-xl-last { order: 13; }
  .wd-col--order-xl-0 { order: 0; }
  .wd-col--order-xl-1 { order: 1; }
  .wd-col--order-xl-2 { order: 2; }
  .wd-col--order-xl-3 { order: 3; }
  .wd-col--order-xl-4 { order: 4; }
  .wd-col--order-xl-5 { order: 5; }
  .wd-col--order-xl-6 { order: 6; }
  .wd-col--order-xl-7 { order: 7; }
  .wd-col--order-xl-8 { order: 8; }
  .wd-col--order-xl-9 { order: 9; }
  .wd-col--order-xl-10 { order: 10; }
  .wd-col--order-xl-11 { order: 11; }
  .wd-col--order-xl-12 { order: 12; }
}

@container wd-grid (min-width: 2560px) {
  .wd-col--xxl-flex { flex: 1 1 0; max-width: 100%; }
  .wd-col--xxl-auto { flex: 0 0 auto; width: auto; max-width: none; }

  .wd-col--xxl-1 { flex-basis: 8.3333%; max-width: 8.3333%; }
  .wd-col--xxl-2 { flex-basis: 16.6667%; max-width: 16.6667%; }
  .wd-col--xxl-3 { flex-basis: 25%; max-width: 25%; }
  .wd-col--xxl-4 { flex-basis: 33.3333%; max-width: 33.3333%; }
  .wd-col--xxl-5 { flex-basis: 41.6667%; max-width: 41.6667%; }
  .wd-col--xxl-6 { flex-basis: 50%; max-width: 50%; }
  .wd-col--xxl-7 { flex-basis: 58.3333%; max-width: 58.3333%; }
  .wd-col--xxl-8 { flex-basis: 66.6667%; max-width: 66.6667%; }
  .wd-col--xxl-9 { flex-basis: 75%; max-width: 75%; }
  .wd-col--xxl-10 { flex-basis: 83.3333%; max-width: 83.3333%; }
  .wd-col--xxl-11 { flex-basis: 91.6667%; max-width: 91.6667%; }
  .wd-col--xxl-12 { flex-basis: 100%; max-width: 100%; }

  .wd-col--offset-xxl-0 { margin-inline-start: 0; }
  .wd-col--offset-xxl-1 { margin-inline-start: 8.3333%; }
  .wd-col--offset-xxl-2 { margin-inline-start: 16.6667%; }
  .wd-col--offset-xxl-3 { margin-inline-start: 25%; }
  .wd-col--offset-xxl-4 { margin-inline-start: 33.3333%; }
  .wd-col--offset-xxl-5 { margin-inline-start: 41.6667%; }
  .wd-col--offset-xxl-6 { margin-inline-start: 50%; }
  .wd-col--offset-xxl-7 { margin-inline-start: 58.3333%; }
  .wd-col--offset-xxl-8 { margin-inline-start: 66.6667%; }
  .wd-col--offset-xxl-9 { margin-inline-start: 75%; }
  .wd-col--offset-xxl-10 { margin-inline-start: 83.3333%; }
  .wd-col--offset-xxl-11 { margin-inline-start: 91.6667%; }

  .wd-col--order-xxl-first { order: -1; }
  .wd-col--order-xxl-last { order: 13; }
  .wd-col--order-xxl-0 { order: 0; }
  .wd-col--order-xxl-1 { order: 1; }
  .wd-col--order-xxl-2 { order: 2; }
  .wd-col--order-xxl-3 { order: 3; }
  .wd-col--order-xxl-4 { order: 4; }
  .wd-col--order-xxl-5 { order: 5; }
  .wd-col--order-xxl-6 { order: 6; }
  .wd-col--order-xxl-7 { order: 7; }
  .wd-col--order-xxl-8 { order: 8; }
  .wd-col--order-xxl-9 { order: 9; }
  .wd-col--order-xxl-10 { order: 10; }
  .wd-col--order-xxl-11 { order: 11; }
  .wd-col--order-xxl-12 { order: 12; }
}
</style>
