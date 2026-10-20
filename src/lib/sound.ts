import { Howl, Howler } from 'howler'
import { useAppStore } from '../store/useAppStore'

// Drop .mp3 files into public/sounds and register them here; a file overrides
// the synthesized placeholder of the same name, e.g.
// slam: new Howl({ src: ['/sounds/slam.mp3'], volume: 0.8 }),
const sounds: Record<string, Howl> = {}

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Everything synthesized goes through one gain node that follows the sound toggle. */
function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = useAppStore.getState().soundOn ? 1 : 0
    master.connect(ctx.destination)
    useAppStore.subscribe((s) => master!.gain.setTargetAtTime(s.soundOn ? 1 : 0, ctx!.currentTime, 0.1))
  }
  return { ctx, out: master! }
}

function noiseBuffer(seconds: number, shape: (i: number, length: number) => number) {
  const { ctx } = audio()
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * shape(i, length)
  return buffer
}

/** Filtered noise burst. `crackle` is the chance per sample of a fibre snapping. */
function noiseBurst(duration: number, type: BiquadFilterType, from: number, to: number, volume: number, crackle = 0) {
  const { ctx, out } = audio()
  let snap = 0
  const source = ctx.createBufferSource()
  source.buffer = noiseBuffer(duration, (i, n) => {
    if (Math.random() < crackle) snap = Math.random()
    snap *= 0.996
    return (0.3 + snap) * Math.min(1, i / 300) * (1 - i / n)
  })
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.Q.value = 0.8
  filter.frequency.setValueAtTime(from, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration)
  const gain = ctx.createGain()
  gain.gain.value = volume
  source.connect(filter).connect(gain).connect(out)
  source.start()
}

function tone(freq: number, duration: number, volume: number, type: OscillatorType = 'sine', glideTo = freq) {
  const { ctx, out } = audio()
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + Math.min(0.08, duration / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
  osc.connect(gain).connect(out)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

/** A hinge groaning: a buzzy tone whose pitch wanders, through a narrow filter. */
function creak(duration: number) {
  const { ctx, out } = audio()
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  const t = ctx.currentTime
  osc.frequency.setValueAtTime(70, t)
  for (let s = 0.1; s < duration; s += 0.1) osc.frequency.linearRampToValueAtTime(60 + Math.random() * 90, t + s)
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 6
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.15)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(filter).connect(gain).connect(out)
  osc.start()
  osc.stop(t + duration)
}

const synths: Record<string, () => void> = {
  tear: () => noiseBurst(0.9, 'bandpass', 900, 3400, 0.7, 0.012),
  creak: () => creak(1.6),
  slam: () => {
    noiseBurst(0.5, 'lowpass', 900, 120, 1.2)
    tone(70, 0.6, 0.9, 'sine', 35)
  },
  step: () => noiseBurst(0.13, 'lowpass', 500 + Math.random() * 200, 150, 0.35),
  sting: () => {
    for (const f of [220, 233, 311, 466]) tone(f, 2.2, 0.12, 'sawtooth', f * 1.06)
    noiseBurst(1.4, 'highpass', 2000, 6000, 0.25)
  },
}

/** Wind and a low drone that loop for the whole visit. */
export function startAmbience() {
  const { ctx, out } = audio()
  const wind = ctx.createBufferSource()
  wind.buffer = noiseBuffer(6, () => 0.5)
  wind.loop = true
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = 'bandpass'
  windFilter.frequency.value = 400
  windFilter.Q.value = 0.6
  // a slow wobble in the filter makes the wind gust
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.08
  const lfoDepth = ctx.createGain()
  lfoDepth.gain.value = 250
  lfo.connect(lfoDepth).connect(windFilter.frequency)
  const windGain = ctx.createGain()
  windGain.gain.value = 0.18
  wind.connect(windFilter).connect(windGain).connect(out)

  const drone = ctx.createGain()
  drone.gain.value = 0.05
  drone.connect(out)
  for (const f of [55, 55.7, 82.4]) {
    const osc = ctx.createOscillator()
    osc.frequency.value = f
    osc.connect(drone)
    osc.start()
  }
  wind.start()
  lfo.start()
}

export function playSound(name: string) {
  if (sounds[name]) {
    if (useAppStore.getState().soundOn) sounds[name].play()
  } else if (ctx || name === 'tear') {
    synths[name]?.()
  }
}

export function setMuted(muted: boolean) {
  Howler.mute(muted)
}
