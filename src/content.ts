import type { DrawingId } from './lib/drawings'

/** Everything a visitor reads lives here. Edit freely. */
export const site = {
  name: 'Your Name',
  role: 'creative developer',
  email: 'hello@yourname.dev',
}

/** Pictures hanging in the hallway. `z` is how far down the hall (negative = further). */
export const hallway: { drawing: DrawingId; caption: string; side: 'left' | 'right'; z: number }[] = [
  { drawing: 'hauntedPortrait', caption: 'grandma', side: 'left', z: -7.5 },
  { drawing: 'brokenMirror', caption: "don't look back", side: 'right', z: -8.5 },
  { drawing: 'candle', caption: 'the last candle', side: 'right', z: -14.5 },
  { drawing: 'teddy', caption: 'play with me', side: 'left', z: -16.5 },
  { drawing: 'moonCrows', caption: 'they are watching', side: 'right', z: -19 },
  { drawing: 'key', caption: 'find the key', side: 'left', z: -26 },
  { drawing: 'hauntedPortrait', caption: 'grandpa', side: 'right', z: -28 },
]

/** Things scrawled on the hallway walls. */
export const scrawls: { text: string; side: 'left' | 'right'; z: number; y: number }[] = [
  { text: 'GET OUT', side: 'left', z: -3, y: 1.4 },
  { text: 'turn back', side: 'right', z: -23.5, y: 2.3 },
  { text: 'she sees you', side: 'left', z: -31, y: 1.2 },
]

export const work: { title: string; year: string; blurb: string; drawing: DrawingId; href: string }[] = [
  {
    title: 'Project one',
    year: '2026',
    blurb: 'A short line about what you built and why it was interesting.',
    drawing: 'laptop',
    href: '#',
  },
  {
    title: 'Project two',
    year: '2025',
    blurb: 'Another project. Mention the tech, the client or the result.',
    drawing: 'rocket',
    href: '#',
  },
  {
    title: 'Project three',
    year: '2024',
    blurb: 'A side project, experiment or open-source tool.',
    drawing: 'paperPlane',
    href: '#',
  },
]

export const about = {
  card: [`I'm ${site.name}`, 'I build things', 'that go bump'],
  paragraphs: [
    "I'm a creative developer who likes turning ideas into interactive experiences.",
    'I work with React, Three.js, shaders and a lot of pencil sketches.',
    'Currently open to freelance projects and collaborations.',
  ],
}

export const contact = {
  card: ['write to me...', site.email],
  links: [
    { label: 'GitHub', href: 'https://github.com/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'X / Twitter', href: 'https://x.com/' },
  ],
}
