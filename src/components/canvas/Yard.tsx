import { HALL, YARD } from '../../lib/layout'
import {
  facadeTextures,
  fenceTextures,
  graveTextures,
  groundTextures,
  litWindowTextures,
  moonTextures,
  treeTextures,
} from '../../lib/textures'
import { FrontDoor } from './Door'
import Sketch from './Sketch'

/** The house front is 16 m × 11 m; the door sits at its bottom centre, at the origin. */
const FACADE: [number, number] = [16, 11]
const FENCE_Z = 12
const GATE = 1.3

// [x, z, seed] for each dead tree, [x, z, tilt, seed] for each headstone
const TREES = [[-6, 8, 1], [7, 5, 2], [-10, 3, 3], [11, 11, 4], [-12, 13, 5]]
const GRAVES = [[-4.5, 8, 0.12, 1], [-3.4, 6.2, -0.08, 2], [4.8, 9.5, 0.05, 3]]

/** Everything outside: the yard, the fence, the trees, the moon, and the front of the house. */
export default function Yard() {
  const fenceWidth = YARD.width / 2 - GATE
  return (
    <>
      <Sketch
        pair={groundTextures()}
        size={[YARD.width, YARD.depth]}
        position={[0, 0, HALL.start + YARD.depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        painted
        revealed
      />

      <group position={[0, 0, HALL.start + 0.03]}>
        <Sketch pair={facadeTextures()} size={FACADE} position={[0, FACADE[1] / 2, 0]} opaque={false} painted revealed />
        {/* somebody is home */}
        <Sketch pair={litWindowTextures()} size={[1, 1.5]} position={[3, 4.85, 0.01]} painted revealed glow="flicker" />
      </group>
      <FrontDoor />

      {[-1, 1].map((side) => (
        <Sketch
          key={side}
          pair={fenceTextures()}
          size={[fenceWidth, 1.5]}
          position={[side * (GATE + fenceWidth / 2), 0.75, FENCE_Z]}
          opaque={false}
          painted
          revealed
        />
      ))}

      {TREES.map(([x, z, seed]) => (
        <Sketch
          key={seed}
          pair={treeTextures(seed)}
          size={[5, 7.5]}
          position={[x, 3.75, z]}
          opaque={false}
          painted
          revealed
        />
      ))}

      {GRAVES.map(([x, z, tilt, seed]) => (
        <Sketch
          key={seed}
          pair={graveTextures(seed)}
          size={[0.9, 1.1]}
          position={[x, 0.55, z]}
          rotation={[0, 0, tilt]}
          opaque={false}
          painted
          revealed
        />
      ))}

      <Sketch
        pair={moonTextures()}
        size={[9, 9]}
        position={[-30, 13, -36]}
        rotation={[0, 0.55, 0]}
        opaque={false}
        painted
        revealed
        glow="steady"
      />
    </>
  )
}
