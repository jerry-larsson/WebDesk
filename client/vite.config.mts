import { fileURLToPath, URL } from 'node:url'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Fonts from 'unplugin-fonts/vite'
import { defineConfig } from 'vite'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLibraryBuild = mode === 'library'

  return {
    plugins: [
      Vue({
        template: { transformAssetUrls },
      }),
      AutoImport({
        dts: 'src/auto-imports.d.ts',
        imports: ['vue'],
        vueTemplate: true,
      }),
      Components({
        dts: 'src/components.d.ts',
        dirs: ['src/components'],
        deep: true,
        extensions: ['vue'],
      }),
      // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
      Vuetify({
        autoImport: true,
        styles: {
          configFile: 'src/styles/settings.scss',
        },
      }),
      Fonts({
        fontsource: {
          families: [
            {
              name: 'Roboto',
              weights: [100, 300, 400, 500, 700, 900],
              styles: ['normal', 'italic'],
            },
          ],
        },
      }),
    ],
    define: { 'process.env': {} },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
      extensions: [
        '.js',
        '.json',
        '.jsx',
        '.mjs',
        '.ts',
        '.tsx',
        '.vue',
      ],
    },
    build: isLibraryBuild
      ? {
        lib: {
          entry: fileURLToPath(new URL('src/lib.ts', import.meta.url)),
          name: 'WebDesk',
          fileName: 'index',
          formats: ['es'],
        },
        outDir: 'dist/library',
        emptyOutDir: true,
        rollupOptions: {
          external: ['vue', 'vuetify', 'pinia', 'vue-i18n'],
        },
      }
      : undefined,
    server: {
      port: 3000,
    },
  }
})
