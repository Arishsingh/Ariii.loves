import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { drawings, type DrawingId } from './drawings'
import { catmull, ellipsePoints, Pencil, rect, type Pt } from './pencil'

/** A sketch is two textures: pencil lines (alpha) and the colour that paints in underneath. */
export type SketchPair = { ink: CanvasTexture; paint: CanvasTexture }

/** Display font for signs and titles; handwriting stays in Caveat. */
const HORROR_FONT = 'Creepster'

const cache = new Map<string, SketchPair>()

function toTexture(canvas: HTMLCanvasElement, color: boolean, repeat: boolean) {
  const t = new CanvasTexture(canvas)
  t.anisotropy = 8
  if (color) t.colorSpace = SRGBColorSpace
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping
  return t
}

function sketch(key: string, w: number, h: number, draw: (p: Pencil) => void, seed = 1, repeat = false) {
  const hit = cache.get(key)
  if (hit) return hit
  const [ink, paint] = [0, 1].map(() => Object.assign(document.createElement('canvas'), { width: w, height: h }))
  draw(new Pencil(ink.getContext('2d')!, paint.getContext('2d')!, seed))
  const pair = { ink: toTexture(ink, false, repeat), paint: toTexture(paint, true, repeat) }
  cache.set(key, pair)
  return pair
}

/** A jagged crack running from (x, y) roughly along `angle`. */
function crack(p: Pencil, x: number, y: number, angle: number, length: number) {
  const pts: Pt[] = [[x, y]]
  for (let d = 0; d < length; d += p.range(15, 35)) {
    const a = angle + p.range(-0.7, 0.7)
    x += Math.cos(a) * 25
    y += Math.sin(a) * 25
    pts.push([x, y])
    if (p.rand() < 0.15) crack(p, x, y, a + p.range(-1, 1), length * 0.3)
  }
  p.stroke(pts, { w: 2.5, alpha: 0.75, passes: 1, jitter: 1, overshoot: 0 })
}

/** Wall tile: 4 m wide × the corridor height, at 256 px per metre. Faded damask over a dark wainscot. */
export const wallTextures = () =>
  sketch('wall', 1024, 820, (p) => {
    const H = 820
    const rail = H - 256
    p.wash(rect(0, 0, 1024, rail), '#5f6b55', 0.6)
    // damask motif in offset rows
    for (let row = 0; row * 136 < rail - 40; row++) {
      for (let col = 0; col < 8; col++) {
        const x = col * 128 + (row % 2) * 64 + 32
        const y = row * 136 + 70
        p.ellipse(x, y, 10, 18, { w: 2, alpha: 0.3, passes: 1 })
        p.arc(x - 18, y - 6, 16, 22, -2.2, 1.2, { w: 2, alpha: 0.3, passes: 1 })
        p.arc(x + 18, y - 6, 16, 22, 1.9, 5.3, { w: 2, alpha: 0.3, passes: 1 })
        p.line(x, y + 22, x, y + 42, { w: 2, alpha: 0.3, passes: 1 })
      }
    }
    // water stains running down from the ceiling
    for (const x of [p.range(80, 300), p.range(560, 900)]) {
      const len = p.range(220, 420)
      const w = p.range(50, 110)
      p.wash([[x - w, 0], [x + w, 0], [x + w * 0.4, len * 0.6], [x + 8, len], [x - 8, len], [x - w * 0.5, len * 0.5]], '#4a3b22', 0.35)
    }
    // a strip of peeling paper
    const px = p.range(420, 560)
    const peel: Pt[] = [[px, 120], [px + 120, 110], [px + 135, 260], [px + 40, 300], [px - 10, 220]]
    p.wash(peel, '#a39a83', 0.9)
    p.poly(peel, { w: 2.5, alpha: 0.7 })
    p.curve([[px + 40, 300], [px + 70, 340], [px + 110, 330], [px + 135, 260]], { w: 2.5, alpha: 0.7 })
    crack(p, p.range(100, 900), p.range(40, 200), Math.PI / 2, 300)
    // wainscot, rail, baseboard, crown
    p.wash(rect(0, rail, 1024, H), '#3b2a1f', 0.9)
    p.wash(rect(0, H - 40, 1024, H), '#24180f', 0.9)
    for (const y of [H - 40, H - 48, rail, rail - 12, 22, 36]) p.line(-10, y, 1034, y, { w: 3.5, alpha: 0.75 })
    p.poly(rect(90, rail + 34, 934, H - 78), { w: 3, alpha: 0.6 })
    p.poly(rect(110, rail + 52, 914, H - 96), { w: 2, alpha: 0.4 })
    p.hatch(rect(0, rail, 1024, H), { gap: 12, alpha: 0.3 })
    for (const x of [22, 1002]) p.line(x, 36, x, rail - 12, { w: 3, alpha: 0.5 })
  }, 3, true)

