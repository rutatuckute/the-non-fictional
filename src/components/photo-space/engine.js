// The Photography page as one pinned stage of prints: the pile, the edit, the
// archive by place, by roll and as a grid, then the series. Ported from the
// approved mockup (design/photography, K) by design/photography/build/port.mjs.
// Nothing moves unless the reader scrolls, clicks or presses a key.
//
// createPhotoSpace(root, data, { view }) wires the markup in ./markup into a
// working page and returns a function that removes every listener it added.
export function createPhotoSpace(root, DATA, opts = {}) {
const cleanups = []
const addEventListener = (type, fn, o) => { window.addEventListener(type, fn, o); cleanups.push(() => window.removeEventListener(type, fn, o)) }
const docOn = (type, fn, o) => { document.addEventListener(type, fn, o); cleanups.push(() => document.removeEventListener(type, fn, o)) }
if (opts.view && !new URLSearchParams(location.search).get("view")) {
  history.replaceState(history.state, "", location.pathname + "?" + new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(location.search)), view: opts.view }) + location.hash)
}
// Shared by the three mockups: data helpers, URL state, masthead, hover card
// and lightbox. Nothing here moves on its own.
// (data comes in as DATA)
const FRAMES = DATA.frames
const byId = Object.fromEntries(FRAMES.map(f => [f.id, f]))
const TYPE = { portraits: "Portraits", strangers: "Strangers", scenes: "Scenes", lights: "Lights" }
const SERIES = DATA.series.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
const seriesBySlug = Object.fromEntries(SERIES.map(s => [s.slug, s]))
const LIVED = DATA.lived
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
const narrowQuery = matchMedia("(max-width: 860px)")
const hoverable = matchMedia("(hover: hover)").matches
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const seeded = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let v = Math.imul(s ^ (s >>> 15), 1 | s); v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v; return ((v ^ (v >>> 14)) >>> 0) / 4294967296 }
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`

FRAMES.forEach(f => { f.ratio = f.w && f.h ? f.w / f.h : 1.5; f.src = f.m; f.big = f.l || f.m; f.thumb = f.s || f.m })
// Newest first by year, then roll, then title: the archive's own order.
const ARCHIVE = FRAMES.slice().sort((a, b) => (b.year || 0) - (a.year || 0) || ((b.roll ?? -1) - (a.roll ?? -1)) || a.title.localeCompare(b.title))
const SELECTED = FRAMES.filter(f => f.selected).sort((a, b) => (a.selectedOrder ?? 99) - (b.selectedOrder ?? 99))
const seriesFrames = slug => FRAMES.filter(f => f.series === slug).sort((a, b) => (a.seriesOrder ?? 99) - (b.seriesOrder ?? 99))
SERIES.forEach((s, i) => {
  s.frames = seriesFrames(s.slug)
  s.cover = s.frames[0]
  s.numeral = ROMAN[i] || String(i + 1)
  const ys = s.frames.map(f => f.year).filter(Boolean)
  s.years = ys.length ? (Math.min(...ys) === Math.max(...ys) ? String(ys[0]) : `${Math.min(...ys)}–${Math.max(...ys)}`) : ""
  s.places = [...new Set(s.frames.map(f => f.city))].filter(Boolean)
})

const MARK = '<svg width="11" height="11" aria-hidden="true"><path d="M.75 4V.75H4M7 .75h3.25V4M10.25 7v3.25H7M4 10.25H.75V7" stroke="var(--photography)" stroke-width="1.4" fill="none"/></svg>'
const metaLine = f => [f.year, f.location].filter(Boolean).join(" · ")

// ---------- URL state: ?view=, ?frame= and anything a mockup adds
const query = () => new URLSearchParams(location.search)
function setQuery(changes, replace = false) {
  const q = query()
  for (const [k, v] of Object.entries(changes)) (v == null || v === "") ? q.delete(k) : q.set(k, v)
  const s = q.toString()
  const url = location.pathname + (s ? "?" + s : "") + location.hash
  try { history[replace ? "replaceState" : "pushState"](null, "", url) } catch (e) { /* file:// in some browsers */ }
}

// ---------- masthead and footer
function chrome() {}

// ---------- hover card
const tip = document.createElement("div")
tip.className = "tip"; tip.setAttribute("aria-hidden", "true")
root.appendChild(tip)
function tipHtml(f, note) {
  const s = f.series ? seriesBySlug[f.series] : null
  const pos = s ? s.frames.indexOf(f) + 1 : 0
  return `<b>${MARK}Photograph · ${esc(TYPE[f.type] || "Frame")}</b><strong>${esc(f.title)}</strong><small>${esc(metaLine(f))}${f.roll ? " · Roll " + f.roll : ""}</small>${s ? `<small>Series: ${esc(s.title)}, ${pos} of ${s.frames.length}</small>` : ""}${note === false ? "" : `<i>${esc(note || "Click to open")}</i>`}`
}
let tipFor = null
function showTip(f, el, note, force = false) {
  if (!force && !hoverable && !el.matches(":focus-visible")) return
  tipFor = el
  const b = el.getBoundingClientRect()
  tip.innerHTML = tipHtml(f, note)
  tip.classList.add("on")
  const tw = tip.offsetWidth, th = tip.offsetHeight
  let x = b.right + 14, y = b.top + 8
  if (x + tw > innerWidth - 10) x = b.left - tw - 14
  if (x < 10) { x = clamp(b.left + b.width / 2 - tw / 2, 10, innerWidth - tw - 10); y = b.bottom + 10; if (y + th > innerHeight - 10) y = b.top - th - 10 }
  tip.style.left = x + "px"; tip.style.top = clamp(y, 10, innerHeight - th - 10) + "px"
}
const hideTip = () => { tip.classList.remove("on"); tipFor = null }
addEventListener("scroll", hideTip, { passive: true })
// On touch, the first tap shows the caption and the second opens the frame.
let lastPointer = "mouse"
addEventListener("pointerdown", e => { lastPointer = e.pointerType }, true)
docOn("click", e => { if (tipFor && !tipFor.contains(e.target)) hideTip() })
function bindPrint(el, f, open, noteArg) {
  const noteOf = () => (typeof noteArg === "function" ? noteArg() : noteArg)
  el.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") showTip(f, el, noteOf()) })
  el.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hideTip() })
  el.addEventListener("focus", () => { if (lastPointer !== "touch") showTip(f, el, noteOf()) })
  el.addEventListener("blur", () => { if (lastPointer !== "touch") hideTip() })
  el.addEventListener("click", e => {
    e.preventDefault()
    if (lastPointer === "touch" && tipFor !== el) { e.stopPropagation(); showTip(f, el, (noteOf() || "Click to open").replace(/^Click/, "Tap again"), true); return }
    hideTip(); open()
  })
}
function printEl(f, { tag = "a", cls = "", big = false } = {}) {
  const el = document.createElement(tag)
  el.className = "print " + cls
  if (tag === "a") el.href = "?frame=" + encodeURIComponent(f.id)
  el.setAttribute("aria-label", `${f.title}, ${metaLine(f)}`)
  el.innerHTML = `<img alt="" src="${big ? f.big : f.src}" decoding="async" draggable="false">`
  return el
}

// ---------- lightbox
const lb = document.createElement("div")
lb.className = "lb"; lb.hidden = true
lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true")
lb.innerHTML = `
  <figure class="lb-figure"><img alt=""></figure>
  <aside class="lb-cap">
    <b>${MARK}<span class="lb-type"></span></b>
    <h2 class="lb-title"></h2>
    <dl class="lb-meta"></dl>
    <p class="lb-context"></p>
    <div class="lb-steps">
      <button type="button" class="lb-prev" aria-label="Previous frame">← <span>Previous</span></button>
      <span class="lb-count"></span>
      <button type="button" class="lb-next" aria-label="Next frame"><span>Next</span> →</button>
    </div>
    <p class="lb-keys">← → to step · Esc to close</p>
  </aside>
  <button type="button" class="lb-close">Close <span aria-hidden="true">✕</span></button>`
root.appendChild(lb)
const LB = { list: [], i: 0, context: "", returnFocus: null, extraRows: null, onSeries: null }
function renderLightbox() {
  const f = LB.list[LB.i]
  $(".lb-figure img", lb).src = f.big
  $(".lb-figure img", lb).alt = f.title
  $(".lb-type", lb).textContent = "Photograph · " + (TYPE[f.type] || "Frame")
  $(".lb-title", lb).textContent = f.title
  lb.setAttribute("aria-label", f.title)
  const s = f.series ? seriesBySlug[f.series] : null
  const rows = [
    ["Place", esc(f.location)],
    ["Year", f.year ? String(f.year) : null],
    ["Roll", f.roll ? "No. " + f.roll : "Not noted"],
    ["Series", s ? `<a data-series="${esc(s.slug)}">${esc(s.title)}</a> · ${s.frames.indexOf(f) + 1} of ${s.frames.length}` : null],
    ...(LB.extraRows ? LB.extraRows(f) : []),
  ].filter(r => r[1] != null && r[1] !== "")
  $(".lb-meta", lb).innerHTML = rows.map(([k, v, cls]) => `<dt>${k}</dt><dd${cls ? ` class="${cls}"` : ""}>${v}</dd>`).join("")
  $(".lb-context", lb).textContent = LB.context
  $(".lb-count", lb).textContent = `${LB.i + 1} / ${LB.list.length}`
  $(".lb-prev", lb).disabled = LB.i === 0
  $(".lb-next", lb).disabled = LB.i === LB.list.length - 1
  $(".lb-steps", lb).hidden = LB.list.length < 2
  const link = $("[data-series]", lb)
  if (link && LB.onSeries) { link.href = "?view=series&series=" + encodeURIComponent(link.dataset.series); link.addEventListener("click", e => { e.preventDefault(); const slug = link.dataset.series; closeLightbox(); LB.onSeries(slug) }) }
  else if (link) link.removeAttribute("data-series")
}
function openLightbox(list, i, context = "", push = true) {
  LB.list = list; LB.i = i; LB.context = context
  LB.returnFocus = document.activeElement
  renderLightbox()
  lb.hidden = false
  document.documentElement.style.overflow = "hidden"
  setQuery({ frame: list[i].id }, !push)
  $(".lb-close", lb).focus({ preventScroll: true })
}
function stepLightbox(d) {
  const n = clamp(LB.i + d, 0, LB.list.length - 1)
  if (n === LB.i) return
  LB.i = n; renderLightbox(); setQuery({ frame: LB.list[n].id }, true)
}
function closeLightbox(updateUrl = true) {
  if (lb.hidden) return
  lb.hidden = true
  document.documentElement.style.overflow = ""
  if (updateUrl) setQuery({ frame: null }, true)
  if (LB.returnFocus && LB.returnFocus.focus) LB.returnFocus.focus({ preventScroll: true })
}
$(".lb-prev", lb).addEventListener("click", () => stepLightbox(-1))
$(".lb-next", lb).addEventListener("click", () => stepLightbox(1))
$(".lb-close", lb).addEventListener("click", () => closeLightbox())
lb.addEventListener("click", e => { if (e.target === lb || e.target.classList.contains("lb-figure")) closeLightbox() })
addEventListener("keydown", e => {
  if (lb.hidden) return
  if (e.key === "Escape") closeLightbox()
  if (e.key === "ArrowRight") stepLightbox(1)
  if (e.key === "ArrowLeft") stepLightbox(-1)
})
// Touch: a horizontal swipe steps, which is the user's own movement.
let touchX = null
lb.addEventListener("touchstart", e => { touchX = e.touches[0].clientX }, { passive: true })
lb.addEventListener("touchend", e => { if (touchX == null) return; const dx = e.changedTouches[0].clientX - touchX; if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1); touchX = null })
// A frame arriving by link opens in the context given, or alone.
function openFromUrl(contextFor) {
  const id = query().get("frame")
  if (!id || !byId[id]) return
  const { list, label } = contextFor(byId[id])
  openLightbox(list, Math.max(0, list.indexOf(byId[id])), label, false)
}
addEventListener("popstate", () => { if (!query().get("frame")) closeLightbox(false) })

// ---------- justified rows: frames at their own proportions, rows filled to a width
function justify(list, width, rowH, gap, { lastFull = false } = {}) {
  const rows = []
  let row = [], sum = 0
  for (const f of list) {
    row.push(f); sum += f.ratio
    if (sum * rowH + gap * (row.length - 1) >= width) {
      const h = (width - gap * (row.length - 1)) / sum
      rows.push({ h, items: row.map(x => ({ f: x, w: x.ratio * h })) })
      row = []; sum = 0
    }
  }
  if (row.length) {
    let h = rowH
    if (lastFull || sum * rowH + gap * (row.length - 1) > width) h = (width - gap * (row.length - 1)) / sum
    rows.push({ h, items: row.map(x => ({ f: x, w: x.ratio * h })), last: true })
  }
  return rows
}
function justifiedHtml(rows, gap) {
  return rows.map(r => `<div class="jrow" style="height:${r.h.toFixed(1)}px;gap:${gap}px">${r.items.map(it => `<a class="print" href="?frame=${encodeURIComponent(it.f.id)}" data-id="${esc(it.f.id)}" style="width:${it.w.toFixed(1)}px;height:${r.h.toFixed(1)}px" aria-label="${esc(it.f.title)}, ${esc(metaLine(it.f))}"><img alt="" src="${it.f.src}" decoding="async" draggable="false"></a>`).join("")}</div>`).join("")
}

// The pile and its scenes, shared by B, C and D. One pinned stage holds every
// frame as a print; invisible scroll steps behind it re-lay the same prints.
// Nothing moves except in answer to the reader's scroll, click or key.

const SCENE_TEXT = {
  edit1: { title: "Selected", body: "The edit: twelve frames, in the order they are meant to be seen. The first six." },
  edit2: { title: "Selected, continued", body: "The other six. Click a print to see it whole, then step through all twelve." },
  edit: { title: "Selected", body: "Twelve frames, in the order they are meant to be seen." },
  places: { title: "Where", body: "Vilnius, Paris and London, the cities lived in, and everywhere else the film went." },
  rolls: { title: "Roll by roll", body: "Straight off the film, newest roll first. 38 frames have no roll number yet." },
  years: { title: "When", body: "2011 to 2026, oldest first. Most of it since 2019." },
  series: { title: "Series", body: "Nine series, each a stack. Click one to open it." },
  all: { title: "Archive", body: "Every frame at once, newest first. Keep scrolling to filter them." },
}

// Best-candidate placement: each print takes the spot that overlaps the
// prints already down the least, so a pile fills its box evenly.
function place(items, box, rand, pad, tries = 200, avoid = []) {
  const placed = avoid.map(a => ({ ...a })), out = {}
  for (const it of items) {
    let best = null, bestScore = Infinity
    for (let k = 0; k < tries; k++) {
      const x = box.x0 + it.w / 2 + rand() * Math.max(1, box.x1 - box.x0 - it.w)
      const y = box.y0 + it.h / 2 + rand() * Math.max(1, box.y1 - box.y0 - it.h)
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
    out[it.f.id] = best
  }
  return out
}
function pileLayout(list, box, rand, hBase, hVar, tilt, zBase = 0, avoid = []) {
  const items = list.map(f => { const h = hBase + rand() * hVar; return { f, h, w: h * f.ratio, weight: f.selected ? 2 : 1 } })
  const at = place(items, box, rand, -4, 200, avoid)
  const pos = {}
  items.forEach((it, i) => { pos[it.f.id] = { x: at[it.f.id].x, y: at[it.f.id].y, h: it.h, r: (rand() - .5) * tilt, z: zBase + i } })
  return pos
}
// Rows that fit a box, centred: the number of rows that gives the biggest
// prints, with the frames split evenly between them (in order).
function fitRows(list, box, gap, maxH) {
  const width = box.x1 - box.x0, height = box.y1 - box.y0
  const total = list.reduce((a, f) => a + f.ratio, 0)
  let best = null
  for (let k = 1; k <= Math.min(list.length, 40); k++) {
    const target = total / k, groups = []
    let cur = [], sum = 0
    list.forEach(f => {
      if (cur.length && groups.length < k - 1 && sum + f.ratio / 2 > target) { groups.push(cur); cur = []; sum = 0 }
      cur.push(f); sum += f.ratio
    })
    groups.push(cur)
    // One height for every row: the most the width, the height and maxH allow.
    const h = Math.min(maxH, (height - gap * (groups.length - 1)) / groups.length, ...groups.map(g => (width - gap * (g.length - 1)) / g.reduce((a, f) => a + f.ratio, 0)))
    if (h < 14) continue
    const rows = groups.map(g => ({ h, items: g.map(f => ({ f, w: f.ratio * h })) }))
    const tot = h * rows.length + gap * (rows.length - 1)
    const score = h
    if (!best || score > best.score) best = { score, rows, tot }
  }
  if (!best) { const rows = justify(list, width, 14, gap); best = { rows, tot: rows.reduce((a, r) => a + r.h, 0) + gap * (rows.length - 1) } }
  let y = box.y0 + Math.max(0, (height - best.tot) / 2)
  const pos = {}
  for (const r of best.rows) {
    const used = r.items.reduce((a, it) => a + it.w, 0) + gap * (r.items.length - 1)
    let x = box.x0 + Math.max(0, (width - used) / 2)
    for (const it of r.items) { pos[it.f.id] = { x: x + it.w / 2, y: y + r.h / 2, h: r.h, z: 200 }; x += it.w + gap }
    y += r.h + gap
  }
  return pos
}
// Groups laid as blocks that wrap like words: a roll per strip of film, or a
// year per stretch of timeline.
function flow(groups, box, narrow, { strip, labelH, maxH, gap, groupGap, lineGap, pad, minW = 0 }) {
  const width = box.x1 - box.x0
  let best = null
  for (let h = maxH; h > 12; h -= 2) {
    const out = { pos: {}, labels: [] }
    let x = box.x0, y = box.y0, fits = true, lines = []
    const lineH = labelH + h + pad * 2
    let line = []
    const newLine = () => { lines.push(line); line = [] }
    for (const g of groups) {
      const pieces = []
      let cur = [], w = pad * 2
      for (const f of g.frames) {
        const fw = f.ratio * h
        if (cur.length && w + fw + gap > width) { pieces.push(cur); cur = []; w = pad * 2 }
        cur.push(f); w += fw + (cur.length > 1 ? gap : 0)
      }
      if (cur.length) pieces.push(cur)
      pieces.forEach((piece, pi) => {
        const natural = pad * 2 + piece.reduce((a, f) => a + f.ratio * h, 0) + gap * (piece.length - 1)
        const pw = Math.max(natural, pi === 0 ? minW : 0)
        if (x > box.x0 && x + pw > box.x1) { x = box.x0; y += lineH + lineGap; newLine() }
        if (y + lineH > box.y1) fits = false
        line.push({ g, piece, pi, x, y, pw, natural })
        x += pw + groupGap
      })
    }
    newLine()
    // Centre each line, so the blocks sit in the middle of the full width.
    const usedH = lines.length * (lineH + lineGap) - lineGap
    const dy = Math.max(0, (box.y1 - box.y0 - usedH) / 2)
    for (const ln of lines) {
      if (!ln.length) continue
      const last = ln[ln.length - 1]
      const dx = (box.x1 - (last.x + last.pw)) / 2
      for (const b of ln) {
        const bx = b.x + dx, by = b.y + dy
        if (strip) out.labels.push({ cls: "strip", x: bx, y: by + labelH, w: b.pw, h: h + pad * 2, html: b.pi === 0 ? `<b>${b.g.label}${narrow ? "" : `<span>${b.g.meta}</span>`}</b>` : "" })
        else {
          out.labels.push({ cls: "axis", x: bx, y: by + labelH + h + pad * 2 - 1, w: b.pw, h: 1, html: "" })
          if (b.pi === 0) out.labels.push({ cls: "year", x: bx, y: by + labelH - (narrow ? 22 : 32), html: `${b.g.label}<span>${b.g.meta}</span>` })
        }
        let fx = bx + pad + (b.pw - b.natural) / 2
        for (const f of b.piece) { const fw = f.ratio * h; out.pos[f.id] = { x: fx + fw / 2, y: by + labelH + pad + h / 2, h, z: 200 }; fx += fw + gap }
      }
    }
    best = out
    if (fits) break
  }
  return best
}

function setupPile(cfg) {
  const { stage, before, track, scenes } = cfg
  const P = { G: null, L: {}, current: null, openSeries: null, labelEls: [], list: null }
  const items = ARCHIVE.map(f => {
    const el = printEl(f, { cls: "item" })
    $("img", el).src = f.thumb
    f.bh = 340; f.bw = 340 * f.ratio
    el.style.width = f.bw + "px"; el.style.height = f.bh + "px"
    stage.insertBefore(el, before)
    f.el = el
    // The hover note depends on the scene: a stack opens, a print opens.
    bindPrint(el, f, () => onPrint(f), () => noteFor(f))
    return f
  })
  const sceneKey = () => (P.current == null || P.current < 0 ? "hero" : scenes[P.current])
  const noteFor = f => (sceneKey() === "series" && !P.openSeries && f.series ? "Click to open the series" : "Click to open")
  function onPrint(f) {
    if (sceneKey() === "series" && !P.openSeries && f.series) return openSeries(f.series)
    const ctx = P.list && P.list.list.includes(f) ? P.list : { list: [f], label: "" }
    openLightbox(ctx.list, ctx.list.indexOf(f), ctx.label)
  }

  track.innerHTML = scenes.map(k => `<div class="step ${k === "series" ? "tall" : ""}" data-key="${k}"></div>`).join("")
  const stepEls = $$(".step", track)

  function compute() {
    const G = (P.G = cfg.geometry())
    const { r, S, narrow, W, H } = G
    const rw = r.x1 - r.x0, rh = r.y1 - r.y0
    const L = (P.L = {})
    // The opening pile, full bleed; the edit on top.
    {
      const rand = seeded(cfg.seed || 11)
      const box = G.heroBox
      const area = (box.x1 - box.x0) * (box.y1 - box.y0)
      const base = Math.sqrt(area / ARCHIVE.length) * (narrow ? .95 : 1.02)
      const rest = ARCHIVE.filter(f => !f.selected)
      const inner = G.heroInner || { x0: box.x0 + (box.x1 - box.x0) * .1, x1: box.x1 - (box.x1 - box.x0) * .1, y0: box.y0 + (box.y1 - box.y0) * .1, y1: box.y1 - (box.y1 - box.y0) * .1 }
      const avoid = G.heroAvoid || []
      L.hero = { pos: { ...pileLayout(rest, box, rand, base * .8, base * .45, 10, 0), ...pileLayout(SELECTED.slice().reverse(), inner, rand, base * 1.35, base * .3, 8, 200, avoid) }, labels: [], list: { list: SELECTED, label: "From the edit" } }
    }
    const gapE = narrow ? 8 : 18
    L.edit1 = { pos: fitRows(SELECTED.slice(0, 6), r, gapE, narrow ? 300 : 700), labels: [], list: { list: SELECTED, label: "Selected" } }
    L.edit2 = { pos: fitRows(SELECTED.slice(6), r, gapE, narrow ? 300 : 700), labels: [], list: { list: SELECTED, label: "Selected" } }
    L.edit = { pos: fitRows(SELECTED, r, narrow ? 6 : 14, narrow ? 240 : 560), labels: [], list: { list: SELECTED, label: "Selected" } }

    // Where: a pile per lived-in city, and one for everywhere else.
    {
      const groups = [...LIVED.map(c => ({ label: c, em: "lived in", frames: ARCHIVE.filter(f => f.city === c) })), { label: "Elsewhere", em: `${new Set(ARCHIVE.filter(f => !LIVED.includes(f.city)).map(f => f.city)).size} places`, frames: ARCHIVE.filter(f => !LIVED.includes(f.city)) }]
      const pos = {}, labels = [], rand = seeded(23)
      if (narrow) {
        const cw = (rw - 12) / 2, ch = (rh - 26) / 2
        groups.forEach((g, i) => {
          const x0 = r.x0 + (i % 2) * (cw + 12), y0 = r.y0 + Math.floor(i / 2) * (ch + 26)
          labels.push({ cls: "group", x: x0, y: y0, html: `${g.label}<span>${g.frames.length}</span>` })
          const hB = clamp(Math.sqrt(cw * (ch - 18) / (g.frames.length * 1.1)), 30, 110)
          Object.assign(pos, pileLayout(g.frames, { x0, x1: x0 + cw, y0: y0 + 18, y1: y0 + ch }, rand, hB * .85, hB * .3, 9, 0))
        })
      } else {
        const weights = groups.map(g => Math.sqrt(g.frames.length) + 1.2)
        const sum = weights.reduce((a, b) => a + b, 0), gap = 48 * S
        let x = r.x0
        groups.forEach((g, i) => {
          const cw = (rw - gap * (groups.length - 1)) * weights[i] / sum
          labels.push({ cls: "group", x, y: r.y0 + 6, html: `${g.label}<span>${g.frames.length}</span><em>${g.em}</em>` })
          const hB = clamp(Math.sqrt(cw * (rh - 40) / (g.frames.length * 1.15)) * .95, 60 * S, 260 * S)
          Object.assign(pos, pileLayout(g.frames, { x0: x, x1: x + cw, y0: r.y0 + 34, y1: r.y1 }, rand, hB * .85, hB * .3, 9, 0))
          x += cw + gap
        })
      }
      L.places = { pos, labels, list: { list: groups.flatMap(g => g.frames), label: "By place" } }
    }
    // Roll by roll: a strip of film per numbered roll; the rest in a dim pile.
    {
      const rolls = {}
      ARCHIVE.filter(f => f.roll != null).forEach(f => (rolls[f.roll] = rolls[f.roll] || []).push(f))
      const groups = Object.keys(rolls).map(Number).sort((a, b) => b - a).map(n => ({ label: "Roll " + n, meta: rolls[n][0].year, frames: rolls[n] }))
      const pileW = narrow ? 0 : Math.min(240 * S, rw * 0.16)
      const box = narrow ? { x0: r.x0, x1: r.x1, y0: r.y0 + 4, y1: r.y1 - 60 } : { x0: r.x0, x1: r.x1 - pileW - 40, y0: r.y0 + 10, y1: r.y1 }
      const out = flow(groups, box, narrow, { strip: true, labelH: 18, maxH: 170, gap: 3, groupGap: narrow ? 8 : 16, lineGap: narrow ? 8 : 14, pad: narrow ? 4 : 7, minW: narrow ? 66 : 108 })
      const unknown = ARCHIVE.filter(f => f.roll == null)
      const ub = narrow ? { x0: r.x0 + 150, x1: r.x1 - 4, y0: r.y1 - 52, y1: r.y1 } : { x0: r.x1 - pileW, x1: r.x1, y0: r.y0 + rh / 2 - pileW * .55, y1: r.y0 + rh / 2 + pileW * .55 }
      const up = pileLayout(unknown, ub, seeded(5), (narrow ? 24 : 48) * S, (narrow ? 8 : 16) * S, 14, 0)
      for (const id in up) up[id].dim = true, up[id].o = .55
      out.labels.push({ cls: "note", x: narrow ? r.x0 : ub.x0, y: narrow ? r.y1 - 46 : ub.y0 - 48, w: narrow ? 140 : pileW, html: "38 frames, roll not noted" })
      L.rolls = { pos: { ...out.pos, ...up }, labels: out.labels, list: { list: ARCHIVE.filter(f => f.roll != null), label: "Roll by roll" } }
    }
    // When: oldest first, a stretch of timeline per year.
    {
      const ys = {}
      ARCHIVE.forEach(f => (ys[f.year] = ys[f.year] || []).push(f))
      const groups = Object.keys(ys).map(Number).sort((a, b) => a - b).map(y => ({ label: y, meta: ys[y].length, frames: ys[y].slice().reverse() }))
      const out = flow(groups, r, narrow, { strip: false, labelH: narrow ? 26 : 42, maxH: 180, gap: narrow ? 2 : 4, groupGap: narrow ? 10 : 24, lineGap: narrow ? 6 : 14, pad: narrow ? 3 : 6, minW: narrow ? 62 : 92 })
      L.years = { pos: out.pos, labels: out.labels, list: { list: groups.flatMap(g => g.frames), label: "By year" } }
    }
    // Series: a fanned stack each; the frames that stand alone leave.
    {
      const capBlock = narrow ? 44 : 74, spread = (narrow ? 5 : 12) * S
      let best = null
      for (const cols of narrow ? [2, 3] : [3, 4, 5]) {
        const rows = Math.ceil(SERIES.length / cols), cw = rw / cols, ch = rh / rows
        const h = Math.min(ch - capBlock - 16, 520 * S)
        // A stack never reaches into its neighbour's cell.
        const lim = SERIES.map(s => Math.min(h, (cw - (narrow ? 14 : 48) - spread * (s.frames.length - 1)) / (Math.max(...s.frames.map(f => f.ratio)) * 1.06)))
        // Stacks of about the same area, so a landscape set is not dwarfed by a portrait one.
        const ra = SERIES.map(s => s.frames.reduce((a, f) => a + f.ratio, 0) / s.frames.length)
        const C = Math.min(...lim.map((l, i) => l * l * ra[i])) * 1.6
        const hs = lim.map((l, i) => Math.min(l, Math.sqrt(C / ra[i])))
        const score = hs.reduce((a, b, i) => a + b * b * ra[i], 0)
        if (!best || score > best.score) best = { cols, rows, cw, ch, hs, score }
      }
      const { cols, cw, ch, hs } = best
      const pos = {}, labels = []
      const lastRow = SERIES.length - cols * (best.rows - 1)
      SERIES.forEach((s, i) => {
        const row = Math.floor(i / cols), inRow = row === best.rows - 1 ? lastRow : cols
        const rowH = Math.max(...hs.slice(row * cols, row * cols + cols))
        const top = r.y0 + row * ch + Math.max(0, (ch - rowH - capBlock) / 2)
        const cx = r.x0 + (rw - inRow * cw) / 2 + (i % cols) * cw + cw / 2
        const n = s.frames.length, h = hs[i]
        s.frames.slice().reverse().forEach((f, k) => {
          const j = n - 1 - k, off = j - (n - 1) / 2
          pos[f.id] = { x: cx + off * spread, y: top + rowH - h / 2 + Math.abs(off) * 2, h, r: off * (narrow ? 3 : 3.5), z: 200 + (n - j) }
        })
        labels.push({ cls: "stackcap", x: cx - cw / 2 + 8, y: top + rowH + (narrow ? 14 : 24), w: cw - 16, html: narrow ? `<strong>${esc(s.title)}</strong><small>${plural(n, "frame")}</small>` : `<strong>${esc(s.title)}</strong><small>Series ${s.numeral} · ${plural(n, "frame")} · ${esc(s.places.join(", "))} · ${s.years}</small>` })
      })
      L.series = { pos, labels, list: { list: SERIES.flatMap(s => s.frames), label: "Series" } }
      SERIES.forEach(s => {
        L["series:" + s.slug] = { pos: fitRows(s.frames, r, narrow ? 8 : 18, narrow ? 320 : 660), labels: [], list: { list: s.frames, label: "Series · " + s.title } }
      })
    }
    L.all = { pos: fitRows(ARCHIVE, r, narrow ? 2 : 4, 260), labels: [], list: { list: ARCHIVE, label: "Archive · newest first" } }
    if (cfg.extend) cfg.extend(L, G)
  }

  function render(layout) {
    P.list = layout.list
    items.forEach(f => {
      const p = layout.pos[f.id], el = f.el
      if (!p) { el.style.opacity = 0; el.classList.add("off"); el.tabIndex = -1; return }
      const s = p.h / f.bh
      el.style.transform = `translate3d(${(p.x - f.bw / 2).toFixed(1)}px, ${(p.y - f.bh / 2).toFixed(1)}px, 0) rotate(${(p.r || 0).toFixed(2)}deg) scale(${s.toFixed(4)})`
      el.style.opacity = p.o ?? 1
      el.style.zIndex = Math.round(p.z ?? 100)
      el.classList.toggle("dim", !!p.dim)
      el.classList.remove("off")
      el.tabIndex = 0
    })
    P.labelEls.forEach(el => el.remove())
    P.labelEls = layout.labels.map(l => {
      const el = document.createElement("div")
      el.className = "lab " + l.cls
      el.innerHTML = l.html
      el.style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px)`
      if (l.w) el.style.width = l.w + "px"
      if (l.h) el.style.height = l.h + "px"
      stage.insertBefore(el, before)
      return el
    })
    const els = P.labelEls
    setTimeout(() => els.forEach(el => el.classList.add("on")), stage.classList.contains("anim") && !reduceMotion ? 450 : 0)
  }
  function draw() {
    const key = sceneKey()
    const layout = key === "series" && P.openSeries ? P.L["series:" + P.openSeries] : P.L[key]
    stage.dataset.scene = key
    hideTip()
    render(layout)
    cfg.onScene && cfg.onScene(P.current, key, P.openSeries ? seriesBySlug[P.openSeries] : null, P.G)
  }
  function openSeries(slug) {
    P.openSeries = slug
    setQuery({ series: slug }, true)
    hideTip(); draw()
  }
  function closeSeries() { P.openSeries = null; setQuery({ series: null }, true); draw() }
  function frame() {
    const line = innerHeight * 0.5
    let scene = -1
    stepEls.forEach((el, i) => { if (el.getBoundingClientRect().top <= line) scene = i })
    // Past the last step the stage holds its final scene while the archive slides over it.
    if (scene === P.current) return
    P.current = scene
    if (scenes[scene] !== "series" && P.openSeries) { P.openSeries = null; setQuery({ series: null }, true) }
    draw()
  }
  function jump(key) {
    if (key === "hero") return scrollTo({ top: 0, behavior: "instant" })
    const i = scenes.indexOf(key)
    if (i < 0) return
    const el = stepEls[i]
    scrollTo({ top: el.getBoundingClientRect().top + scrollY - innerHeight * 0.5 + 4, behavior: "instant" })
  }
  let raf = 0
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame() }) }, { passive: true })
  addEventListener("resize", () => { compute(); P.current = null; frame() })
  addEventListener("keydown", e => { if (e.key === "Escape" && lb.hidden && P.openSeries) closeSeries() })
  LB.onSeries = slug => { jump("series"); P.current = scenes.indexOf("series"); openSeries(slug) }

  compute()
  // A series arriving by link opens in place.
  const linked = query().get("series")
  frame()
  if (linked && seriesBySlug[linked]) LB.onSeries(linked)
  requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("anim")))
  return { P, jump, frame, compute, openSeries, closeSeries, sceneKey, stepEls }
}

