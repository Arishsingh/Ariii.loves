// Shared by every surface, in three variants:
//   ENV     walls, floors and ceilings: textures picked by facing, revealed by distance,
//           shaded with pencil hatching in corners
//   SHADOW  the hatched shadow a frame casts on the wall
//   default a single sketch, revealed by uReveal and painted on hover
// Everything is then lit: a flashlight from the camera, flickering bulbs, moonlight outside, fog.

uniform float uTime;
uniform vec3 uCam;
uniform vec3 uFlashDir;
uniform float uFlicker;
uniform vec3 uFogColor;
uniform vec3 uLamps[LAMP_COUNT];
uniform vec3 uPaperColor;
uniform vec3 uInkColor;
uniform sampler2D uInk;
uniform sampler2D uPaint;

#if defined(ENV)
uniform sampler2D uInkFloor;
uniform sampler2D uPaintFloor;
uniform sampler2D uInkCeil;
uniform sampler2D uPaintCeil;
uniform vec2 uTile;
uniform vec2 uRevealDist;
uniform float uHeight;
uniform vec4 uPlans[PLAN_COUNT];
#elif defined(SHADOW)
uniform vec2 uRevealDist;
uniform vec2 uSize;
uniform vec2 uCaster;
#else
uniform float uReveal;
uniform float uHover;
uniform vec2 uPointer;
uniform float uOpaque;
// 0: lit by the scene, 1: glows steadily (the moon), 2: glows and flickers (bulbs, windows)
uniform float uGlow;
#endif

varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vNormalW;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

// 0 until the pencil reaches this pixel, then 1. `order` (0..1) is when it gets here.
float revealMask(float progress, float order) {
  float w = 0.08;
  return smoothstep(order, order + w, progress * (1.0 + w));
}

// Hand-drawn "boil": lines shift slightly a few times per second, like animation drawn frame by frame.
vec2 boil(vec2 uv) {
  float tick = floor(uTime * 5.0);
  return (vec2(noise(uv * 9.0 + tick * 3.1), noise(uv * 9.0 + tick * 1.7 + 11.0)) - 0.5) * 0.003;
}

// Paper tooth: graphite catches on the ridges and skips the valleys.
// `p` is in texels; the grain fades out where it would be finer than a pixel.
float tooth(vec2 p) {
  float t = noise(p * 0.5) * 0.6 + noise(p * 0.13 + 7.0) * 0.4;
  float fine = 1.0 - smoothstep(0.6, 1.6, fwidth(p.x));
  return mix(0.65, smoothstep(0.15, 0.85, t), fine);
}

// One family of parallel hatch lines; `coord` crosses the lines, `along` runs down them.
float hatchLine(float coord, float along, float width) {
  float aa = fwidth(coord);
  float d = abs(fract(coord) - 0.5);
  float line = 1.0 - smoothstep(width - aa, width + aa, d);
  // each line is broken into separate strokes of varying weight
  float id = floor(coord);
  float gaps = smoothstep(0.3, 0.38, noise(vec2(along * 0.09, id * 1.7)));
  return line * gaps * (0.5 + 0.5 * hash(vec2(id, 9.0)));
}

// Pencil hatching for a tone from 0 (blank paper) to 1 (dark). `q` is in line spacings.
float hatch(vec2 q, float tone) {
  float wob = (noise(q * 0.08) - 0.5) * 0.8;
  float c1 = q.x * 0.8 + q.y * 0.6 + wob;
  float c2 = q.x * 0.8 - q.y * 0.6 + wob;
  float h1 = hatchLine(c1, q.x * 0.6 - q.y * 0.8, clamp(tone * 0.3, 0.0, 0.16)) * smoothstep(0.15, 0.25, tone);
  float h2 = hatchLine(c2, q.x * 0.6 + q.y * 0.8, clamp((tone - 0.45) * 0.3, 0.0, 0.14)) * step(0.45, tone);
  // far away the lines get finer than a pixel; swap in an even grey of the same weight
  float fade = smoothstep(0.25, 0.6, fwidth(c1));
  return mix(max(h1, h2), tone * 0.25, fade);
}

float lampLight(vec3 p) {
  float l = 0.0;
  for (int i = 0; i < LAMP_COUNT; i++) {
    vec3 d = p - uLamps[i];
    l += exp(-dot(d, d) / 7.0);
  }
  return l * uFlicker;
}

// How much light reaches a point: flashlight + bulbs + moonlight (outside only).
float lighting(vec3 p, vec3 n) {
  vec3 toP = p - uCam;
  float d = max(length(toP), 0.001);
  vec3 dir = toP / d;
  float cosA = dot(dir, uFlashDir);
  float facing = 0.35 + 0.65 * abs(dot(n, dir));
  float beam = smoothstep(0.86, 0.96, cosA) * 1.7 + smoothstep(0.55, 0.9, cosA) * 0.25;
  float flash = beam * facing / (1.0 + d * d * 0.045);
  float moon = 0.2 * smoothstep(-0.5, 0.5, p.z);
  return flash + lampLight(p) * 0.75 + moon + 0.025;
}

// Dim light turns cold and blue, bright light stays warm; then the fog rolls in.
vec3 light(vec3 col, float l, vec3 p) {
  vec3 cold = col * vec3(0.5, 0.58, 0.8);
  vec3 lit = mix(cold, col * vec3(1.05, 0.97, 0.85), smoothstep(0.15, 0.7, l)) * min(l, 1.25);
  float d = distance(p, uCam);
  float fog = smoothstep(4.0, 24.0, d) * mix(0.55, 0.9, smoothstep(-0.5, 0.5, p.z));
  return mix(lit, uFogColor, fog);
}

