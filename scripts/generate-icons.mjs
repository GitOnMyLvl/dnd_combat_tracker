import sharp from 'sharp'
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, '..', 'public')

const BG_TOP = '#1a1a20'
const BG_BOT = '#0a0a10'
const HI = '#f5f5f7'   // light edge / brightest facet
const MID = '#9ca3af'  // mid grey
const LO = '#374151'   // shadow grey

// Faceted d20 — face-on view. Front face is the central upward triangle whose
// bottom edge sits on the pentagon's bottom edge; back facets fan out around it.
function buildSvg({ size = 512, padding = 0.08, bgRadius = 0.18 } = {}) {
  const r = size * bgRadius
  const cx = size / 2
  const cy = size / 2
  const inset = size * padding
  const inner = size - inset * 2

  const s = inner * 0.82
  const ox = cx - s / 2
  const oy = cy - s / 2 + s * 0.03
  const P = (x, y) => [ox + x * s, oy + y * s]

  // Pentagon (top-pointing): top, upper-right, lower-right, lower-left, upper-left
  const V0 = P(0.50, 0.02)
  const V1 = P(0.97, 0.36)
  const V2 = P(0.79, 0.97)
  const V3 = P(0.21, 0.97)
  const V4 = P(0.03, 0.36)

  // Front face apex — sits just above the geometric center
  const F = P(0.50, 0.54)

  const poly = (pts, fill, opacity = 1) =>
    `<polygon points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}" fill="${fill}" fill-opacity="${opacity}" />`

  // 5 back facets + 1 front face. Top facets brightest, sides mid, bottom face darker.
  const facets = [
    poly([V0, V1, F], HI,  0.85),  // top-right back — brightest
    poly([V0, F, V4], HI,  0.70),  // top-left back
    poly([V1, V2, F], MID, 0.55),  // right side
    poly([V4, F, V3], MID, 0.45),  // left side
    poly([F, V2, V3], LO,  0.70),  // front face — in shadow
  ].join('\n  ')

  const outerPoints = [V0, V1, V2, V3, V4]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const stroke = Math.max(2, size * 0.014)
  const edge = Math.max(1, size * 0.005)

  // Internal facet edges (no extra bottom band)
  const facetLines = [
    [V0, F], [V1, F], [V2, F], [V3, F], [V4, F],
  ].map(([a, b]) =>
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${HI}" stroke-width="${edge}" stroke-opacity="0.55" stroke-linecap="round" />`
  ).join('\n  ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}" />
      <stop offset="1" stop-color="${BG_BOT}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)" />
  ${facets}
  ${facetLines}
  <polygon points="${outerPoints}" fill="none" stroke="${HI}" stroke-width="${stroke}" stroke-linejoin="round" />
</svg>`
}

async function render(svg, outPath) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer()
  await writeFile(outPath, buf)
  console.log(`wrote ${outPath} (${buf.length} bytes)`)
}

await mkdir(PUBLIC, { recursive: true })

await render(buildSvg({ size: 192 }), join(PUBLIC, 'icon-192.png'))
await render(buildSvg({ size: 512 }), join(PUBLIC, 'icon-512.png'))
// Maskable: extra safe-area padding, no rounded corners (PWA mask handles that)
await render(buildSvg({ size: 512, padding: 0.18, bgRadius: 0 }), join(PUBLIC, 'icon-512-maskable.png'))
await writeFile(join(PUBLIC, 'icon.svg'), buildSvg({ size: 512 }))
console.log(`wrote ${join(PUBLIC, 'icon.svg')}`)