// ---------- the archive, after the pile: filters and every frame
function setupArchive(root) {
  const F = { type: [], lived: [], year: "", place: "" }
  const countBy = (list, pick) => { const m = new Map(); list.forEach(f => { const v = pick(f); if (v) m.set(v, (m.get(v) || 0) + 1) }); return m }
  const passes = (f, skip) => (skip === "type" || !F.type.length || F.type.includes(f.type)) && (skip === "lived" || !F.lived.length || F.lived.includes(f.city)) && (skip === "year" || !F.year || String(f.year) === F.year) && (skip === "place" || !F.place || f.country === F.place)
  const q = query()
  F.type = (q.get("type") || "").split(",").filter(Boolean)
  F.lived = (q.get("lived") || "").split(",").filter(Boolean)
  F.year = q.get("year") || ""; F.place = q.get("place") || ""
  const write = () => setQuery({ type: F.type.join(","), lived: F.lived.join(","), year: F.year, place: F.place }, true)
  root.innerHTML = `<div class="archive-head"><div><p class="kicker">Archive</p><h2>Every frame</h2></div><p>All ${FRAMES.length} frames, newest first: the edit, the series and everything else. Filter by type, the cities lived in, year or country.</p></div><div class="filters"></div><div class="sheet"></div>`
  const filters = $(".filters", root), sheet = $(".sheet", root)
  function draw() {
    const types = countBy(FRAMES.filter(f => passes(f, "type")), f => f.type)
    const lived = countBy(FRAMES.filter(f => passes(f, "lived")), f => LIVED.includes(f.city) ? f.city : null)
    const years = countBy(FRAMES.filter(f => passes(f, "year")), f => String(f.year))
    const places = countBy(FRAMES.filter(f => passes(f, "place")), f => f.country)
    const list = ARCHIVE.filter(f => passes(f))
    const any = F.type.length || F.lived.length || F.year || F.place
    filters.innerHTML = `
      <div class="grp"><span class="label">Type</span>${Object.keys(TYPE).map(t => `<button type="button" class="chip" data-f="type" data-v="${t}" aria-pressed="${F.type.includes(t)}" ${!types.get(t) && !F.type.includes(t) ? "disabled" : ""}>${TYPE[t]}<span>${types.get(t) || 0}</span></button>`).join("")}</div>
      <div class="grp"><span class="label">Lived in</span>${LIVED.map(c => `<button type="button" class="chip" data-f="lived" data-v="${c}" aria-pressed="${F.lived.includes(c)}" ${!lived.get(c) && !F.lived.includes(c) ? "disabled" : ""}>${c}<span>${lived.get(c) || 0}</span></button>`).join("")}</div>
      <div class="grp">
        <label class="select"><b>Year</b><select data-s="year"><option value="">All</option>${[...new Set(FRAMES.map(f => String(f.year)))].sort((a, b) => b - a).map(y => `<option value="${y}" ${F.year === y ? "selected" : ""}>${y} (${years.get(y) || 0})</option>`).join("")}</select></label>
        <label class="select"><b>Country</b><select data-s="place"><option value="">All</option>${[...countBy(FRAMES, f => f.country).keys()].sort().map(c => `<option value="${esc(c)}" ${F.place === c ? "selected" : ""}>${esc(c)} (${places.get(c) || 0})</option>`).join("")}</select></label>
      </div>
      <div class="count"><span><strong>${list.length}</strong> of ${FRAMES.length}</span>${any ? '<button type="button" class="clear">Clear</button>' : ""}</div>`
    $$("[data-f]", filters).forEach(b => b.addEventListener("click", () => { const a = F[b.dataset.f]; const i = a.indexOf(b.dataset.v); i < 0 ? a.push(b.dataset.v) : a.splice(i, 1); write(); draw() }))
    $$("[data-s]", filters).forEach(s => s.addEventListener("change", () => { F[s.dataset.s] = s.value; write(); draw() }))
    const c = $(".clear", filters); if (c) c.addEventListener("click", () => { F.type = []; F.lived = []; F.year = ""; F.place = ""; write(); draw() })
    const width = sheet.clientWidth
    const narrow = narrowQuery.matches, gap = narrow ? 5 : 12
    const years2 = [...new Set(list.map(f => f.year))]
    sheet.innerHTML = list.length ? years2.map(y => {
      const fs = list.filter(f => f.year === y)
      return `<section class="yeargroup"><h3>${y}<span>${plural(fs.length, "frame")}</span></h3>${justifiedHtml(justify(fs, width, narrow ? 120 : clamp(width / 6, 200, 300), gap), gap)}</section>`
    }).join("") : `<p class="empty">Nothing matches. Try clearing a filter.</p>`
    $$(".print", sheet).forEach(el => { const f = byId[el.dataset.id]; bindPrint(el, f, () => openLightbox(list, list.indexOf(f), "Archive · newest first")) })
  }
  draw()
  let w = innerWidth
  addEventListener("resize", () => { if (innerWidth !== w) { w = innerWidth; draw() } })
  return { draw }
}



