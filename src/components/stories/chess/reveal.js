"use client"

import * as React from "react"

import { c, Pinned, Show, Text, useUnit } from "./parts"
import data from "./style.json"

// Part III, third question: what our choices reveal. The professor said
// "aggressiveness is in your nature" while she still played the London
// System; on 23 March 2026 she stopped. Her style on three scales, against
// players of her own rating (style.json, from style_scales.py, its
// definitions fixed before the run in style-definitions.md): first the
// switch, then the reader places her on each scale, then each is revealed,
// for the London months and since.
//
// Colours as everywhere in Part III: clay is the author (pale for the London
// months), grey dots are other players (one dot for ten), the reader's guess
// is light.

const SCALES = [
  { key: "initiative", name: "Initiative", what: "forcing moves, moves 5–25", ends: ["quiet", "aggressive"] },
  { key: "safety", name: "Safety", what: "castled by move 10", ends: ["exposed", "cautious"] },
  { key: "tempo", name: "Tempo", what: "moves made in under 2 seconds", ends: ["deliberate", "impulsive"] },
]
const ROWS = [
  ["since", "Since the switch", "rated 600–900"],
  ["london", "London months", "rated 400–600"],
]
const pct = v => `${Math.round(v * 100)}%`
const inHundred = v => Math.round(v * 100)

// Where on each scale's line a value lies: the scale spans both rows' players.
const domain = key => {
  const all = ROWS.flatMap(([period]) => [...data.scales[key][period].dots, data.scales[key][period].her])
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const pad = (hi - lo) * 0.04
  return [lo - pad, hi + pad]
}

// Players as a dot plot: each dot is ten players, stacked where they are many.
const W = 600
const stackOf = (dots, x) => {
  const counts = new Map()
  return dots.map(v => {
    const column = Math.round(x(v) / 6)
    const n = counts.get(column) || 0
    counts.set(column, n + 1)
    return [column * 6, n]
  })
}

const Row = ({ scale, period, label, band, x, shown, guess }) => {
  const unit = useUnit()
  const row = data.scales[scale.key][period]
  const placed = stackOf(row.dots, x)
  const tallest = Math.max(...placed.map(([, n]) => n)) + 1
  const H = Math.min(64, 14 + tallest * 4.4)
  const y = n => H - 8 - n * 4.4
  return (
    <div className={c("ch-scaleRow")} data-period={period}>
      <p className={c("ch-scaleLabel")}>
        {label} <span>{band}</span>
      </p>
      <svg ref={unit} viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={shown ? `${label}: ${pct(row.her)}, more than ${inHundred(row.above)} in 100 players ${band}. Typical player ${pct(row.median)}.` : `${label}: not revealed yet.`}>
        <line x1="0" x2={W} y1={H - 3} y2={H - 3} className={c("ch-scaleAxis")} />
        <g className={c("ch-scaleDots")} data-on={shown ? "true" : "false"}>
          {placed.map(([cx, n], i) => (
            <circle key={i} cx={cx} cy={y(n)} r="1.9" />
          ))}
        </g>
        {shown ? (
          <g className={c("ch-scaleHer")} data-period={period}>
            <line x1={x(row.range[0])} x2={x(row.range[1])} y1={H - 3} y2={H - 3} />
            <circle cx={x(row.her)} cy={H - 3} r="6" />
            <text x={x(row.her)} y={H + 14} textAnchor="middle">{pct(row.her)}</text>
          </g>
        ) : null}
        {guess != null && period === "since" ? (
          <g className={c("ch-scaleGuess")}>
            <path d={`M${x(guess)},${H - 12} l-6,-9 h12 z`} />
          </g>
        ) : null}
      </svg>
    </div>
  )
}

const Scale = ({ scale, shown, focus, says, guess, onGuess, asking, note }) => {
  const [lo, hi] = domain(scale.key)
  const x = v => ((v - lo) / (hi - lo)) * W
  const since = data.scales[scale.key].since
  const guessAbove = guess == null ? null : since.dots.filter(d => d < guess).length / since.dots.length
  return (
    <figure className={c("ch-scale")} data-shown={shown ? "true" : "false"} data-focus={focus ? "true" : "false"}>
      <figcaption className={c("ch-scaleHead")}>
        <b>{scale.name}</b> <span>{scale.what}</span>
      </figcaption>
      <div className={c("ch-scaleEnds")} aria-hidden="true">
        <span>{scale.ends[0]}</span>
        <span>{scale.ends[1]}</span>
      </div>
      {/* before it is revealed, only the row the reader places her on */}
      {ROWS.filter(([period]) => shown || period === "since").map(([period, label, band]) => (
        <Row key={period} scale={scale} period={period} label={label} band={band} x={x} shown={shown} guess={guess} />
      ))}
      {asking ? (
        <label className={c("ch-scaleAsk")}>
          <span>Your guess</span>
          <input
            type="range"
            min={0}
            max={1000}
            value={guess == null ? 500 : Math.round(((guess - lo) / (hi - lo)) * 1000)}
            onChange={e => onGuess(lo + (Number(e.target.value) / 1000) * (hi - lo))}
            aria-valuetext={guess == null ? "not placed" : `more than ${inHundred(guessAbove)} in 100 players`}
          />
        </label>
      ) : null}
      {shown && says ? (
        <p className={c("ch-scaleSays")}>
          Since the switch, more than <b>{inHundred(since.above)} in 100</b> players at my rating. In the London months, {inHundred(data.scales[scale.key].london.above)} in 100.
          {guess != null ? ` You placed me above ${inHundred(guessAbove)} in 100.` : ""}
          {note ? <span>{note}</span> : null}
        </p>
      ) : null}
    </figure>
  )
}