/** Floor tile: 4 m × 4 m of old dark planks. */
export const floorTextures = () =>
  sketch('floor', 1024, 1024, (p) => {
    const tones = ['#4a3828', '#3f2f21', '#523e2c', '#46352a']
    for (let i = 0; i < 8; i++) {
      const x = i * 128
      p.wash(rect(x + 2, 0, x + 126, 1024), tones[i % tones.length], 0.9)
      p.line(x, -10, x, 1034, { w: 4, alpha: 0.85 })
      const joint = p.range(100, 900)
      p.line(x + 4, joint, x + 124, joint, { w: 3, alpha: 0.7 })
      for (const y of [joint - 14, joint + 14]) p.ellipse(x + 20, y, 3, 3, { w: 2.5, passes: 1 })
      for (let g = 0; g < 4; g++) {
        const gx = x + p.range(15, 113)
        const gy = p.range(0, 800)
        p.curve([[gx, gy], [gx + p.range(-8, 8), gy + 90], [gx + p.range(-8, 8), gy + 220]], { w: 2, alpha: 0.35, passes: 1 })
      }
    }
    // a gap where a board has shrunk away
    p.fill(rect(637, 0, 643, 1024), '#120c08')
    // scuffs and drag marks
    for (let i = 0; i < 4; i++) {
      const [x, y] = [p.range(100, 900), p.range(100, 900)]
      p.line(x, y, x + p.range(-60, 60), y + p.range(80, 200), { w: 2, alpha: 0.3, passes: 1 })
    }
  }, 5, true)

/** Ceiling tile: cracked plaster, water rings, cobwebs where it meets the walls. */
export const ceilingTextures = () =>
  sketch('ceiling', 1024, 1024, (p) => {
    p.wash(rect(0, 0, 1024, 1024), '#8d8572', 0.6)
    for (const y of [0, 512]) {
      p.wash(rect(0, y, 1024, y + 70), '#3b2c20', 0.9)
      p.line(-10, y, 1034, y, { w: 3.5, alpha: 0.8 })
      p.line(-10, y + 70, 1034, y + 70, { w: 3.5, alpha: 0.8 })
      p.hatch(rect(0, y, 1024, y + 70), { gap: 12, alpha: 0.35 })
    }
    for (let i = 0; i < 3; i++) {
      const [x, y, r] = [p.range(150, 870), p.range(120, 900), p.range(40, 90)]
      p.wash(ellipsePoints(x, y, r, r * 0.8), '#5e4a2c', 0.3)
      p.ellipse(x, y, r, r * 0.8, { w: 2, alpha: 0.4, passes: 1 })
    }
    crack(p, p.range(200, 800), p.range(150, 400), 0.3, 400)
    // Canvas x = 512 is where the ceiling meets both walls, so a web here spans each corner.
    const [cx, cy] = [512, 300]
    const spokes = 9
    const ends = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + p.range(-0.15, 0.15))
    for (const a of ends) p.line(cx, cy, cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, { w: 1.8, alpha: 0.55, passes: 1 })
    for (let r = 30; r < 150; r += 28) {
      const ring = ends.map((a): Pt => [cx + Math.cos(a) * r, cy + Math.sin(a) * r])
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]
        const sag: Pt = [(a[0] + b[0]) / 2 + (cx - (a[0] + b[0]) / 2) * 0.12, (a[1] + b[1]) / 2 + (cy - (a[1] + b[1]) / 2) * 0.12]
        p.stroke(catmull([a, sag, b]), { w: 1.4, alpha: 0.45, passes: 1, jitter: 0.5, overshoot: 0 })
      })
    }
  }, 7, true)