chrome()

// ---------- the opened frame, as the live page shows it: the photograph up to
// 80% of the height, a centred caption under it, arrows at the sides, a cross
// top right; it wraps round at either end.
lb.innerHTML = `
  <button type="button" class="lbx-scrim" aria-label="Close" tabindex="-1"></button>
  <button type="button" class="lb-close lbx-btn" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button>
  <button type="button" class="lb-prev lbx-btn lbx-step" aria-label="Previous frame"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 4 7 12 15 20"/></svg></button>
  <button type="button" class="lb-next lbx-btn lbx-step" aria-label="Next frame"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 4 17 12 9 20"/></svg></button>
  <figure class="lbx-figure"><img alt=""><figcaption><span class="lbx-title"></span><span class="lbx-meta"></span><span class="lbx-count"></span></figcaption></figure>`
renderLightbox = function () {
  const f = LB.list[LB.i], s = f.series ? seriesBySlug[f.series] : null
  const img = $(".lbx-figure img", lb)
  img.src = f.big; img.alt = f.title
  lb.setAttribute("aria-label", f.title)
  $(".lbx-title", lb).textContent = f.title
  $(".lbx-meta", lb).textContent = [f.location, f.year].filter(Boolean).join(" · ") + (s ? ` · ${s.title}` : "")
  $(".lbx-count", lb).textContent = LB.list.length > 1 ? `${LB.i + 1} / ${LB.list.length}` : ""
  $$(".lbx-step", lb).forEach(b => (b.hidden = LB.list.length < 2))
}
stepLightbox = function (d) {
  const n = LB.list.length
  if (n < 2) return
  LB.i = (LB.i + d + n) % n
  renderLightbox(); setQuery({ frame: LB.list[LB.i].id }, true)
}
$(".lb-prev", lb).addEventListener("click", () => stepLightbox(-1))
$(".lb-next", lb).addEventListener("click", () => stepLightbox(1))
$(".lb-close", lb).addEventListener("click", () => closeLightbox())
$(".lbx-scrim", lb).addEventListener("click", () => closeLightbox())

