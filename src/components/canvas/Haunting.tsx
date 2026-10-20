import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { gsap } from '../../lib/gsap'
import { flickerBurst, haunting, setHauntClock } from '../../lib/haunting'
import { FIGURE_TRIGGER, HALL_LAMPS } from '../../lib/layout'
import { playSound } from '../../lib/sound'
import { figureTextures } from '../../lib/textures'
import Sketch from './Sketch'
import { shared } from './materials'

const FIGURE: [number, number] = [0.9, 2.25]
/** It crosses under the second bulb, where it shows up against the light. */
const FIGURE_Z = HALL_LAMPS[1] - 0.5
/** Far enough left or right that it is hidden inside the wall. */
const OFFSTAGE = 2.5

/** Flickers the bulbs and stages the figure that crosses the end of the hall. */
export default function Haunting() {
  const figure = useRef<Group>(null)
  const dip = useRef(0)

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime
    setHauntClock(t)

    // Bulbs hum steadily, sag now and then, and stutter hard during a scare.
    let level = 0.92 + Math.sin(t * 47) * 0.03
    if (t < haunting.flickerUntil) level = Math.random() < 0.45 ? 0.04 : 1
    else if (t < dip.current) level = 0.2
    else if (Math.random() < 0.004) dip.current = t + 0.05 + Math.random() * 0.15
    shared.uFlicker.value = level

    if (!haunting.figureSeen && camera.position.z < FIGURE_TRIGGER && camera.position.z > FIGURE_Z + 3) {
      haunting.figureSeen = true
      const g = figure.current!
      g.visible = true
      playSound('sting')
      gsap.fromTo(
        g.position,
        { x: -OFFSTAGE },
        {
          x: OFFSTAGE,
          duration: 1.1,
          ease: 'power1.inOut',
          onComplete: () => {
            g.visible = false
            flickerBurst(1)
          },
        },
      )
    }
  })

  return (
    <group ref={figure} position={[-OFFSTAGE, FIGURE[1] / 2, FIGURE_Z]} visible={false}>
      <Sketch pair={figureTextures()} size={FIGURE} opaque={false} painted revealed />
    </group>
  )
}
