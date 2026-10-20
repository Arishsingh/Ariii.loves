import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type Group } from 'three'
import { flickerBurst } from '../../lib/haunting'
import { DOOR, FRONT_DOOR, ROOMS, type RoomId } from '../../lib/layout'
import { goToRoom } from '../../lib/navigation'
import { doors } from '../../lib/rig'
import { playSound } from '../../lib/sound'
import { doorLeafTextures, doorTrimTextures } from '../../lib/textures'
import { useAppStore } from '../../store/useAppStore'
import Sketch from './Sketch'

const TRIM: [number, number] = [DOOR.width + 0.6, DOOR.height + 0.75]

/** The door panel inside a hinge group on its right edge; the group swings it. */
function Leaf({ front = false, interactive = false, onClick }: { front?: boolean; interactive?: boolean; onClick?: () => void }) {
  return (
    <Sketch
      pair={doorLeafTextures(front)}
      size={[DOOR.width, DOOR.height]}
      position={[-DOOR.width / 2, DOOR.height / 2, 0]}
      doubleSided
      painted
      interactive={interactive}
      onClick={onClick}
    />
  )
}

/** A room door with a name sign; it swings into its room when clicked. */
export default function Door({ id }: { id: RoomId }) {
  const room = ROOMS[id]
  const hinge = useRef<Group>(null)
  const inHall = useAppStore((s) => s.view === 'hall')

  useFrame(() => {
    hinge.current!.rotation.y = -doors[id].open * 1.75
  })

  return (
    <group position={[room.x, 0, room.z]} rotation-y={room.rotY}>
      <Sketch pair={doorTrimTextures(room.label)} size={TRIM} position={[0, TRIM[1] / 2, 0.012]} opaque={false} painted />
      <group ref={hinge} position={[DOOR.width / 2, 0, 0]}>
        <Leaf interactive={inHall} onClick={() => goToRoom(id)} />
      </group>
    </group>
  )
}

/** The front door creaks open as you come up the path, and slams shut once you're inside. */
export function FrontDoor() {
  const hinge = useRef<Group>(null)
  const state = useRef({ open: 0, target: 0 })

  useFrame(({ camera }, delta) => {
    const s = state.current
    const z = camera.position.z
    const inside = z < FRONT_DOOR.slamsAt
    const target = !inside && z < FRONT_DOOR.opensAt ? 1 : 0
    if (target !== s.target) {
      if (target === 0 && inside) {
        playSound('slam')
        flickerBurst(1.4)
      } else {
        playSound('creak')
      }
      s.target = target
    }
    s.open = MathUtils.damp(s.open, target, target === 0 && inside ? 16 : 1.4, delta)
    hinge.current!.rotation.y = -s.open * 1.6
  })

  return (
    <group ref={hinge} position={[DOOR.width / 2, 0, 0]}>
      <Leaf front />
    </group>
  )
}
