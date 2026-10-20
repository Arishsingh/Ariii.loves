import { useFrame, type ThreeElements, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Vector3, type Mesh } from 'three'
import { gsap } from '../../lib/gsap'
import { REVEAL_DISTANCE } from '../../lib/layout'
import type { SketchPair } from '../../lib/textures'
import { createShadowMaterial, createSketchMaterial, type Glow } from './materials'

type Props = Omit<ThreeElements['group'], 'onClick'> & {
  pair: SketchPair
  size: [number, number]
  /** Opaque sketches hide the wall behind them; transparent ones show only their lines. */
  opaque?: boolean
  /** Always in colour, rather than painting in on hover. */
  painted?: boolean
  /** Reacts to the pointer. Off for anything the visitor can't currently reach. */
  interactive?: boolean
  /** Casts a hatched shadow on the wall behind it. */
  shadow?: boolean
  /** Visible from behind too (doors you walk through). */
  doubleSided?: boolean
  /** Lit by itself rather than by the flashlight and bulbs. */
  glow?: Glow
  /** Fully drawn from the start, for things too far away to ever get close to. */
  revealed?: boolean
  onClick?: () => void
}

const SHADOW_MARGIN = 0.3
/** Light comes from the lamps above, so shadows fall down and slightly to the side. */
const SHADOW_OFFSET: [number, number, number] = [0.06, -0.1, -0.012]

function Shadow({ width, height }: { width: number; height: number }) {
  const plane: [number, number] = [width + SHADOW_MARGIN, height + SHADOW_MARGIN]
  const material = useMemo(
    () => createShadowMaterial([width + SHADOW_MARGIN, height + SHADOW_MARGIN], [width, height]),
    [width, height],
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh position={SHADOW_OFFSET} material={material}>
      <planeGeometry args={plane} />
    </mesh>
  )
}

/** A flat hand-drawn picture that draws itself in when the camera comes near. */
export default function Sketch({
  pair,
  size,
  opaque = true,
  painted = false,
  interactive = false,
  shadow = false,
  doubleSided = false,
  glow = 'none',
  revealed = false,
  onClick,
  ...props
}: Props) {
  const material = useMemo(() => {
    const m = createSketchMaterial(pair.ink, pair.paint, { opaque, painted, doubleSided, glow })
    if (revealed) m.uniforms.uReveal.value = 1
    return m
  }, [pair, opaque, painted, doubleSided, glow, revealed])
  const mesh = useRef<Mesh>(null)
  const drawing = useRef(revealed)
  const center = useMemo(() => new Vector3(), [])

  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    const reveal = material.uniforms.uReveal
    if (!drawing.current) {
      mesh.current!.getWorldPosition(center)
      drawing.current = center.distanceTo(state.camera.position) < REVEAL_DISTANCE
    } else if (reveal.value < 1) {
      reveal.value = Math.min(1, reveal.value + delta * 0.5)
    }
  })

  const hover = (on: boolean, e?: ThreeEvent<PointerEvent>) => {
    document.body.style.cursor = on && onClick ? 'pointer' : ''
    if (painted) return
    if (on && e?.uv) material.uniforms.uPointer.value.copy(e.uv)
    gsap.to(material.uniforms.uHover, {
      value: on ? 1 : 0,
      duration: on ? 1.2 : 1.8,
      ease: 'power2.out',
      overwrite: true,
    })
  }

  const live = interactive && (!painted || !!onClick)
  return (
    <group {...props}>
      <mesh
        ref={mesh}
        material={material}
        onPointerOver={live ? (e) => (e.stopPropagation(), hover(true, e)) : undefined}
        onPointerOut={live ? () => hover(false) : undefined}
        onClick={interactive && onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}
      >
        <planeGeometry args={size} />
      </mesh>
      {shadow && <Shadow width={size[0]} height={size[1]} />}
    </group>
  )
}
