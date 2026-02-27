<template>
  <wd-window :title="`Hello world - ${testParameter}`" icon="mdi-account" :initial-width="300" :initial-height="200"
    :window-id="windowId" :menu-items="menuItems">
    <p class=mt-0>Value: {{ testParameter }}</p>

    <template #footer>
      <div class="text-caption">Status: Ready</div>
    </template>
  </wd-window>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WdTopMenuItem } from '@/composables/useTopMenu'

const props = defineProps<{
  testParameter?: string
  windowId?: string
}>()

const menuItems = computed<readonly WdTopMenuItem[]>(() => [
  {
    id: 'file',
    label: 'File',
    children: [
      {
        id: 'file-new',
        label: 'New',
        shortcut: 'Ctrl+N',
        onClick: () => console.log('HelloWorldWindow: New'),
      },
      {
        id: 'file-open',
        label: 'Open',
        shortcut: 'Ctrl+O',
        onClick: () => console.log('HelloWorldWindow: Open'),
      },
      { id: 'file-divider-1', type: 'divider' },
      {
        id: 'file-export',
        label: 'Export',
        children: [
          {
            id: 'file-export-json',
            label: 'As JSON',
            onClick: () => console.log('HelloWorldWindow: Export JSON'),
          },
          {
            id: 'file-export-csv',
            label: 'As CSV',
            onClick: () => console.log('HelloWorldWindow: Export CSV'),
          },
        ],
      },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    children: [
      {
        id: 'edit-copy',
        label: 'Copy',
        shortcut: 'Ctrl+C',
        onClick: () => console.log('HelloWorldWindow: Copy'),
      },
      {
        id: 'edit-paste',
        label: 'Paste',
        shortcut: 'Ctrl+V',
        onClick: () => console.log('HelloWorldWindow: Paste'),
      },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    children: [
      {
        id: 'window-about',
        label: `About ${props.testParameter ?? 'Hello World'}`,
        onClick: () => console.log('HelloWorldWindow: About'),
      },
    ],
  },
])
</script>
