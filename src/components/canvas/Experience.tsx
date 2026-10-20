import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Leva } from 'leva'
import { lazy, Suspense, useRef, useState } from 'react'
import { HALL, ROOM_IDS } from '../../lib/layout'
import { rig } from '../../lib/rig'
import { useAppStore } from '../../store/useAppStore'
import CameraRig from './CameraRig'
import Corridor from './Corridor'
import Haunting from './Haunting'
import { NIGHT } from './materials'
import Room from './Room'
import Yard from './Yard'

const Perf = lazy(() => import('r3f-perf').then((m) => ({ default: m.Perf })))

const debug = import.meta.env.DEV && location.hash === '#debug'

/** Marks the scene as loaded once a few frames have rendered (textures uploaded). */
function Ready() {
  const frames = useRef(0)
  useFrame(() => {
    if (++frames.current === 3) useAppStore.getState().setLoaded(true)
  })
  return null
}

export default function Experience() {
  const [dpr, setDpr] = useState(1.5)

  return (
    <>
      <Leva hidden={!debug} />
      <Canvas
        dpr={dpr}
        flat
        camera={{ position: [0, HALL.eye, rig.z], fov: 55, near: 0.05, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {debug && (
          <Suspense fallback={null}>
            <Perf position="bottom-left" />
          </Suspense>
        )}
        <color attach="background" args={[NIGHT]} />
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        <AdaptiveDpr pixelated />
        <CameraRig />
        <Yard />
        <Corridor />
        <Haunting />
        {ROOM_IDS.map((id) => (
          <Room key={id} id={id} />
        ))}
        <Ready />
      </Canvas>
    </>
  )
}
