import { useMemo, useRef, useState } from 'react'
import { site } from '../../content'
import { gsap, useGSAP } from '../../lib/gsap'
import { enterSite } from '../../lib/navigation'
import { useAppStore } from '../../store/useAppStore'

/** A jagged vertical tear, as clip-path polygons for the left and right halves. */
function tearPaths() {
  const pts: string[] = []
  let x = 50
  for (let y = 0; y <= 100; y += 2.5) {
    x = Math.max(42, Math.min(58, x + (Math.random() - 0.5) * 6))
    pts.push(`${(x + (Math.random() - 0.5) * 1.2).toFixed(2)}% ${y}%`)
  }
  const edge = pts.join(', ')
  return { left: `polygon(0 0, ${edge}, 0 100%)`, right: `polygon(${edge}, 100% 100%, 100% 0)` }
}

/** iOS asks for permission before sharing device tilt, and only inside a tap. */
async function askForTilt() {
  const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  try {
    await D?.requestPermission?.()
  } catch {
    // Declined or unsupported: the mouse/touch look still works.
  }
}

function Sheet({ clip, side }: { clip: string; side: 'left' | 'right' }) {
  return (
    <div className={`tear-half tear-${side}`}>
      <div className="tear-paper paper" style={{ clipPath: clip }} aria-hidden={side === 'right'}>
        <p className="intro-kicker">the house of</p>
        <h1 className="intro-title">{site.name}</h1>
        <p className="intro-role">{site.role}</p>
      </div>
    </div>
  )
}

/** Loading screen that becomes a sheet of paper; entering rips it open. */
export default function Intro() {
  const root = useRef<HTMLDivElement>(null)
  const loaded = useAppStore((s) => s.loaded)
  const entered = useAppStore((s) => s.entered)
  const [gone, setGone] = useState(false)
  const clip = useMemo(() => tearPaths(), [])

  const enter = (withSound: boolean) => {
    askForTilt()
    useAppStore.getState().setSound(withSound)
    enterSite()
  }

  useGSAP(
    () => {
      if (!entered) return
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to('.intro-actions', { autoAlpha: 0, duration: 0.25 })
        // a first small rip, a beat, then the halves fall away
        .to('.tear-left', { x: -10, rotate: -0.6, duration: 0.18, ease: 'power2.out' })
        .to('.tear-right', { x: 10, rotate: 0.6, duration: 0.18, ease: 'power2.out' }, '<')
        .to('.tear-left', { xPercent: -80, y: 80, rotate: -10, duration: 1.5, ease: 'power3.inOut' }, '+=0.12')
        .to('.tear-right', { xPercent: 80, y: 60, rotate: 8, duration: 1.5, ease: 'power3.inOut' }, '<')
    },
    { scope: root, dependencies: [entered] },
  )

  if (gone) return null

  return (
    <div ref={root} className={`intro ${entered ? 'is-tearing' : ''}`}>
      <Sheet clip={clip.left} side="left" />
      <Sheet clip={clip.right} side="right" />
      <div className="intro-actions">
        {loaded ? (
          <>
            <button className="pencil-button" onClick={() => enter(true)}>
              enter, if you dare
            </button>
            <button className="text-button" onClick={() => enter(false)}>
              enter without sound (coward)
            </button>
            <p className="intro-hint">headphones recommended · your mouse is a flashlight</p>
          </>
        ) : (
          <p className="intro-loading">something is waking up...</p>
        )}
      </div>
    </div>
  )
}
