"use client"

import * as React from "react"

import { c, Pinned, Show, Text, useUnit } from "./parts"
import data from "./style.json"

// Part III, third question: what our choices reveal. The professor said
// "aggressiveness is in your nature" while she still played the London
// System; on 23 March 2026 she stopped. One chart carries the whole scene:
// every game she played as White, which is also the date track, and under it
// her three scales against players of her own rating (style.json, from
// style_scales.py, its definitions fixed before the run in
// style-definitions.md).
//
// First the switch; then the reader places her on each scale; then each is
// revealed, as she plays now; then the date slider: her games so far in that
// period, week by week, back across 23 March to the London months and
// forward again (export_style_timeline.py). Each stop is placed among the
// players of its own period's rating band, so the grey dots change across the
// switch. The last stop of each period is the period's own value, the one the
// words quote.
//
// Colours as everywhere in Part III: clay is the author, grey dots are other
// players (one dot for ten), green is the reader (the guesses, the slider).

const SCALES = [
  {
    key: "initiative",
    name: "Initiative",
    what: "forcing moves, moves 5–25",
    ends: ["quiet", "aggressive"],
  },
  {
    key: "safety",
    name: "Safety",
    what: "castled by move 10",
    ends: ["exposed", "cautious"],
  },
  {
    key: "tempo",
    name: "Tempo",
    what: "moves made in under 2 seconds",
    ends: ["deliberate", "impulsive"],
  },
]
const BAND = { london: "rated 400–600", since: "rated 600–900" }
const pct = v => `${Math.round(v * 100)}%`
const inHundred = v => Math.round(v * 100)
const longDay = day =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  })

// The slider's stops: a stop counts from 30 games of its period on.
const STOPS = data.timeline.filter(s => s.games >= 30)
const LAST = STOPS.length - 1
const LONDON_END = STOPS.findLastIndex(s => s.period === "london")

// Where on each scale's line a value lies: the scale spans both bands' players
// and every stop of hers.
const W = 600
const DOMAIN = Object.fromEntries(
  SCALES.map(({ key }) => {
    const all = [
      ...data.scales[key].london.dots,
      ...data.scales[key].since.dots,
      ...STOPS.map(s => s[key].her),
    ]
    const lo = Math.min(...all)
    const hi = Math.max(...all)
    const pad = (hi - lo) * 0.04
    return [key, [lo - pad, hi + pad]]
  }),
)
const xOf = key => {
  const [lo, hi] = DOMAIN[key]
  return v => Math.max(0, Math.min(W, ((v - lo) / (hi - lo)) * W))
}

// Players as a dot plot: each dot is ten players, stacked where they are many.
const STEP = 4.4
const stackOf = (dots, x) => {
  const counts = new Map()
  return dots.map(v => {
    const column = Math.round(x(v) / 6)
    const n = counts.get(column) || 0
    counts.set(column, n + 1)
    return [column * 6, n]
  })
}
const PLACED = Object.fromEntries(
  SCALES.map(({ key }) => {
    const x = xOf(key)
    const london = stackOf(data.scales[key].london.dots, x)
    const since = stackOf(data.scales[key].since.dots, x)
    const tallest = Math.max(...[...london, ...since].map(([, n]) => n)) + 1
    return [key, { london, since, H: Math.min(64, 14 + tallest * STEP) }]
  }),
)

