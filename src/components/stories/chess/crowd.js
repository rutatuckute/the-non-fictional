"use client"

import * as React from "react"

import { c } from "./parts"
import say from "./say.json"

// After the pace chart, its 1,252 dots stay on stage. They first lose their
// axis and become a crowd of other players, then four rows of them sort out by
// what their usernames say (a guessing game: each row waits as a pile on the
// typical opponent's line until the reader says lower or higher), then the
// lost games: a hundred for those who say they are bad, a hundred for everyone
// else, and last, hers and the reader's.
// The dots of the pace chart are not the people of the username rows: the
// axis goes first, so a dot means nothing in particular before it means
// something new. Rows are drawn at one dot for ten players.

export const NAMES = say.names
export const GROUPS = NAMES.groups
export const TYPICAL = NAMES.typical
export const MY_RAPID = say.fast.rapid
export const MY_RESIGN = NAMES.me
export const RATING_MAX = 2500

// Every kind is clearly lower or clearly higher than a typical opponent.
export const truth = g => (g.high < 0.5 ? "lower" : "higher")

// From the steps of the "what we say" scene (scenes.js) to what the crowd shows:
// step 9 the crowd, 10 the guesses, 11 the lost games, 12 ours. (The "And me?" beat,
// her line and the reader's beside the rows, was taken out on 27 Nov at the owner's request.)
export const crowdStage = step =>
  step >= 12 ? "us" : step >= 11 ? "giveup" : step >= 10 ? "rows" : step >= 9 ? "crowd" : null

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

// Which pace dot goes where: a fixed shuffle, so each row is drawn from the
// whole swarm and the sorting reads as a crowd pulling apart. The dots no row
// takes wait, unseen, for the lost games.
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
  return { rows, spare: order.slice(at) }
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

// Squares of ten by ten for lost games, side by side; four (with the reader's)
// go two by two (owner, 27 Nov): the others above, me and the reader below.
const grids = (keys, { left, right, top, bottom, narrow }) => {
  const n = keys.length
  const cols = n === 4 ? 2 : n
  const lines = Math.ceil(n / cols)
  const head = narrow ? 56 : 76, foot = 18
  // as large as the frame allows (up to Q2's dot size), the squares a little closer
  const cell = Math.max(5, Math.min(32, (right - left) / (cols * 10 + (cols - 1) * 2.2), (bottom - top - lines * (head + foot)) / (lines * 10)))
  const gap = cell * 2.2
  const width = cols * cell * 10 + (cols - 1) * gap
  // set high, just under the chart's title and keys, not floating in the middle
  const x0 = (left + right) / 2 - width / 2, y0 = top + (narrow ? 4 : 12)
  return Object.fromEntries(keys.map((key, k) => {
    const x = x0 + (k % cols) * (cell * 10 + gap), y = y0 + Math.floor(k / cols) * (head + cell * 10 + foot) + head
    return [key, { key, x, y, cell, width: cell * 10, head, pitch: cell * 10 + gap }]
  }))
}
const cellAt = (g, i) => ({ x: g.x + (i % 10) * g.cell + g.cell / 2, y: g.y + Math.floor(i / 10) * g.cell + g.cell / 2 })

