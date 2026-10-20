import { create } from 'zustand'
import type { RoomId } from '../lib/layout'

type AppState = {
  /** The 3D scene has rendered its first frames. */
  loaded: boolean
  setLoaded: (loaded: boolean) => void
  /** The visitor clicked through the intro. */
  entered: boolean
  enter: () => void
  /** Page scroll progress from 0 (top) to 1 (bottom), shared with the 3D scene. */
  scrollProgress: number
  setScrollProgress: (progress: number) => void
  soundOn: boolean
  toggleSound: () => void
  setSound: (on: boolean) => void
  /** Where the camera is, or is heading. */
  view: 'hall' | RoomId
  setView: (view: 'hall' | RoomId) => void
  /** The room's text panel is showing. */
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  loaded: false,
  setLoaded: (loaded) => set({ loaded }),
  entered: false,
  enter: () => set({ entered: true }),
  scrollProgress: 0,
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  soundOn: false,
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  setSound: (soundOn) => set({ soundOn }),
  view: 'hall',
  setView: (view) => set({ view }),
  panelOpen: false,
  setPanelOpen: (panelOpen) => set({ panelOpen }),
}))
