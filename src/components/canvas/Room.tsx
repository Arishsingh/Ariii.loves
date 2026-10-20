import { about, contact, site, work } from '../../content'
import { HALL, ROOM, ROOMS, type RoomId } from '../../lib/layout'
import { cardTextures, frameTextures, lampTextures } from '../../lib/textures'
import { useAppStore } from '../../store/useAppStore'
import Sketch from './Sketch'
import Walls, { type Rect } from './Walls'

const { width: W, depth: D } = ROOM
const H = HALL.height
const BACK = -D + 0.02
const FRAME: [number, number] = [1.2, 1.5]
const CARD: [number, number] = [2, 1.5]

// In room-local space: the door is at the origin and the room extends toward -z.
const RECTS: Rect[] = [
  { position: [0, H / 2, -D], rotation: [0, 0, 0], size: [W, H] },
  { position: [-W / 2, H / 2, -D / 2], rotation: [0, Math.PI / 2, 0], size: [D, H] },
  { position: [W / 2, H / 2, -D / 2], rotation: [0, -Math.PI / 2, 0], size: [D, H] },
  { position: [0, 0, -D / 2], rotation: [-Math.PI / 2, 0, 0], size: [W, D] },
  { position: [0, H, -D / 2], rotation: [Math.PI / 2, 0, 0], size: [W, D] },
]

const open = (href: string) => window.open(href, '_blank', 'noopener')

export default function Room({ id }: { id: RoomId }) {
  const room = ROOMS[id]
  const active = useAppStore((s) => s.view === id)

  return (
    <group position={[room.x, 0, room.z]} rotation-y={room.rotY}>
      <Walls rects={RECTS} />
      <Sketch pair={lampTextures()} size={[0.5, 1]} position={[0, H - 0.5, -D / 2]} opaque={false} painted glow="flicker" />

      {id === 'work' &&
        work.map((p, i) => (
          <Sketch
            key={p.title}
            pair={frameTextures(p.drawing, p.title, 20 + i)}
            size={FRAME}
            position={[(i - 1) * 1.8, 1.75, BACK]}
            interactive={active}
            shadow
            onClick={() => open(p.href)}
          />
        ))}

      {id === 'about' && (
        <>
          <Sketch
            pair={frameTextures('portrait', "that's me", 30)}
            size={FRAME}
            position={[-1.3, 1.75, BACK]}
            interactive={active}
            shadow
          />
          <Sketch pair={cardTextures(about.card, 31)} size={CARD} position={[1.2, 1.8, BACK]} interactive={active} shadow />
        </>
      )}

      {id === 'contact' && (
        <>
          <Sketch
            pair={frameTextures('envelope', 'write to me', 40)}
            size={FRAME}
            position={[-1.3, 1.75, BACK]}
            interactive={active}
            shadow
            onClick={() => open(`mailto:${site.email}`)}
          />
          <Sketch pair={cardTextures(contact.card, 41)} size={CARD} position={[1.2, 1.8, BACK]} interactive={active} shadow />
        </>
      )}
    </group>
  )
}