$("#lived").textContent = LIVED.join(" · ")
const stage = $("#stage"), cap = $("#cap"), track = $("#track"), filtersEl = $("#filters"), minibar = $("#minibar")

// ---------- the caption lives on the print; no box
showTip = (f, el) => {
  $$(".cap-on").forEach(x => x !== el && x.classList.remove("cap-on"))
  tipFor = el
  if (lastPointer === "touch") el.classList.add("cap-on")
}
addEventListener("scroll", () => $$(".cap-on").forEach(x => x.classList.remove("cap-on")), { passive: true })
function dress(el, f) {
  const img = $("img", el)
  const lift = document.createElement("span")
  lift.className = "lift"
  el.insertBefore(lift, img)
  lift.appendChild(img)
  lift.insertAdjacentHTML("beforeend", `<span class="pcap"><b>${esc(f.title)}</b><span>${esc([f.city, f.year].filter(Boolean).join(", "))}</span></span>`)
}

// ---------- one pile, re-laid by the scroll, all the way down
// [scene, which view it belongs to, height of its stretch of scroll]
const STEPS = [["pile", null, 30], ["edit", "selected", 130], ["where", "archive", 110], ["rolls", "archive", 110], ["grid", "archive", 120], ["series", "series", 150]]
const VIEW_STEP = { selected: 1, archive: 2, series: 5 }
const SHOW = { grid: "Grid", where: "Where", rolls: "Roll by roll" }
// The live archive's sizes: 104, 170 and 260 pixel squares (smaller on a phone).
const SIZE = { sm: ["Small", 104, 64], md: ["Medium", 170, 92], lg: ["Large", 260, 120] }
const F = { size: "lg", view: "grid", type: [], lived: [], year: [], place: [] }
let gridOffset = -1, liveTimer = 0, openMenu = null
// A click outside an open list, or Escape, closes it.
docOn("mousedown", e => { if (openMenu && !e.target.closest(".dd")) { openMenu = null; drawFilters() } })
addEventListener("keydown", e => { if (e.key === "Escape" && openMenu) { openMenu = null; drawFilters() } })
let current = null, focus = 0, openSeries = null, L = {}, G = null, labelEls = []
const scene = () => STEPS[Math.max(0, current ?? 0)][0]
// The filters come in with the grid, and apply to it.
const inArchive = () => scene() === "grid"