// Everything the crowd needs for a frame size: positions per pace index.
export const crowdLayout = ({ total, left, right, top, bottom, width, you }) => {
  const { rows, spare } = assignRows(total)
  const narrow = width < 560
  const radius = width < 400 ? 1 : 1.6
  const rx = v => left + (Math.min(RATING_MAX, Math.max(0, v)) / RATING_MAX) * (right - left)
  const typicalX = rx(TYPICAL)

  // the crowd: a loose oval, no axis
  const next = random(7)
  const cx = (left + right) / 2, cy = (top + bottom) / 2
  const ax = (right - left) * 0.46, ay = (bottom - top) * 0.42
  const crowd = Array.from({ length: total }, () => {
    const a = next() * Math.PI * 2, r = Math.sqrt(next())
    return { x: cx + Math.cos(a) * r * ax, y: cy + Math.sin(a) * r * ay }
  })

  // the rows: a name above, the dots under it; no taller than they need to be
  const rowH = Math.min((bottom - top) / rows.length, narrow ? 96 : 108)
  const rowsBottom = top + rowH * rows.length
  const shown = new Array(total), waiting = new Array(total), rowOf = new Array(total)
  const bands = rows.map((row, k) => {
    const rowTop = top + k * rowH
    const bandTop = rowTop + Math.min(38, rowH * 0.34), bandBottom = rowTop + rowH - 10
    const values = sample(row.group.spread, row.indices.length)
    const spots = pack(values.map(rx), radius, bandTop, bandBottom)
    // before the guess: a tight pile on the typical opponent's line, saying nothing yet
    const d = radius * 2 + 0.9
    const perColumn = Math.max(1, Math.floor((bandBottom - bandTop) / d))
    const columns = Math.ceil(row.indices.length / perColumn)
    const pileLeft = typicalX - (columns * d) / 2
    row.indices.forEach((index, i) => {
      shown[index] = spots[i]
      waiting[index] = { x: pileLeft + Math.floor(i / perColumn) * d + radius, y: bandTop + (i % perColumn) * d + radius }
      rowOf[index] = row.key
    })
    return { key: row.key, group: row.group, top: rowTop, bandTop, bandBottom, pileLeft, pileRight: pileLeft + columns * d }
  })

  // the lost games: first two squares, then (with hers, and the reader's) three or four
  const frame = { left, right, top, bottom, narrow }
  const first = grids(["bad", "everyone"], frame)
  const ours = grids(you ? ["bad", "everyone", "me", "you"] : ["bad", "everyone", "me"], frame)
  const pools = {
    bad: rows.find(r => r.key === "bad").indices.slice(0, 100),
    everyone: spare.slice(0, 100),
    me: spare.slice(100, 200),
    you: spare.slice(200, 300),
  }
  const lostAt = new Array(total).fill(null)
  for (const [key, indices] of Object.entries(pools)) indices.forEach((index, i) => { lostAt[index] = { key, i } })

  // four dots wear a name in the crowd, one per kind
  const anchors = [[0.3, 0.32], [0.72, 0.3], [0.28, 0.7], [0.7, 0.72]]
  const tags = GROUPS.map((g, k) => {
    const [fx, fy] = anchors[k]
    const want = { x: left + fx * (right - left), y: top + fy * (bottom - top) }
    const row = rows.find(r => r.key === g.key)
    const index = row.indices.reduce((best, i) =>
      (crowd[i].x - want.x) ** 2 + (crowd[i].y - want.y) ** 2 < (crowd[best].x - want.x) ** 2 + (crowd[best].y - want.y) ** 2 ? i : best, row.indices[0])
    return { key: g.key, name: g.examples[0], index, ...crowd[index] }
  })

  return { rows, bands, crowd, shown, waiting, rowOf, lostAt, first, ours, tags, rx, radius, typicalX, narrow, rowsBottom }
}

// How many of a hundred lost games each square lights: resigned.
export const resignedOf = (key, you) => Math.round(
  key === "bad" ? GROUPS.find(g => g.key === "bad").resigned * 100
    : key === "everyone" ? NAMES.everyoneResigned * 100
      : key === "me" ? (MY_RESIGN.resigned / MY_RESIGN.losses) * 100
        : (you?.share ?? 0) * 100)

// Where one dot is, and how it looks, at a stage.
export const dotAt = (layout, index, { stage, revealed, you }) => {
  if (!layout || !stage) return null
  if (stage === "crowd") return { ...layout.crowd[index], opacity: 0.55, tone: "quiet" }
  const lost = layout.lostAt[index]
  if (stage === "giveup" || stage === "us") {
    const squares = stage === "us" ? layout.ours : layout.first
    const g = lost && squares[lost.key]
    if (!g) {
      // hers and the reader's wait, unseen, at the middle of their square-to-be
      const later = lost && layout.ours[lost.key]
      if (later) return { x: later.x + later.width / 2, y: later.y + later.width / 2, opacity: 0, tone: "kept", r: 0.5 }
      const at = layout.rowOf[index] ? layout.shown[index] : layout.crowd[index]
      return { ...at, opacity: 0, tone: "quiet" }
    }
    const lit = lost.i < resignedOf(lost.key, you)
    const tone = !lit ? "kept" : lost.key === "me" ? "me" : lost.key === "you" ? "you" : "resign"
    return { ...cellAt(g, lost.i), opacity: 1, tone, r: g.cell * 0.32 }
  }
  const key = layout.rowOf[index]
  if (!key) return { ...layout.crowd[index], opacity: 0, tone: "quiet" }
  if (!revealed[key]) return { ...layout.waiting[index], opacity: 0.45, tone: "quiet" }
  return { ...layout.shown[index], opacity: 0.9, tone: "plain" }
}

