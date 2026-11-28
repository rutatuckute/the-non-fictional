"use client"

import * as React from "react"

import { c } from "./parts"
import { EndingMark, EndingsMap } from "./endings"
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
// step 9 the crowd, 10 the guesses (one kind at a time, answered beside the chart),
// 11 every row open ("And what about the way they lose?"), 12 how a game can end,
// 13 the same, narrowed to the loss, 14-15 how their lost games end, 16 ours
// (11-15 reworked 28 Nov). (The "And me?" beat was taken out on 27 Nov.)
export const crowdStage = step =>
  step >= 16 ? "us" : step >= 14 ? "giveup" : step >= 13 ? "focus" : step >= 12 ? "endings"
    : step >= 11 ? "ratings" : step >= 10 ? "rows" : step >= 9 ? "crowd" : null
export const LOST_STAGES = ["giveup", "us"]
export const ROW_STAGES = ["rows", "ratings"]

// The kind of username the reader is asked about now: the first not yet answered.
export const activeKind = guesses => GROUPS.find(g => !guesses[g.key])?.key ?? null

// "94 rating points below typical": the data's words, higher or lower, never better or worse.
export const diffWords = g => `${Math.abs(g.diff)} rating points ${g.diff < 0 ? "below" : "above"} typical`

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

// The hundred lost games of a group as a square of ten by ten (owner's reference,
// 28 Nov): resigned filled first, row by row, the rest as rings; beside it (under it
// on a phone) the number resigned, large, and the other three ways of losing with
// their marks. Two squares side by side; hers and the reader's a row below, so the
// first two never move. Cells are sized for two rows from the start.
export const LOSS_ORDER = ["resigned", "checkmated", "abandoned", "timeout"]
// (on a phone the frame is short: the first two squares take one row, large, with
// the breakdown; with hers and the reader's they reflow two by two, smaller, with
// only the number resigned under each; the phone's frame also uses its top and foot)
const squares = (keys, { left, right, top, bottom, narrow }, { rows = 2, compact = false } = {}) => {
  const width = right - left
  if (narrow) { top -= 40; bottom += 30 }
  const head = narrow ? 26 : 34, foot = narrow ? 12 : 30
  const side = narrow ? 0 : 150 // the numbers beside the square
  const below = narrow ? (compact ? 34 : 56) : 0 // or under it
  const gutter = narrow ? 16 : 40
  const fromWidth = narrow ? (width - gutter) / 20 : (width - gutter - 2 * (16 + side)) / 20
  const fromHeight = ((bottom - top - 24) / rows - head - below - foot) / 10
  const cell = Math.max(6, Math.min(22, fromWidth, fromHeight))
  const square = cell * 10
  const pitch = narrow ? (width + gutter) / 2 : square + 16 + side + gutter
  const block = head + square + below + foot
  const y0 = top + (narrow ? 4 : 12)
  return Object.fromEntries(keys.map((key, k) => [key, {
    key, cell, square, head, narrow, compact, below, foot,
    x: left + (k % 2) * pitch, y: y0 + Math.floor(k / 2) * block + head,
  }]))
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

  // the lost games: two squares, then (with hers, and the reader's) three or four
  const ourKeys = you ? ["bad", "everyone", "me", "you"] : ["bad", "everyone", "me"]
  const lost = squares(ourKeys, { left, right, top, bottom, narrow }, { rows: 2, compact: narrow })
  const lostFirst = narrow ? squares(["bad", "everyone"], { left, right, top, bottom, narrow }, { rows: 1 }) : lost
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

  return { rows, bands, crowd, shown, waiting, rowOf, lostAt, lost, lostFirst, tags, rx, radius, typicalX, narrow, rowsBottom }
}

// How many of a hundred lost games were resigned.
export const resignedOf = (key, you) => Math.round(
  key === "bad" ? GROUPS.find(g => g.key === "bad").resigned * 100
    : key === "everyone" ? NAMES.everyoneResigned * 100
      : key === "me" ? (MY_RESIGN.resigned / MY_RESIGN.losses) * 100
        : (you?.share ?? 0) * 100)

// How a group's hundred lost games ended, in whole games adding up to 100: the
// resigned ones rounded alone (so the number read stays 52, 45, 5), the other
// three share the rest by largest remainder.
export const endsOf = (key, you) => {
  const resigned = resignedOf(key, you)
  const raw = key === "bad" ? GROUPS.find(g => g.key === "bad").ends
    : key === "everyone" ? NAMES.everyoneEnds : key === "me" ? MY_RESIGN.ends : you?.ends
  const rest = LOSS_ORDER.slice(1)
  const total = rest.reduce((t, end) => t + (raw?.[end] ?? 0), 0)
  const exact = rest.map(end => (total ? ((raw[end] ?? 0) / total) * (100 - resigned) : 0))
  const whole = exact.map(Math.floor)
  let left = 100 - resigned - whole.reduce((a, b) => a + b, 0)
  exact.map((v, k) => [v - whole[k], k]).sort((a, b) => b[0] - a[0]).forEach(([, k]) => { if (left > 0 && total) { whole[k] += 1; left -= 1 } })
  return { resigned, ...Object.fromEntries(rest.map((end, k) => [end, whole[k]])) }
}