/** A framed picture with a handwritten caption. Plane aspect 1.2 × 1.5. */
export const frameTextures = (drawing: DrawingId, caption: string, seed = 1) =>
  sketch(`frame:${drawing}:${caption}:${seed}`, 1024, 1280, (p) => {
    const outer = rect(24, 24, 1000, 1256)
    const inner = rect(96, 96, 928, 1184)
    p.wash(outer, '#3a2a1e', 1, inner)
    p.poly(outer)
    p.poly(inner, { w: 3.5 })
    for (const i of [0, 1, 2, 3]) p.line(outer[i][0], outer[i][1], inner[i][0], inner[i][1], { w: 2.5 })
    p.hatch([[928, 96], [1000, 24], [1000, 1256], [928, 1184]], { gap: 10, alpha: 0.45 })
    p.hatch([[96, 1184], [928, 1184], [1000, 1256], [24, 1256]], { gap: 10, alpha: 0.45 })
    p.within(142, 125, 0.74, () => drawings[drawing](p))
    p.text(caption, 512, 1060, 96)
    // foxing and grime on the mat
    for (let i = 0; i < 6; i++) p.wash(ellipsePoints(p.range(120, 900), p.range(120, 1160), p.range(8, 30), p.range(8, 30)), '#7a6644', 0.35)
  }, seed)

/** A hand-lettered note pinned up in a room. Plane aspect 4 : 3. */
export const cardTextures = (lines: string[], seed = 1) =>
  sketch(`card:${lines.join('|')}`, 1024, 768, (p) => {
    const board: Pt[] = [[40, 50], [990, 30], [980, 730], [30, 745]]
    p.wash(board, '#b9ab8c', 1)
    p.poly(board)
    p.ellipse(512, 70, 14, 14, { w: 4 })
    const step = 560 / lines.length
    lines.forEach((line, i) => {
      const size = p.fitText(line, i === 0 ? 150 : 96, 840)
      const y = 120 + step * (i + 0.5)
      const width = p.text(line, 512, y, size)
      if (i === 0) p.curve([[512 - width / 2, y + 70], [512, y + 82], [512 + width / 2, y + 64]], { w: 5 })
    })
    p.wash(ellipsePoints(820, 600, 60, 45), '#5a0c0c', 0.6)
  }, seed)

/** Weathered sign hanging just inside the front door. Plane aspect 8 : 3. */
export const bannerTextures = (title: string, subtitle: string) =>
  sketch(`banner:${title}:${subtitle}`, 2048, 768, (p) => {
    p.line(320, 0, 320, 250, { w: 5 })
    p.line(1728, 0, 1728, 300, { w: 5 })
    // hangs crooked, one chain longer than the other
    const board: Pt[] = [[120, 240], [1928, 290], [1920, 790], [110, 740]]
    p.fill(board, '#a89878')
    p.poly(board, { w: 6 })
    for (const y of [400, 560]) p.line(130, y, 1915, y + 45, { w: 2, alpha: 0.35 })
    p.text(title, 1024, 450, p.fitText(title, 230, 1600, 400, HORROR_FONT), { font: HORROR_FONT, weight: 400, rot: 0.025 })
    p.text(subtitle, 1024, 650, 110, { weight: 400, rot: 0.025 })
    crack(p, 1500, 300, 1.4, 200)
  })

