import { useMemo } from 'react'
import { getEnvMaterial } from './materials'

export type Rect = {
  position: [number, number, number]
  rotation: [number, number, number]
  size: [number, number]
}

/** Renders flat rectangles with the shared wall/floor/ceiling material. */
export default function Walls({ rects }: { rects: Rect[] }) {
  const material = useMemo(() => getEnvMaterial(), [])
  return rects.map((r, i) => (
    <mesh key={i} position={r.position} rotation={r.rotation} material={material}>
      <planeGeometry args={r.size} />
    </mesh>
  ))
}
