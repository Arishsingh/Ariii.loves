import { useMemo } from 'react'
import { hallway, scrawls, site } from '../../content'
import { DOOR, HALL, HALL_LAMPS, ROOM_IDS, ROOMS } from '../../lib/layout'
import { bannerTextures, frameTextures, lampTextures, scrawlTextures } from '../../lib/textures'
import { useAppStore } from '../../store/useAppStore'
import Door from './Door'
import Sketch from './Sketch'
import Walls, { type Rect } from './Walls'

const { width: W, height: H, start, end } = HALL
const BANNER: [number, number] = [3.4, 1.275]

/**
 * A wall running along one axis, with door-sized holes cut at `holes`.
 * Each solid stretch and each lintel above a door becomes its own plane.
 */
function wall(along: 'x' | 'z', fixed: number, from: number, to: number, holes: number[], rotY: number) {
  const rects: Rect[] = []
  const place = (c: number, y: number, w: number, h: number) =>
    rects.push({ position: along === 'z' ? [fixed, y, c] : [c, y, fixed], rotation: [0, rotY, 0], size: [w, h] })
  const sorted = [...holes].sort((a, b) => a - b)
  const edges = [from, ...sorted.flatMap((h) => [h - DOOR.width / 2, h + DOOR.width / 2]), to]
  for (let i = 0; i < edges.length; i += 2) {
    if (edges[i + 1] > edges[i]) place((edges[i] + edges[i + 1]) / 2, H / 2, edges[i + 1] - edges[i], H)
  }
  for (const h of sorted) place(h, (DOOR.height + H) / 2, DOOR.width, H - DOOR.height)
  return rects
}

function hallRects(): Rect[] {
  const doorsOn = (x: number) => ROOM_IDS.filter((id) => ROOMS[id].x === x && ROOMS[id].rotY !== 0).map((id) => ROOMS[id].z)
  const length = start - end
  return [
    ...wall('z', -W / 2, end, start, doorsOn(-W / 2), Math.PI / 2),
    ...wall('z', W / 2, end, start, doorsOn(W / 2), -Math.PI / 2),
    ...wall('x', end, -W / 2, W / 2, [ROOMS.contact.x], 0),
    // the front wall, with the front door in it
    ...wall('x', start, -W / 2, W / 2, [0], Math.PI),
    { position: [0, 0, (start + end) / 2], rotation: [-Math.PI / 2, 0, 0], size: [W, length] },
    { position: [0, H, (start + end) / 2], rotation: [Math.PI / 2, 0, 0], size: [W, length] },
  ]
}

const onWall = (side: 'left' | 'right', inset: number) => ({
  x: side === 'left' ? -W / 2 + inset : W / 2 - inset,
  rotY: side === 'left' ? Math.PI / 2 : -Math.PI / 2,
})

export default function Corridor() {
  const rects = useMemo(() => hallRects(), [])
  const inHall = useAppStore((s) => s.view === 'hall')

  return (
    <>
      <Walls rects={rects} />

      <Sketch
        pair={bannerTextures(site.name, site.role)}
        size={BANNER}
        position={[0, H - BANNER[1] / 2, -2.5]}
        opaque={false}
        painted
      />

      {hallway.map((f, i) => {
        const { x, rotY } = onWall(f.side, 0.02)
        return (
          <Sketch
            key={i}
            pair={frameTextures(f.drawing, f.caption, i + 1)}
            size={[1.2, 1.5]}
            position={[x, 1.75, f.z]}
            rotation={[0, rotY, 0]}
            interactive={inHall}
            shadow
          />
        )
      })}

      {scrawls.map((s, i) => {
        const { x, rotY } = onWall(s.side, 0.015)
        return (
          <Sketch
            key={s.text}
            pair={scrawlTextures(s.text, i + 1)}
            size={[2.4, 0.6]}
            position={[x, s.y, s.z]}
            rotation={[0, rotY, 0]}
            opaque={false}
            painted
          />
        )
      })}

      {HALL_LAMPS.map((z) => (
        <Sketch key={z} pair={lampTextures()} size={[0.5, 1]} position={[0, H - 0.5, z]} opaque={false} painted glow="flicker" />
      ))}

      {ROOM_IDS.map((id) => (
        <Door key={id} id={id} />
      ))}
    </>
  )
}