// ---------- prints
const items = ARCHIVE.map(f => {
  const el = printEl(f, { cls: "item" })
  $("img", el).src = f.thumb
  dress(el, f)
  f.bh = 340; f.bw = 340 * f.ratio
  el.style.width = f.bw + "px"; el.style.height = f.bh + "px"
  stage.insertBefore(el, cap)
  f.el = el
  // A small print in the edit's column is picked at once, on touch too.
  el.addEventListener("click", e => {
    if (!el.classList.contains("thumb")) return
    e.preventDefault(); e.stopImmediatePropagation()
    setFocus(SELECTED.indexOf(f))
  }, true)
  bindPrint(el, f, () => onPrint(f))
  return f
})
function onPrint(f) {
  const k = scene()
  if (k === "edit") return openLightbox(SELECTED, focus, "Selected")
  if (k === "series" && !openSeries && f.series) return showSeries(f.series)
  const ctx = L.cur && L.cur.list.includes(f) ? L.cur : { list: [f], label: "" }
  openLightbox(ctx.list, ctx.list.indexOf(f), ctx.label)
}

// ---------- filters: the live set, for the archive's three lays
const countBy = (list, pick) => { const m = new Map(); list.forEach(f => { const v = pick(f); if (v) m.set(v, (m.get(v) || 0) + 1) }); return m }
const passes = (f, skip) => (skip === "type" || !F.type.length || F.type.includes(f.type)) && (skip === "lived" || !F.lived.length || F.lived.includes(f.city)) && (skip === "year" || !F.year.length || F.year.includes(String(f.year))) && (skip === "place" || !F.place.length || F.place.includes(f.country))
const pool = () => ARCHIVE.filter(f => passes(f))
function drawFilters() {
  const types = countBy(FRAMES.filter(f => passes(f, "type")), f => f.type)
  // The live page's dropdown: a button that opens a list; several can be picked.
  const sel = (k, label, entries) => {
    const v = F[k], summary = !v.length ? "All" : v.length === 1 ? v[0] : `${v.length} selected`
    return `<div class="dd" data-dd="${k}" ${v.length ? "data-on" : ""}><button type="button" class="dd-btn" aria-haspopup="listbox" aria-expanded="${openMenu === k}"><span class="dd-l">${label}</span><span class="dd-v">${esc(summary)}</span><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></button>${openMenu === k ? `<div class="dd-menu" role="listbox" aria-multiselectable="true">${entries.map(([val]) => `<button type="button" class="dd-opt" role="option" data-v="${esc(val)}" aria-selected="${v.includes(String(val))}"><span class="dd-t">${v.includes(String(val)) ? "✓" : ""}</span>${esc(val)}</button>`).join("")}${v.length ? `<button type="button" class="dd-reset">Clear ${label.toLowerCase()}</button>` : ""}</div>` : ""}</div>`
  }
  const n = pool().length, any = F.type.length || F.lived.length || F.year.length || F.place.length
  const k = scene()
  filtersEl.innerHTML = `
    <span class="pf-title">Archive</span>
    <div class="pf-group"><span class="pf-label">View</span><div class="pf-show">${[["grid", "Grid"], ["pile", "Pile"]].map(([v, l]) => `<button type="button" data-viewas="${v}" aria-pressed="${F.view === v}">${l}</button>`).join("")}</div></div>
    ${F.view === "grid" ? `<div class="pf-group"><span class="pf-label">Size</span><div class="pf-chips">${Object.entries(SIZE).map(([s, [l]]) => `<button type="button" class="pf-chip" data-size="${s}" aria-pressed="${F.size === s}">${l}</button>`).join("")}</div></div>` : ""}
    <div class="pf-group"><span class="pf-label">Type</span><div class="pf-chips">${Object.keys(TYPE).map(t => `<button type="button" class="pf-chip" data-type="${t}" aria-pressed="${F.type.includes(t)}" ${!types.get(t) && !F.type.includes(t) ? "disabled" : ""}>${TYPE[t]}</button>`).join("")}</div></div>
    <div class="pf-group"><span class="pf-label">Space/time</span><div class="pf-chips">
      ${sel("lived", "Lived", [...countBy(FRAMES.filter(f => passes(f, "lived")), f => LIVED.includes(f.city) ? f.city : null)].sort((a, b) => b[1] - a[1]))}
      ${sel("year", "Year", [...countBy(FRAMES.filter(f => passes(f, "year")), f => String(f.year))].sort((a, b) => b[0] - a[0]))}
      ${sel("place", "Place", [...countBy(FRAMES.filter(f => passes(f, "place")), f => f.country)].sort((a, b) => b[1] - a[1]))}
    </div></div>
    <div class="pf-count">${n} frame${n === 1 ? "" : "s"}${any ? '<button type="button" id="clear">Clear</button>' : ""}</div>`
  // Show jumps to that lay's stretch of the scroll; the scroll lights it.
  $$("[data-show]", filtersEl).forEach(b => b.addEventListener("click", () => jump(STEPS.findIndex(s => s[0] === b.dataset.show))))
  $$("[data-viewas]", filtersEl).forEach(b => b.addEventListener("click", () => { F.view = b.dataset.viewas; refilter() }))
  $$("[data-size]", filtersEl).forEach(b => b.addEventListener("click", () => { F.size = b.dataset.size; refilter() }))
  $$("[data-type]", filtersEl).forEach(b => b.addEventListener("click", () => { const i = F.type.indexOf(b.dataset.type); i < 0 ? F.type.push(b.dataset.type) : F.type.splice(i, 1); refilter() }))
  $$(".dd", filtersEl).forEach(dd => {
    const k = dd.dataset.dd
    $(".dd-btn", dd).addEventListener("click", () => { openMenu = openMenu === k ? null : k; drawFilters() })
    $$(".dd-opt", dd).forEach(o => o.addEventListener("click", () => { const a = F[k], i = a.indexOf(o.dataset.v); i < 0 ? a.push(o.dataset.v) : a.splice(i, 1); refilter() }))
    const r = $(".dd-reset", dd); if (r) r.addEventListener("click", () => { F[k] = []; refilter() })
    // The bar scrolls sideways on a phone, so the list is placed on the page.
    const m = $(".dd-menu", dd)
    if (m) { const b = $(".dd-btn", dd).getBoundingClientRect(); m.style.left = Math.min(b.left, innerWidth - m.offsetWidth - 8) + "px"; m.style.top = b.bottom + 4 + "px" }
  })
  const c = $("#clear", filtersEl); if (c) c.addEventListener("click", () => { F.type = []; F.lived = []; F.year = []; F.place = []; openMenu = null; refilter() })
}
function refilter() {
  setQuery({ as: F.view === "grid" ? "" : F.view, size: F.size === "lg" ? "" : F.size, type: F.type.join(","), lived: F.lived.join(","), year: F.year.join(","), place: F.place.join(",") }, true)
  drawFilters(); compute(); sizeGridStep(); draw()
}

