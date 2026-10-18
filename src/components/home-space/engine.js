// F · Blend. D's pile of prints and its editorial arrangements, set in E's
// room: every work is a real print hanging in 3D, drifting a little. In the
// hero you can look around and walk into the pile; a print you point at holds
// still. Scrolling then lays the same prints out as D's scenes (forms,
// inquiries, connections), and the last one is E's line bending into a circle.
import {
  BufferAttribute, BufferGeometry, Color, ColorManagement, DynamicDrawUsage, Euler, Line, LineBasicMaterial,
  LineSegments, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, NoColorSpace,
  PerspectiveCamera, PlaneGeometry, Quaternion, Raycaster, Scene, ShaderMaterial, Texture, Vector2, Vector3,
  WebGLRenderer,
} from "three"


// Colours are the system's hex values, used as they are.
ColorManagement.enabled = false

// The homepage as one room. Every published work is a print hanging in 3D;
// scrolling lays the same prints out as the five ideas, and the reader can
// look around and walk in each. Nothing moves unless the reader moves it.
//
// createHomeSpace(root, data, { navigate }) wires the room into the markup
// rendered by HomeSpace (elements are found by data-hs) and returns a
// function that takes it all down again.
export function createHomeSpace(root, DATA, { navigate }) {
const $ = name => root.querySelector(`[data-hs="${name}"]`)
const cleanups = []
const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)) }
let destroyed = false

const HEX = { ground: "#11100f", meta: "#91897d", rule: "#5b5d5d", essay: "#c96a4b", reflection: "#c08ae8", data: "#6ecb78", photography: "#4fbbd4" }
const CSS = { essay: "var(--hs-essay)", reflection: "var(--hs-reflection)", data: "var(--hs-data)", photography: "var(--hs-photography)" }
const NAME = { essay: "Essay", reflection: "Reflection", data: "Data", photography: "Photograph" }
const INQUIRIES = ["systems", "reality", "agency", "power", "connection", "memory"]
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const DEG = Math.PI / 180
const FOV = 36
const TAN_V = Math.tan((FOV / 2) * DEG)
const D = 20 // the camera's home distance from the picture plane
const COVER_W = 3, PHOTO_LONG = 1.4 // world sizes in the time scene

const mqNarrow = matchMedia("(max-width: 860px)")
const mqReduced = matchMedia("(prefers-reduced-motion: reduce)")
let reduced = mqReduced.matches

// The mockup's review toggles, settled: the pile as prints, no mesh.
const settings = { pile: "prints", mesh: "off" }

// ---- Randomness -------------------------------------------------------------
const seeded = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let v = Math.imul(s ^ (s >>> 15), 1 | s); v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v; return ((v ^ (v >>> 14)) >>> 0) / 4294967296 }
const rand = seeded(20261018)
const between = (a, b) => a + (b - a) * rand()
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const clamp01 = v => clamp(v, 0, 1)
const lerp = (a, b, t) => a + (b - a) * t
const smoothstep = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t) }
const smooth = t => t * t * (3 - 2 * t)
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// ---- The works ----------------------------------------------------------------
const writings = DATA.writings
const photographs = DATA.photographs
const nodes = [...writings, ...photographs].map(w => ({ ...w, form: w.format, frames: w.frameCount || 1, place: w.location || null }))
const N = nodes.length
const W_COUNT = writings.length
const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
const indexById = new Map(nodes.map((n, i) => [n.id, i]))
const photoIdx = nodes.map((n, i) => (i >= W_COUNT ? i : -1)).filter(i => i >= 0)
const writingsOf = test => nodes.map((n, i) => (i < W_COUNT && test(n) ? i : -1)).filter(i => i >= 0)
nodes.forEach(n => {
  n.w3 = n.kind === "writing" ? COVER_W : n.ratio >= 1 ? PHOTO_LONG : PHOTO_LONG * n.ratio
  n.phase = [between(0, 6.28), between(0, 6.28), between(0, 6.28), between(0, 6.28)]
  n.tilt = new Quaternion().setFromEuler(new Euler(between(-2, 2) * DEG, between(-5, 5) * DEG, 0))
  n.colour = new Color(HEX[n.form])
  n.depth = rand() // where it hangs in the pile, front to back
})

const markSvg = form => ({
  essay: '<svg width="14" height="9"><g stroke="var(--hs-essay)" stroke-width="1.6"><path d="M1 1.5h12M1 4.5h12M1 7.5h12"/></g></svg>',
  reflection: '<svg width="14" height="9"><g stroke="var(--hs-reflection)" stroke-width="1.6"><path d="M1 2.5h12M1 6.5h12"/></g></svg>',
  data: '<svg width="14" height="9"><g stroke="var(--hs-data)" stroke-width="1.6"><path d="M1 1.5h12M1 4.5h12M1 7.5h7"/></g><circle cx="12" cy="7.5" r="1.5" fill="var(--hs-data)"/></svg>',
  photography: '<svg width="11" height="11"><path d="M.75 4V.75H4M7 .75h3.25V4M10.25 7v3.25H7M4 10.25H.75V7" stroke="var(--hs-photography)" stroke-width="1.4" fill="none"/></svg>',
})[form]

// ---- D's arrangements, in screen pixels ------------------------------------------
function geometry() {
  const W = innerWidth, H = innerHeight, narrow = mqNarrow.matches
  // The text column's own inset, so the field starts where the words end.
  const inset = parseFloat(getComputedStyle($("text")).paddingLeft) || clamp(W * 0.07, 20, 100)
  if (narrow) {
    const r = { x0: 14, x1: W - 14, y0: 46, y1: H * 0.63 }
    return { W, H, narrow, inset, r, S: Math.min((r.x1 - r.x0) / 560, (r.y1 - r.y0) / 520) }
  }
  const column = Math.min(330, W * 0.26)
  const r = { x0: inset + column + 56, x1: W - inset * 0.4, y0: 40, y1: H - 64 }
  return { W, H, narrow, inset, r, S: Math.min((r.x1 - r.x0) / 920, (r.y1 - r.y0) / 780) }
}

// Best-candidate placement: each rectangle takes the spot that overlaps what's
// already placed the least, so the pile fills evenly.
function place(items, box, rnd, pad, tries = 220) {
  const placed = [], out = {}
  for (const it of items) {
    let best = null, bestScore = Infinity
    for (let k = 0; k < tries; k++) {
      const x = box.x0 + it.w / 2 + rnd() * Math.max(1, box.x1 - box.x0 - it.w)
      const y = box.y0 + it.h / 2 + rnd() * Math.max(1, box.y1 - box.y0 - it.h)
      let score = 0
      for (const p of placed) {
        const ox = Math.min(x + it.w / 2 + pad, p.x + p.w / 2) - Math.max(x - it.w / 2 - pad, p.x - p.w / 2)
        const oy = Math.min(y + it.h / 2 + pad, p.y + p.h / 2) - Math.max(y - it.h / 2 - pad, p.y - p.h / 2)
        if (ox > 0 && oy > 0) score += ox * oy * (p.weight || 1)
      }
      if (score < bestScore) { bestScore = score; best = { x, y } }
      if (score === 0 && k > 30) break
    }
    placed.push({ ...best, w: it.w, h: it.h, weight: it.weight })
    out[it.id] = best
  }
  return out
}
function mosaic(list, x0, width, y0, rowH, gap) {
  const out = {}
  let row = [], rowW = 0, y = y0
  const flush = last => {
    const scale = last ? 1 : (width - gap * (row.length - 1)) / rowW
    let x = x0
    for (const p of row) { const w = p.ratio * rowH * scale; out[p.id] = { x: x + w / 2, y: y + rowH * scale / 2, w }; x += w + gap }
    y += rowH * scale + gap; row = []; rowW = 0
  }
  for (const p of list) { row.push(p); rowW += p.ratio * rowH; if (rowW + gap * (row.length - 1) >= width) flush(false) }
  if (row.length) flush(true)
  return { pos: out, bottom: y - gap }
}
const mosaicFit = (list, x0, width, y0, maxH, startH, gap) => {
  for (let h = startH; h > 12; h -= 1) { const m = mosaic(list, x0, width, y0, h, gap); if (m.bottom - y0 <= maxH) return m }
  return mosaic(list, x0, width, y0, 12, gap)
}