// Every game she played as White from February, by its first move.
const DAY = 86400000
const first = Date.parse(`${data.switch[0][0]}T00:00:00Z`)
const last = Date.parse(`${data.switch.at(-1)[0]}T00:00:00Z`)
const SWITCH_DAY = Date.parse("2026-03-23T00:00:00Z")
const Switch = () => {
  const unit = useUnit()
  const x = day => ((Date.parse(`${day}T00:00:00Z`) - first) / (last - first + DAY)) * W
  const d4 = data.switch.filter(([, m]) => m === "d4").length
  const e4 = data.switch.filter(([, m]) => m === "e4").length
  return (
    <figure className={c("ch-switch")}>
      <figcaption className={c("ch-scaleHead")}>
        <b>Every game I played as White</b> <span>February to November 2026, by its first move</span>
      </figcaption>
      <svg ref={unit} viewBox={`0 0 ${W} 96`} role="img" aria-label={`${data.switch.length} games as White: ${d4} opened 1.d4, the London System, until 23 March 2026; ${e4} opened 1.e4, all after it.`}>
        {data.switch.map(([day, move], i) => (
          <line key={i} x1={x(day)} x2={x(day)} y1="18" y2="70" data-move={move === "d4" ? "d4" : move === "e4" ? "e4" : "other"} className={c("ch-switchGame")} />
        ))}
        <line x1={((SWITCH_DAY - first) / (last - first + DAY)) * W} x2={((SWITCH_DAY - first) / (last - first + DAY)) * W} y1="6" y2="82" className={c("ch-switchDay")} />
        <text x={((SWITCH_DAY - first) / (last - first + DAY)) * W + 6} y="12">23 March</text>
        {["2026-02-01", "2026-05-01", "2026-08-01", "2026-11-01"].map(day => (
          <text key={day} x={x(day)} y="92" className={c("ch-switchMonth")}>
            {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
          </text>
        ))}
      </svg>
      <p className={c("ch-switchKey")}>
        <span data-move="d4">1.d4, the London System · {d4}</span>
        <span data-move="e4">1.e4 · {e4}</span>
      </p>
    </figure>
  )
}

export const Reveal = () => {
  const [guesses, setGuesses] = React.useState({})
  const guess = key => ({ guess: guesses[key] ?? null, onGuess: v => setGuesses(all => ({ ...all, [key]: v })) })
  const notes = {
    safety: `Queens off by move 20: more than ${inHundred(data.queens20.above)} in 100.`,
    tempo: `My moves under 2 seconds were mistakes ${pct(data.fastMistakes.mistakeRateFast)} of the time; my slower moves, ${pct(data.fastMistakes.mistakeRateSlow)}.`,
  }
  return (
    <Pinned
      reading
      mark="what-we-choose"
      className={c("ch-reveal")}
      label="What our choices reveal"
      steps={[
        { text: <Text name="reveal-professor" look="lead" /> },
        { text: <Text name="reveal-guess" look="lead" /> },
        { text: <Text name="reveal-initiative" look="lead" /> },
        { text: <Text name="reveal-safety" look="lead" /> },
        { text: <Text name="reveal-tempo" look="lead" /> },
        { text: <Text name="reveal-verdict" look="lead" /> },
        { text: <Text name="reveal-limits" look="lead" /> },
      ]}
    >
      {step => (
        <div className={c("ch-revealScene")}>
          <Show on={step === 0} className={c("ch-revealLayer")}>
            <Switch />
          </Show>
          <Show on={step >= 1} className={c("ch-revealLayer")}>
            <div className={c("ch-scales")}>
              {SCALES.map((scale, i) => (
                <Scale key={scale.key} scale={scale} shown={step >= 2 + i} focus={step === 2 + i || step === 1 || step >= 5} says={step === 2 + i} asking={step === 1} note={notes[scale.key]} {...guess(scale.key)} />
              ))}
            </div>
          </Show>
        </div>
      )}
    </Pinned>
  )
}
