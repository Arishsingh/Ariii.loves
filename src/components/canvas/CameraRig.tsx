import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, Vector3 } from 'three'
import { progressToZ } from '../../lib/layout'
import { rig } from '../../lib/rig'
import { playSound } from '../../lib/sound'
import { useAppStore } from '../../store/useAppStore'
import { shared } from './materials'

const clamp = (v: number) => MathUtils.clamp(v, -1, 1)

const STRIDE = 0.85
const aim = new Vector3()

/**
 * Drives the camera from the rig, plus a little look-around from the mouse or phone tilt.
 * The flashlight points wherever the cursor is, and footsteps sound as the camera moves.
 */
export default function CameraRig() {
  const look = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const walked = useRef({ x: rig.x, z: rig.z, distance: 0 })

  useEffect(() => {
    const l = look.current
    const onMove = (e: PointerEvent) => {
      l.tx = (e.clientX / innerWidth) * 2 - 1
      l.ty = (e.clientY / innerHeight) * 2 - 1
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      l.tx = clamp(e.gamma / 25)
      l.ty = clamp((e.beta - 50) / 25)
    }
    addEventListener('pointermove', onMove)
    addEventListener('deviceorientation', onTilt)
    return () => {
      removeEventListener('pointermove', onMove)
      removeEventListener('deviceorientation', onTilt)
    }
  }, [])

  useFrame((state, delta) => {
    const l = look.current
    if (rig.mode === 'walk') {
      rig.z = MathUtils.damp(rig.z, progressToZ(useAppStore.getState().scrollProgress), 5, delta)
    }
    l.x = MathUtils.damp(l.x, l.tx, 3, delta)
    l.y = MathUtils.damp(l.y, l.ty, 3, delta)

    const bob = rig.mode === 'walk' ? Math.sin(rig.z * 2.6) * 0.025 : 0
    const cam = state.camera
    cam.position.set(rig.x, rig.y + bob, rig.z)
    cam.rotation.set(rig.pitch - l.y * 0.08, rig.yaw - l.x * 0.14, 0, 'YXZ')

    shared.uTime.value += delta
    shared.uCam.value.copy(cam.position)
    aim.set(l.x * 0.75, -l.y * 0.75, 0.5).unproject(cam).sub(cam.position).normalize()
    shared.uFlashDir.value.lerp(aim, 1 - Math.exp(-delta * 10)).normalize()

    const w = walked.current
    w.distance += Math.hypot(rig.x - w.x, rig.z - w.z)
    w.x = rig.x
    w.z = rig.z
    if (w.distance > STRIDE) {
      w.distance = 0
      playSound('step')
    }
  })

  return null
}