function pile(g, hero) {
  const { r, S, W, H, narrow } = g
  const rnd = seeded(hero ? 7 : 19)
  const big = hero && settings.pile === "prints"
  const box = hero ? (narrow ? { x0: -24, x1: W + 24, y0: 70, y1: H * 0.43 } : { x0: g.inset + 360, x1: W + 70, y0: -30, y1: H + 20 }) : r
  const covW = (hero ? 270 : 230) * S * (narrow ? 1.25 : 1)
  const items = [
    ...writings.map(w => ({ id: w.id, w: covW * (0.9 + rnd() * 0.25), weight: 3 })),
    ...photographs.map(p => { const h = (big ? 82 + rnd() * 46 : 56 + rnd() * 34) * S * (narrow ? 1.1 : 1); return { id: p.id, h, w: Math.min(h * p.ratio, h * 1.55) } }),
  ].map(it => ({ ...it, h: it.h || it.w / 1.5 }))
  const pos = place(items, box, rnd, big ? -6 : 8 * S)
  const out = {}
  for (const it of items) {
    const w = byId[it.id], isW = w.kind === "writing"
    out[it.id] = { x: pos[it.id].x, y: pos[it.id].y, w: isW ? it.w : it.h * w.ratio, r: big ? (rnd() - 0.5) * (isW ? 5 : 9) : 0 }
  }
  return { pos: out, labels: [] }
}

function forms(g) {
  if (g.narrow) return formsNarrow(g)
  const { r, S } = g
  const rw = r.x1 - r.x0, gap = 12 * S, G = 44 * S, labH = 30 * S
  const cw = Math.min(250 * S, (rw - 3 * gap - 2 * G) / 4.45), ch = cw / 1.5
  const ty = r.y0 + labH + 10, capH = 78 * S
  const pos = {}, labels = []
  const essays = writings.filter(w => w.format === "essay"), data = writings.filter(w => w.format === "data")
  essays.forEach((w, i) => { pos[w.id] = { x: r.x0 + (i % 3) * (cw + gap) + cw / 2, y: ty + Math.floor(i / 3) * (ch + capH) + ch / 2, w: cw, cap: true } })
  const xr = r.x0 + 3 * cw + 2 * gap + G, xd = xr + 0.45 * cw + G
  data.forEach((w, i) => { pos[w.id] = { x: xd + cw / 2, y: ty + i * (ch + capH) + ch / 2, w: cw, cap: true } })
  const group = (x, y, form, n, plural, z = Z_FRONT) => labels.push({ x, y: y - labH, z, cls: "group", html: `<b style="color:${CSS[form]};font-weight:500">${plural}</b><span>${n}</span>` })
  group(r.x0, ty, "essay", essays.length, "Essays")
  group(xr, ty, "reflection", 0, "Reflections")
  labels.push({ x: xr, y: ty, z: Z_FRONT, cls: "slot", w: 0.45 * cw, h: 2 * ch + capH - 18 * S, html: "Nothing here yet" })
  group(xd, ty, "data", data.length, "Data")
  const py = ty + 2 * (ch + capH) + 8 * S + labH
  group(r.x0, py, "photography", photographs.length, "Photography", Z_BACK)
  Object.assign(pos, mosaicFit(photographs, r.x0, rw, py, r.y1 - py, 70 * S, 6 * S).pos)
  return { pos, labels }
}
function formsNarrow(g) {
  const { r } = g
  const rw = r.x1 - r.x0, gap = 7, labH = 20
  const pos = {}, labels = []
  const cw = (rw - 2 * gap) / 3, ch = cw / 1.5
  const group = (x, y, form, n, plural, z = Z_FRONT) => labels.push({ x, y: y - labH + 4, z, cls: "group", html: `<b style="color:${CSS[form]};font-weight:500">${plural}</b><span>${n}</span>` })
  const essays = writings.filter(w => w.format === "essay"), data = writings.filter(w => w.format === "data")
  let y = r.y0 + labH
  group(r.x0, y, "essay", essays.length, "Essays")
  essays.forEach((w, i) => { pos[w.id] = { x: r.x0 + (i % 3) * (cw + gap) + cw / 2, y: y + Math.floor(i / 3) * (ch + gap) + ch / 2, w: cw } })
  y += 2 * (ch + gap) + labH + 6
  group(r.x0, y, "data", data.length, "Data")
  data.forEach((w, i) => { pos[w.id] = { x: r.x0 + i * (cw + gap) + cw / 2, y: y + ch / 2, w: cw } })
  group(r.x0 + 2 * (cw + gap), y, "reflection", 0, "Reflections")
  labels.push({ x: r.x0 + 2 * (cw + gap), y, z: Z_FRONT, cls: "slot", w: cw, h: ch, html: "Nothing here yet" })
  y += ch + labH + 10
  group(r.x0, y, "photography", photographs.length, "Photography", Z_BACK)
  Object.assign(pos, mosaicFit(photographs, r.x0, rw, y, r.y1 - y, 44, 3).pos)
  return { pos, labels }
}

function inquiries(g) {
  const { r, S, narrow } = g
  const rw = r.x1 - r.x0
  const bandH = narrow ? 70 * S : 150 * S
  const top = r.y0 + 26 * S, bottom = r.y1 - bandH - 40 * S
  const cols = narrow ? 2 : 3, rows = narrow ? 3 : 2, cellW = rw / cols, cellH = (bottom - top) / rows
  const pos = {}, labels = []
  INQUIRIES.forEach((q, i) => {
    const cx = r.x0 + (i % cols) * cellW, cy = top + Math.floor(i / cols) * cellH
    const list = writings.filter(w => w.inquiry === q)
    const n = list.length
    const w = Math.min(cellW - (narrow ? 40 : 40 * S), (cellH - (narrow ? 34 : 80 * S)) * 1.5) * (n > 1 ? 0.74 : 0.92)
    const z = inquiryDepth(i)
    labels.push({ x: cx, y: cy, z, cls: "group", html: `<b style="color:var(--hs-ink);font-weight:500">${q}</b><span>${n || "—"}</span>` })
    if (!n) labels.push({ x: cx, y: cy + 26 * S, z, cls: "slot", w: w * 0.9, h: w * 0.6, html: "Asked, not yet written" })
    list.forEach((it, k) => {
      pos[it.id] = { x: cx + w / 2 + k * 64 * S, y: cy + 26 * S + w / 3 + k * 46 * S, w, r: n > 1 ? (k ? 2 : -2.5) : 0, cap: !narrow && k === n - 1, front: k }
    })
  })
  const py = r.y1 - bandH
  labels.push({ x: r.x0, y: py - 26 * S, z: Z_STRIP, cls: "group", html: `<b style="color:var(--hs-photography);font-weight:500">Photography</b>` })
  Object.assign(pos, mosaicFit(photographs, r.x0, rw, py, bandH, 44 * S, 4 * S).pos)
  for (const p of photographs) pos[p.id].o = 0.55
  return { pos, labels }
}

