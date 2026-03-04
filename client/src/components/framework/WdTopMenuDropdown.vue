<template>
  <v-list class="wd-top-menu-dropdown py-1" density="compact" min-width="220">
    <template v-for="item in visibleItems" :key="item.id">
      <v-divider v-if="item.type === 'divider'" class="my-1" />

      <v-menu v-else-if="item.children?.length" location="end top" :open-on-hover="!isTouchInput" open-on-click
        :close-on-content-click="false">
        <template #activator="{ props: activatorProps }">
          <v-list-item v-bind="activatorProps" :disabled="item.disabled" :title="item.label" class="text-body-medium">
            <template #append>
              <span v-if="item.shortcut" class="text-body-medium text-medium-emphasis mr-2">{{ item.shortcut }}</span>
              <v-icon icon="mdi-chevron-right" size="16" />
            </template>
          </v-list-item>
        </template>

        <wd-top-menu-dropdown :items="item.children" :on-item-invoked="onItemInvoked" />
      </v-menu>

      <v-list-item v-else :disabled="item.disabled" :title="item.label" @click="onItemClick(item)"
        class="text-body-medium">
        <template #append>
          <span v-if="item.shortcut" class="text-body-medium text-medium-emphasis">{{ item.shortcut }}</span>
          <v-icon v-if="item.icon" :icon="item.icon"></v-icon>
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WdTopMenuItem } from '../../composables/useTopMenu'

const props = defineProps<{
  items: readonly WdTopMenuItem[]
  onItemInvoked?: () => void
}>()

const visibleItems = computed(() => props.items.filter(item => item.visible !== false))
const isTouchInput = computed(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
})

const onItemClick = (item: WdTopMenuItem) => {
  if (item.disabled) return
  item.onClick?.()
  props.onItemInvoked?.()
}

const onItemInvoked = () => {
  props.onItemInvoked?.()
}
</script>
