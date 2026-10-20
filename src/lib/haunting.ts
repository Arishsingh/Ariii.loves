/** Scare events shared between the scene and the sound: Haunting reads these each frame. */
export const haunting = {
  /** Clock time (seconds) until which the bulbs stutter hard. */
  flickerUntil: 0,
  /** The figure has crossed the hall; it only does so once per visit. */
  figureSeen: false,
}

let now = 0
export const setHauntClock = (t: number) => (now = t)

export function flickerBurst(seconds = 1.2) {
  haunting.flickerUntil = Math.max(haunting.flickerUntil, now + seconds)
}