/** Door leaf, hinged on its right edge, gouged by something with claws. Plane aspect 1.3 × 2.3. */
export const doorLeafTextures = (front = false) =>
  sketch(`door-leaf:${front}`, 512, 906, (p) => {
    const leaf = rect(10, 10, 502, 906)
    p.wash(leaf, front ? '#2f2219' : '#4a3426', 1)
    p.poly(leaf)
    for (const [y0, y1] of [[80, 420], [480, 840]]) {
      p.wash(rect(70, y0, 442, y1), '#2a1c13', 0.6)
      p.poly(rect(70, y0, 442, y1), { w: 4 })
      p.poly(rect(86, y0 + 16, 426, y1 - 16), { w: 2.5, alpha: 0.6 })
    }
    p.hatch(rect(380, 10, 502, 906), { gap: 12, alpha: 0.4 })
    for (let i = 0; i < 4; i++) p.line(150 + i * 26, 520 + i * 6, 260 + i * 26, 760 + i * 6, { w: 3.5, alpha: 0.8 })
    p.wash(rect(42, 455, 87, 500), '#9b7b3f', 1)
    p.ellipse(64, 478, 20, 20, { w: 4 })
    if (front) {
      p.ellipse(256, 250, 46, 46, { w: 5 })
      p.wash(rect(220, 150, 292, 200), '#9b7b3f', 1)
      p.text('13', 256, 175, 46)
    }
  })

/** Door casing with a name sign above; transparent where the opening is. Plane 1.9 × 3.05. */
export const doorTrimTextures = (label: string) =>
  sketch(`door-trim:${label}`, 640, 1028, (p) => {
    const opening = rect(101, 253, 539, 1040)
    p.fill(rect(40, 195, 600, 1040), '#2c211a', opening)
    p.poly(rect(40, 195, 600, 1028))
    p.poly(rect(101, 253, 539, 1028), { w: 3.5 })
    p.hatch(rect(539, 195, 600, 1028), { gap: 10, alpha: 0.4 })
    const sign: Pt[] = [[150, 40], [490, 25], [495, 160], [145, 170]]
    p.fill(sign, '#7a6a52')
    p.poly(sign)
    p.text(label, 320, 100, p.fitText(label, 92, 300, 400, HORROR_FONT), { font: HORROR_FONT, weight: 400 })
    p.line(170, 165, 190, 195, { w: 3 })
    p.line(470, 160, 450, 195, { w: 3 })
  })

/** A bare bulb on a cord. Plane 0.5 × 1. */
export const lampTextures = () =>
  sketch('lamp', 512, 1024, (p) => {
    p.wash(ellipsePoints(256, 780, 200, 200), '#ffd98a', 0.3)
    p.curve([[256, -10], [262, 300], [250, 620]], { w: 4 })
    p.wash(rect(226, 620, 286, 690), '#3a3430', 1)
    p.poly(rect(226, 620, 286, 690), { w: 4 })
    p.wash(ellipsePoints(256, 760, 62, 78), '#ffe9a8', 1)
    p.ellipse(256, 760, 62, 78, { w: 3.5 })
    p.curve([[236, 700], [246, 760], [266, 740], [276, 700]], { w: 2.5 })
  })

// ---------- The yard and the outside of the house ----------