const Lane = ({
  scale,
  stop,
  revealed,
  focus,
  says,
  note,
  guess,
  onGuess,
  asking,
}) => {
  const unit = useUnit()
  const x = xOf(scale.key)
  const [lo, hi] = DOMAIN[scale.key]
  const { H } = PLACED[scale.key]
  const placed = PLACED[scale.key][stop.period]
  const most = Math.max(
    PLACED[scale.key].london.length,
    PLACED[scale.key].since.length,
  )
  const y = n => H - 8 - n * STEP
  const her = stop[scale.key]
  const since = data.scales[scale.key].since
  const guessAbove =
    guess == null
      ? null
      : since.dots.filter(d => d < guess).length / since.dots.length
  const guessShown = guess != null && stop.period === "since"
  return (
    <figure
      className={c("ch-scale")}
      data-shown={revealed ? "true" : "false"}
      data-focus={focus ? "true" : "false"}
    >
      <figcaption className={c("ch-scaleHead")}>
        <b>{scale.name}</b> <span>{scale.what}</span>
        {revealed ? (
          <em className={c("ch-scalePlace")} data-period={stop.period}>
            above {inHundred(her.above)} in 100
          </em>
        ) : asking ? (
          <em className={c("ch-scalePlace")} data-reader="true">
            {guess == null
              ? "drag along the line"
              : `your guess: above ${inHundred(guessAbove)} in 100`}
          </em>
        ) : null}
      </figcaption>
      <div className={c("ch-scaleRow")} data-asking={asking ? "true" : "false"}>
        <div className={c("ch-scaleEnds")} aria-hidden="true">
          <span>{scale.ends[0]}</span>
          <span>{scale.ends[1]}</span>
        </div>
        <svg
          ref={unit}
          viewBox={`0 0 ${W} ${H + 18}`}
          role="img"
          aria-label={
            revealed
              ? `${scale.name}: ${pct(her.her)}, more than ${inHundred(her.above)} in 100 players ${BAND[stop.period]}.`
              : `${scale.name}: players ${BAND[stop.period]}; mine not revealed yet.`
          }
        >
          <line
            x1="0"
            x2={W}
            y1={H - 3}
            y2={H - 3}
            className={c("ch-scaleAxis")}
          />
          <g className={c("ch-scaleDots")} data-on="true">
            {Array.from({ length: most }, (_, i) => {
              const [cx, n] = placed[i] || placed.at(-1)
              return (
                <circle
                  key={i}
                  r="1.9"
                  style={{
                    transform: `translate(${cx}px, ${y(n)}px)`,
                    opacity: placed[i] ? undefined : 0,
                  }}
                />
              )
            })}
          </g>
          {revealed ? (
            <g className={c("ch-scaleHer")} data-period={stop.period}>
              <line
                x1={x(her.range[0])}
                x2={x(her.range[1])}
                y1={H - 3}
                y2={H - 3}
              />
              <circle cx={x(her.her)} cy={H - 3} r="6" />
              <text x={x(her.her)} y={H + 14} textAnchor="middle">
                {pct(her.her)}
              </text>
            </g>
          ) : null}
          {guessShown || asking ? (
            <g
              className={c("ch-scaleGuess")}
              data-placed={guess != null ? "true" : "false"}
            >
              <path
                d={`M${x(guess ?? (lo + hi) / 2)},${H - 12} l-7,-11 h14 z`}
              />
            </g>
          ) : null}
        </svg>
        {/* The guess is made on the line itself: the range input lies over it, unseen, and the
            triangle is its handle. */}
        {asking ? (
          <input
            className={c("ch-scaleAsk")}
            type="range"
            min={0}
            max={1000}
            value={
              guess == null
                ? 500
                : Math.round(((guess - lo) / (hi - lo)) * 1000)
            }
            onChange={e =>
              onGuess(lo + (Number(e.target.value) / 1000) * (hi - lo))
            }
            aria-label={`Your guess for ${scale.name.toLowerCase()}, from ${scale.ends[0]} to ${scale.ends[1]}`}
            aria-valuetext={
              guess == null
                ? "not placed"
                : `more than ${inHundred(guessAbove)} in 100 players`
            }
          />
        ) : null}
      </div>
      {says && (guess != null || note) ? (
        <p className={c("ch-scaleSays")}>
          {guess != null ? (
            <i>You placed me above {inHundred(guessAbove)} in 100.</i>
          ) : null}
          {note ? <span>{note}</span> : null}
        </p>
      ) : null}
    </figure>
  )
}

// Every game she played as White from February, by its first move: the date
// track. With a stop chosen, the games after it fade and a line marks it.
const DAY = 86400000
const first = Date.parse(`${data.switch[0][0]}T00:00:00Z`)
const last = Date.parse(`${data.switch.at(-1)[0]}T00:00:00Z`)
const xDay = day =>
  ((Date.parse(`${day}T00:00:00Z`) - first) / (last - first + DAY)) * W
const SWITCH_X = xDay("2026-03-23")
const D4 = data.switch.filter(([, m]) => m === "d4").length
const E4 = data.switch.filter(([, m]) => m === "e4").length

const Track = ({ at }) => {
  const unit = useUnit()
  const edge = at == null ? null : xDay(at) + (DAY / (last - first + DAY)) * W
  return (
    <svg
      ref={unit}
      viewBox={`0 0 ${W} 96`}
      role="img"
      aria-label={`${data.switch.length} games as White: ${D4} opened 1.d4, the London System, until 23 March 2026; ${E4} opened 1.e4, all after it.`}
    >
      {data.switch.map(([day, move], i) => (
        <line
          key={i}
          x1={xDay(day)}
          x2={xDay(day)}
          y1="18"
          y2="70"
          data-move={move === "d4" ? "d4" : move === "e4" ? "e4" : "other"}
          data-later={at != null && day > at ? "true" : "false"}
          className={c("ch-switchGame")}
        />
      ))}
      <line
        x1={SWITCH_X}
        x2={SWITCH_X}
        y1="6"
        y2="82"
        className={c("ch-switchDay")}
      />
      <text x={SWITCH_X + 6} y="12">
        23 March
      </text>
      {["2026-02-01", "2026-05-01", "2026-08-01", "2026-11-01"].map(day => (
        <text key={day} x={xDay(day)} y="92" className={c("ch-switchMonth")}>
          {new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
            month: "short",
            timeZone: "UTC",
          })}
        </text>
      ))}
      {edge != null ? (
        <line x1={edge} x2={edge} y1="14" y2="74" className={c("ch-styleAt")} />
      ) : null}
    </svg>
  )
}