#ifdef ENV
bool onPlan(vec3 p, vec4 b) {
  return p.x > b.x - 0.02 && p.x < b.z + 0.02 && p.z > b.y - 0.02 && p.z < b.w + 0.02;
}

// How tucked into a corner a point is: 0 out in the open, 1 right in the crease.
float cornerShade(vec3 p, vec3 n) {
  // A wall between two spaces belongs to the one the camera is standing in.
  vec4 b = uPlans[0];
  bool found = false;
  for (int i = 0; i < PLAN_COUNT; i++) {
    if (!found && onPlan(uCam, uPlans[i]) && onPlan(p, uPlans[i])) { b = uPlans[i]; found = true; }
  }
  for (int i = 0; i < PLAN_COUNT; i++) {
    if (!found && onPlan(p, uPlans[i])) { b = uPlans[i]; found = true; }
  }
  float dx = min(p.x - b.x, b.z - p.x);
  float dz = min(p.z - b.y, b.w - p.z);
  float dy = min(p.y, uHeight - p.y);
  float d = abs(n.y) > 0.5 ? min(dx, dz) : abs(n.x) > 0.5 ? min(dy, dz) : min(dy, dx);
  float s = 1.0 - smoothstep(0.0, 0.6, d);
  return s * s;
}
#endif

void main() {
#if defined(SHADOW)
  // Soft-edged shadow of the frame, offset down and to the right, drawn in hatching.
  vec2 local = (vUv - 0.5) * uSize;
  float edge = length(max(abs(local) - uCaster * 0.5, 0.0));
  float tone = (1.0 - smoothstep(0.0, 0.1, edge)) * 0.6;
  float progress = 1.0 - smoothstep(uRevealDist.x, uRevealDist.y, distance(vWorld, uCam));
  float a = hatch(local * 38.0, tone) * progress * 0.8 * tooth(local * 900.0);
  if (a < 0.01) discard;
  gl_FragColor = linearToOutputTexel(vec4(uInkColor, a));
#else

#ifdef ENV
  vec3 n = normalize(vNormalW);
  // world position on this surface's plane, in metres
  vec2 plane = abs(n.y) > 0.5 ? vWorld.xz : abs(n.x) > 0.5 ? vWorld.zy : vWorld.xy;
  vec2 uv = abs(n.y) > 0.5 ? plane / uTile.x : plane / uTile;
  uv += boil(uv);
  vec4 ink;
  vec4 paint;
  if (abs(n.y) > 0.5) {
    ink = n.y > 0.0 ? texture2D(uInkFloor, uv) : texture2D(uInkCeil, uv);
    paint = n.y > 0.0 ? texture2D(uPaintFloor, uv) : texture2D(uPaintCeil, uv);
  } else {
    ink = texture2D(uInk, uv);
    paint = texture2D(uPaint, uv);
  }
  float d = distance(vWorld, uCam);
  float progress = 1.0 - smoothstep(uRevealDist.x, uRevealDist.y, d);
  float order = clamp((fbm(uv * 3.0) - 0.2) / 0.6, 0.0, 1.0);
  float inkMask = revealMask(progress, order);
  // colour follows a little behind the pencil
  float paintMask = revealMask(progress, min(1.0, order + 0.15));
  vec2 texel = plane * 256.0;
#else
  vec3 n = normalize(vNormalW);
  vec2 uv = vUv + boil(vUv);
  vec4 ink = texture2D(uInk, uv);
  vec4 paint = texture2D(uPaint, uv);
  // drawn roughly left to right, top to bottom, with a ragged front
  float order = clamp(vUv.x * 0.45 + (1.0 - vUv.y) * 0.25 + (fbm(vUv * 5.0) - 0.2) * 0.5, 0.0, 1.0);
  float inkMask = revealMask(uReveal, order);
  float radius = uHover * 1.5;
  float wobble = (fbm(vUv * 6.0 + 3.0) - 0.5) * 0.3;
  float paintMask = (1.0 - smoothstep(radius - 0.2, radius, distance(vUv, uPointer) + wobble))
    * step(0.001, uHover) * inkMask;
  vec2 texel = vUv * vec2(textureSize(uInk, 0));
#endif

  float grain = tooth(texel);
  vec3 paper = uPaperColor * (1.0 - (fbm(texel * 0.004) - 0.5) * 0.08) * (1.0 - (1.0 - grain) * 0.05);

  // watercolour granulates into the paper's valleys
  float pa = paint.a * paintMask * mix(0.7, 1.0, grain);
  vec3 col = mix(paper, paint.rgb, pa);

#ifdef ENV
  // Shade like an artist would: heavy hatching into every corner.
  float tone = cornerShade(vWorld, n) * 0.8 + (n.y < -0.5 ? 0.15 : 0.0);
  float shade = hatch(plane * 30.0, clamp(tone, 0.0, 1.0)) * inkMask * 0.6;
  col = mix(col, uInkColor, shade * grain);
#endif

  float ia = ink.a * inkMask * mix(0.5, 1.0, grain);
  col = mix(col, uInkColor, ia);

#ifdef ENV
  gl_FragColor = vec4(mix(uFogColor, light(col, lighting(vWorld, n), vWorld), paintMask), 1.0);
#else
  if (uGlow > 0.5) {
    col *= uGlow > 1.5 ? 0.35 + 0.75 * uFlicker : 1.0;
  } else {
    // like the walls, a sketch emerges from the dark as the pencil reaches it
    col = mix(uFogColor, light(col, lighting(vWorld, n), vWorld), revealMask(uReveal, order * 0.85));
  }
  float alpha = max(uOpaque, max(ia, paint.a * paintMask));
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
#endif

  gl_FragColor = linearToOutputTexel(gl_FragColor);
#endif
}
