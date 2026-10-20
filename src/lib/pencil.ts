export type Pt = [number, number]

export type StrokeOptions = {
  /** Line width in canvas units. */
  w?: number
  alpha?: number
  /** How far the line wanders from its true path. */
  jitter?: number
  /** Overlapping passes; real pencil lines are rarely a single stroke. */
  passes?: number
  /** How far a line runs past its end points, like a quick hand would. */
  overshoot?: number
  dash?: number[]
}

/** Smooth Catmull-Rom curve through the given points. */
export function catmull(pts: Pt[], closed = false, seg = 10): Pt[] {
  const n = pts.length
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  const out: Pt[] = []
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [get(i - 1), get(i), get(i + 1), get(i + 2)]
    for (let s = 0; s < seg; s++) {
      const t = s / seg
      const t2 = t * t
      const t3 = t2 * t
      const at = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (-p0[k] + p2[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
          (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
      out.push([at(0), at(1)])
    }
  }
  out.push(closed ? out[0] : pts[n - 1])
  return out
}

export function ellipsePoints(cx: number, cy: number, rx: number, ry: number, count = 48): Pt[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt
  })
}

export const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
]

function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step))
    for (let s = 1; s <= n; s++) out.push([x0 + ((x1 - x0) * s) / n, y0 + ((y1 - y0) * s) / n])
  }
  return out
}

function trace(ctx: CanvasRenderingContext2D, pts: Pt[], ox = 0, oy = 0) {
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)))
  ctx.closePath()
}

/**
 * Draws wobbly pencil lines onto an `ink` canvas (alpha only, coloured by the shader)
 * and watercolour washes onto a `paint` canvas (revealed on hover).
 */
export class Pencil {
  ink: CanvasRenderingContext2D
  paint: CanvasRenderingContext2D
  private seed: number

  constructor(ink: CanvasRenderingContext2D, paint: CanvasRenderingContext2D, seed = 1) {
    this.ink = ink
    this.paint = paint
    this.seed = seed * 9973
  }

