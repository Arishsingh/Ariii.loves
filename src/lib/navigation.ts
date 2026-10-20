import { getLenis } from '../hooks/useLenis'
import { useAppStore } from '../store/useAppStore'
import { gsap } from './gsap'
import { insidePoint, ROOMS, standPoint, WALK, zToProgress, type RoomId } from './layout'
import { doors, rig } from './rig'
import { playSound, startAmbience } from './sound'

let busy = false

/** After the paper tears: step up to the gate and unlock scrolling. */
export function enterSite() {
  useAppStore.getState().enter()
  playSound('tear')
  startAmbience()
  gsap.to(rig, {
    z: WALK.from,
    duration: 2.6,
    delay: 0.6,
    ease: 'power3.inOut',
    onComplete: () => {
      rig.mode = 'walk'
      getLenis()?.start()
    },
  })
}

/** Walk to a door, open it, step inside, then show the room's panel. */
export async function goToRoom(id: RoomId) {
  const { view, setView, setPanelOpen } = useAppStore.getState()
  if (busy || view === id) return
  if (view !== 'hall') await backToHall()
  busy = true
  rig.mode = 'tween'
  getLenis()?.stop()
  setView(id)

  const stand = standPoint(id)
  const inside = insidePoint(id)
  const travel = Math.hypot(stand.x - rig.x, stand.z - rig.z)
  const tl = gsap.timeline()
  tl.to(rig, {
    x: stand.x,
    z: stand.z,
    yaw: ROOMS[id].rotY,
    pitch: 0,
    duration: gsap.utils.clamp(1, 2.8, 0.7 + travel * 0.12),
    ease: 'power2.inOut',
  })
    .call(() => playSound('creak'))
    .to(doors[id], { open: 1, duration: 1, ease: 'power2.out' })
    .to(rig, { x: inside.x, z: inside.z, duration: 1.5, ease: 'power2.inOut' }, '-=0.45')
    .call(() => setPanelOpen(true), [], '-=0.3')
  await tl
  busy = false
}

/** Step back out, close the door and hand the camera back to the scroll. */
export async function backToHall() {
  const { view, setView, setPanelOpen, setScrollProgress } = useAppStore.getState()
  if (busy || view === 'hall') return
  busy = true
  setPanelOpen(false)

  const stand = standPoint(view)
  const z = Math.min(WALK.from, Math.max(WALK.to, stand.z))
  const tl = gsap.timeline()
  tl.to(rig, { x: stand.x, z: stand.z, duration: 1.3, ease: 'power2.inOut' })
    .call(() => playSound('creak'))
    .to(doors[view], { open: 0, duration: 0.9, ease: 'power2.inOut' })
    .to(rig, { x: 0, z, yaw: 0, duration: 1.1, ease: 'power2.inOut' }, '<')
  await tl

  // Put the scroll position where the camera now is, so walking resumes from here.
  const lenis = getLenis()
  const progress = zToProgress(z)
  lenis?.start()
  lenis?.scrollTo(progress * lenis.limit, { immediate: true, force: true })
  setScrollProgress(progress)
  rig.mode = 'walk'
  setView('hall')
  busy = false
}
