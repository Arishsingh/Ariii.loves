import { useEffect } from 'react'
import { setMuted } from '../../lib/sound'
import { useAppStore } from '../../store/useAppStore'

export default function SoundToggle() {
  const soundOn = useAppStore((s) => s.soundOn)
  const toggleSound = useAppStore((s) => s.toggleSound)

  useEffect(() => setMuted(!soundOn), [soundOn])

  return (
    <button className="sound-toggle" onClick={toggleSound} aria-pressed={soundOn}>
      sound {soundOn ? 'on' : 'off'}
    </button>
  )
}