/** The front of the house: 16 m × 11 m at 128 px per metre; the door opening is left transparent. */
export const facadeTextures = () =>
  sketch('facade', 2048, 1408, (p) => {
    const door = rect(941, 1114, 1107, 1408)
    p.fill(rect(40, 600, 2008, 1408), '#3f3c39', door)
    p.poly(rect(40, 600, 2008, 1420))
    // clapboard siding, broken around the door
    for (let y = 640; y < 1400; y += 26) {
      if (y > 1100) {
        p.line(40, y, 925, y, { w: 2, alpha: 0.25, passes: 1 })
        p.line(1123, y, 2008, y, { w: 2, alpha: 0.25, passes: 1 })
      } else p.line(40, y, 2008, y, { w: 2, alpha: 0.25, passes: 1 })
    }
    const roof: Pt[] = [[0, 615], [2048, 615], [1780, 300], [268, 300]]
    p.fill(roof, '#211d1c')
    p.poly(roof, { w: 6 })
    p.hatch(roof, { gap: 16, alpha: 0.5, angle: 0.4 })
    p.fill(rect(1560, 140, 1660, 330), '#3a2e2a')
    p.poly(rect(1560, 140, 1660, 330))
    for (let y = 170; y < 320; y += 30) p.line(1560, y, 1660, y, { w: 2, alpha: 0.4, passes: 1 })
    const gable: Pt[] = [[680, 650], [1024, 70], [1368, 650]]
    p.fill(gable, '#35322f')
    p.poly(gable, { w: 6 })
    p.fill(ellipsePoints(1024, 420, 72, 72), '#101216')
    p.ellipse(1024, 420, 72, 72, { w: 5 })
    p.line(952, 420, 1096, 420, { w: 3 })
    p.line(1024, 348, 1024, 492, { w: 3 })
    p.hatch(rect(40, 615, 2008, 670), { gap: 10, alpha: 0.55 })

    const windows: [number, number, 'dark' | 'boarded' | 'broken'][] = [
      [256, 1075, 'boarded'], [640, 1075, 'dark'], [1408, 1075, 'broken'], [1792, 1075, 'dark'],
      [256, 700, 'dark'], [640, 700, 'broken'], [1792, 700, 'boarded'],
    ]
    for (const [cx, y, kind] of windows) {
      const win = rect(cx - 64, y, cx + 64, y + 192)
      p.fill(win, '#101216')
      p.poly(rect(cx - 80, y - 14, cx + 80, y + 206), { w: 5 })
      p.poly(win, { w: 3 })
      p.line(cx, y, cx, y + 192, { w: 3 })
      p.line(cx - 64, y + 96, cx + 64, y + 96, { w: 3 })
      if (kind === 'boarded') {
        for (const [a, b] of [[[cx - 90, y + 30], [cx + 90, y + 160]], [[cx - 90, y + 150], [cx + 90, y + 40]]] as Pt[][]) {
          p.fill([[a[0], a[1] - 14], [b[0], b[1] - 14], [b[0], b[1] + 14], [a[0], a[1] + 14]], '#5a4634')
          p.line(a[0], a[1] - 14, b[0], b[1] - 14, { w: 3 })
          p.line(a[0], a[1] + 14, b[0], b[1] + 14, { w: 3 })
        }
      }
      if (kind === 'broken') {
        p.fill([[cx - 64, y], [cx - 10, y], [cx - 30, y + 40], [cx - 64, y + 70]], '#1d1f24')
        crack(p, cx + 20, y + 60, 2.2, 120)
      }
    }
    // the upstairs window at x = 1408 is left for the lit-window overlay
    p.poly(rect(1328, 686, 1488, 906), { w: 5 })

    // porch
    const porch: Pt[] = [[790, 1050], [1024, 955], [1258, 1050]]
    p.fill(porch, '#211d1c')
    p.poly(porch, { w: 5 })
    p.fill(rect(800, 1050, 1248, 1082), '#2b2624')
    p.poly(rect(800, 1050, 1248, 1082), { w: 4 })
    for (const x of [835, 1213]) {
      p.fill(rect(x - 12, 1082, x + 12, 1408), '#2b2624')
      p.poly(rect(x - 12, 1082, x + 12, 1408), { w: 3 })
    }
    p.fill(rect(921, 1094, 1127, 1408), '#26190f', door)
    p.poly(rect(921, 1094, 1127, 1420), { w: 5 })
    // ivy crawling up the left side
    p.curve([[90, 1408], [120, 1200], [80, 1000], [140, 820], [110, 640]], { w: 4 })
    for (let y = 1360; y > 680; y -= 55) p.wash(ellipsePoints(110 + p.range(-25, 25), y, 22, 14), '#1e2a1c', 1)
    crack(p, 1650, 900, 1.8, 260)
  })

