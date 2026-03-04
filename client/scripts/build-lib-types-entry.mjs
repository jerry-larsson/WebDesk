import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'

const outDir = resolve(process.cwd(), 'dist', 'library')
const outFile = resolve(outDir, 'index.d.ts')
const vueModuleAliasesFile = resolve(outDir, 'vue-module-aliases.d.ts')
const indexContent = "import './vue-module-aliases'\nimport './global-components'\nexport * from './lib'\nexport { default } from './lib'\n"

await mkdir(outDir, { recursive: true })
await writeFile(outFile, indexContent, 'utf8')

const vueTypeFiles = []

const walk = async (dir) => {
  const entries = await readdir(dir)
  for (const entry of entries) {
    const fullPath = resolve(dir, entry)
    const s = await stat(fullPath)
    if (s.isDirectory()) {
      await walk(fullPath)
      continue
    }

    if (entry.endsWith('.vue.d.ts')) {
      vueTypeFiles.push(fullPath)
    }
  }
}

await walk(outDir)

const aliases = vueTypeFiles
  .map((filePath) => {
    const rel = `./${relative(outDir, filePath).split(sep).join('/')}`
    const vuePath = rel.replace(/\.d\.ts$/, '')
    return `declare module '${vuePath}' {\n  export { default } from '${rel}'\n}\n`
  })
  .join('\n')

await writeFile(vueModuleAliasesFile, aliases, 'utf8')