function network(g, unsorted) {
  const { r, S, narrow } = g
  const rw = r.x1 - r.x0, rh = r.y1 - r.y0
  const groups = {}
  DATA.connections.forEach(c => (groups[c.from] = groups[c.from] || []).push(c))
  const pos = {}, labels = []
  const entries = Object.entries(groups)
  if (narrow) {
    const blockH = rh / entries.length
    entries.forEach(([from, cs], i) => {
      const top = r.y0 + i * blockH + 6, cw = rw * 0.56, ch = cw / 1.5, flip = i % 2 === 1
      const cx = flip ? r.x1 - cw / 2 : r.x0 + cw / 2, cy = top + ch / 2
      pos[from] = { x: cx, y: cy, w: cw }
      labels.push({ x: flip ? r.x0 : r.x0 + cw + 10, y: top + 4, z: Z_LINK, cls: "place", html: `Both in<br>${esc(cs[0].place)}` })
      const ph = Math.min(blockH - ch - 22, 92)
      const list = cs.map(c => ({ c, w: ph * byId[c.to].ratio }))
      const k = Math.min(1, (rw - 12) / list.reduce((a, q) => a + q.w, 0))
      let x = r.x0 + (rw - list.reduce((a, q) => a + q.w * k, 0) - 12) / 2
      list.forEach(q => { const w = q.w * k; pos[q.c.to] = { x: x + w / 2, y: cy + ch / 2 + 14 + ph * k / 2, w }; x += w + 6 })
    })
  } else {
    entries.forEach(([from, cs], i) => {
      const flip = i % 2 === 1
      const cw = Math.min(290 * S, rw * 0.32)
      const ph = 118 * S, gap = 22 * S, reach = 64 * S
      const photos = cs.map(c => ({ c, w: ph * byId[c.to].ratio }))
      const rowW = photos.reduce((a, q) => a + q.w, 0) + gap * (photos.length - 1)
      const left = r.x0 + Math.max(0, (rw - (cw + reach + rowW)) / 2) + (flip ? 0 : -10 * S)
      const cy = r.y0 + rh * (entries.length > 1 ? (flip ? 0.7 : 0.25) : 0.45)
      const cx = flip ? left + rowW + reach + cw / 2 : left + cw / 2
      pos[from] = { x: cx, y: cy, w: cw, cap: true }
      let x = flip ? left : left + cw + reach
      photos.forEach((q, k) => { pos[q.c.to] = { x: x + q.w / 2, y: cy + (k - (photos.length - 1) / 2) * 26 * S - 8 * S, w: q.w, r: (k - 1) * 1.2 }; x += q.w + gap })
      labels.push({ x: flip ? left : left + cw + reach, y: cy - ph / 2 - 62 * S, z: Z_LINK, cls: "place", html: `Both in ${esc(cs[0].place)}` })
    })
  }
  for (const w of nodes) if (!pos[w.id]) {
    const u = unsorted.pos[w.id]
    pos[w.id] = { ...u, w: u.w * 0.72, o: w.kind === "writing" ? 0.22 : 0.13, r: 0, back: true }
  }
  return { pos, labels }
}

// ---- Pixels to the room -------------------------------------------------------------
// The camera's home is straight in front of the picture plane at distance D.
// A print placed deeper in the room is moved out and enlarged just enough to
// land where D put it on screen, so the home view is D's picture; the depth
// only shows once you move.
const region = { dx: 0, dy: 0, w: 1, h: 1 }
let G = null
let pxScale = 1
const toWorld = (px, py, z) => {
  const f = (D - z) / D
  const ox = G.W / 2 + region.dx, oy = G.H / 2 - region.dy
  return [(px - ox) * pxScale * f, -(py - oy) * pxScale * f, z, f]
}
const PILE = 0, LOOSE = 1, FORMS = 2, INQ = 3, CONN = 4, TIME = 5
// Depths for D's laid-out scenes, so there is a room to walk round in each:
// covers stand forward of the photographs, inquiry columns step back.
const Z_FRONT = 1.4, Z_BACK = -1.8, Z_STRIP = -2.8, Z_LINK = 0.4
const inquiryDepth = i => [1.6, 0, -1.6][i % 3]
const makeLayout = () => ({ pos: new Float32Array(N * 3), wid: new Float32Array(N), rot: new Float32Array(N), dim: new Float32Array(N), tilt: 0.2, px: null, labels: [] })
function fromPixels(px, depthOf, tilt) {
  const L = makeLayout()
  L.px = px.pos
  // Labels hang in the room too, at their scene's depth, so they stay with
  // their prints when you walk.
  L.labels = px.labels.map(l => ({ ...l, world: toWorld(l.x, l.y, l.z || 0), world2: l.w ? toWorld(l.x + l.w, l.y + l.h, l.z || 0) : null }))
  L.tilt = tilt
  nodes.forEach((n, i) => {
    const p = px.pos[n.id]
    const z = depthOf(n, p)
    const [x, y, zz, f] = toWorld(p.x, p.y, z)
    L.pos.set([x, y, zz], i * 3)
    // Full compensation keeps the size D drew; deep prints keep a little less.
    L.wid[i] = p.w * pxScale * (z < 0 ? Math.sqrt(f) : f)
    L.rot[i] = -(p.r || 0) * DEG
    L.dim[i] = 1 - (p.o ?? 1)
  })
  return L
}

// ---- 05: a straight time line that bends into a ring you can turn -------------------------
// Years are evenly spaced. Each year's photographs stand in one column above
// the line; the writings hang below it in two rows, in date order, each tied
// to its year. Bending keeps that shape: the line closes into a ring (2026
// meets 2011), and once it's closed the ring turns like a carousel.
const YEARS = []
for (let y = 2011; y <= 2026; y++) YEARS.push(y)
const YEAR_GAP = 3.4
const AXIS_Y = -1.2
const COVER_T = 2.5
const tS = new Float32Array(N), tY = new Float32Array(N)
const yearS = new Float32Array(YEARS.length)
YEARS.forEach((y, k) => (yearS[k] = (k - (YEARS.length - 1) / 2) * YEAR_GAP))
const L_TIME = YEARS.length * YEAR_GAP
// A year with more than three photographs stacks them in two columns, so
// the busy years stay low enough to read up close.
YEARS.forEach((year, yk) => {
  const list = photoIdx.filter(i => nodes[i].year === year)
  const cols = list.length > 3 ? 2 : 1
  const y = [0.35, 0.35]
  list.forEach((i, k) => {
    const c = k % cols, h = nodes[i].w3 / nodes[i].ratio
    tS[i] = yearS[yk] + (cols > 1 ? (c ? 0.78 : -0.78) : 0)
    tY[i] = y[c] + h / 2
    y[c] += h + 0.14
  })
})
{
  const dateS = n => { const d = new Date(n.date); return yearS[0] + (d.getUTCFullYear() - YEARS[0] - 0.5 + (d.getUTCMonth() + 0.5) / 12) * YEAR_GAP }
  const dated = writingsOf(() => true).sort((a, b) => new Date(nodes[a].date) - new Date(nodes[b].date))
  const ch = COVER_T / 1.5, stepS = COVER_T + 0.3
  // One row under the line, in date order, centred on their dates.
  const mean = dated.reduce((acc, i) => acc + dateS(nodes[i]), 0) / dated.length
  dated.forEach((i, k) => {
    tS[i] = mean + (k - (dated.length - 1) / 2) * stepS
    tY[i] = -(1.0 + ch / 2)
  })
}
const R_TIME = L_TIME / (Math.PI * 2)
const bendX = (s, k) => (k < 1e-5 ? s : Math.sin(s * k) / k)
const bendZ = (s, k) => (k < 1e-5 ? -0.5 * s * s * k : -(1 - Math.cos(s * k)) / k)
const timeCentreZ = t => { if (t < 1e-4) return 0; const half = Math.PI * t; return -(1 - Math.sin(half) / half) * (L_TIME / (2 * Math.PI * t)) }
const time = makeLayout()
time.tilt = 0
nodes.forEach((n, i) => { time.wid[i] = i < W_COUNT ? COVER_T : n.w3 })
let bendT = 0
let lineViewW = 20
let ring = 0, ringTarget = 0, ringMode = false
// Where a point s along the line is, after bending by t and turning the ring.
const timeXZ = (s, t, out) => {
  const k = (t * Math.PI * 2) / L_TIME
  let x = bendX(s, k), z = bendZ(s, k)
  const a = ring * smoothstep(0.8, 1, t)
  if (a && k > 1e-5) {
    const cz = -1 / k, dz = z - cz
    const c = Math.cos(a), si = Math.sin(a)
    const nx = x * c + dz * si
    z = cz - x * si + dz * c
    x = nx
  }
  out[0] = x; out[1] = z
  return out
}
const xz = [0, 0]
// As the line closes, each year's column lies down flat: photographs fan out
// from the ring, writings fall inside it. Seen from above, a flat circle.
const FAN = 0.9
const MAX_TY = Math.max(...photoIdx.map(i => tY[i]))
// In the circle the writings spread evenly round the inside, in date order,
// so none hides another; their stems still run to their years.
const ringS = new Float32Array(N)
{
  const dated = writingsOf(() => true).sort((a, b) => new Date(nodes[a].date) - new Date(nodes[b].date))
  const s0 = Math.min(...dated.map(i => tS[i]))
  dated.forEach((i, j) => (ringS[i] = s0 + (j * L_TIME) / dated.length))
}
const RING_IN = 2.6
const fillTime = t => {
  const k = (t * Math.PI * 2) / L_TIME
  const u = smoothstep(0.4, 1, t)
  for (let i = 0; i < N; i++) {
    const isW = i < W_COUNT
    timeXZ(isW ? lerp(tS[i], ringS[i], u) : tS[i], t, xz)
    let x = xz[0], z = xz[1]
    if (u > 0 && k > 1e-5) {
      const cz = -1 / k, dx = x, dz = z - cz, len = Math.hypot(dx, dz) || 1
      const d = (isW ? lerp(tY[i], -RING_IN, u) : tY[i] * FAN) * u
      x += (dx / len) * d
      z += (dz / len) * d
    }
    time.pos[i * 3] = x
    time.pos[i * 3 + 1] = AXIS_Y + tY[i] * (1 - u) + (tY[i] > 0 ? 0.5 : 0.3) * u
    time.pos[i * 3 + 2] = z
  }
}
fillTime(0)