  /** Seeded random, so every reload draws the same sketch. */
  rand() {
    let t = (this.seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  range(a: number, b: number) {
    return a + (b - a) * this.rand()
  }

  /** Runs `draw` with both canvases moved to (x, y) and scaled. */
  within(x: number, y: number, scale: number, draw: () => void) {
    for (const ctx of [this.ink, this.paint]) {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)
    }
    draw()
    this.ink.restore()
    this.paint.restore()
  }

  stroke(pts: Pt[], { w = 5, alpha = 0.85, jitter = 3, passes = 2, overshoot = 8, dash }: StrokeOptions = {}) {
    const ctx = this.ink
    const path = [...pts]
    if (overshoot && path.length > 1) {
      const extend = (a: Pt, b: Pt): Pt => {
        const len = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1
        const d = this.range(0, overshoot)
        return [a[0] + ((a[0] - b[0]) / len) * d, a[1] + ((a[1] - b[1]) / len) * d]
      }
      path[0] = extend(path[0], path[1])
      path[path.length - 1] = extend(path[path.length - 1], path[path.length - 2])
    }
    const dense = resample(path, 6)

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (dash) ctx.setLineDash(dash)
    let total = 0
    const dists = dense.map((p, i) => (total += i ? Math.hypot(p[0] - dense[i - 1][0], p[1] - dense[i - 1][1]) : 0))
    const normals = dense.map((_, i) => {
      const prev = dense[Math.max(0, i - 1)]
      const next = dense[Math.min(dense.length - 1, i + 1)]
      const len = Math.hypot(next[0] - prev[0], next[1] - prev[1]) || 1
      return [-(next[1] - prev[1]) / len, (next[0] - prev[0]) / len] as Pt
    })

    for (let pass = 0; pass < passes; pass++) {
      const [ph1, ph2, ph3] = [this.rand() * 6.28, this.rand() * 6.28, this.rand() * 6.28]
      const [f1, f2, f3] = [this.range(0.004, 0.01), this.range(0.015, 0.03), this.range(0.01, 0.03)]
      const width = w * this.range(0.75, 1.1) * (pass ? 0.75 : 1)
      const opacity = alpha * this.range(0.7, 1) * (pass ? 0.45 : 1)
      const taper = Math.min(28, total / 3)
      const centre = dense.map(([x, y], i): Pt => {
        const off = jitter * (Math.sin(dists[i] * f1 + ph1) * 0.7 + Math.sin(dists[i] * f2 + ph2) * 0.3)
        return [x + normals[i][0] * off, y + normals[i][1] * off]
      })

      if (dash) {
        ctx.setLineDash(dash)
        ctx.lineWidth = width
        ctx.strokeStyle = `rgba(0,0,0,${opacity})`
        ctx.beginPath()
        centre.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.stroke()
        continue
      }

      // A ribbon whose width follows hand pressure: light at both ends, swelling in between.
      const left: Pt[] = []
      const right: Pt[] = []
      centre.forEach(([x, y], i) => {
        const d = dists[i]
        const ends = taper ? Math.min(1, d / taper, (total - d) / taper) : 1
        const pressure = (0.3 + 0.7 * Math.sqrt(Math.max(0, ends))) * (0.85 + 0.15 * Math.sin(d * f3 + ph3))
        const half = (width * pressure) / 2
        left.push([x + normals[i][0] * half, y + normals[i][1] * half])
        right.push([x - normals[i][0] * half, y - normals[i][1] * half])
      })
      ctx.fillStyle = `rgba(0,0,0,${opacity})`
      ctx.beginPath()
      trace(ctx, [...left, ...right.reverse()])
      ctx.fill()
    }
    ctx.restore()
  }

  line(x0: number, y0: number, x1: number, y1: number, o?: StrokeOptions) {
    // Now and then leave a faint construction line running past the real one, as artists do.
    if (this.rand() < 0.3 && (o?.alpha ?? 1) > 0.5) {
      const [dx, dy] = [x1 - x0, y1 - y0]
      const len = Math.hypot(dx, dy) || 1
      const [a, b] = [this.range(15, 45) / len, this.range(15, 45) / len]
      this.stroke(
        [
          [x0 - dx * a, y0 - dy * a],
          [x1 + dx * b, y1 + dy * b],
        ],
        { w: (o?.w ?? 5) * 0.45, alpha: 0.2, passes: 1, jitter: 1, overshoot: 0 },
      )
    }
    this.stroke([[x0, y0], [x1, y1]], o)
  }

  /** Straight-edged shape, each edge its own stroke so the corners cross. */
  poly(pts: Pt[], o?: StrokeOptions) {
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length]
      this.line(p[0], p[1], q[0], q[1], o)
    })
  }

  curve(pts: Pt[], o?: StrokeOptions, closed = false) {
    this.stroke(catmull(pts, closed), { overshoot: closed ? 0 : 8, ...o })
  }

  arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, o?: StrokeOptions) {
    const pts: Pt[] = []
    const wobble = this.rand() * 6.28
    for (let a = from; a <= to; a += 0.06) {
      const r = 1 + Math.sin(a * 2 + wobble) * 0.02
      pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r])
    }
    this.stroke(pts, { overshoot: 0, ...o })
  }

  /** A loop that slightly overlaps itself, like a circle drawn freehand. */
  ellipse(cx: number, cy: number, rx: number, ry: number, o?: StrokeOptions) {
    const start = this.rand() * Math.PI * 2
    this.arc(cx, cy, rx, ry, start, start + Math.PI * 2.12, o)
  }

  hatch(region: Pt[], { angle = -0.9, gap = 18, w = 2.4, alpha = 0.4 } = {}) {
    const ctx = this.ink
    const xs = region.map((p) => p[0])
    const ys = region.map((p) => p[1])
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const r = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2
    const [dx, dy] = [Math.cos(angle), Math.sin(angle)]
    ctx.save()
    ctx.beginPath()
    trace(ctx, region)
    ctx.clip()
    for (let o = -r; o <= r; o += gap * this.range(0.8, 1.2)) {
      const [ox, oy] = [cx - dy * o, cy + dx * o]
      this.stroke(
        [
          [ox - dx * r, oy - dy * r],
          [ox + dx * r, oy + dy * r],
        ],
        { w, alpha, passes: 1, jitter: 1.5, overshoot: 0 },
      )
    }
    ctx.restore()
  }

  /** Watercolour wash: a few misregistered translucent layers. */
  wash(region: Pt[], color: string, alpha = 0.9, hole?: Pt[]) {
    const ctx = this.paint
    ctx.save()
    ctx.fillStyle = color
    for (let k = 0; k < 3; k++) {
      ctx.globalAlpha = alpha * (k ? 0.3 : 0.65)
      const [ox, oy] = [this.range(-6, 6), this.range(-6, 6)]
      ctx.beginPath()
      trace(ctx, region, ox, oy)
      if (hole) trace(ctx, hole, ox, oy)
      ctx.fill('evenodd')
    }
    // pigment collects where a wash dries, leaving a darker rim
    ctx.globalAlpha = alpha * 0.35
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    trace(ctx, region)
    ctx.stroke()
    ctx.restore()
  }

  /** Solid colour, for surfaces that must hide what is behind them. */
  fill(region: Pt[], color: string, hole?: Pt[]) {
    const ctx = this.paint
    ctx.fillStyle = color
    ctx.beginPath()
    trace(ctx, region)
    if (hole) trace(ctx, hole)
    ctx.fill('evenodd')
  }

  /** Font size at which `str` fits in `maxWidth`, no larger than `size`. */
  fitText(str: string, size: number, maxWidth: number, weight = 700, font = 'Caveat') {
    this.ink.font = `${weight} ${size}px ${font}, cursive`
    return Math.min(size, (size * maxWidth) / this.ink.measureText(str).width)
  }

  text(
    str: string,
    x: number,
    y: number,
    size: number,
    { align = 'center' as CanvasTextAlign, rot = 0, alpha = 0.9, weight = 700, font = 'Caveat' } = {},
  ) {
    const ctx = this.ink
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot + this.range(-0.015, 0.015))
    ctx.font = `${weight} ${size}px ${font}, cursive`
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgba(0,0,0,${alpha})`
    ctx.fillText(str, 0, 0)
    const width = ctx.measureText(str).width
    ctx.restore()
    return width
  }
}
