import Lenis from 'lenis'
import { useEffect } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useAppStore } from '../store/useAppStore'

let instance: Lenis | null = null

/** The live Lenis instance, for code outside React (camera transitions). */
export const getLenis = () => instance

/** Smooth scrolling, synced with GSAP ScrollTrigger and the shared store. */
export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis()
    instance = lenis
    const setScrollProgress = useAppStore.getState().setScrollProgress

    // Scrolling stays locked until the visitor clicks through the intro.
    if (!useAppStore.getState().entered) lenis.stop()

    lenis.on('scroll', (e: Lenis) => {
      ScrollTrigger.update()
      setScrollProgress(e.progress)
    })

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      instance = null
    }
  }, [])
}
