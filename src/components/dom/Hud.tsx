import { site } from '../../content'
import { ROOM_IDS, ROOMS, standPoint, zToProgress } from '../../lib/layout'
import { backToHall, goToRoom } from '../../lib/navigation'
import { useAppStore } from '../../store/useAppStore'
import SoundToggle from './SoundToggle'

/** Header navigation, the scroll hint, and a corridor map along the right edge. */
export default function Hud() {
  const entered = useAppStore((s) => s.entered)
  const view = useAppStore((s) => s.view)
  const progress = useAppStore((s) => s.scrollProgress)

  return (
    <div className={`hud ${entered ? 'is-visible' : ''}`}>
      <header className="hud-header">
        <button className="hud-name" onClick={() => backToHall()}>
          {site.name}
        </button>
        <nav className="hud-nav">
          {ROOM_IDS.map((id) => (
            <button key={id} className={view === id ? 'is-active' : ''} onClick={() => goToRoom(id)}>
              {ROOMS[id].label}
            </button>
          ))}
          <SoundToggle />
        </nav>
      </header>

      <p className={`scroll-hint ${view === 'hall' && progress < 0.02 ? 'is-visible' : ''}`}>scroll to walk toward the house ↓</p>

      <div className={`hall-map ${view === 'hall' ? 'is-visible' : ''}`} aria-hidden>
        <div className="hall-map-line" />
        <div className="hall-map-you" style={{ top: `${progress * 100}%` }} />
        {ROOM_IDS.map((id) => (
          <button
            key={id}
            className="hall-map-door"
            style={{ top: `${zToProgress(standPoint(id).z) * 100}%` }}
            onClick={() => goToRoom(id)}
            tabIndex={-1}
          >
            {ROOMS[id].label}
          </button>
        ))}
      </div>
    </div>
  )
}
