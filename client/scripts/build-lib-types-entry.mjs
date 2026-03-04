import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const outDir = resolve(process.cwd(), 'dist', 'library')
const outFile = resolve(outDir, 'index.d.ts')
const content = "import './global-components'\nexport * from './lib'\nexport { default } from './lib'\n"

await mkdir(outDir, { recursive: true })
await writeFile(outFile, content, 'utf8')
