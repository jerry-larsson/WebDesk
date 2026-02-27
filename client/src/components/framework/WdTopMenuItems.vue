<template>
  <div class="wd-top-menu-items d-flex align-center">
    <template v-for="item in visibleItems" :key="item.id">
      <v-menu v-if="item.children?.length" location="bottom start">
        <template #activator="{ props: activatorProps }">
          <v-btn v-if="!$slots.activator" v-bind="activatorProps" :disabled="item.disabled" class="px-2" density="comfortable" rounded="0"
            variant="text">
            {{ item.label }}
          </v-btn>

          <slot name="activator" v-bind="activatorProps"></slot>
        </template>

        <wd-top-menu-dropdown :items="item.children" />
      </v-menu>

      <v-btn v-else-if="item.type !== 'divider'" :disabled="item.disabled" class="px-2" density="comfortable"
        rounded="0" variant="text" @click="onItemClick(item)">
        {{ item.label }}
      </v-btn>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WdTopMenuItem } from '@/composables/useTopMenu'

const props = defineProps<{
  items: readonly WdTopMenuItem[]
}>()

const visibleItems = computed(() => props.items.filter(item => item.visible !== false))

const onItemClick = (item: WdTopMenuItem) => {
  if (item.disabled) return
  item.onClick?.()
}
</script>
