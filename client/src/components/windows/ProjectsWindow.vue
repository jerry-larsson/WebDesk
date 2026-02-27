<template>
  <wd-window title="Projekt" icon="mdi-file-document-multiple-outline" :initial-width="300" :initial-height="200"
    :window-id="windowId" :menu-items="menuItems">
    <p class="mt-0">Här visas alla projekt som du har tillgång till.</p>

    <div class="mb-4">
      <v-text-field v-model="search" prepend-inner-icon="mdi-filter-variant" hide-details density="comfortable"
        placeholder="Sök" class="mt-0" variant="outlined" clearable>
      </v-text-field>
    </div>

    <v-card border class="d-flex justify-space-evenly">
      <v-card class="w-33">
        <v-card-title class="d-flex">
          <v-badge class="mr-1" dot inline color="error"></v-badge>
          <span class="text-body-large">Ej påbörjad</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-2">
          <v-card border class="border-error border-t-lg border-opacity-100 pa-2">
            <span class="text-body-large">Mitt nya projekt</span>
          </v-card>
        </v-card-text>
      </v-card>

      <v-divider vertical></v-divider>

      <v-card class="w-33">
        <v-card-title class="d-flex">
          <v-badge class="mr-1" dot inline color="warning"></v-badge>
          <span class="text-body-large">Pågående</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-2">
          <v-card border class="border-warning border-t-lg border-opacity-100 pa-2">
            <span class="text-body-large">Mitt påbörjade projekt</span>
          </v-card>
        </v-card-text>
      </v-card>

      <v-divider vertical></v-divider>

      <v-card class="w-33">
        <v-card-title class="d-flex">
          <v-badge class="mr-1" dot inline color="success"></v-badge>
          <span class="text-body-large">Klar</span>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-2 d-flex ga-2 flex-column">
          <v-card border class="border-success border-t-lg border-opacity-100 pa-2">
            <span class="text-body-large">Mitt färdiga projekt 1</span>
          </v-card>
          <v-card border class="border-success border-t-lg border-opacity-100 pa-2">
            <span class="text-body-large">Mitt färdiga projekt 2</span>
          </v-card>
          <v-card border class="border-success border-t-lg border-opacity-100 pa-2">
            <span class="text-body-large">Mitt färdiga projekt 3</span>
          </v-card>
        </v-card-text>
      </v-card>
    </v-card>

  </wd-window>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WdTopMenuItem } from '@/composables/useTopMenu'

const props = defineProps<{
  testParameter?: string
  windowId?: string
}>()

const search = ref('');

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