// The words and lines drawn over the dots: the tags, the rows, the typical
// line, me and the reader, and the squares of lost games.
export const CrowdMarks = ({ layout, stage, revealed, guesses = {}, you, left, right, top, bottom }) => {
  if (!layout) return null
  const { rx, bands, tags, typicalX, narrow, rowsBottom } = layout
  const on = yes => ({ style: { opacity: yes ? 1 : 0 }, "aria-hidden": "true" })
  const rowsOn = stage === "rows"
  const ticks = [0, 1000, 2000]
  const squares = stage === "us" ? layout.ours : layout.first
  // whose square, said in full where there is room ("Username says bad" where there is not)
  const LABEL = { bad: "Usernames that say they’re bad", everyone: "Everyone else", me: "Me", you: "You" }
  const labelOf = g => (g.key === "bad" && g.pitch < 290 ? "Username says bad" : LABEL[g.key])
  return (
    <g className={c("ch-crowdMarks")}>
      <g {...on(stage === "crowd")}>
        {tags.map((t, k) => {
          const width = t.name.length * (narrow ? 7.6 : 8.6) + 18
          const x = Math.min(right - width, Math.max(left, t.x - width / 2))
          return (
            <g key={t.key} className={c("ch-crowdTag")} style={{ transitionDelay: stage === "crowd" ? `${300 + k * 260}ms` : "0ms", opacity: stage === "crowd" ? 1 : 0 }}>
              <line x1={t.x} x2={t.x} y1={t.y} y2={t.y - 14} />
              <rect x={x} y={t.y - 38} width={width} height={24} rx={3} />
              <text x={x + 9} y={t.y - 21}>{t.name}</text>
            </g>
          )
        })}
      </g>
      <g {...on(rowsOn)}>
        {ticks.map(v => <text key={v} x={rx(v)} y={rowsBottom + 22} textAnchor="middle">{v.toLocaleString("en-GB")}</text>)}
        <text x={right} y={rowsBottom + 38} textAnchor="end">Rapid rating →</text>
        <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={rowsBottom} y2={rowsBottom} />
        {bands.map(b => <line key={b.key} className={c("ch-crowdTypical")} x1={typicalX} x2={typicalX} y1={b.bandTop - 6} y2={b.bandBottom + 6} />)}
        <text x={typicalX} y={top - 26} textAnchor="middle">Typical opponent ↓</text>
        {bands.map(b => {
          const g = b.group
          const open = revealed[g.key]
          const guess = guesses[g.key]
          const right_ = open && guess ? guess === truth(g) : null
          const median = rx(g.median)
          return (
            <g key={b.key} className={c("ch-crowdRow")} data-open={open ? "true" : "false"}>
              <text x={left} y={b.top + 20} className={c("ch-crowdLabelLit", "ch-crowdRowName")}>
                {g.label}<tspan className={c("ch-crowdExample")}>{narrow ? "" : `   ${g.examples.slice(0, 3).join(" · ")}`}</tspan>
              </text>
              <g className={c("ch-crowdMedian")} style={{ opacity: open ? 1 : 0 }}>
                <line x1={median} x2={median} y1={b.bandTop - 4} y2={b.bandBottom + 2} />
                {/* from the typical line to the row's middle: lower or higher, at a glance */}
                <path className={c("ch-crowdShift")} d={`M${typicalX} ${(b.bandTop + b.bandBottom) / 2} H${median}`} />
              </g>
              {right_ !== null ? (
                <text x={right} y={b.top + 18} textAnchor="end" className={c(right_ ? "ch-crowdRight" : "ch-crowdWrong")}>
                  {right_ ? "✓ You called it" : `✗ It’s ${truth(g)}`}
                </text>
              ) : null}
            </g>
          )
        })}
      </g>
      {[layout.first, layout.ours].map((set, s) => (
        <g key={s} {...on(squares === set && (stage === "giveup" || stage === "us"))}>
          {Object.values(set).map(g => {
            const n = resignedOf(g.key, you)
            const who = g.key === "me" || g.key === "you" ? g.key : null
            return (
              <g key={g.key}>
                {/* read top down: whose, how many in 100, then the hundred lost games */}
                {who ? <circle cx={g.x + 4} cy={g.y - g.head + 12} r={4} className={c("ch-crowdWho")} data-who={who} data-dot={who} /> : null}
                <text x={g.x + (who ? 14 : 0)} y={g.y - g.head + 18} className={c(who ? "ch-crowdLabelLit" : "ch-crowdLabel", "ch-crowdRowName", "ch-crowdGridName")}>{labelOf(g)}</text>
                <text x={g.x} y={g.y - (narrow ? 10 : 14)} className={c("ch-crowdBig")} data-who={who || undefined}>
                  {n}<tspan className={c("ch-crowdUnit")}> in 100</tspan>
                </text>
              </g>
            )
          })}
        </g>
      ))}
    </g>
  )
}
