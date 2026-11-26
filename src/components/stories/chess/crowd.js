"use client"

import * as React from "react"

import { c } from "./parts"
import say from "./say.json"

// After the pace chart, its 1,252 dots stay on stage. They first lose their
// axis and become a crowd of other players, then sort into rows by what their
// usernames say, then (the last beat) a hundred of them become lost games.
// The dots of the pace chart are not the people of the username rows: the
// axis goes first, so a dot means nothing in particular before it means
// something new. Groups are drawn at one dot for ten players; "everyone else"
// is the shape of 1.4 million players, drawn with the dots that are left.

export const NAMES = say.names
export const GROUPS = NAMES.groups
export const TYPICAL = NAMES.typical
export const MY_RAPID = say.fast.rapid
export const RATING_MAX = 2500
export const RESIGN = "#3d8bff"

export const truth = g => (g.high < 0.5 ? "lower" : g.low > 0.5 ? "higher" : "same")

// From the steps of the "what we say" scene (scenes.js) to what the crowd shows:
// step 9 the crowd, 10 the guesses (all four kinds at once), 11 the result,
// 12 the jokers and the road to GM, 13 me, 14 the hundred lost games.
export const crowdStage = step =>
  step >= 14 ? "giveup" : step >= 13 ? "me" : step >= 11 ? "all" : step >= 10 ? "rows" : step >= 9 ? "crowd" : null
export const activeGroups = step =>
  step === 10 ? GROUPS.map(g => g.key) : step === 11 ? ["bad", "good"] : step === 12 ? ["jokes", "aims"] : step === 13 ? ["bad"] : []

const random = seed => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const between = (spread, p) => {
  const at = p * (spread.length - 1), i = Math.floor(at)
  return i >= spread.length - 1 ? spread.at(-1) : spread[i] + (spread[i + 1] - spread[i]) * (at - i)
}
// n evenly spaced values with the group's shape: nobody's rating, the group's spread.
const sample = (spread, n) => Array.from({ length: n }, (_, i) => between(spread, (i + 0.5) / n))

// Which pace dot goes to which row: a fixed shuffle, so each row is drawn from
// the whole swarm and the sorting reads as a crowd pulling apart.
export const assignRows = total => {
  const order = Array.from({ length: total }, (_, i) => i)
  const next = random(2026)
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
  const rows = []
  let at = 0
  for (const g of GROUPS) {
    const n = Math.round(g.people / 10)
    rows.push({ key: g.key, group: g, indices: order.slice(at, at + n) })
    at += n
  }
  rows.unshift({ key: "everyone", group: null, indices: order.slice(at) })
  return rows
}

// A beeswarm in a band: x is the value, y only keeps dots apart.
const pack = (xs, radius, top, bottom) => {
  const d = radius * 2 + 0.4, centre = (top + bottom) / 2
  const placed = []
  const out = new Array(xs.length)
  xs.map((x, i) => ({ x, i })).sort((a, b) => a.x - b.x).forEach(({ x, i }) => {
    const near = []
    for (let k = placed.length - 1; k >= 0 && x - placed[k].x < d; k--) near.push(placed[k])
    let offset = 0
    for (let k = 0; k < 400; k++) {
      offset = k === 0 ? 0 : Math.ceil(k / 2) * d * (k % 2 ? 1 : -1)
      if (near.every(q => (x - q.x) ** 2 + (centre + offset - q.y) ** 2 >= d * d - 0.01)) break
    }
    const q = { x, y: centre + offset }
    placed.push(q); out[i] = q
  })
  const extent = Math.max(1, ...out.map(q => Math.abs(q.y - centre)))
  const squeeze = Math.min(1, ((bottom - top) / 2 - radius) / extent)
  return out.map(q => ({ x: q.x, y: centre + (q.y - centre) * squeeze }))
}

