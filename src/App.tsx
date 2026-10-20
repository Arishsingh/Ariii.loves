import { useEffect, useState } from 'react'
import Experience from './components/canvas/Experience'
import Hud from './components/dom/Hud'
import Intro from './components/dom/Intro'
import RoomPanel from './components/dom/RoomPanel'
import { useLenis } from './hooks/useLenis'

/** Sketch textures are lettered in Caveat and Creepster, so wait for them (but not forever). */
const fontsReady = () =>
  Promise.race([
    Promise.all(['700 100px Caveat', '400 100px Caveat', '400 100px Creepster'].map((f) => document.fonts.load(f))),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]).catch(() => {})

export default function App() {
  useLenis()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fontsReady().then(() => setReady(true))
  }, [])

  return (
    <>
      <div className="canvas-wrap">{ready && <Experience />}</div>
      {/* Gives the page its scroll length; scrolling walks the camera down the corridor. */}
      <div className="scroll-space" aria-hidden />
      <div className="film" aria-hidden />
      <div className="vignette" aria-hidden />
      <Hud />
      <RoomPanel />
      <Intro />
    </>
  )
}