// Where one dot is, and how it looks, at a stage.
export const dotAt = (layout, index, { stage, revealed, you, active }) => {
  if (!layout || !stage) return null
  if (stage === "crowd") return { ...layout.crowd[index], opacity: 0.55, tone: "quiet" }
  // while the endings are told, the dots wait, unseen, where the rows left them
  if (stage === "endings" || stage === "focus") return { ...(layout.rowOf[index] ? layout.shown[index] : layout.crowd[index]), opacity: 0, tone: "quiet" }
  const lost = layout.lostAt[index]
  if (LOST_STAGES.includes(stage)) {
    const set = stage === "us" ? layout.lost : layout.lostFirst
    const square = lost && (set[lost.key] || layout.lost[lost.key])
    const shown = square && (stage === "us" || lost.key === "bad" || lost.key === "everyone")
    if (!shown) {
      // hers and the reader's wait, unseen, at the middle of their square-to-be
      if (square) return { x: square.x + square.square / 2, y: square.y + square.square / 2, opacity: 0, tone: "kept", r: 0.5 }
      const at = layout.rowOf[index] ? layout.shown[index] : layout.crowd[index]
      return { ...at, opacity: 0, tone: "quiet" }
    }
    // resigned filled, in whose colour; every other way of losing a ring
    const lit = lost.i < resignedOf(lost.key, you)
    const tone = !lit ? "kept" : lost.key === "me" ? "me" : lost.key === "you" ? "you" : "resign"
    return { ...cellAt(square, lost.i), opacity: 1, tone, r: square.cell * 0.36 }
  }
  const key = layout.rowOf[index]
  if (!key) return { ...layout.crowd[index], opacity: 0, tone: "quiet" }
  // the kind asked about now waits lit; the others wait dim
  if (!revealed[key]) return { ...layout.waiting[index], opacity: stage === "rows" && key !== active ? 0.16 : 0.5, tone: "quiet" }
  return { ...layout.shown[index], opacity: 0.9, tone: "plain" }
}