// Everything the crowd needs for a frame size: positions per pace index.
export const crowdLayout = ({ total, left, right, top, bottom, width }) => {
  const rows = assignRows(total)
  const radius = width < 400 ? 1 : 1.6
  const rx = v => left + (Math.min(RATING_MAX, Math.max(0, v)) / RATING_MAX) * (right - left)

  // the crowd: a loose oval, no axis
  const next = random(7)
  const cx = (left + right) / 2, cy = (top + bottom) / 2
  const ax = (right - left) * 0.46, ay = (bottom - top) * 0.42
  const crowd = Array.from({ length: total }, () => {
    const a = next() * Math.PI * 2, r = Math.sqrt(next())
    return { x: cx + Math.cos(a) * r * ax, y: cy + Math.sin(a) * r * ay }
  })

  // the rows
  const rowH = (bottom - top) / rows.length
  const shown = new Array(total), waiting = new Array(total), rowOf = new Array(total)
  const bands = rows.map((row, k) => {
    const rowTop = top + k * rowH
    const bandTop = rowTop + Math.min(22, rowH * 0.34), bandBottom = rowTop + rowH - 4
    const values = sample(row.group ? row.group.spread : NAMES.everyoneSpread, row.indices.length)
    const spots = pack(values.map(rx), radius, bandTop, bandBottom)
    // before a guess: a neat pile at the start of the row, saying nothing
    // tighter on a small frame, so a pile never runs past half the row
    let d = radius * 2 + 1.2, perColumn = 1
    for (; d > radius * 1.3; d -= 0.1) {
      perColumn = Math.max(1, Math.floor((bandBottom - bandTop) / d))
      if (Math.ceil(row.indices.length / perColumn) * d <= (right - left) * 0.5) break
    }
    row.indices.forEach((index, i) => {
      shown[index] = spots[i]
      waiting[index] = { x: left + Math.floor(i / perColumn) * d + radius, y: bandTop + (i % perColumn) * d + radius }
      rowOf[index] = row.key
    })
    const pileEnd = left + Math.ceil(row.indices.length / perColumn) * d
    return { key: row.key, group: row.group, top: rowTop, bandTop, bandBottom, pileEnd }
  })

  // the last beat: a hundred lost games each, two squares of ten by ten
  const cell = Math.max(6, Math.min(24, (right - left) / 25, (bottom - top - 90) / 10))
  const gap = cell * 3
  const gridTop = top + Math.max(40, (bottom - top - cell * 10 - 40) / 2)
  const gridLeft = [cx - gap / 2 - cell * 10, cx + gap / 2]
  const grid = new Array(total).fill(null)
  const giveUp = [
    { key: "bad", label: "Says it is bad", share: GROUPS.find(g => g.key === "bad").resigned },
    { key: "everyone", label: "Everyone else", share: NAMES.everyoneResigned },
  ].map((g, k) => {
    const indices = rows.find(r => r.key === g.key).indices.slice(0, 100)
    const resigned = Math.round(g.share * 100)
    indices.forEach((index, i) => {
      grid[index] = { x: gridLeft[k] + (i % 10) * cell + cell / 2, y: gridTop + Math.floor(i / 10) * cell + cell / 2, resigned: i < resigned }
    })
    return { ...g, resigned, x: gridLeft[k], width: cell * 10 }
  })

  // four dots wear a name in the crowd, one per group
  const anchors = [[0.3, 0.32], [0.72, 0.3], [0.28, 0.7], [0.7, 0.72]]
  const tags = GROUPS.map((g, k) => {
    const [fx, fy] = anchors[k]
    const want = { x: left + fx * (right - left), y: top + fy * (bottom - top) }
    const row = rows.find(r => r.key === g.key)
    const index = row.indices.reduce((best, i) =>
      (crowd[i].x - want.x) ** 2 + (crowd[i].y - want.y) ** 2 < (crowd[best].x - want.x) ** 2 + (crowd[best].y - want.y) ** 2 ? i : best, row.indices[0])
    return { key: g.key, name: g.examples[0], index, ...crowd[index] }
  })

  return { rows, bands, crowd, shown, waiting, rowOf, grid, giveUp, gridTop, cell, tags, rx, radius }
}

// Where one dot is, and how it looks, at a stage.
export const dotAt = (layout, index, { stage, step, revealed }) => {
  if (!layout || !stage) return null
  if (stage === "crowd") return { ...layout.crowd[index], opacity: 0.55, tone: "quiet" }
  if (stage === "giveup") {
    const g = layout.grid[index]
    return g ? { x: g.x, y: g.y, opacity: 1, tone: g.resigned ? "resign" : "kept", r: layout.cell * 0.3 } : { ...layout.shown[index], opacity: 0, tone: "quiet" }
  }
  const key = layout.rowOf[index]
  const active = activeGroups(step)
  if (key === "everyone") return { ...layout.shown[index], opacity: active.length ? 0.38 : 0.6, tone: "quiet" }
  if (!revealed[key]) return { ...layout.waiting[index], opacity: active.includes(key) ? 0.75 : 0.4, tone: "quiet" }
  // the two claims have a hue: saying it is bad is blue, saying it is good is gold; the others stay ivory
  return { ...layout.shown[index], opacity: !active.length || active.includes(key) ? 0.95 : 0.4, tone: HUE[key] || (active.includes(key) ? "lit" : "plain") }
}

const median = g => g.median
const HUE = { bad: "blue", good: "gold" }

