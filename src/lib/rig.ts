import { HALL, WALK, type RoomId } from './layout'

/**
 * Where the camera is. In 'walk' mode CameraRig follows the page scroll;
 * in 'tween' mode GSAP animates these values directly.
 */
export const rig = {
  x: 0,
  y: HALL.eye,
  z: WALK.from + 5,
  yaw: 0,
  pitch: 0,
  mode: 'tween' as 'walk' | 'tween',
}

/** How far each door is open, 0 to 1. */
export const doors: Record<RoomId, { open: number }> = {
  work: { open: 0 },
  about: { open: 0 },
  contact: { open: 0 },
}
