import { catmull, ellipsePoints, rect, type Pencil, type Pt } from './pencil'

/**
 * Hand-drawn illustrations, authored on a 1000×1000 grid. Lines go to the ink layer,
 * colour to the paint layer. Swap any of these for your own scanned drawings later.
 */
const { cos, sin, PI } = Math

function leaf(p: Pencil, x: number, y: number, angle: number, len: number, width: number) {
  const [dx, dy] = [cos(angle), sin(angle)]
  const [nx, ny] = [-dy * (width / 2), dx * (width / 2)]
  const tip: Pt = [x + dx * len, y + dy * len]
  const mid: Pt = [x + (dx * len) / 2, y + (dy * len) / 2]
  const a = catmull([[x, y], [mid[0] + nx, mid[1] + ny], tip])
  const b = catmull([tip, [mid[0] - nx, mid[1] - ny], [x, y]])
  p.wash([...a, ...b], '#6fa86f')
  p.stroke(a, { w: 4 })
  p.stroke(b, { w: 4 })
  p.line(x, y, tip[0] - dx * 15, tip[1] - dy * 15, { w: 2.5, alpha: 0.6 })
}

export const drawings = {
  sunHills(p: Pencil) {
    p.wash(ellipsePoints(700, 280, 115, 115), '#f2b84b')
    p.ellipse(700, 280, 110, 110)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2
      p.line(700 + cos(a) * 150, 280 + sin(a) * 150, 700 + cos(a) * 205, 280 + sin(a) * 205, { w: 4 })
    }
    const back = catmull([[40, 640], [220, 500], [420, 580], [600, 450], [960, 620]])
    p.wash([...back, [960, 960], [40, 960]], '#a3c47f')
    p.stroke(back)
    const front = catmull([[40, 770], [300, 650], [560, 740], [780, 640], [960, 720]])
    p.wash([...front, [960, 960], [40, 960]], '#5d9b6a')
    p.stroke(front)
    p.hatch([...front, [960, 960], [40, 960]], { gap: 26 })
    p.curve([[200, 260], [235, 235], [265, 262]], { w: 3.5 })
    p.curve([[265, 262], [295, 232], [330, 255]], { w: 3.5 })
    p.curve([[330, 340], [355, 322], [378, 342]], { w: 3 })
    p.curve([[378, 342], [400, 320], [425, 337]], { w: 3 })
  },

  plant(p: Pencil) {
    const pot = [[355, 650], [645, 650], [605, 920], [395, 920]] as Pt[]
    p.wash(pot, '#d07a52')
    p.poly(pot)
    p.wash(rect(330, 600, 670, 655), '#bf6844')
    p.poly(rect(330, 600, 670, 655))
    p.hatch([[560, 655], [645, 655], [605, 920], [530, 920]], { gap: 16 })
    p.curve([[500, 600], [490, 450], [520, 300], [500, 150]])
    p.curve([[498, 560], [400, 450], [330, 390]])
    p.curve([[505, 520], [620, 430], [690, 340]])
    leaf(p, 500, 230, -PI / 2 - 0.15, 170, 80)
    leaf(p, 340, 395, -PI * 0.85, 160, 70)
    leaf(p, 685, 345, -PI * 0.2, 160, 70)
    leaf(p, 495, 430, -PI * 0.92, 140, 60)
    leaf(p, 515, 330, -PI * 0.1, 150, 60)
  },

  cup(p: Pencil) {
    p.wash(ellipsePoints(500, 840, 330, 70), '#8fb3d1')
    p.ellipse(500, 840, 330, 70)
    const bottom = Array.from({ length: 21 }, (_, i): Pt => {
      const a = (i / 20) * PI
      return [500 + cos(a) * 170, 785 + sin(a) * 40]
    })
    p.wash([[300, 420], [700, 420], ...bottom], '#7fa7c9')
    p.line(300, 420, 330, 785)
    p.line(700, 420, 670, 785)
    p.arc(500, 785, 170, 40, 0, PI)
    p.arc(700, 580, 95, 110, -PI / 2, PI / 2, { w: 5 })
    p.arc(700, 580, 55, 70, -PI / 2, PI / 2, { w: 4 })
    p.wash(ellipsePoints(500, 425, 185, 40), '#7a5236')
    p.ellipse(500, 420, 200, 50)
    p.hatch([[580, 470], [690, 470], [665, 780], [580, 800]], { gap: 16 })
    p.curve([[440, 350], [470, 300], [430, 240], [465, 180]], { w: 3.5, alpha: 0.55 })
    p.curve([[545, 345], [575, 290], [535, 230], [570, 165]], { w: 3.5, alpha: 0.55 })
  },

  house(p: Pencil) {
    p.wash(rect(250, 460, 750, 880), '#efc27a')
    p.poly(rect(250, 460, 750, 880))
    p.wash(rect(615, 220, 690, 380), '#b0503c')
    p.poly(rect(615, 220, 690, 380))
    const roof: Pt[] = [[200, 475], [500, 200], [800, 475]]
    p.wash(roof, '#c95a43')
    p.poly(roof)
    p.hatch(roof, { gap: 20, angle: 0.7 })
    p.curve([[652, 205], [690, 150], [645, 95], [700, 40]], { w: 3.5, alpha: 0.5 })
    p.wash(rect(445, 680, 565, 880), '#5f86b0')
    p.poly(rect(445, 680, 565, 880))
    p.ellipse(540, 785, 9, 9, { w: 4 })
    for (const x of [295, 590]) {
      p.wash(rect(x, 530, x + 115, 630), '#bfe0ef')
      p.poly(rect(x, 530, x + 115, 630))
      p.line(x + 57, 530, x + 57, 630, { w: 3 })
      p.line(x, 580, x + 115, 580, { w: 3 })
    }
    p.line(110, 880, 890, 880)
    for (let x = 140; x < 880; x += 45) p.line(x, 880, x + p.range(-12, 12), 850, { w: 2.5, alpha: 0.6 })
  },

  rocket(p: Pencil) {
    const body: Pt[] = [[500, 110], [600, 300], [610, 620], [390, 620], [400, 300]]
    p.wash(catmull(body, true), '#ece6d8')
    p.curve(body, {}, true)
    p.line(408, 255, 592, 255, { w: 3.5 })
    p.wash(ellipsePoints(500, 380, 62, 62), '#7fb4d6')
    p.ellipse(500, 380, 62, 62)
    p.ellipse(500, 380, 46, 46, { w: 3 })
    const finL: Pt[] = [[400, 500], [290, 690], [400, 640]]
    const finR: Pt[] = [[600, 500], [710, 690], [600, 640]]
    for (const fin of [finL, finR]) {
      p.wash(fin, '#d9573f')
      p.poly(fin)
    }
    const flame: Pt[] = [[425, 630], [500, 910], [575, 630]]
    p.wash(catmull(flame, true), '#f39a3d')
    p.curve(flame, { w: 4 }, true)
    p.wash(catmull([[465, 635], [500, 800], [535, 635]], true), '#f6d04d')
    p.hatch([[540, 300], [600, 300], [610, 620], [545, 620]], { gap: 16 })
    for (const [x, y] of [[180, 200], [820, 260], [230, 520], [800, 560], [150, 820]]) {
      p.line(x - 22, y, x + 22, y, { w: 3 })
      p.line(x, y - 22, x, y + 22, { w: 3 })
    }
  },

  portrait(p: Pencil) {
    const shoulders: Pt[] = [[150, 960], [220, 770], [400, 700], [600, 700], [780, 770], [850, 960]]
    p.wash([...catmull(shoulders), [850, 980], [150, 980]], '#6d93b8')
    p.curve(shoulders)
    p.line(450, 620, 445, 705)
    p.line(550, 620, 555, 705)
    p.wash(ellipsePoints(500, 450, 170, 210), '#eab894')
    p.ellipse(500, 450, 170, 210)
    const hair: Pt[] = [[325, 470], [335, 300], [450, 215], [610, 235], [690, 340], [675, 470], [610, 335], [480, 320], [380, 390]]
    p.wash(catmull(hair, true), '#4b3a2f')
    p.curve(hair, {}, true)
    p.hatch(catmull(hair, true), { gap: 12, alpha: 0.55 })
    p.ellipse(440, 455, 18, 13, { w: 4 })
    p.ellipse(560, 455, 18, 13, { w: 4 })
    p.curve([[405, 410], [440, 398], [475, 410]], { w: 3.5 })
    p.curve([[525, 410], [560, 398], [595, 410]], { w: 3.5 })
    p.curve([[500, 470], [485, 540], [512, 548]], { w: 3.5 })
    p.curve([[435, 590], [500, 625], [565, 590]])
    p.wash(ellipsePoints(410, 540, 35, 22), '#e58f88', 0.6)
    p.wash(ellipsePoints(590, 540, 35, 22), '#e58f88', 0.6)
  },

  envelope(p: Pencil) {
    p.wash(rect(180, 300, 820, 760), '#f3e3c3')
    p.poly(rect(180, 300, 820, 760))
    p.stroke([[180, 300], [500, 565], [820, 300]])
    p.line(180, 760, 420, 525)
    p.line(820, 760, 580, 525)
    p.hatch([[180, 760], [420, 525], [580, 525], [820, 760]], { gap: 20, alpha: 0.3 })
    const heart: Pt[] = [[500, 560], [545, 515], [595, 535], [595, 590], [500, 680], [405, 590], [405, 535], [455, 515]]
    p.wash(catmull(heart, true), '#e0533f')
    p.curve(heart, { w: 4 }, true)
    for (const y of [400, 480, 560]) p.line(50, y, 140, y, { w: 3.5, alpha: 0.6 })
  },

  laptop(p: Pencil) {
    p.wash(rect(255, 225, 745, 605), '#4a5566')
    p.poly(rect(255, 225, 745, 605))
    p.wash(rect(290, 260, 710, 570), '#a9cfe3')
    p.poly(rect(290, 260, 710, 570), { w: 3.5 })
    for (let y = 305, indent = 0; y < 545; y += 38) {
      const x = 325 + indent * 40
      p.line(x, y, x + p.range(90, 280), y, { w: 6, alpha: 0.6, passes: 1 })
      indent = Math.max(0, Math.min(3, indent + Math.round(p.range(-1, 1))))
    }
    const base: Pt[] = [[200, 605], [800, 605], [880, 700], [120, 700]]
    p.wash(base, '#c9ccd2')
    p.poly(base)
    p.poly([[430, 630], [570, 630], [580, 680], [420, 680]], { w: 3 })
    p.hatch([[120, 700], [880, 700], [860, 730], [140, 730]], { gap: 10 })
  },

  paperPlane(p: Pencil) {
    const top: Pt[] = [[790, 290], [240, 470], [470, 545]]
    const bottom: Pt[] = [[790, 290], [470, 545], [530, 720]]
    p.wash(top, '#a9cbe6')
    p.wash(bottom, '#7aa8cf')
    p.poly(top)
    p.poly(bottom)
    p.line(470, 545, 430, 600, { w: 4 })
    p.hatch(bottom, { gap: 15 })
    p.curve([[230, 560], [140, 640], [130, 760], [240, 800], [300, 710], [200, 650], [70, 640]], {
      w: 4,
      alpha: 0.7,
      dash: [22, 18],
      passes: 1,
    })
  },

  hauntedPortrait(p: Pencil) {
    p.wash(rect(40, 40, 960, 960), '#3a332d')
    p.hatch(rect(40, 40, 960, 960), { gap: 13, alpha: 0.45 })
    const dress: Pt[] = [[170, 980], [250, 780], [400, 700], [600, 700], [750, 780], [830, 980]]
    p.wash([...catmull(dress), [830, 990], [170, 990]], '#1d1a1a')
    p.curve(dress)
    p.curve([[420, 700], [500, 760], [580, 700]], { w: 4 })
    p.line(455, 590, 448, 700)
    p.line(545, 590, 552, 700)
    p.wash(ellipsePoints(500, 420, 140, 185), '#d9d2c4')
    p.ellipse(500, 420, 140, 185)
    p.wash(ellipsePoints(500, 215, 90, 60), '#2a2420')
    p.ellipse(500, 215, 90, 60)
    const hair: Pt[] = [[360, 430], [368, 285], [500, 235], [632, 285], [640, 430], [600, 320], [500, 300], [400, 320]]
    p.wash(catmull(hair, true), '#2a2420')
    p.curve(hair, {}, true)
    p.hatch(catmull(hair, true), { gap: 9, alpha: 0.7 })
    // hollow eyes, weeping
    for (const x of [445, 555]) {
      p.wash(ellipsePoints(x, 420, 32, 24), '#0b0909', 1)
      p.ellipse(x, 420, 32, 24, { w: 4 })
      p.hatch(ellipsePoints(x, 420, 30, 22), { gap: 4, alpha: 0.9 })
    }
    p.stroke([[442, 446], [439, 490], [441, 530]], { w: 3, alpha: 0.7 })
    p.stroke([[558, 446], [561, 485]], { w: 3, alpha: 0.7 })
    p.line(462, 525, 538, 527, { w: 3.5 })
    // somebody scratched at the canvas
    p.line(300, 220, 690, 640, { w: 3, alpha: 0.55 })
    p.line(320, 210, 705, 625, { w: 2.5, alpha: 0.45 })
    p.line(340, 205, 715, 605, { w: 2, alpha: 0.4 })
  },

  brokenMirror(p: Pencil) {
    p.wash(ellipsePoints(500, 480, 290, 395), '#5a4029')
    p.ellipse(500, 480, 290, 395, { w: 6 })
    p.wash(ellipsePoints(500, 480, 245, 350), '#77848c', 1)
    p.ellipse(500, 480, 245, 350, { w: 4 })
    // something standing behind you
    const ghost: Pt[] = [[380, 820], [395, 600], [430, 520], [400, 450], [420, 380], [470, 370], [490, 440], [470, 520], [520, 600], [530, 820]]
    p.wash(catmull(ghost, true), '#1c1a1a', 0.55)
    const [cx, cy] = [585, 395]
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + p.range(-0.2, 0.2)
      const pts: Pt[] = [[cx, cy]]
      let [x, y] = [cx, cy]
      for (let k = 0; k < 4; k++) {
        const len = p.range(50, 110)
        const aa = a + p.range(-0.35, 0.35)
        x += Math.cos(aa) * len
        y += Math.sin(aa) * len
        pts.push([x, y])
      }
      p.stroke(pts, { w: 2.8, passes: 1, jitter: 1, overshoot: 0 })
    }
    p.ellipse(cx, cy, 45, 40, { w: 3 })
    p.ellipse(cx, cy, 110, 95, { w: 2.5, alpha: 0.6 })
    p.hatch([[700, 200], [760, 360], [760, 640], [700, 800]], { gap: 12, alpha: 0.35 })
  },

  candle(p: Pencil) {
    p.wash(ellipsePoints(500, 330, 330, 330), '#f3c66b', 0.25)
    p.hatch(rect(40, 40, 960, 960), { gap: 14, alpha: 0.3 })
    p.wash(ellipsePoints(500, 330, 230, 230), '#efe0b4', 0.5)
    p.wash(ellipsePoints(500, 870, 190, 45), '#7a6a4c')
    p.ellipse(500, 870, 190, 45)
    p.poly([[470, 770], [530, 770], [545, 860], [455, 860]], { w: 4 })
    p.wash(ellipsePoints(500, 770, 110, 26), '#8f7d58')
    p.ellipse(500, 770, 110, 26, { w: 4 })
    p.wash(rect(445, 430, 555, 770), '#e6dcc4')
    p.line(445, 430, 445, 770)
    p.line(555, 430, 555, 770)
    p.ellipse(500, 430, 55, 14, { w: 3.5 })
    for (const [x, len] of [[455, 110], [500, 60], [540, 170]]) {
      p.wash(catmull([[x - 12, 430], [x - 10, 430 + len], [x, 430 + len + 18], [x + 10, 430 + len], [x + 12, 430]], true), '#ece4d0')
      p.curve([[x - 12, 432], [x - 10, 430 + len], [x, 430 + len + 18], [x + 10, 430 + len], [x + 12, 432]], { w: 3 })
    }
    p.line(500, 418, 502, 385, { w: 3 })
    const flame: Pt[] = [[500, 250], [535, 340], [500, 395], [465, 340]]
    p.wash(catmull(flame, true), '#f3a33c', 1)
    p.wash(catmull([[500, 300], [518, 350], [500, 385], [482, 350]], true), '#f8e27a', 1)
    p.curve(flame, { w: 3.5 }, true)
    p.hatch([[530, 440], [555, 440], [555, 770], [530, 770]], { gap: 10, alpha: 0.5 })
  },

  teddy(p: Pencil) {
    const fur = '#8a6a4c'
    for (const [x, y, rx, ry] of [[380, 215, 58, 58], [620, 215, 58, 58], [500, 640, 190, 215], [295, 600, 70, 120], [705, 600, 70, 120], [385, 850, 85, 62], [615, 850, 85, 62], [500, 335, 150, 140]]) {
      p.wash(ellipsePoints(x, y, rx, ry), fur)
      p.ellipse(x, y, rx, ry)
    }
    p.wash(ellipsePoints(500, 395, 62, 45), '#c4a27c')
    p.ellipse(500, 395, 62, 45, { w: 3.5 })
    p.wash(ellipsePoints(500, 375, 20, 14), '#1a1414', 1)
    p.stroke([[470, 420], [500, 432], [530, 420]], { w: 3 })
    // one button eye, one stitched shut
    p.wash(ellipsePoints(445, 310, 18, 18), '#111', 1)
    p.ellipse(445, 310, 18, 18, { w: 3.5 })
    p.line(538, 292, 572, 326, { w: 4 })
    p.line(572, 292, 538, 326, { w: 4 })
    // torn seam with stuffing spilling out
    p.stroke([[560, 540], [590, 600], [570, 660], [600, 720]], { w: 3 })
    for (let y = 550; y < 720; y += 22) p.line(565 + (y - 550) * 0.2, y, 600 + (y - 550) * 0.2, y + 8, { w: 2, alpha: 0.6 })
    p.wash(ellipsePoints(615, 640, 40, 50), '#ece6da', 1)
    p.ellipse(615, 640, 40, 50, { w: 2.5, alpha: 0.6 })
    p.hatch(ellipsePoints(560, 650, 140, 200), { gap: 14, alpha: 0.35 })
  },

  moonCrows(p: Pencil) {
    p.wash(rect(40, 40, 960, 960), '#2b2f3d')
    p.wash(ellipsePoints(650, 300, 175, 175), '#e8e2c8', 1)
    p.ellipse(650, 300, 170, 170)
    p.wash(ellipsePoints(600, 260, 30, 25), '#c9c2a6')
    p.wash(ellipsePoints(700, 350, 40, 30), '#c9c2a6')
    p.hatch(rect(40, 520, 960, 960), { gap: 12, alpha: 0.4 })
    p.curve([[40, 720], [300, 650], [520, 610], [800, 640]], { w: 14 })
    p.curve([[300, 655], [360, 560], [420, 520]], { w: 7 })
    p.curve([[620, 620], [700, 540], [720, 470]], { w: 6 })
    p.curve([[520, 612], [560, 700], [640, 760]], { w: 6 })
    for (const [x, y, s] of [[250, 610, 1], [470, 570, 1.15], [700, 600, 0.9]] as [number, number, number][]) {
      const body = ellipsePoints(x, y, 45 * s, 30 * s)
      p.wash(body, '#0c0c0e', 1)
      p.wash(ellipsePoints(x + 38 * s, y - 28 * s, 20 * s, 18 * s), '#0c0c0e', 1)
      p.wash([[x + 55 * s, y - 32 * s], [x + 85 * s, y - 25 * s], [x + 55 * s, y - 20 * s]], '#0c0c0e', 1)
      p.wash([[x - 40 * s, y - 5 * s], [x - 95 * s, y + 25 * s], [x - 40 * s, y + 15 * s]], '#0c0c0e', 1)
      p.ellipse(x, y, 45 * s, 30 * s, { w: 3 })
      p.wash(ellipsePoints(x + 44 * s, y - 31 * s, 4, 4), '#e8e2c8', 1)
    }
  },

  key(p: Pencil) {
    const brass = '#9b7b3f'
    p.wash(ellipsePoints(290, 500, 120, 120), brass, 0.9, ellipsePoints(290, 500, 60, 60))
    p.ellipse(290, 500, 120, 120)
    p.ellipse(290, 500, 60, 60, { w: 4 })
    p.wash(rect(405, 478, 820, 522), brass)
    p.poly(rect(405, 478, 820, 522))
    for (const [x, h] of [[700, 90], [760, 60], [800, 110]]) {
      p.wash(rect(x - 18, 522, x + 18, 522 + h), brass)
      p.poly(rect(x - 18, 522, x + 18, 522 + h), { w: 4 })
    }
    p.hatch(rect(405, 505, 820, 522), { gap: 9, alpha: 0.5 })
    p.curve([[290, 380], [260, 260], [300, 170]], { w: 3 })
    const tag: Pt[] = [[250, 90], [370, 110], [355, 230], [235, 210]]
    p.wash(tag, '#d9ceb2')
    p.poly(tag, { w: 4 })
    p.text('13', 303, 160, 80, { rot: 0.15 })
  },
}

export type DrawingId = keyof typeof drawings