// ---------- layouts
function geometry() {
  // The stage is 100svh: the screen with the browser bars showing. Laying out
  // to it, not to innerHeight, keeps the prints still as the bars come and go.
  const W = innerWidth, H = stage.clientHeight || innerHeight, narrow = narrowQuery.matches
  const inset = clamp(W * 0.07, 20, 100), bar = narrow ? 48 : 56
  const r = narrow ? { x0: 12, x1: W - 12, y0: bar + 14, y1: H - 28 } : { x0: inset, x1: W - inset, y0: bar + 30, y1: H - 32 }
  const fh = filtersEl.offsetHeight
  const rf = { ...r, y0: bar + fh + (narrow ? 26 : 34) }
  return { W, H, narrow, r, rf, S: clamp(Math.min(W / 1440, H / 900), .7, 1.35) }
}
// Groups as columns of rows, each headed by its name: Where's cities.
function columns(groups, box, narrow, gap, maxH) {
  const pos = {}, labels = []
  const head = 30
  if (narrow) {
    const cw = (box.x1 - box.x0 - 12) / 2, rows = Math.ceil(groups.length / 2), ch = (box.y1 - box.y0 - 16 * (rows - 1)) / rows
    groups.forEach((g, i) => {
      const x0 = box.x0 + (i % 2) * (cw + 12), y0 = box.y0 + Math.floor(i / 2) * (ch + 16)
      labels.push({ cls: "group", x: x0, y: y0, html: `${g.label}<span>${g.frames.length}</span>` })
      Object.assign(pos, fitRows(g.frames, { x0, x1: x0 + cw, y0: y0 + 20, y1: y0 + ch }, 3, maxH * .5))
    })
  } else {
    const weights = groups.map(g => Math.sqrt(g.frames.length) + 1.4), sum = weights.reduce((a, b) => a + b, 0), gp = 44
    let x = box.x0
    groups.forEach((g, i) => {
      const cw = (box.x1 - box.x0 - gp * (groups.length - 1)) * weights[i] / sum
      labels.push({ cls: "group", x, y: box.y0, html: `${g.label}<span>${g.frames.length}</span>${g.em ? `<em>${g.em}</em>` : ""}` })
      const p = fitRows(g.frames, { x0: x, x1: x + cw, y0: box.y0 + head, y1: box.y1 }, gap, maxH)
      // Hang each column from the top rather than centring it.
      const top = Math.min(...g.frames.map(f => p[f.id] ? p[f.id].y - p[f.id].h / 2 : Infinity))
      for (const id in p) p[id].y -= top - (box.y0 + head)
      Object.assign(pos, p)
      x += cw + gp
    })
  }
  return { pos, labels }
}
function compute() {
  G = geometry()
  const { r, rf, narrow, W, H, S } = G
  const rw = r.x1 - r.x0, rh = r.y1 - r.y0
  const list = pool(), sk = SIZE[F.size][1]
  L = {}
  // The pile, behind the header.
  {
    const rand = seeded(7)
    const box = { x0: -60, x1: W + 60, y0: -20, y1: H - 76 + 20 }
    const base = Math.sqrt((box.x1 - box.x0) * (box.y1 - box.y0) / ARCHIVE.length) * (narrow ? .92 : 1.02)
    const rest = ARCHIVE.filter(f => !f.selected)
    const inner = narrow ? { x0: -10, x1: W + 10, y0: H * .52, y1: H - 76 - 30 } : { x0: W * .04, x1: W * .96, y0: H * .44, y1: H - 76 - 24 }
    L.pile = { pos: { ...pileLayout(rest, box, rand, base * .8, base * .45, 10, 0), ...pileLayout(SELECTED.slice().reverse(), inner, rand, base * 1.3, base * .3, 8, 200) }, list: { list: SELECTED, label: "Selected" } }
  }
  // Selected: the twelve in one column down the left (two rows along the
  // foot on a phone), the chosen one large, its caption beside it.
  SELECTED.forEach((fo, i) => {
    const pos = {}
    let big, capBox, slot
    if (narrow) {
      const tg = 5, rowsOf = [SELECTED.slice(0, 6), SELECTED.slice(6)]
      const hs = rowsOf.map(row => Math.min(52, (rw - tg * (row.length - 1)) / row.reduce((a, f) => a + f.ratio, 0)))
      const rowsTop = r.y1 - hs[0] - hs[1] - tg
      let y = rowsTop
      rowsOf.forEach((row, ri) => {
        const h = hs[ri], used = row.reduce((a, f) => a + f.ratio * h, 0) + tg * (row.length - 1)
        let x = r.x0 + (rw - used) / 2
        row.forEach(f => { const w = f.ratio * h; if (f !== fo) pos[f.id] = { x: x + w / 2, y: y + h / 2, h, z: 300, thumb: true }; else slot = { x, y, w, h }; x += w + tg })
        y += h + tg
      })
      big = { x0: r.x0, x1: r.x1, y0: r.y0, y1: rowsTop - 158 }
      capBox = { x: r.x0, y: big.y1 + 12, w: rw }
    } else {
      const n = SELECTED.length, gap = 6
      const ch = (rh - gap * (n - 1)) / n, cw = clamp(ch * 1.5, 60, 96)
      SELECTED.forEach((f, j) => {
        const h = Math.min(ch, cw / f.ratio), cy = r.y0 + j * (ch + gap) + ch / 2, cx = r.x0 + cw / 2
        if (f !== fo) pos[f.id] = { x: cx, y: cy, h, z: 300, thumb: true }
        else slot = { x: cx - (h * f.ratio) / 2, y: cy - h / 2, w: h * f.ratio, h }
      })
      const capW = Math.min(330, rw * .24)
      // A portrait frame sits between the column and the caption; a landscape
      // one takes the whole width and leaves the caption the corner below it.
      big = fo.ratio > 1.05 ? { x0: r.x0 + cw + 56, x1: r.x1, y0: r.y0, y1: r.y1 - 200 } : { x0: r.x0 + cw + 56, x1: r.x1 - capW - 56, y0: r.y0, y1: r.y1 }
      capBox = { x: r.x1 - capW, bottom: H - r.y1 + 36, w: capW }
    }
    const bw = big.x1 - big.x0, bh = big.y1 - big.y0, h = Math.min(bh, bw / fo.ratio)
    pos[fo.id] = { x: big.x0 + bw / 2, y: big.y0 + bh / 2, h, z: 400, focus: true }
    L["edit" + i] = { pos, cap: capBox, slot, list: { list: SELECTED, label: "Selected" } }
  })
  // Archive · Where: a pile per city lived in, and one for everywhere else.
  {
    const box = { ...r, y0: r.y0 + 6 }, bw = box.x1 - box.x0, bh = box.y1 - box.y0
    const groups = [...LIVED.map(c => ({ label: c, em: "lived in", frames: ARCHIVE.filter(f => f.city === c) })), { label: "Elsewhere", em: `${new Set(ARCHIVE.filter(f => !LIVED.includes(f.city)).map(f => f.city)).size} places`, frames: ARCHIVE.filter(f => !LIVED.includes(f.city)) }].filter(g => g.frames.length)
    const pos = {}, labels = [], rand = seeded(23)
    if (narrow) {
      const cw = (bw - 12) / 2, rows = Math.ceil(groups.length / 2), ch = (bh - 26 * (rows - 1)) / rows
      groups.forEach((g, i) => {
        const x0 = box.x0 + (i % 2) * (cw + 12), y0 = box.y0 + Math.floor(i / 2) * (ch + 26)
        labels.push({ cls: "group", x: x0, y: y0, html: `${g.label}<span>${g.frames.length}</span>` })
        const hB = clamp(Math.sqrt(cw * (ch - 18) / (g.frames.length * 1.1)), 30, 110)
        Object.assign(pos, pileLayout(g.frames, { x0, x1: x0 + cw, y0: y0 + 18, y1: y0 + ch }, rand, hB * .85, hB * .3, 9, 0))
      })
    } else {
      const weights = groups.map(g => Math.sqrt(g.frames.length) + 1.2), sum = weights.reduce((a, b) => a + b, 0), gp = 48 * S
      let x = box.x0
      groups.forEach((g, i) => {
        const cw = (bw - gp * (groups.length - 1)) * weights[i] / sum
        labels.push({ cls: "group", x, y: box.y0, html: `${g.label}<span>${g.frames.length}</span><em>${g.em}</em>` })
        const hB = clamp(Math.sqrt(cw * (bh - 40) / (g.frames.length * 1.15)) * .95, 50 * S, 260 * S)
        Object.assign(pos, pileLayout(g.frames, { x0: x, x1: x + cw, y0: box.y0 + 30, y1: box.y1 }, rand, hB * .85, hB * .3, 9, 0))
        x += cw + gp
      })
    }
    L.where = { pos, labels, list: { list: groups.flatMap(g => g.frames), label: "Archive · where" } }
  }
  // Archive · Roll by roll: a strip of film per numbered roll, newest
  // first; the frames with no roll number in a pile at the side.
  {
    const rolls = {}
    ARCHIVE.filter(f => f.roll != null).forEach(f => (rolls[f.roll] = rolls[f.roll] || []).push(f))
    const groups = Object.keys(rolls).map(Number).sort((a, b) => b - a).map(n => ({ label: "Roll " + n, meta: rolls[n][0].year, frames: rolls[n] }))
    const unknown = ARCHIVE.filter(f => f.roll == null), bh = rh
    const pileW = narrow ? 0 : Math.min(240 * S, rw * 0.16)
    const box = narrow ? { ...r, y1: r.y1 - 60 } : { ...r, y0: r.y0 + 6, x1: r.x1 - pileW - 40 }
    const out = flow(groups, box, narrow, { strip: true, labelH: 18, maxH: 210, gap: 3, groupGap: narrow ? 8 : 16, lineGap: narrow ? 8 : 14, pad: narrow ? 4 : 7, minW: narrow ? 66 : 108 })
    const ub = narrow ? { x0: r.x0 + 150, x1: r.x1 - 4, y0: r.y1 - 52, y1: r.y1 } : { x0: r.x1 - pileW, x1: r.x1, y0: r.y0 + bh / 2 - pileW * .55, y1: r.y0 + bh / 2 + pileW * .55 }
    const up = pileLayout(unknown, ub, seeded(5), (narrow ? 24 : 48) * S, (narrow ? 8 : 16) * S, 14, 0)
    for (const id in up) up[id].o = .6
    Object.assign(out.pos, up)
    out.labels.push({ cls: "note", x: narrow ? r.x0 : ub.x0, y: narrow ? r.y1 - 46 : ub.y0 - 48, w: narrow ? 140 : pileW, html: `${plural(unknown.length, "frame")}, roll not noted` })
    L.rolls = { ...out, list: { list: [...groups.flatMap(g => g.frames), ...unknown], label: "Archive · roll by roll" } }
  }
  // Archive · Grid: tight squares at the live archive's sizes. Taller than
  // the screen, so the scroll moves through it; or, as a pile, one screen.
  {
    const gap = narrow ? 2 : 3, bw = rf.x1 - rf.x0
    const target = narrow ? SIZE[F.size][2] : SIZE[F.size][1]
    const cols = Math.max(1, Math.floor((bw + gap) / (target + gap)))
    const side = (bw - gap * (cols - 1)) / cols
    const pos = {}
    list.forEach((f, i) => { pos[f.id] = { x: rf.x0 + (i % cols) * (side + gap) + side / 2, y: rf.y0 + Math.floor(i / cols) * (side + gap) + side / 2, h: side, sq: true } })
    const height = Math.ceil(list.length / cols) * (side + gap)
    L.grid = { pos, list: { list, label: "Archive" }, travel: Math.max(0, rf.y0 + height - (H - 24)) }
    const area = (rf.x1 - rf.x0) * (rf.y1 - rf.y0), base = clamp(Math.sqrt(area / Math.max(list.length, 6)) * .95, 40, narrow ? 140 : 300)
    L.gridpile = { pos: pileLayout(list, { x0: rf.x0 - 10, x1: rf.x1 + 10, y0: rf.y0, y1: rf.y1 }, seeded(31), base * .8, base * .4, 10, 0), list: { list, label: "Archive" } }
  }
  // Series: a fanned stack each; click one to lay it out.
  {
    const capBlock = narrow ? 44 : 74, spread = (narrow ? 5 : 12) * S
    let best = null
    for (const cols of narrow ? [2, 3] : [3, 4, 5]) {
      const rows = Math.ceil(SERIES.length / cols), cw = rw / cols, ch = rh / rows
      const h = Math.min(ch - capBlock - 16, 520 * S)
      const lim = SERIES.map(s => Math.min(h, (cw - (narrow ? 14 : 48) - spread * (s.frames.length - 1)) / (Math.max(...s.frames.map(f => f.ratio)) * 1.06)))
      const ra = SERIES.map(s => s.frames.reduce((a, f) => a + f.ratio, 0) / s.frames.length)
      const C = Math.min(...lim.map((l, i) => l * l * ra[i])) * 1.6
      const hs = lim.map((l, i) => Math.min(l, Math.sqrt(C / ra[i])))
      const score = hs.reduce((a, b, i) => a + b * b * ra[i], 0)
      if (!best || score > best.score) best = { cols, rows, cw, ch, hs, score }
    }
    const { cols, cw, ch, hs } = best
    const pos = {}, labels = [], lastRow = SERIES.length - cols * (best.rows - 1)
    SERIES.forEach((s, i) => {
      const row = Math.floor(i / cols), inRow = row === best.rows - 1 ? lastRow : cols
      const rowH = Math.max(...hs.slice(row * cols, row * cols + cols))
      const top = r.y0 + row * ch + Math.max(0, (ch - rowH - capBlock) / 2)
      const cx = r.x0 + (rw - inRow * cw) / 2 + (i % cols) * cw + cw / 2
      const n = s.frames.length, h = hs[i]
      s.frames.slice().reverse().forEach((f, k) => {
        const j = n - 1 - k, off = j - (n - 1) / 2
        pos[f.id] = { x: cx + off * spread, y: top + rowH - h / 2 + Math.abs(off) * 2, h, r: off * (narrow ? 3 : 3.5), z: 200 + (n - j) }
      })
      labels.push({ cls: "stackcap", x: cx - cw / 2 + 8, y: top + rowH + (narrow ? 14 : 24), w: cw - 16, html: narrow ? `<strong>${esc(s.title)}</strong><small>${plural(n, "frame")}</small>` : `<strong>${esc(s.title)}</strong><small>${plural(n, "frame")} · ${esc(s.places.join(", "))} · ${s.years}</small>` })
    })
    L.series = { pos, labels, list: { list: SERIES.flatMap(s => s.frames), label: "Series" } }
    SERIES.forEach(s => { L["series:" + s.slug] = { pos: fitRows(s.frames, { ...r, y0: r.y0 + (narrow ? 40 : 50) }, narrow ? 8 : 18, narrow ? 320 : 660), list: { list: s.frames, label: "Series · " + s.title } } })
  }
}