let LAYOUTS = []
const computeLayouts = () => {
  G = geometry()
  pxScale = (2 * D * TAN_V) / G.H
  const loosePx = pile(G, false)
  LAYOUTS = [
    // The hero pile has real depth, kept shallow so it reads as one pile:
    // covers in front, photographs just behind them.
    fromPixels(pile(G, true), n => (n.kind === "writing" ? 0.4 + n.depth * 1.4 : -4 + n.depth * 4.6), 1),
    fromPixels(loosePx, n => (n.kind === "writing" ? 0.4 : (n.depth - 0.5) * 1.6), 0.45),
    fromPixels(forms(G), n => (n.kind === "writing" ? Z_FRONT : Z_BACK), 0.12),
    fromPixels(inquiries(G), (n, p) => (n.kind === "writing" ? inquiryDepth(INQUIRIES.indexOf(n.inquiry)) + (p.front || 0) * 0.2 : Z_STRIP), 0.12),
    fromPixels(network(G, loosePx), (n, p) => (p.back ? -7 + n.depth * 3 : Z_LINK), 0.15),
    time,
  ]
}

// ---- Renderer --------------------------------------------------------------------------
const canvas = $("space")
const stage = $("stage")
let renderer
try {
  renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" })
  renderer.outputColorSpace = LinearSRGBColorSpace
} catch (error) {
  console.warn("WebGL unavailable", error)
}
const scene = new Scene()
const ground = new Color(HEX.ground)
if (renderer) renderer.setClearColor(ground, 1)
const camera = new PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 220)

const U = { ground: { value: ground }, fogNear: { value: 20 }, fogFar: { value: 50 }, fogMax: { value: 0.84 }, nearFade: { value: 1.2 } }
const PRINT_VERT = `
varying vec2 vUv;
varying float vDepth;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`
const PRINT_FRAG = `
uniform sampler2D map;
uniform vec3 frameColor;
uniform float frameAlpha;
uniform vec2 size;
uniform float dim;
uniform vec3 ground;
uniform float fogNear;
uniform float fogFar;
uniform float fogMax;
uniform float nearFade;
varying vec2 vUv;
varying float vDepth;
void main() {
  vec3 c = texture2D(map, vUv).rgb;
  c *= 0.92 + 0.1 * vUv.y;
  vec2 e2 = min(vUv, 1.0 - vUv) * size;
  float e = min(e2.x, e2.y);
  float aa = fwidth(e);
  float edge = 1.0 - smoothstep(aa * 0.6, aa * 1.6, e);
  c = mix(c, frameColor, edge * frameAlpha);
  float grey = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(c, vec3(grey) * 0.8, dim * 0.8);
  c *= 1.0 - dim * 0.75;
  c = mix(c, ground, smoothstep(fogNear, fogFar, vDepth) * fogMax);
  gl_FragColor = vec4(c, smoothstep(nearFade, nearFade + 2.4, vDepth));
}`
// A soft shadow under each print, as on a table: D's prints cast one too.
const SHADOW_FRAG = `
uniform float alpha;
varying vec2 vUv;
varying float vDepth;
uniform float nearFade;
void main() {
  vec2 d = min(vUv, 1.0 - vUv);
  float a = smoothstep(0.0, 0.12, d.x) * smoothstep(0.0, 0.12, d.y);
  gl_FragColor = vec4(0.0, 0.0, 0.0, a * alpha * smoothstep(nearFade, nearFade + 2.4, vDepth));
}`
const plane = new PlaneGeometry(1, 1)
const meshes = []
const shadowMats = []
nodes.forEach((n, i) => {
  const material = new ShaderMaterial({
    vertexShader: PRINT_VERT, fragmentShader: PRINT_FRAG, transparent: true, depthWrite: true,
    uniforms: { map: { value: null }, frameColor: { value: n.colour }, frameAlpha: { value: 0.22 }, size: { value: new Vector2(1, 1) }, dim: { value: 0 }, ground: U.ground, fogNear: U.fogNear, fogFar: U.fogFar, fogMax: U.fogMax, nearFade: U.nearFade },
  })
  const mesh = new Mesh(plane, material)
  mesh.userData.index = i
  mesh.visible = false
  const sm = new ShaderMaterial({ vertexShader: PRINT_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, uniforms: { alpha: { value: 0.55 }, nearFade: U.nearFade } })
  shadowMats.push(sm)
  const shadow = new Mesh(plane, sm)
  shadow.position.set(0.035, -0.06, -0.03)
  shadow.scale.set(1.16, 1.2, 1)
  shadow.renderOrder = -1
  mesh.add(shadow)
  if (n.frames > 1) {
    // A series is a small stack of prints.
    for (let g = 1; g <= 2; g++) {
      const ghost = new Mesh(plane, new ShaderMaterial({ vertexShader: PRINT_VERT, fragmentShader: `varying vec2 vUv; varying float vDepth; uniform float nearFade; void main(){ gl_FragColor = vec4(vec3(0.17,0.165,0.155), smoothstep(nearFade, nearFade + 2.4, vDepth)); }`, transparent: true, uniforms: { nearFade: U.nearFade } }))
      ghost.position.set(0.04 * g, 0.05 * g, -0.012 * g)
      mesh.add(ghost)
    }
  }
  meshes.push(mesh)
  scene.add(mesh)
})

const loadTextures = async () => {
  const maxAniso = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1
  const narrow = mqNarrow.matches
  await Promise.all(nodes.map(async (n, i) => {
    const img = new Image()
    img.src = n.img
    try { await img.decode() } catch { return }
    let source = img
    const limit = narrow ? (i < W_COUNT ? 560 : 260) : 0
    if (limit && img.naturalWidth > limit) {
      const c = document.createElement("canvas")
      c.width = limit
      c.height = Math.round((img.naturalHeight / img.naturalWidth) * limit)
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height)
      source = c
    }
    const tex = new Texture(source)
    tex.colorSpace = NoColorSpace
    tex.minFilter = LinearMipmapLinearFilter
    tex.magFilter = LinearFilter
    tex.anisotropy = maxAniso
    tex.generateMipmaps = true
    tex.needsUpdate = true
    meshes[i].material.uniforms.map.value = tex
    meshes[i].visible = true
  }))
}