// The words and lines drawn over the dots: the tags, the rows, the typical
// line, the medians, me, and the two squares of the last beat.
export const CrowdMarks = ({ layout, stage, step, revealed, left, right, top, bottom, h, narrow }) => {
  if (!layout) return null
  const { rx, bands, tags, giveUp, gridTop, cell } = layout
  const on = (yes, extra = {}) => ({ style: { opacity: yes ? 1 : 0, ...extra.style }, "aria-hidden": "true" })
  const rowsOn = stage === "rows" || stage === "all" || stage === "me"
  const active = activeGroups(step)
  const ticks = [0, 500, 1000, 1500, 2000, 2500]
  return (
    <g className={c("ch-crowdMarks")}>
      <g {...on(stage === "crowd")}>
        {tags.map((t, k) => {
          const width = t.name.length * (narrow ? 6.1 : 6.7) + 44
          const x = Math.min(right - width, Math.max(left, t.x - width / 2))
          return (
            <g key={t.key} className={c("ch-crowdTag")} style={{ transitionDelay: stage === "crowd" ? `${300 + k * 260}ms` : "0ms", opacity: stage === "crowd" ? 1 : 0 }}>
              <line x1={t.x} x2={t.x} y1={t.y} y2={t.y - 14} />
              <rect x={x} y={t.y - 34} width={width} height={20} rx={3} />
              <text x={x + 8} y={t.y - 20}>{t.name}… <tspan className={c("ch-crowdUnknown")}>(???)</tspan></text>
            </g>
          )
        })}
      </g>
      <g {...on(rowsOn)}>
        {ticks.map(v => <text key={v} x={rx(v)} y={bottom + 22} textAnchor="middle">{v.toLocaleString("en-GB")}</text>)}
        <text x={right} y={h - 1} textAnchor="end">Rapid rating</text>
        <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
        <line className={c("ch-crowdTypical")} x1={rx(TYPICAL)} x2={rx(TYPICAL)} y1={top - 6} y2={bottom} />
        <text x={rx(TYPICAL) + 6} y={top - 10}>Typical opponent · {TYPICAL}</text>
        {bands.map(b => {
          const g = b.group
          const lit = g && active.includes(g.key)
          const open = !g || revealed[g.key]
          return (
            <g key={b.key} data-lit={lit ? "true" : undefined} className={c("ch-crowdRow")}>
              {g && HUE[g.key] && !narrow ? <circle cx={left - 9} cy={b.top + 8} r={3.5} className={c(HUE[g.key] === "blue" ? "ch-hueBlue" : "ch-hueGold")} /> : null}
              {/* on a narrow frame the labels stand at the sparse right end, clear of the medians */}
              <text x={narrow ? right : left} y={b.top + 12} textAnchor={narrow ? "end" : undefined} className={c(lit ? "ch-crowdLabelLit" : "ch-crowdLabel")}>
                {g ? <>{g.label}<tspan className={c("ch-crowdExample")}>{narrow ? "" : ` · ${g.examples[0]}…`}</tspan></> : "Everyone else"}
              </text>
              {g && !open ? <text x={b.pileEnd + 8} y={(b.bandTop + b.bandBottom) / 2 + 4} className={c("ch-crowdUnknown")}>?</text> : null}
              {g && open ? (
                <g className={c("ch-crowdMedian")} data-hue={HUE[g.key]}>
                  <line x1={rx(median(g))} x2={rx(median(g))} y1={b.bandTop - 3} y2={b.bandBottom + 1} />
                  <text x={rx(median(g)) + 6} y={b.top + 12}>{median(g)}</text>
                </g>
              ) : null}
            </g>
          )
        })}
      </g>
      <g {...on(stage === "me")}>
        <line className={c("ch-crowdMe")} x1={rx(MY_RAPID)} x2={rx(MY_RAPID)} y1={top - 2} y2={bottom} />
      </g>
      <g {...on(stage === "giveup")}>
        {giveUp.map(g => (
          <g key={g.key}>
            <text x={g.x} y={gridTop - 14} className={c(g.key === "bad" ? "ch-crowdLabelLit" : "ch-crowdLabel")}>{g.label}</text>
            <text x={g.x} y={gridTop + cell * 10 + 22} className={c("ch-crowdResign")}>{g.resigned} resigned</text>
            <text x={g.x} y={gridTop + cell * 10 + 38}>{100 - g.resigned} ended otherwise</text>
          </g>
        ))}
        <text x={(left + right) / 2} y={gridTop - 36} textAnchor="middle">100 lost games each · at the same ratings</text>
      </g>
    </g>
  )
}
