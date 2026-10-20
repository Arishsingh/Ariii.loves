import { Color, DoubleSide, ShaderMaterial, Vector2, Vector3, Vector4, type Texture } from 'three'
import { floorPlans, HALL, lampPositions } from '../../lib/layout'
import { ceilingTextures, floorTextures, wallTextures } from '../../lib/textures'
import fragmentShader from '../../shaders/sketch.frag'
import vertexShader from '../../shaders/sketch.vert'

/** Aged paper, charcoal, and the night everything fades into. */
export const PAPER = '#cbbfa7'
export const INK = '#16130f'
export const NIGHT = '#07080c'

const lamps = lampPositions().map(({ x, y, z }) => new Vector3(x, y, z))

/** Uniforms every sketch material shares by reference; the camera rig and Haunting update them per frame. */
export const shared = {
  uTime: { value: 0 },
  uCam: { value: new Vector3() },
  uFlashDir: { value: new Vector3(0, 0, -1) },
  /** Brightness of the bulbs, 0 to 1; dips when they flicker. */
  uFlicker: { value: 1 },
  uFogColor: { value: new Color(NIGHT) },
  uLamps: { value: lamps },
  uPaperColor: { value: new Color(PAPER) },
  uInkColor: { value: new Color(INK) },
}

const defines = { LAMP_COUNT: lamps.length }

/** Distance band over which walls (and shadows on them) get drawn in. */
const REVEAL_DIST = new Vector2(7, 16)

let env: ShaderMaterial | null = null

/** One material for every wall, floor and ceiling; it picks a texture by which way the surface faces. */
export function getEnvMaterial() {
  if (env) return env
  const [wall, floor, ceil] = [wallTextures(), floorTextures(), ceilingTextures()]
  const plans = floorPlans().map(([a, b, c, d]) => new Vector4(a, b, c, d))
  env = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines: { ...defines, ENV: '', PLAN_COUNT: plans.length },
    side: DoubleSide,
    uniforms: {
      ...shared,
      uInk: { value: wall.ink },
      uPaint: { value: wall.paint },
      uInkFloor: { value: floor.ink },
      uPaintFloor: { value: floor.paint },
      uInkCeil: { value: ceil.ink },
      uPaintCeil: { value: ceil.paint },
      uTile: { value: new Vector2(4, HALL.height) },
      uRevealDist: { value: REVEAL_DIST },
      uHeight: { value: HALL.height },
      uPlans: { value: plans },
    },
  })
  return env
}

/** Hatched shadow cast on the wall by a frame of size `caster`, drawn on a plane of size `size`. */
export function createShadowMaterial(size: [number, number], caster: [number, number]) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines: { ...defines, SHADOW: '' },
    transparent: true,
    depthWrite: false,
    uniforms: {
      ...shared,
      uRevealDist: { value: REVEAL_DIST },
      uSize: { value: new Vector2(...size) },
      uCaster: { value: new Vector2(...caster) },
    },
  })
}

export type Glow = 'none' | 'steady' | 'flicker'

export function createSketchMaterial(
  ink: Texture,
  paint: Texture,
  { opaque = true, painted = false, doubleSided = false, glow = 'none' as Glow } = {},
) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    defines,
    transparent: !opaque,
    depthWrite: opaque,
    ...(doubleSided && { side: DoubleSide }),
    uniforms: {
      ...shared,
      uInk: { value: ink },
      uPaint: { value: paint },
      uReveal: { value: 0 },
      uHover: { value: painted ? 1 : 0 },
      uPointer: { value: new Vector2(0.5, 0.5) },
      uOpaque: { value: opaque ? 1 : 0 },
      uGlow: { value: { none: 0, steady: 1, flicker: 2 }[glow] },
    },
  })
}
