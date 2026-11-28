"use client"

import * as React from "react"

import { c } from "./parts"

// How a game of chess can end: six endings, each with its own mark, drawn in
// one line style so colour stays free for whose game it is (me, you, them).
// Shown once, between the names and the lost games (owner, 28 Nov), and meant
// to be reused wherever the story speaks of how games end.
// Marks: "#" and "½" are chess's own notation (checkmate, a draw); resigning is
// the tipped king, the gesture over the board (owner's choice); the clock and the
// empty chair stand in where chess has no sign.
// Names and lines are my wording, to be changed freely by the owner.
export const ENDINGS = [
  { key: "checkmate", group: "lose", name: "Checkmate", line: "The king is trapped and can’t escape." },
  { key: "resigned", group: "lose", name: "Resigned", line: "The player gives up and tips their king." },
  { key: "timeout", group: "lose", name: "Out of time", line: "Their clock runs out." },
  { key: "abandoned", group: "lose", name: "Abandoned", line: "They leave and never come back." },
  { key: "stalemate", group: "draw", name: "Stalemate", line: "No legal move, but not in check." },
  { key: "draw", group: "draw", name: "Other draws", line: "Agreed, repeated, or too few pieces to win." },
]
export const ENDING_GROUPS = [
  { key: "lose", name: "One player loses" },
  { key: "draw", name: "Nobody wins" },
]

// a solid king in a 32 × 32 box, standing on y = 28.5
const King = props => (
  <g className={c("ch-endingKing")} {...props}>
    <rect x={15} y={2} width={2} height={7} rx={0.5} />
    <rect x={12.5} y={4.2} width={7} height={2} rx={0.5} />
    <path d="M10 14.5C10 9.5 22 9.5 22 14.5L20.5 16H11.5Z" />
    <path d="M11.5 17H20.5L22 25H10Z" />
    <rect x={8} y={25.5} width={16} height={3} rx={1} />
  </g>
)

// One ending's mark, size × size, at (x, y) top left. Strokes take currentColor.
export const EndingMark = ({ kind, x = 0, y = 0, size = 32 }) => {
  const s = size / 32
  return (
    <g className={c("ch-endingMark")} transform={`translate(${x} ${y}) scale(${s})`} data-ending={kind} aria-hidden="true">
      {kind === "checkmate" ? <text x={16} y={25} textAnchor="middle" className={c("ch-endingGlyph")}>#</text>
        : kind === "resigned" ? (<><King transform="rotate(90 16 16) translate(4 0)" /><path d="M2 28.5h28" /></>)
          : kind === "timeout" ? (<><circle cx={16} cy={18} r={10} /><path d="M16 18v-6M16 18l4 2.5M14 4.5h4M16 4.5v3.5" /></>)
            : kind === "abandoned" ? <path d="M9.5 3.5h13v11h-13zM6.5 17.5h19M9 17.5v10M23 17.5v10" />
              : kind === "stalemate" ? (<><rect x={3.5} y={2.5} width={25} height={27} rx={1.5} strokeDasharray="2.4 2.4" /><King transform="translate(4 2) scale(0.75)" /></>)
                : <text x={16} y={24} textAnchor="middle" className={c("ch-endingGlyph", "ch-endingHalf")}>½</text>}
    </g>
  )
}

// (a line that may not fit wraps by words, and its row grows)
const wrap = (text, chars) => text.split(" ").reduce((lines, word) => {
  const last = lines.at(-1)
  if (last && (last + " " + word).length <= chars) lines[lines.length - 1] = last + " " + word
  else lines.push(word)
  return lines
}, [])

// The three results a game can have, with chess's own scores. A win and a loss
// are one game seen from both sides: a bracket joins them.
export const RESULTS = [
  { key: "win", name: "Win", score: "1–0", group: "lose" },
  { key: "loss", name: "Loss", score: "0–1", group: "lose" },
  { key: "draw", name: "Draw", score: "½–½", group: "draw" },
]

