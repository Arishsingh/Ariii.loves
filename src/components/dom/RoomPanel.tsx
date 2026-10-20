import { useEffect, useRef } from 'react'
import { about, contact, site, work } from '../../content'
import { gsap, useGSAP } from '../../lib/gsap'
import { backToHall } from '../../lib/navigation'
import { useAppStore } from '../../store/useAppStore'

function Work() {
  return (
    <>
      <h2>selected work</h2>
      <ul className="panel-list">
        {work.map((p) => (
          <li key={p.title}>
            <a href={p.href} target="_blank" rel="noreferrer">
              {p.title} <span>{p.year}</span>
            </a>
            <p>{p.blurb}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function About() {
  return (
    <>
      <h2>about me</h2>
      {about.paragraphs.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </>
  )
}

function Contact() {
  return (
    <>
      <h2>say hello</h2>
      <p>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      <ul className="panel-links">
        {contact.links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}

const BODIES = { work: Work, about: About, contact: Contact }

/** The readable content of a room, shown once the camera is inside. */
export default function RoomPanel() {
  const ref = useRef<HTMLElement>(null)
  const view = useAppStore((s) => s.view)
  const open = useAppStore((s) => s.panelOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && backToHall()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  useGSAP(() => {
    gsap.to(ref.current, open ? { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' } : { autoAlpha: 0, y: 30, duration: 0.3 })
  }, [open])

  const Body = view === 'hall' ? null : BODIES[view]
  return (
    <aside ref={ref} className="room-panel paper" aria-hidden={!open}>
      {Body && <Body />}
      <button className="text-button" onClick={() => backToHall()}>
        ← back to the hallway
      </button>
    </aside>
  )
}
