import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(dir, '..', 'public')
const source = path.join(publicDir, 'logo.jpg')

const targets = [
  { file: 'pwa-192x192.png', size: 192 },
  { file: 'pwa-512x512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon.png', size: 48 },
]

for (const { file, size } of targets) {
  await sharp(source).resize(size, size).png().toFile(path.join(publicDir, file))
  console.log('generated', file)
}