/** The yard seen from above: 26 m wide × 20 m deep. The top of the canvas meets the house. */
export const groundTextures = () =>
  sketch('ground', 2048, 2048, (p) => {
    p.wash(rect(0, 0, 2048, 2048), '#2f2a22', 1)
    for (let i = 0; i < 260; i++) {
      const [x, y] = [p.range(0, 2048), p.range(0, 2048)]
      if (Math.abs(x - 1024) < 90) continue
      for (let k = 0; k < 4; k++) p.line(x, y, x + p.range(-18, 18), y - p.range(10, 30), { w: 1.8, alpha: 0.45, passes: 1, overshoot: 0 })
    }
    for (let y = 30; y < 2048; y += p.range(60, 90)) {
      const w = p.range(45, 60)
      const h = p.range(26, 40)
      const x = 1024 + p.range(-12, 12)
      const stone: Pt[] = [[x - w, y - h], [x + w * 0.9, y - h * 1.1], [x + w, y + h * 0.8], [x - w * 0.85, y + h]]
      p.wash(stone, '#5e5a50', 1)
      p.poly(stone, { w: 3 })
    }
    for (let i = 0; i < 70; i++) p.wash(ellipsePoints(p.range(0, 2048), p.range(0, 2048), 9, 5), '#5b3d22', 0.8)
    p.wash(ellipsePoints(1350, 1300, 160, 70), '#1a2026', 0.8)
    p.ellipse(1350, 1300, 160, 70, { w: 2.5, alpha: 0.5 })
    p.hatch(rect(0, 0, 2048, 90), { gap: 10, alpha: 0.5 })
  })

/** A dead tree, 5 m × 7.5 m, drawn as a dark silhouette of forking branches. */
export const treeTextures = (seed: number) =>
  sketch(`tree:${seed}`, 1024, 1536, (p) => {
    const branch = (x: number, y: number, angle: number, len: number, w: number, depth: number) => {
      const bend = p.range(-0.3, 0.3)
      const mid: Pt = [x + Math.cos(angle + bend) * len * 0.5, y + Math.sin(angle + bend) * len * 0.5]
      const end: Pt = [x + Math.cos(angle) * len, y + Math.sin(angle) * len]
      p.stroke(catmull([[x, y], mid, end]), { w, alpha: 0.95, jitter: w * 0.15, overshoot: 0 })
      if (depth === 0) return
      const kids = depth > 3 ? 2 : p.rand() < 0.5 ? 2 : 3
      for (let k = 0; k < kids; k++) {
        branch(end[0], end[1], angle + p.range(-0.75, 0.75), len * p.range(0.62, 0.8), Math.max(2, w * 0.62), depth - 1)
      }
    }
    branch(512, 1536, -Math.PI / 2 + p.range(-0.1, 0.1), 420, 46, 6)
    p.hatch([[470, 1536], [554, 1536], [540, 1150], [490, 1150]], { gap: 7, alpha: 0.6 })
  }, seed)

/** Iron fence with spear-tipped pickets: 12 m × 1.5 m. */
export const fenceTextures = () =>
  sketch('fence', 2048, 256, (p) => {
    for (const y of [70, 200]) p.line(0, y, 2048, y, { w: 5 })
    for (let x = 30; x < 2048; x += 85) {
      const lean = p.range(-6, 6)
      p.line(x, 256, x + lean, 30, { w: 5 })
      p.fill([[x + lean - 10, 34], [x + lean, 6], [x + lean + 10, 34]], '#1a1816')
      p.poly([[x + lean - 10, 34], [x + lean, 6], [x + lean + 10, 34]], { w: 3 })
    }
  })