// ---------- render
function render(layout) {
  L.cur = layout.list
  items.forEach(f => {
    const p = layout.pos[f.id], el = f.el
    if (!p) { el.style.opacity = 0; el.classList.add("off"); el.tabIndex = -1; return }
    if (p.focus && f.l && !f.bigLoaded) { $("img", el).src = f.big; f.bigLoaded = true }
    const s = p.h / f.bh, bw = p.sq ? f.bh : f.bw
    el.style.width = bw + "px"
    el.classList.toggle("sq", !!p.sq)
    el.style.transform = `translate3d(${(p.x - bw / 2).toFixed(1)}px, ${(p.y - f.bh / 2).toFixed(1)}px, 0) rotate(${(p.r || 0).toFixed(2)}deg) scale(${s.toFixed(4)})`
    el.style.setProperty("--inv", (1 / s).toFixed(3))
    el.style.opacity = p.o ?? 1
    el.style.zIndex = Math.round(p.z ?? 100)
    el.classList.toggle("thumb", !!p.thumb)
    el.classList.toggle("nocap", !!p.thumb || p.h < 70)
    el.classList.remove("off")
    el.tabIndex = 0
  })
  labelEls.forEach(el => el.remove())
  labelEls = (layout.labels || []).map(l => {
    const el = document.createElement("div")
    el.className = "lab " + l.cls
    el.innerHTML = l.html
    el.style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px)`
    if (l.w) el.style.width = l.w + "px"
    if (l.h) el.style.height = l.h + "px"
    stage.insertBefore(el, cap)
    return el
  })
  const els = labelEls.slice()
  setTimeout(() => els.forEach(el => el.classList.add("on")), stage.classList.contains("anim") && !reduceMotion ? 450 : 0)
  if (layout.slot) {
    const m = document.createElement("div")
    m.className = "lab on"
    m.style.cssText = `transform:translate(${layout.slot.x.toFixed(1)}px,${layout.slot.y.toFixed(1)}px);width:${layout.slot.w.toFixed(1)}px;height:${layout.slot.h.toFixed(1)}px;outline:2px solid var(--accent);outline-offset:2px;opacity:1;z-index:310;background:center / cover no-repeat url(${SELECTED[focus].thumb})`
    stage.insertBefore(m, cap)
    labelEls.push(m)
  }
}
function drawCap(box) {
  const f = SELECTED[focus], s = f.series ? seriesBySlug[f.series] : null
  cap.style.cssText = box.bottom != null ? `left:${box.x}px;bottom:${box.bottom}px;width:${box.w}px` : `left:${box.x}px;top:${box.y}px;width:${box.w}px`
  cap.innerHTML = `<span class="n">${String(focus + 1).padStart(2, "0")}<small>/ ${SELECTED.length}</small></span><h2>${esc(f.title)}</h2><p class="m">${esc([f.location, f.year].filter(Boolean).join(" · "))}${s ? `<br>Series: ${esc(s.title)}` : ""}</p>
    <div class="acts"><button type="button" id="prevF" ${focus === 0 ? "disabled" : ""} aria-label="Previous">←</button><button type="button" id="nextF" ${focus === SELECTED.length - 1 ? "disabled" : ""} aria-label="Next">→</button></div>`
  $("#prevF").addEventListener("click", () => setFocus(focus - 1))
  $("#nextF").addEventListener("click", () => setFocus(focus + 1))
}
function setFocus(i) { focus = clamp(i, 0, SELECTED.length - 1); draw() }
function draw() {
  const k = scene()
  stage.dataset.scene = k
  stage.toggleAttribute("data-open", !!openSeries)
  hideTip()
  filtersEl.classList.toggle("away", !inArchive())
  $$("[data-show]", filtersEl).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.show === k)))
  const layout = openSeries ? L["series:" + openSeries] : k === "edit" ? L["edit" + focus] : k === "grid" && F.view === "pile" ? L.gridpile : L[k]
  gridOffset = -1
  clearTimeout(liveTimer); delete stage.dataset.live
  if (k === "grid" && F.view === "grid") liveTimer = setTimeout(() => { stage.dataset.live = "1"; slideGrid() }, reduceMotion ? 0 : 950)
  render(layout)
  if (k === "edit") drawCap(layout.cap)
  lightLinks()
}
function showSeries(slug) { openSeries = slug; setQuery({ series: slug }, true); draw() }
function closeSeries() { openSeries = null; setQuery({ series: null }, true); draw() }
$("#backS").addEventListener("click", closeSeries)
addEventListener("keydown", e => {
  if (!lb.hidden || e.target.closest("input, select, textarea")) return
  if (e.key === "Escape" && openSeries) closeSeries()
  if (scene() !== "edit") return
  if (e.key === "ArrowLeft") setFocus(focus - 1)
  if (e.key === "ArrowRight") setFocus(focus + 1)
})

// ---------- scroll drives the scenes
track.innerHTML = STEPS.map(([, , h]) => `<div class="step" style="height:${h}vh;height:${h}svh"></div>`).join("")
// A steady screen height: the stage's, which doesn't change as a phone's
// address bar comes and goes.
const vh = () => stage.clientHeight || innerHeight
const steps = $$(".step", track)
const GRID = STEPS.findIndex(s => s[0] === "grid")
function sizeGridStep() { steps[GRID].style.height = (vh() * 1.1 + (F.view === "grid" && L.grid ? L.grid.travel : 0)) + "px" }
// Once the grid has arrived, the scroll moves through it like a page.
function slideGrid() {
  if (scene() !== "grid" || F.view !== "grid" || !stage.dataset.live) return
  const into = vh() * .5 - steps[GRID].getBoundingClientRect().top
  const off = clamp(into - vh() * .2, 0, L.grid.travel)
  if (Math.abs(off - gridOffset) < .5) return
  gridOffset = off
  items.forEach(f => {
    const p = L.grid.pos[f.id]; if (!p) return
    const s = p.h / f.bh
    f.el.style.transform = `translate3d(${(p.x - f.bh / 2).toFixed(1)}px, ${(p.y - off - f.bh / 2).toFixed(1)}px, 0) scale(${s.toFixed(4)})`
  })
}
function frame() {
  slideGrid()
  let s = 0
  steps.forEach((el, i) => { if (i && el.getBoundingClientRect().top <= vh() * .5) s = i })
  lightLinks()
  if (s === current) return
  current = s
  if (scene() !== "series" && openSeries) { openSeries = null; setQuery({ series: null }, true) }
  draw()
}
function lightLinks() {
  const on = STEPS[Math.max(0, current ?? 0)][1]
  $$("[data-view]").forEach(a => a.toggleAttribute("data-on", a.dataset.view === on))
  const shown = $("#views").getBoundingClientRect().bottom < 0
  minibar.classList.toggle("on", shown)
  const ts = $("#toStart"); ts.classList.toggle("on", shown); ts.tabIndex = shown ? 0 : -1; ts.setAttribute("aria-hidden", String(!shown))
  minibar.setAttribute("aria-hidden", String(!shown))
  $$("button, a", minibar).forEach(x => (x.tabIndex = shown ? 0 : -1))
}
function jump(i) {
  if (i <= 0) return scrollTo({ top: 0, behavior: "instant" })
  scrollTo({ top: steps[i].getBoundingClientRect().top + scrollY - vh() * .5 + 4, behavior: "instant" })
}
$$("[data-view]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); jump(VIEW_STEP[a.dataset.view]); setQuery({ view: a.dataset.view === "selected" ? "" : a.dataset.view }, true) }))
$("#toTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "instant" }))
$("#toStart").addEventListener("click", () => { if (openSeries) closeSeries(); scrollTo({ top: 0, behavior: "instant" }) })
LB.onSeries = slug => { jump(VIEW_STEP.series); requestAnimationFrame(() => showSeries(slug)) }

let raf = 0
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; frame() }) }, { passive: true })
// On a phone the address bar slides away and back as you scroll, and each time
// the window "resizes" by its height. Only a change of width (or a big change
// of height, as when the phone turns) re-lays the page; the rest is ignored.
let lastW = innerWidth, lastH = innerHeight
addEventListener("resize", () => {
  if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return
  lastW = innerWidth; lastH = innerHeight
  compute(); sizeGridStep(); current = null; frame()
})

{
  const q = query()
  F.size = SIZE[q.get("size")] ? q.get("size") : "lg"
  F.type = (q.get("type") || "").split(",").filter(Boolean)
  for (const k of ["lived", "year", "place"]) F[k] = (q.get(k) || "").split(",").filter(Boolean)
  F.view = q.get("as") === "pile" ? "pile" : "grid"
  drawFilters(); compute(); sizeGridStep(); frame()
  if (VIEW_STEP[q.get("view")]) jump(VIEW_STEP[q.get("view")])
  if (q.get("series") && seriesBySlug[q.get("series")]) LB.onSeries(q.get("series"))
}
requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add("anim")))
openFromUrl(f => f.selected ? { list: SELECTED, label: "Selected" } : { list: ARCHIVE, label: "Archive" })

return () => {
  cleanups.forEach(fn => fn())
  document.documentElement.style.overflow = ""
  tip.remove()
  lb.remove()
}
}