// The step, told to the scene's state (as in wrong.js).
const StepSpy = ({ at, onStep }) => {
  React.useEffect(() => onStep(at), [at, onStep])
  return null
}

export const Reveal = () => {
  const [guesses, setGuesses] = React.useState({})
  const [at, setAt] = React.useState(LAST)
  const [step, setStep] = React.useState(0)
  const walked = React.useRef(false)
  const walk = React.useRef(null)
  const guess = key => ({
    guess: guesses[key] ?? null,
    onGuess: v => setGuesses(all => ({ ...all, [key]: v })),
  })
  const notes = {
    safety: `Queens off by move 20: more than ${inHundred(data.queens20.above)} in 100.`,
    tempo: `My moves under 2 seconds were mistakes ${pct(data.fastMistakes.mistakeRateFast)} of the time; my slower moves, ${pct(data.fastMistakes.mistakeRateSlow)}.`,
  }

  // Once, when the slider first appears: back through the weeks to the last
  // London stop, where the professor's words were said. Then it is the
  // reader's. Without motion it is simply there.
  const travelling = step >= 5
  React.useEffect(() => {
    if (!travelling || walked.current) return
    walked.current = true
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAt(LONDON_END)
      return
    }
    let i = LAST
    walk.current = window.setInterval(() => {
      i -= 1
      setAt(i)
      if (i <= LONDON_END) {
        window.clearInterval(walk.current)
        walk.current = null
      }
    }, 45)
  }, [travelling])
  React.useEffect(
    () => () => walk.current && window.clearInterval(walk.current),
    [],
  )
  const take = v => {
    if (walk.current) {
      window.clearInterval(walk.current)
      walk.current = null
    }
    setAt(v)
  }

  const stop = STOPS[travelling ? at : LAST]
  const where = `${stop.games.toLocaleString("en-GB")} games ${stop.period === "london" ? "before the switch" : "since the switch"} · players ${BAND[stop.period]}`

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
      {now => {
        return (
          <div className={c("ch-revealScene")}>
            <StepSpy at={now} onStep={setStep} />
            <Show on className={c("ch-revealLayer")}>
              <figure className={c("ch-style")} data-at={now}>
                <figcaption className={c("ch-scaleHead", "ch-styleCaption")}>
                  <b>Every game I played as White</b>{" "}
                  <span>February to 15 November 2026, by its first move</span>
                </figcaption>
                <div className={c("ch-switch")}>
                  <Track at={now >= 5 ? stop.day : null} />
                  <p className={c("ch-switchKey")}>
                    <span data-move="d4">1.d4, London System · {D4}</span>
                    <span data-move="e4">1.e4 · {E4}</span>
                  </p>
                </div>
                <div
                  className={c("ch-styleWhen")}
                  data-on={now >= 1 ? "true" : "false"}
                >
                  {now >= 5 ? (
                    <label className={c("ch-styleSlider")}>
                      <span>
                        <b>Up to {longDay(stop.day)}</b> · {where}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={LAST}
                        value={at}
                        onChange={e => take(Number(e.target.value))}
                        aria-label="Move through the months"
                        aria-valuetext={`Up to ${longDay(stop.day)} 2026: ${where}`}
                      />
                    </label>
                  ) : (
                    <p>
                      <b>Since the switch</b> ·{" "}
                      {STOPS[LAST].games.toLocaleString("en-GB")} games ·
                      players {BAND.since}
                    </p>
                  )}
                </div>
                <div
                  className={c("ch-scales")}
                  data-on={now >= 1 ? "true" : "false"}
                >
                  {SCALES.map((scale, i) => (
                    <Lane
                      key={scale.key}
                      scale={scale}
                      stop={stop}
                      revealed={now >= 2 + i}
                      focus={now === 2 + i || now === 1 || now >= 5}
                      says={now === 2 + i}
                      asking={now === 1}
                      note={notes[scale.key]}
                      {...guess(scale.key)}
                    />
                  ))}
                </div>
              </figure>
            </Show>
          </div>
        )
      }}
    </Pinned>
  )
}
