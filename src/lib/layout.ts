/**
 * World layout in metres. The visitor starts outside in the yard (+z), walks up the
 * path, through the front door at z = 0, and down the hallway toward -z.
 */
export const HALL = { width: 4, height: 3.2, start: 0, end: -36, eye: 1.6 }
export const YARD = { depth: 20, width: 26 }
export const DOOR = { width: 1.3, height: 2.3 }
export const ROOM = { width: 6, depth: 6 }

/** Camera z at the top and the bottom of the page scroll. */
export const WALK = { from: 15, to: HALL.end + 3 }

/** A sketch reveals itself once the camera is closer than this. */
export const REVEAL_DISTANCE = 7.5

/** The front door opens while the camera is between these z values, and slams once past the inner one. */
export const FRONT_DOOR = { opensAt: 5, slamsAt: -3.5 }

/** Camera z at which the figure crosses the hall up ahead. */
export const FIGURE_TRIGGER = -6

export type RoomId = 'work' | 'about' | 'contact'
export type RoomPlacement = { x: number; z: number; rotY: number; label: string }

const half = HALL.width / 2

/** Each room sits behind a door; the door's local -z points into the room. */
export const ROOMS: Record<RoomId, RoomPlacement> = {
  work: { x: -half, z: -12, rotY: Math.PI / 2, label: 'work' },
  about: { x: half, z: -22, rotY: -Math.PI / 2, label: 'about' },
  contact: { x: 0, z: HALL.end, rotY: 0, label: 'contact' },
}
export const ROOM_IDS = Object.keys(ROOMS) as RoomId[]

/** Converts a room-local point (x across the door, z toward the corridor) to world space. */
export function roomToWorld(room: RoomPlacement, lx: number, ly: number, lz: number) {
  const c = Math.cos(room.rotY)
  const s = Math.sin(room.rotY)
  return { x: room.x + lx * c + lz * s, y: ly, z: room.z - lx * s + lz * c }
}

/** Where the camera stands in the corridor, facing a door. */
export const standPoint = (id: RoomId) => roomToWorld(ROOMS[id], 0, HALL.eye, 1.6)
/** Where the camera stands inside a room: left of centre, so the text panel doesn't cover the frames. */
export const insidePoint = (id: RoomId) => roomToWorld(ROOMS[id], -0.9, HALL.eye, -1.4)

export const zToProgress = (z: number) =>
  Math.min(1, Math.max(0, (z - WALK.from) / (WALK.to - WALK.from)))
export const progressToZ = (p: number) => WALK.from + (WALK.to - WALK.from) * p

/** Bare bulbs hang down the hallway, and one in the middle of each room. */
export const HALL_LAMPS = [-5, -17, -29]
/** How far below the ceiling a lamp's bulb sits. */
export const BULB_DROP = 0.75

export const lampPositions = () => [
  ...HALL_LAMPS.map((z) => ({ x: 0, y: HALL.height - BULB_DROP, z })),
  ...ROOM_IDS.map((id) => roomToWorld(ROOMS[id], 0, HALL.height - BULB_DROP, -ROOM.depth / 2)),
]

/** Floor-plan bounds [minX, minZ, maxX, maxZ] of the hallway and each room. */
export const floorPlans = () => [
  [-HALL.width / 2, HALL.end, HALL.width / 2, HALL.start],
  ...ROOM_IDS.map((id) => {
    const a = roomToWorld(ROOMS[id], -ROOM.width / 2, 0, 0)
    const b = roomToWorld(ROOMS[id], ROOM.width / 2, 0, -ROOM.depth)
    return [Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z)]
  }),
]