// "How a game can end" (owner's brief, 28 Nov): the result first, then how it ends.
// Two tiers under thin section rules; the endings sit under the result they give.
// stage "endings": everything; "focus": only the loss and its four ways stay lit;
// lost-game stages: the map fades and the squares of lost games come in (crowd.js).
export const EndingsMap = ({ left, right, top, narrow, stage }) => {
  const tight = right - left < 300
  const lost = ["giveup", "us"].includes(stage)
  const shown = stage === "endings" || stage === "focus" || lost
  const focus = stage !== "endings"
  const dim = key => (focus && key !== "loss" && key !== "lose" ? 0.14 : 1)
  const width = right - left
  // two columns on a wide frame (draws beside), one on a phone (draws under)
  const colL = left, colR = narrow ? left : left + width * 0.62
  const icon = narrow ? (tight ? 24 : 26) : 30
  const rowH = narrow ? (tight ? 42 : 46) : 54
  const y0 = top + (narrow ? (tight ? -56 : -44) : 4)

  const rule = (label, y, key) => (
    <g key={key} className={c("ch-endingRule")}>
      <text x={left} y={y}>{label}</text>
      <line x1={left + label.length * 7.4 + 12} x2={right} y1={y - 4} y2={y - 4} />
    </g>
  )

  // tier one: the result
  const wordsY = y0 + (narrow ? 46 : 60), scoreY = wordsY + (narrow ? 20 : 24)
  const wordX = { win: colL, loss: colL + (narrow ? width * 0.3 : width * 0.28), draw: narrow ? left + width * 0.68 : colR }
  const wordW = narrow ? 54 : 84
  const bracketY = scoreY + (narrow ? 10 : 14)
  // tier two: how it ends
  const endsRuleY = bracketY + (narrow ? 30 : 40)
  const blocks = []
  let yL = endsRuleY + (narrow ? 26 : 32), yR = yL
  for (const group of ENDING_GROUPS) {
    const draw = group.key === "draw"
    const x = draw ? colR : colL
    if (draw && narrow) yR = yL + 18
    let y = draw ? yR : yL
    const colW = narrow ? width : draw ? width * 0.38 : width * 0.58
    const nameX = x + icon + (narrow ? 14 : 16)
    const chars = Math.floor((x + colW - nameX) / (narrow ? 6.6 : 7.2))
    blocks.push(<text key={`head-${group.key}`} x={x} y={y} className={c("ch-endingHead")} style={{ opacity: lost ? 0 : dim(group.key) }}>{group.name}</text>)
    y += narrow ? 12 : 16
    ENDINGS.filter(e => e.group === group.key).forEach((e, k) => {
      const lines = wrap(e.line, chars)
      blocks.push(
        <g key={e.key} className={c("ch-endingRow")} style={{ opacity: lost ? 0 : dim(group.key) }}>
          <EndingMark kind={e.key} x={x} y={y} size={icon} />
          <text x={nameX} y={y + (narrow ? 14 : 15)} className={c("ch-crowdRowName", "ch-endingName")}>{e.name}</text>
          <text x={nameX} y={y + (narrow ? 32 : 35)} className={c("ch-endingLine")}>
            {lines.map((line, i) => <tspan key={i} x={nameX} dy={i ? "1.3em" : undefined}>{line}</tspan>)}
          </text>
        </g>
      )
      y += rowH + (lines.length - 1) * 16
    })
    if (draw) yR = y; else yL = y
  }

  return (
    <g className={c("ch-endings")} style={{ opacity: shown ? 1 : 0 }} aria-hidden="true" data-stage={stage}>
      <g style={{ opacity: lost ? 0 : 1 }} className={c("ch-endingTiers")}>
        {rule("The result", y0 + 10, "rule-result")}
        {RESULTS.map(r => (
          <g key={r.key} style={{ opacity: dim(r.key) }} className={c("ch-endingResult")}>
            <text x={wordX[r.key]} y={wordsY} className={c("ch-endingWord")}>{r.name}</text>
            <text x={wordX[r.key]} y={scoreY} className={c("ch-endingScore")}>{r.score}</text>
          </g>
        ))}
        {/* a win and a loss are one game: the bracket joins them */}
        <path className={c("ch-endingBracket")} style={{ opacity: focus ? 0.35 : 1 }}
          d={`M${wordX.win + wordW / 2} ${bracketY - 6}V${bracketY}H${wordX.loss + wordW / 2}V${bracketY - 6}`} />
        {rule("How it ends", endsRuleY, "rule-ends")}
      </g>
      {blocks}
    </g>
  )
}
