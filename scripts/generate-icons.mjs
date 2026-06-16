// Rasterizes public/favicon.svg into the PNG sizes the PWA manifest needs.
// Run with: npm run icons
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pub = join(root, 'public')
const svg = await readFile(join(pub, 'favicon.svg'))

// Maskable icons need padding so the glyph survives a circular/rounded mask.
const maskableSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
     <rect width="512" height="512" fill="#0f172a"/>
     <g transform="translate(64,64) scale(0.75)">${svg
       .toString()
       .replace(/<\?xml.*?\?>/, '')
       .replace(/<svg[^>]*>/, '')
       .replace(/<\/svg>/, '')}</g>
   </svg>`,
)

const targets = [
  { name: 'pwa-192.png', size: 192, src: svg },
  { name: 'pwa-512.png', size: 512, src: svg },
  { name: 'apple-touch-icon-180.png', size: 180, src: svg },
  { name: 'maskable-512.png', size: 512, src: maskableSvg },
]

for (const { name, size, src } of targets) {
  const out = await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png()
    .toBuffer()
  await writeFile(join(pub, name), out)
  console.log(`✓ ${name} (${size}×${size})`)
}