/** A cracked headstone: 1 m × 1.25 m. */
export const graveTextures = (seed: number) =>
  sketch(`grave:${seed}`, 512, 640, (p) => {
    const stone: Pt[] = [...catmull([[60, 640], [60, 220], [256, 60], [452, 220], [452, 640]])]
    p.fill(stone, '#5d5b57')
    p.stroke(stone)
    p.hatch([[340, 200], [452, 220], [452, 640], [360, 640]], { gap: 10, alpha: 0.5 })
    p.text('R.I.P', 256, 330, 110, { font: HORROR_FONT, weight: 400 })
    crack(p, 300, 120, 1.9, 300)
    for (let x = 40; x < 480; x += 22) p.line(x, 640, x + p.range(-10, 10), 600 - p.range(0, 30), { w: 2.5, alpha: 0.7, passes: 1 })
  }, seed)

/** Full moon with a cloud dragged across it. */
export const moonTextures = () =>
  sketch('moon', 1024, 1024, (p) => {
    p.wash(ellipsePoints(512, 512, 470, 470), '#9fb0c8', 0.15)
    p.wash(ellipsePoints(512, 512, 330, 330), '#e8e2c8', 1)
    p.ellipse(512, 512, 330, 330, { w: 4, alpha: 0.6 })
    for (const [x, y, r] of [[430, 420, 60], [610, 600, 80], [560, 380, 35], [420, 650, 40]]) {
      p.wash(ellipsePoints(x, y, r, r * 0.85), '#c3bca2', 0.8)
    }
    p.wash([[60, 640], [500, 590], [980, 660], [940, 720], [380, 700], [40, 700]], '#20232c', 0.9)
  })

/** The thing at the end of the hall: a tall thin silhouette, 0.9 m × 2.25 m. */
export const figureTextures = () =>
  sketch('figure', 512, 1280, (p) => {
    const body: Pt[] = [
      [256, 60], [320, 110], [310, 220], [370, 300], [400, 700], [430, 1280], [80, 1280], [112, 700], [142, 300], [202, 220], [192, 110],
    ]
    p.fill(catmull(body, true), '#050505')
    p.stroke(catmull(body, true), { w: 4, jitter: 4 })
    for (const s of [-1, 1]) {
      const arm: Pt[] = [[256 + s * 120, 310], [256 + s * 150, 600], [256 + s * 160, 900], [256 + s * 150, 1000]]
      p.stroke(catmull(arm), { w: 22, alpha: 1 })
      for (let f = -1; f <= 1; f++) p.line(256 + s * 150, 1000, 256 + s * (150 + f * 14), 1080, { w: 5 })
    }
    for (const x of [232, 280]) p.fill(ellipsePoints(x, 150, 6, 4), '#d8d0b0')
  })

/** Warm light and a watcher in the upstairs window: 1 m × 1.5 m. */
export const litWindowTextures = () =>
  sketch('lit-window', 256, 384, (p) => {
    p.fill(rect(0, 0, 256, 384), '#e9b95a')
    p.fill(catmull([[70, 384], [80, 250], [105, 220], [96, 150], [128, 110], [160, 150], [151, 220], [176, 250], [186, 384]], true), '#120d0a')
    p.line(128, 0, 128, 384, { w: 6 })
    p.line(0, 192, 256, 192, { w: 6 })
    p.poly(rect(3, 3, 253, 381), { w: 6 })
  })

/** Words scrawled on the wall in something red: 2.4 m × 0.6 m. */
export const scrawlTextures = (text: string, seed = 1) =>
  sketch(`scrawl:${text}`, 1024, 256, (p) => {
    const ctx = p.paint
    const size = p.fitText(text, 170, 900)
    ctx.save()
    ctx.translate(512, 120)
    ctx.rotate(p.range(-0.08, 0.04))
    ctx.font = `700 ${size}px Caveat, cursive`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#5e0d0d'
    ctx.fillText(text, 0, 0)
    const width = ctx.measureText(text).width
    for (let i = 0; i < 12; i++) {
      const x = p.range(-width / 2, width / 2)
      const len = p.range(20, 90)
      ctx.fillRect(x, size * 0.2, p.range(3, 6), len)
      ctx.beginPath()
      ctx.arc(x + 2, size * 0.2 + len, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }, seed)