// ---- Threads ----------------------------------------------------------------------------
// Connections always; with the mesh on, faint hairlines by place and year too.
const conns = DATA.connections.map(c => ({ a: indexById.get(c.from), b: indexById.get(c.to) })).filter(c => c.a !== undefined && c.b !== undefined)
const A_YEAR = N
const points = new Float32Array((N + YEARS.length) * 3)
const pointColour = [...nodes.map(n => n.colour), ...YEARS.map(() => new Color(HEX.meta))]
const T_INQ = 0, T_PLACE = 1, T_YEAR = 2, T_CONN = 3, T_STEM = 4
// Alpha per type, per layout: pile, loose, forms, inquiries, connections, time.
const EDGE_ALPHA = [
  [0.12, 0.2, 0, 0.3, 0, 0],
  [0.1, 0.14, 0, 0, 0, 0],
  [0.06, 0.1, 0, 0, 0, 0],
  [0, 0.05, 0, 0, 0.9, 0],
  [0, 0, 0, 0, 0, 0.26],
]
const ESSENTIAL = new Set([T_CONN * 10 + CONN, T_STEM * 10 + TIME])
const edges = []
const addEdge = (a, b, type) => edges.push({ a, b, type, alpha: 0 })
{
  INQUIRIES.forEach(q => { const m = writingsOf(n => n.inquiry === q); for (let x = 0; x < m.length; x++) for (let y = x + 1; y < m.length; y++) addEdge(m[x], m[y], T_INQ) })
  const chain = (key, sortKey, type, list) => {
    const groups = new Map()
    list.forEach(i => { const k = key(nodes[i]); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i) })
    groups.forEach(g => { g.sort((a, b) => sortKey(nodes[a]) - sortKey(nodes[b])); for (let k = 1; k < g.length; k++) addEdge(g[k - 1], g[k], type) })
  }
  chain(n => n.place, n => n.year, T_PLACE, photoIdx)
  chain(n => n.year, n => (n.place || "").length, T_YEAR, nodes.map((n, i) => i))
  conns.forEach(c => addEdge(c.a, c.b, T_CONN))
  nodes.forEach((n, i) => addEdge(i, A_YEAR + YEARS.indexOf(n.year), T_STEM))
}
const edgeGeometry = new BufferGeometry()
const edgePos = new Float32Array(edges.length * 6)
const edgeCol = new Float32Array(edges.length * 8)
edgeGeometry.setAttribute("position", new BufferAttribute(edgePos, 3).setUsage(DynamicDrawUsage))
edgeGeometry.setAttribute("color", new BufferAttribute(edgeCol, 4).setUsage(DynamicDrawUsage))
const edgeLines = new LineSegments(edgeGeometry, new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }))
edgeLines.frustumCulled = false
edgeLines.renderOrder = 2
scene.add(edgeLines)
const AXIS_N = 240
const axisPos = new Float32Array((AXIS_N + 1) * 3)
const axisGeometry = new BufferGeometry()
axisGeometry.setAttribute("position", new BufferAttribute(axisPos, 3).setUsage(DynamicDrawUsage))
const axisMaterial = new LineBasicMaterial({ color: new Color(HEX.meta), transparent: true, opacity: 0, depthWrite: false })
const axis = new Line(axisGeometry, axisMaterial)
axis.frustumCulled = false
scene.add(axis)

// ---- HTML: D's labels and captions, E's year labels --------------------------------------
const layer = $("layer")
const caps = nodes.slice(0, W_COUNT).map(n => {
  const el = document.createElement("div")
  el.className = "cap"
  el.innerHTML = `<b style="color:${CSS[n.form]}">${markSvg(n.form)}${NAME[n.form]} · ${n.year}</b>${esc(n.title)}`
  layer.appendChild(el)
  return el
})
let labelEls = []
let capsTimer = 0
let wordsOn = false // labels and captions wait until the prints have arrived
const showLabels = L => {
  labelEls.forEach(({ el }) => { el.style.opacity = 0; setTimeout(() => el.remove(), 600) })
  labelEls = []
  wordsOn = false
  caps.forEach(c => (c.style.opacity = 0))
  clearTimeout(capsTimer)
  if (!L.px) return
  for (const l of L.labels) {
    const el = document.createElement("div")
    el.className = "lab " + l.cls
    el.innerHTML = l.html
    layer.appendChild(el)
    labelEls.push({ el, l })
  }
  capsTimer = setTimeout(() => { wordsOn = true; wake() }, reduced ? 200 : 1300)
}
const toScreen = (x, y, z) => {
  proj.set(x, y, z).project(camera)
  return [(proj.x * 0.5 + 0.5) * innerWidth, (-proj.y * 0.5 + 0.5) * innerHeight, proj.z]
}
const updateWords = () => {
  const L = LAYOUTS[layoutIndex]
  for (const { el, l } of labelEls) {
    const [x, y, z] = toScreen(...l.world)
    if (z > 1 || !wordsOn) { el.style.opacity = 0; continue }
    el.style.opacity = 1
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
    if (l.world2) {
      const [x2, y2] = toScreen(...l.world2)
      el.style.width = Math.max(20, x2 - x).toFixed(1) + "px"
      el.style.height = Math.max(20, y2 - y).toFixed(1) + "px"
    }
  }
  // A caption hangs under its cover's lower left corner, wherever the cover is.
  right.set(1, 0, 0).applyQuaternion(camera.quaternion)
  up.set(0, 1, 0).applyQuaternion(camera.quaternion)
  for (let i = 0; i < W_COUNT; i++) {
    const p = L.px && L.px[nodes[i].id]
    if (!p || !p.cap || !wordsOn) { caps[i].style.opacity = 0; continue }
    const o = i * 3, w = curWid[i], h = w / nodes[i].ratio
    const bl = toScreen(disp[o] - right.x * w / 2 - up.x * h / 2, disp[o + 1] - right.y * w / 2 - up.y * h / 2, disp[o + 2] - right.z * w / 2 - up.z * h / 2)
    const br = toScreen(disp[o] + right.x * w / 2 - up.x * h / 2, disp[o + 1] + right.y * w / 2 - up.y * h / 2, disp[o + 2] + right.z * w / 2 - up.z * h / 2)
    if (bl[2] > 1) { caps[i].style.opacity = 0; continue }
    caps[i].style.opacity = 1 - curDim[i]
    caps[i].style.width = Math.max(140, br[0] - bl[0]).toFixed(1) + "px"
    caps[i].style.transform = `translate3d(${bl[0].toFixed(1)}px, ${(bl[1] + 10).toFixed(1)}px, 0)`
  }
}
const yearLabels = YEARS.map((y, k) => {
  if (!nodes.some(n => n.year === y)) return null
  const el = document.createElement("div")
  el.className = "lab year"
  el.textContent = y
  layer.appendChild(el)
  return { el, k, alpha: 0 }
}).filter(Boolean)

// ---- Hover caption and keyboard links -----------------------------------------------------
const tip = $("tip")
const describe = n => n.kind === "writing"
  ? { form: `${markSvg(n.form)}${NAME[n.form]} · ${cap(n.inquiry)}`, meta: `${n.year} · ${n.minutes} min read` }
  : { form: `${markSvg("photography")}${n.frames > 1 ? `Series · ${n.frames} frames` : "Photograph"}`, meta: esc([n.year, n.place].filter(Boolean).join(" · ")) }
let focusIdx = -1
{
  const list = $("works")
  nodes.forEach((n, i) => {
    const li = document.createElement("li")
    const a = document.createElement("a")
    a.href = n.href
    a.textContent = `${NAME[n.form]}: ${n.title}`
    on(a, "focus", () => { focusIdx = i; wake() })
    on(a, "blur", () => { if (focusIdx === i) focusIdx = -1; wake() })
    li.appendChild(a)
    list.appendChild(li)
  })
}

// ---- Scroll -----------------------------------------------------------------------------------
const stepEls = [...root.querySelectorAll("[data-hs=step]")]
const cue = $("cue")
let sceneIndex = -2
let layoutIndex = -1
let progress = 0
let scrollDirty = true
const readScroll = () => {
  scrollDirty = false
  const narrow = G.narrow
  const line = innerHeight * 0.55
  let s = -1
  stepEls.forEach((el, i) => {
    const probe = narrow ? el : el.querySelector("[data-hs=inner]")
    if (probe.getBoundingClientRect().top <= (narrow ? innerHeight * 0.45 : line)) s = i
  })
  if (s === 4) {
    const r = stepEls[4].getBoundingClientRect()
    progress = clamp01(-r.top / Math.max(1, r.height - innerHeight))
  } else progress = 0
  stepEls.forEach((el, i) => (el.dataset.active = String(i === s)))
  if (narrow) stepEls.forEach((el, i) => (el.querySelector("[data-hs=inner]").style.opacity = i === s ? 1 : 0))
  cue.style.opacity = s < 0 ? 1 : 0
  if (s !== sceneIndex) setScene(s)
}