// The words and lines drawn over the dots: the tags, the rows, the typical
// line, me and the reader, the endings, and the squares of lost games.
export const CrowdMarks = ({ layout, stage, revealed, you, active, left, right, top, bottom }) => {
  if (!layout) return null
  const { rx, bands, tags, typicalX, narrow, rowsBottom } = layout
  const on = yes => ({ style: { opacity: yes ? 1 : 0 }, "aria-hidden": "true" })
  const rowsOn = ROW_STAGES.includes(stage)
  const ticks = [0, 1000, 2000]
  // whose square
  const LABEL = { bad: "Usernames that say they’re bad", everyone: "Everyone else", me: "Me", you: "You" }
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
        {/* the axis says higher or lower: a rating, not a judgement (owner, 28 Nov) */}
        <text x={right} y={rowsBottom + 38} textAnchor="end">Higher rating →</text>
        {narrow ? null : <text x={left + 120} y={rowsBottom + 38} className={c("ch-crowdAxisLow")}>← Lower rating</text>}
        {/* the scale of the rows (owner, 28 Nov): a small key under the chart */}
        <g className={c("ch-crowdKey")}>
          <circle cx={left + 4} cy={rowsBottom + 34} r={3.5} />
          <text x={left + 13} y={rowsBottom + 38}>= 10 players</text>
        </g>
        <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={rowsBottom} y2={rowsBottom} />
        {bands.map(b => <line key={b.key} className={c("ch-crowdTypical")} x1={typicalX} x2={typicalX} y1={b.bandTop - 6} y2={b.bandBottom + 6} />)}
        <text x={typicalX} y={top - 26} textAnchor="middle">Typical opponent ↓</text>
        {bands.map(b => {
          const g = b.group
          const open = revealed[g.key]
          const median = rx(g.median)
          const middle = (b.bandTop + b.bandBottom) / 2
          // the row asked about now is lit; rows still waiting are quiet; open rows read as data
          const state = open ? "open" : stage === "rows" && g.key === active ? "asked" : "waiting"
          return (
            <g key={b.key} className={c("ch-crowdRow")} data-open={open ? "true" : "false"} data-state={state}>
              <text x={left} y={b.top + 20} className={c("ch-crowdLabelLit", "ch-crowdRowName")}>
                {g.label}<tspan className={c("ch-crowdExample")}>{narrow ? "" : `   ${g.examples.slice(0, 3).join(" · ")}`}</tspan>
              </text>
              <g className={c("ch-crowdMedian")} style={{ opacity: open ? 1 : 0 }}>
                <line x1={median} x2={median} y1={b.bandTop - 4} y2={b.bandBottom + 2} />
                {/* from the typical line to the row's middle: lower or higher, at a glance */}
                <path className={c("ch-crowdShift")} d={`M${typicalX} ${middle} H${median}`} />
              </g>
              <text x={right} y={b.top + 18} textAnchor="end" className={c("ch-crowdDiff")} style={{ opacity: open ? 1 : 0 }}>
                {narrow ? `${g.diff > 0 ? "+" : "−"}${Math.abs(g.diff)} pts` : diffWords(g)}
              </text>
            </g>
          )
        })}
      </g>
      <EndingsMap left={left} right={right} top={top} narrow={narrow} stage={stage} />
      {/* one set of squares on a wide frame; on a phone the first (large) and ours (2 × 2) */}
      {(layout.lostFirst === layout.lost ? [layout.lost] : [layout.lostFirst, layout.lost]).flatMap(set => Object.values(set).map(g => ({ g, set }))).map(({ g, set }) => {
        const shared = layout.lostFirst === layout.lost
        const shown = shared ? LOST_STAGES.includes(stage) && (stage === "us" || g.key === "bad" || g.key === "everyone")
          : set === layout.lost ? stage === "us" : stage === "giveup"
        const counts = endsOf(g.key, you)
        const who = g.key === "me" || g.key === "you" ? g.key : null
        // beside the square on a wide frame; under it on a phone
        const sx = g.narrow ? g.x : g.x + g.square + 16
        const sy = g.narrow ? g.y + g.square + 28 : g.y + Math.min(g.square * 0.42, 70)
        const others = LOSS_ORDER.slice(1)
        const MARK = { checkmated: "checkmate", abandoned: "abandoned", timeout: "timeout" }
        const NAME = { checkmated: "Checkmate", abandoned: "Abandoned", timeout: "Out of time" }
        return (
          <g key={`${set === layout.lostFirst ? "first" : "ours"}-${g.key}`} {...on(shown)} className={c("ch-lostSquare")} data-who={who || "them"}>
            {who ? <circle cx={g.x + 4} cy={g.y - g.head + 12} r={4} className={c("ch-crowdWho")} data-who={who} data-dot={who} /> : null}
            <text x={g.x + (who ? 14 : 0)} y={g.y - g.head + 18} className={c(who ? "ch-crowdLabelLit" : "ch-crowdLabel", "ch-crowdRowName", "ch-crowdGridName")}>
              {g.narrow && g.key === "bad" ? "Username says bad" : LABEL[g.key]}
            </text>
            <text x={sx} y={sy} className={c("ch-lostBig")}>{counts.resigned}</text>
            {g.narrow && g.compact ? (
              <text x={sx + (String(counts.resigned).length * 17) + 6} y={sy} className={c("ch-lostBigUnit")}>Resigned</text>
            ) : g.narrow ? (
              <>
                <text x={sx + (String(counts.resigned).length * 17) + 6} y={sy} className={c("ch-lostBigUnit")}>Resigned</text>
                {others.map((end, k) => (
                  <g key={end}>
                    <EndingMark kind={MARK[end]} x={sx + k * 46} y={sy + 9} size={13} />
                    <text x={sx + k * 46 + 17} y={sy + 20} className={c("ch-lostCount")}>{counts[end]}</text>
                  </g>
                ))}
              </>
            ) : (
              <>
                <text x={sx} y={sy + 18} className={c("ch-lostBigUnit")}>Resigned</text>
                {others.map((end, k) => (
                  <g key={end}>
                    <EndingMark kind={MARK[end]} x={sx - 1} y={sy + 32 + k * 26} size={17} />
                    <text x={sx + 22} y={sy + 47 + k * 26} className={c("ch-lostCount")}>
                      {counts[end]}<tspan className={c("ch-lostCountName")}> {NAME[end]}</tspan>
                    </text>
                  </g>
                ))}
              </>
            )}
          </g>
        )
      })}
      {/* one dot, one game: under the squares (owner's reference) */}
      {(() => {
        const set = stage === "us" ? layout.lost : layout.lostFirst
        const lowest = Math.max(...Object.values(set).filter(g => stage === "us" || g.key === "bad" || g.key === "everyone").map(g => g.y + g.square + g.below))
        return <text x={left} y={lowest + (set.bad.narrow ? 14 : 28)} className={c("ch-lostNote")} {...on(LOST_STAGES.includes(stage))}>One dot = one lost game in 100.</text>
      })()}
    </g>
  )
}
