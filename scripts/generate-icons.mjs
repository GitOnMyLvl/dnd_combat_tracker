import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  crcTable[i] = c
}
function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type)
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

// D20 polygon vertices (normalized 0..1), pointing up
const D20_POINTS = [
  [0.50, 0.05], // top
  [0.82, 0.28], // top-right
  [0.95, 0.62], // mid-right
  [0.72, 0.95], // bot-right
  [0.28, 0.95], // bot-left
  [0.05, 0.62], // mid-left
  [0.18, 0.28], // top-left
]

function pointInPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function makePNG(size) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2

  const raw = Buffer.alloc(size * (1 + size * 3))
  const pad = size * 0.06

  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 3)
    raw[row] = 0
    for (let x = 0; x < size; x++) {
      const nx = (x - pad) / (size - pad * 2)
      const ny = (y - pad) / (size - pad * 2)
      const inside = pointInPolygon(nx, ny, D20_POINTS)

      let r, g, b
      if (inside) {
        // Blue accent: #60a5fa with slight gradient
        const t = (nx + ny) / 2
        r = Math.round(60 + t * 20)
        g = Math.round(120 + t * 25)
        b = Math.round(220 + t * 35)
      } else {
        // Dark bg: #0d0d12
        r = 13; g = 13; b = 18
      }

      raw[row + 1 + x * 3] = r
      raw[row + 1 + x * 3 + 1] = g
      raw[row + 1 + x * 3 + 2] = b
    }
  }

  const compressed = deflateSync(raw)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = join(__dirname, '..', 'public')
writeFileSync(join(publicDir, 'icon-192.png'), makePNG(192))
writeFileSync(join(publicDir, 'icon-512.png'), makePNG(512))
console.log('Icons generated: public/icon-192.png, public/icon-512.png')