// ---- Motion -------------------------------------------------------------------------------------
const DUR = 1500
const base = new Float32Array(N * 3)
const from = new Float32Array(N * 3)
const startAt = new Float64Array(N)
const curWid = new Float32Array(N)
const curRot = new Float32Array(N)
const curDim = new Float32Array(N)
const hoverAmt = new Float32Array(N)
const disp = new Float32Array(N * 3)
let curTilt = 1
let driftAmp = 0.3
let snapAll = true
let fadeTimer = 0

const setScene = s => {
  sceneIndex = s
  stage.dataset.scene = String(s)
  const next = s + 1
  if (next === layoutIndex) return
  const first = layoutIndex < 0
  layoutIndex = next
  // Each scene opens on its own view; you can walk off from there.
  walkTarget.reset()
  ringTarget = 0
  if (next === TIME) fillTime(reduced ? 1 : bendT)
  const L = LAYOUTS[next]
  const now = performance.now()
  if (first || reduced) {
    const apply = () => {
      base.set(L.pos); from.set(L.pos); startAt.fill(now - DUR)
      snapAll = true; snapCamera = true
      showLabels(L)
    }
    if (first) {
      // The pile is simply there: the canvas fades in, nothing flies in.
      apply()
      return
    }
    canvas.classList.add("is-fading")
    clearTimeout(fadeTimer)
    fadeTimer = setTimeout(() => { apply(); wake(); setTimeout(() => canvas.classList.remove("is-fading"), 40) }, 170)
    return
  }
  showLabels(L)
  from.set(base)
  // A sweep: prints leave in order of where they're going, left to right.
  const span = G.W * pxScale
  for (let i = 0; i < N; i++) startAt[i] = now + clamp01((L.pos[i * 3] + span / 2) / span) * 320 + nodes[i].phase[3] * 22
}

// ---- Camera: home, the time shot, and walking in the pile -------------------------------------
const shot = { tx: 0, ty: 0, tz: 0, az: 0, el: 0, dist: D }
const cam = { tx: 0, ty: 0, tz: 0, az: 0, el: 0, dist: D }
let snapCamera = true
const walk = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 }
const walkTarget = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, reset() { this.x = this.y = this.z = this.yaw = this.pitch = 0 } }
const padEl = $("pad")
const fitDistance = (fw, fh) => Math.max((fw * innerHeight) / (2 * TAN_V * region.w), (fh * innerHeight) / (2 * TAN_V * region.h))
const computeShot = () => {
  shot.tx = shot.ty = shot.tz = shot.az = shot.el = 0
  shot.dist = D
  if (layoutIndex === TIME) {
    const t = reduced ? 1 : bendT
    const u = smooth(t)
    // The line, close up: a few years at a time, starting at 2011; you walk
    // along it to see the rest. Then the circle, near and from a low angle,
    // so its front fills the view and the back recedes.
    const lineH = 11
    const lineW = lineH * (region.w / region.h)
    lineViewW = lineW
    const lineX = yearS[0] - YEAR_GAP * 0.7 + lineW / 2
    const ringSpan = 2 * R_TIME + 2 * MAX_TY * FAN
    shot.tx = lerp(lineX, 0, u)
    shot.ty = AXIS_Y + lerp(1.75, 0.2, u)
    shot.tz = lerp(0, timeCentreZ(t) + R_TIME * 0.35, u)
    shot.el = lerp(0, 36, u) * DEG
    shot.az = 0
    const fw = lerp(lineW, ringSpan * 0.72, u), fh = lerp(lineH, ringSpan * 0.5, u)
    shot.dist = fitDistance(fw, fh)
  }
}
const camPos = new Vector3()
const tgt = new Vector3()
const look = new Vector3()
const right = new Vector3()
const up = new Vector3()
const proj = new Vector3()
const tmp = new Vector3()
const qYaw = new Quaternion()
const qPitch = new Quaternion()
const Y_AXIS = new Vector3(0, 1, 0)
const parallax = new Vector2(), parallaxTarget = new Vector2()
let clock = 0
const damp = (rate, dt) => (snapAll ? 1 : 1 - Math.exp(-rate * dt))

const updateCamera = dt => {
  computeShot()
  const k = snapCamera ? 1 : 1 - Math.exp(-2.6 * dt)
  snapCamera = false
  for (const key of ["tx", "ty", "tz", "az", "el", "dist"]) cam[key] += (shot[key] - cam[key]) * k
  let az = cam.az, el = cam.el
  // Nothing sways on its own: the camera only moves when you move it.
  const kw = 1 - Math.exp(-5 * dt)
  for (const key of ["x", "y", "z", "yaw", "pitch"]) walk[key] += (walkTarget[key] - walk[key]) * kw
  tgt.set(cam.tx, cam.ty, cam.tz)
  {
    // You walk: the head turns, then the body moves.
    camPos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(cam.dist).add(tgt)
    look.copy(tgt).sub(camPos).normalize()
    right.crossVectors(look, Y_AXIS).normalize()
    qYaw.setFromAxisAngle(Y_AXIS, walk.yaw)
    qPitch.setFromAxisAngle(right, walk.pitch)
    look.applyQuaternion(qPitch).applyQuaternion(qYaw)
    camPos.x += walk.x; camPos.y += walk.y; camPos.z += walk.z
    camera.position.copy(camPos)
    camera.lookAt(tmp.copy(camPos).add(look))
  }
  camera.updateMatrixWorld()
  const depth = cam.dist + walk.z * -1
  U.fogNear.value = Math.max(4, cam.dist - 4 - Math.max(0, -walk.z))
  U.fogFar.value = U.fogNear.value + 30
  return depth
}

// ---- Pointer: hover, drag to look, walk ------------------------------------------------------------
const pointer = new Vector2(9, 9)
let pointerOver = false, pointerMoved = false, pointerType = "mouse"
let hoverIdx = -1
const raycaster = new Raycaster()
const hits = []
let drag = null
const touches = new Map()
let pinch = 0

const setPointer = e => {
  const r = canvas.getBoundingClientRect()
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
}
const walkLimits = () => {
  walkTarget.z = clamp(walkTarget.z, -24, 6)
  walkTarget.y = clamp(walkTarget.y, -5, 5)
  // The timeline is long, so there you can walk its whole length.
  if (layoutIndex === TIME && !ringMode) {
    // Along the line: from 2011 to 2026, no further.
    walkTarget.x = clamp(walkTarget.x, -1, Math.max(0, L_TIME - lineViewW + 1))
    walkTarget.y = 0
    walkTarget.yaw = walkTarget.pitch = 0
  } else walkTarget.x = clamp(walkTarget.x, -12, 12)
  // On the line, ↑ ↓ zoom straight in and out, never past the prints.
  const lineMode = layoutIndex === TIME && !ringMode
  walkTarget.z = clamp(walkTarget.z, lineMode ? -(cam.dist - 7) : layoutIndex === TIME ? -cam.dist - 20 : -24, lineMode ? 10 : 8)
  walkTarget.pitch = clamp(walkTarget.pitch, -0.6, 0.6)
  walkTarget.yaw = clamp(walkTarget.yaw, -1.4, 1.4)
}
const stepAlong = (dir, amount) => {
  walkTarget.x += dir.x * amount
  walkTarget.y += dir.y * amount * 0.6
  walkTarget.z += dir.z * amount
  walkLimits()
  wake()
}
on(canvas, "pointerdown", e => {
  pointerType = e.pointerType
  setPointer(e)
  pointerOver = true
  pointerMoved = true
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (touches.size === 2) {
    const [a, b] = [...touches.values()]
    pinch = Math.hypot(a.x - b.x, a.y - b.y)
    drag = null
    return
  }
  drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }
})
on(canvas, "pointermove", e => {
  pointerType = e.pointerType
  setPointer(e)
  pointerOver = true
  pointerMoved = true
  if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (touches.size === 2) {
    const [a, b] = [...touches.values()]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    stepAlong(camera.getWorldDirection(tmp), (d - pinch) * 0.04)
    pinch = d
  } else if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y
    drag.moved += Math.abs(dx) + Math.abs(dy)
    drag.x = e.clientX; drag.y = e.clientY
    if (drag.moved > 4) {
      canvas.setPointerCapture(e.pointerId)
      canvas.classList.add("is-dragging")
      if (layoutIndex === TIME && !ringMode) {
        // The straight line stays flat: dragging slides it sideways along the
        // years, exactly like ← →. Nothing turns, nothing rises or sinks.
        const perPx = (2 * camera.position.distanceTo(tgt) * TAN_V) / innerHeight
        walkTarget.x -= dx * perPx
      } else if (ringMode && layoutIndex === TIME) {
        ringTarget += dx * 0.006
        walkTarget.pitch += dy * 0.0018
      } else {
        walkTarget.yaw += dx * 0.0022
        walkTarget.pitch += dy * 0.0018
      }
      walkLimits()
    }
  }
  wake()
})
const endPointer = e => {
  touches.delete(e.pointerId)
  if (drag && e.pointerId === drag.id) {
    canvas.classList.remove("is-dragging")
    setTimeout(() => (drag = null), 0)
  }
}
on(canvas, "pointerup", endPointer)
on(canvas, "pointercancel", endPointer)
on(canvas, "pointerleave", () => { pointerOver = false; pointerMoved = true; wake() })
on(canvas, "click", () => {
  if (drag && drag.moved > 4) return
  pick()
  if (hoverIdx >= 0 && (pointerType === "mouse" || touchSelected === hoverIdx)) {
    navigate(nodes[hoverIdx].href)
    return
  }
  touchSelected = hoverIdx
  wake()
})
let touchSelected = -1
on(canvas, "dblclick", e => {
  e.preventDefault()
  setPointer(e)
  raycaster.setFromCamera(pointer, camera)
  stepAlong(raycaster.ray.direction, 5)
})
// Keys walk while the pile is on screen: ↑↓ / W S move, ← → / A D turn.
const keys = new Set()
on(window, "keydown", e => {
  if (e.key === "Escape" && document.activeElement === canvas) { canvas.blur(); return }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (document.activeElement && document.activeElement !== canvas && document.activeElement !== document.body) return
  const k = e.key.toLowerCase()
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
    if (k.startsWith("arrow") && document.activeElement !== canvas) return
    e.preventDefault()
    keys.add(k)
    wake()
  }
})
on(window, "keyup", e => keys.delete(e.key.toLowerCase()))
const held = new Set()
// Left and right step sideways, level with the floor: along the timeline, past a pile.
const sideStep = amount => {
  if (ringMode && layoutIndex === TIME) { ringTarget += amount * 0.09; wake(); return }
  camera.getWorldDirection(tmp)
  walkTarget.x += -tmp.z * amount
  walkTarget.z += tmp.x * amount
  walkLimits()
  wake()
}
const applyKeys = dt => {
  if (!keys.size && !held.size) return
  const on = (...names) => names.some(n => keys.has(n) || held.has(n))
  const fwd = (on("arrowup", "w", "fwd") ? 1 : 0) - (on("arrowdown", "s", "back") ? 1 : 0)
  const side = (on("arrowright", "d", "right") ? 1 : 0) - (on("arrowleft", "a", "left") ? 1 : 0)
  if (fwd) stepAlong(camera.getWorldDirection(tmp), fwd * 9 * dt)
  if (side) sideStep(side * 9 * dt)
}
// The pad: hold a button to keep going; a click or a key press is one step.
padEl.querySelectorAll("button[data-move]").forEach(b => {
  const move = b.dataset.move
  const stop = () => held.delete(move)
  on(b, "pointerdown", e => { e.preventDefault(); held.add(move); b.setPointerCapture(e.pointerId); wake() })
  on(b, "pointerup", stop)
  on(b, "pointercancel", stop)
  on(b, "lostpointercapture", stop)
  on(b, "keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return
    e.preventDefault()
    if (move === "fwd" || move === "back") stepAlong(camera.getWorldDirection(tmp), move === "fwd" ? 1.5 : -1.5)
    else sideStep(move === "left" ? -1.5 : 1.5)
  })
})
on($("pad-reset"), "click", () => { walkTarget.reset(); ringTarget = 0; wake() })

const pick = () => {
  pointerMoved = false
  if (!pointerOver || (drag && drag.moved > 4)) { hoverIdx = pointerType === "mouse" ? -1 : touchSelected; canvas.classList.toggle("is-hovering", false); return }
  hits.length = 0
  raycaster.setFromCamera(pointer, camera)
  raycaster.intersectObjects(meshes, false, hits)
  let found = -1
  for (const h of hits) {
    const i = h.object.userData.index
    if (i !== undefined && curDim[i] < 0.5 && h.distance > 1.5) { found = i; break }
  }
  hoverIdx = found
  canvas.classList.toggle("is-hovering", found >= 0)
}

// ---- Frame ------------------------------------------------------------------------------------------
const updateNodes = (now, dt) => {
  const L = LAYOUTS[layoutIndex]
  if (layoutIndex === TIME) {
    // Straight for most of the step; it only bends in the last stretch.
    const t = reduced ? 1 : smoothstep(0.62, 0.92, progress)
    bendT = t
    ring += (ringTarget - ring) * damp(5, dt)
    fillTime(t)
    // Once the line has closed, ← → and dragging turn the ring instead of walking.
    const closed = t > 0.85
    if (closed !== ringMode) { ringMode = closed; walkTarget.reset(); if (!closed) ringTarget = 0 }
  }
  driftAmp = 0
  curTilt += (L.tilt - curTilt) * damp(3, dt)
  const hovered = focusIdx >= 0 ? focusIdx : hoverIdx
  const ks = damp(4, dt), kh = damp(8, dt)
  const q = camera.quaternion
  const tq = new Quaternion()
  for (let i = 0; i < N; i++) {
    const n = nodes[i]
    const e = easeInOut(clamp01((now - startAt[i]) / DUR))
    const o = i * 3
    for (let a = 0; a < 3; a++) base[o + a] = from[o + a] + (L.pos[o + a] - from[o + a]) * e
    curWid[i] += (L.wid[i] - curWid[i]) * (snapAll ? 1 : Math.max(ks, e > 0.98 ? 1 : 0))
    curRot[i] += (L.rot[i] - curRot[i]) * ks
    const dimTarget = Math.max(L.dim[i], hovered >= 0 && hovered !== i && layoutIndex <= LOOSE ? 0.18 : 0)
    curDim[i] += (dimTarget - curDim[i]) * ks
    hoverAmt[i] += ((hovered === i ? 1 : 0) - hoverAmt[i]) * kh
    // Prints hang still; only you move.
    let x = base[o], y = base[o + 1], z = base[o + 2]
    const h = hoverAmt[i]
    if (h > 0.001) {
      tmp.set(camera.position.x - x, camera.position.y - y, camera.position.z - z).normalize().multiplyScalar((layoutIndex <= LOOSE ? 0.6 : layoutIndex === TIME && !ringMode ? 0 : 0.35) * h)
      x += tmp.x; y += tmp.y; z += tmp.z
    }
    disp[o] = x; disp[o + 1] = y; disp[o + 2] = z
    const m = meshes[i]
    const w = curWid[i] * (1 + (layoutIndex === TIME && !ringMode ? 0 : 0.04) * h)
    m.position.set(x, y, z)
    m.scale.set(w, w / n.ratio, 1)
    // Facing the camera, with the print's own tilt, and its turn on the table.
    tq.identity().slerp(n.tilt, curTilt * (1 - h))
    m.quaternion.copy(q).multiply(tq)
    m.rotateZ(curRot[i] * (1 - h * 0.8))
    m.renderOrder = h > 0.01 ? 10 : 0
    const u = m.material.uniforms
    u.dim.value = curDim[i]
    u.size.value.set(w, w / n.ratio)
    u.frameAlpha.value = 0.18 + 0.82 * h
    shadowMats[i].uniforms.alpha.value = (layoutIndex <= LOOSE ? 0.55 : 0.35) * (1 - curDim[i])
  }
  snapAll = false
}

const updateEdges = dt => {
  points.set(disp)
  for (let y = 0; y < YEARS.length; y++) {
    const o = (A_YEAR + y) * 3
    timeXZ(yearS[y], bendT, xz)
    points[o] = xz[0]; points[o + 1] = AXIS_Y; points[o + 2] = xz[1]
  }
  const sc = layoutIndex
  const meshOn = settings.mesh === "on"
  const hovered = focusIdx >= 0 ? focusIdx : hoverIdx
  const ke = damp(3, dt)
  for (let j = 0; j < edges.length; j++) {
    const ed = edges[j]
    let target = EDGE_ALPHA[ed.type][sc]
    if (!meshOn && !ESSENTIAL.has(ed.type * 10 + sc)) target = 0
    if (meshOn && hovered >= 0 && (ed.a === hovered || ed.b === hovered) && ed.type !== T_STEM && sc <= LOOSE) target = 0.55
    if (ed.a < N) target *= 1 - curDim[ed.a]
    if (ed.b < N) target *= 1 - curDim[ed.b]
    ed.alpha += (target - ed.alpha) * ke
    const a3 = ed.a * 3, b3 = ed.b * 3, o = j * 6, c = j * 8
    edgePos[o] = points[a3]; edgePos[o + 1] = points[a3 + 1]; edgePos[o + 2] = points[a3 + 2]
    if (ed.type === T_CONN) {
      // A thread leaves its cover at the edge, not from under the picture.
      const dx = points[b3] - points[a3], dy = points[b3 + 1] - points[a3 + 1]
      const hw = curWid[ed.a] / 2, hh = hw / nodes[ed.a].ratio
      const t = Math.min(dx ? hw / Math.abs(dx) : 1, dy ? hh / Math.abs(dy) : 1, 1)
      edgePos[o] += dx * t; edgePos[o + 1] += dy * t
    }
    edgePos[o + 3] = points[b3]; edgePos[o + 4] = points[b3 + 1]; edgePos[o + 5] = points[b3 + 2]
    const ca = pointColour[ed.a], cb = pointColour[ed.b]
    edgeCol[c] = ca.r; edgeCol[c + 1] = ca.g; edgeCol[c + 2] = ca.b; edgeCol[c + 3] = ed.alpha
    edgeCol[c + 4] = cb.r; edgeCol[c + 5] = cb.g; edgeCol[c + 6] = cb.b; edgeCol[c + 7] = ed.alpha
  }
  edgeGeometry.attributes.position.needsUpdate = true
  edgeGeometry.attributes.color.needsUpdate = true
  axisMaterial.opacity += ((sc === TIME ? 0.55 : 0) - axisMaterial.opacity) * ke
  axis.visible = axisMaterial.opacity > 0.005
  if (axis.visible) {
    for (let j = 0; j <= AXIS_N; j++) {
      timeXZ(-L_TIME / 2 + (L_TIME * j) / AXIS_N, bendT, xz)
      axisPos[j * 3] = xz[0]; axisPos[j * 3 + 1] = AXIS_Y; axisPos[j * 3 + 2] = xz[1]
    }
    axisGeometry.attributes.position.needsUpdate = true
  }
}

const updateYearLabels = dt => {
  const kl = damp(4, dt)
  for (const l of yearLabels) {
    l.alpha += ((layoutIndex === TIME ? 1 : 0) - l.alpha) * kl
    if (l.alpha < 0.01) { l.el.style.opacity = 0; continue }
    timeXZ(yearS[l.k], bendT, xz)
    proj.set(xz[0], AXIS_Y - 0.5, xz[1]).project(camera)
    const x = (proj.x * 0.5 + 0.5) * innerWidth, y = (-proj.y * 0.5 + 0.5) * innerHeight
    l.el.style.opacity = proj.z > 1 ? 0 : l.alpha
    l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateX(-50%)`
  }
}

let tipFor = -2, tipW = 0, tipH = 0
const updateTip = () => {
  const idx = focusIdx >= 0 ? focusIdx : hoverIdx
  if (idx !== tipFor) {
    tipFor = idx
    if (idx >= 0) {
      const n = nodes[idx], d = describe(n)
      tip.innerHTML = `<b style="color:${CSS[n.form]}">${d.form}</b><strong>${esc(n.title)}</strong><small>${d.meta}</small>`
      tip.classList.add("on")
      tipW = tip.offsetWidth; tipH = tip.offsetHeight
    } else tip.classList.remove("on")
  }
  if (idx < 0) return
  const n = nodes[idx], o = idx * 3, w = curWid[idx] * 1.04
  right.set(1, 0, 0).applyQuaternion(camera.quaternion)
  up.set(0, 1, 0).applyQuaternion(camera.quaternion)
  proj.set(disp[o], disp[o + 1], disp[o + 2]).addScaledVector(right, w / 2).addScaledVector(up, w / n.ratio / 2).project(camera)
  const rx = (proj.x * 0.5 + 0.5) * innerWidth, ty = (-proj.y * 0.5 + 0.5) * innerHeight
  proj.set(disp[o], disp[o + 1], disp[o + 2]).addScaledVector(right, -w / 2).addScaledVector(up, -w / n.ratio / 2).project(camera)
  const lx = (proj.x * 0.5 + 0.5) * innerWidth, by = (-proj.y * 0.5 + 0.5) * innerHeight
  let x = rx + 14, y = ty
  if (x + tipW > innerWidth - 12) { x = lx - tipW - 14; if (x < 12) { x = clamp(lx, 12, innerWidth - tipW - 12); y = by + 10 } }
  y = clamp(y, 12, innerHeight - tipH - 12)
  tip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
}

let raf = 0, last = performance.now(), ready = false
const frame = now => {
  raf = 0
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  clock += reduced ? 0 : dt
  if (scrollDirty) readScroll()
  applyKeys(dt)
  updateCamera(dt)
  // Walking moves prints under a still pointer too.
  if (pointerMoved || keys.size || held.size || drag) pick()
  updateNodes(now, dt)
  updateEdges(dt)
  updateYearLabels(dt)
  updateWords()
  updateTip()
  renderer.render(scene, camera)
  wake()
}
function wake() { if (!raf && renderer && !document.hidden && ready && !destroyed) raf = requestAnimationFrame(frame) }

// ---- Start -------------------------------------------------------------------------------------------------
const resize = () => {
  const W = innerWidth, H = innerHeight
  const narrow = mqNarrow.matches
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 2))
    renderer.setSize(W, H, false)
  }
  computeLayouts()
  if (narrow) { region.w = W; region.h = H * 0.6; region.dx = 0; region.dy = H * 0.19 }
  else {
    const left = G.r.x0 - 30
    region.w = W - left; region.h = H; region.dx = left + region.w / 2 - W / 2; region.dy = 0
  }
  // The time scene frames the region beside the text; D's scenes are already
  // laid out in screen pixels, so they're mapped against the same offset.
  computeLayouts()
  camera.aspect = W / H
  camera.setViewOffset(W, H, -region.dx, region.dy, W, H)
  camera.updateProjectionMatrix()
  if (layoutIndex >= 0) {
    const L = LAYOUTS[layoutIndex]
    base.set(L.pos); from.set(L.pos); startAt.fill(performance.now() - DUR); snapAll = true
    showLabels(L)
  }
  scrollDirty = true
  wake()
}
on(window, "scroll", () => { scrollDirty = true; wake() }, { passive: true })
on(window, "resize", resize)
on(mqReduced, "change", () => { reduced = mqReduced.matches; wake() })
on(document, "visibilitychange", () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0 } else { last = performance.now(); wake() } })

resize()
readScroll()
if (renderer) {
  loadTextures().then(() => {
    ready = true
    snapCamera = true
    last = performance.now()
    const L = LAYOUTS[layoutIndex]
    for (let i = 0; i < N; i++) startAt[i] = performance.now() + 150 + nodes[i].depth * 700
    wake()
    requestAnimationFrame(() => canvas.classList.add("is-ready"))
    root.dataset.ready = "true"
  })
}

return () => {
  destroyed = true
  cancelAnimationFrame(raf)
  clearTimeout(capsTimer)
  clearTimeout(fadeTimer)
  cleanups.forEach(fn => fn())
  meshes.forEach(m => m.material.uniforms.map.value?.dispose())
  scene.traverse(o => { o.geometry?.dispose?.(); o.material?.dispose?.() })
  renderer?.dispose()
  layer.replaceChildren()
  list.replaceChildren()
}
}
