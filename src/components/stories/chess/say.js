"use client"

import * as React from "react"

import { c } from "./parts"
import say from "./say.json"

// The graphics of "What we say about ourselves" (say.json, from real games).

const useWidth = () => {
  const ref = React.useRef(null)
  const [width, setWidth] = React.useState(0)
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

const lower = points => (points === 0 ? "the same" : points < 0 ? `${-points} lower` : `${points} higher`)

// Her drop from rapid to bullet, among the players at her rapid level: one dot
// per player, stacked by how far their bullet rating sits from their rapid.
export const FastGap = () => {
  const { gap, peerGaps, peerMedian, peerLevel, rapid, bullet } = say.fast
  const [ref, width] = useWidth()
  const [lo, hi, bin] = [-700, 300, 25]
  const columns = Math.round((hi - lo) / bin)
  const stacks = new Array(columns).fill(0)
  for (const g of peerGaps) stacks[Math.max(0, Math.min(columns - 1, Math.floor((g - lo) / bin)))]++
  const tallest = Math.max(...stacks)
  const step = width ? Math.max(4, Math.min(7, (width / columns) * 0.78)) : 6
  const plot = tallest * step + 6
  const x = value => ((Math.max(lo, Math.min(hi, value)) - lo) / (hi - lo)) * width
  const label = `Bullet rating minus rapid rating, July to September 2026. Mine: ${lower(gap)} (bullet ${bullet}, rapid ${rapid}). For the ${peerGaps.length} players at my rapid level (${peerLevel[0]} to ${peerLevel[1]}): typically ${lower(peerMedian)}; ${Math.round(say.fast.peerShareAsLarge * 100)}% dropped as far as I did, or further.`
  return (
    <figure className={c("ch-fast")} role="img" aria-label={label}>
      <p className={c("ch-note")}>
        Bullet rating minus rapid rating · {peerGaps.length} players at my rapid level
      </p>
      <div className={c("ch-fastPlot")} ref={ref} style={{ height: plot }} aria-hidden="true">
        {width
          ? stacks.flatMap((count, column) =>
              Array.from({ length: count }, (_, k) => (
                <i
                  key={`${column}-${k}`}
                  className={c("ch-dot")}
                  style={{ left: (column + 0.5) * (width / columns), bottom: k * step + 3, width: step - 1.5, height: step - 1.5 }}
                />
              )),
            )
          : null}
        <span className={c("ch-fastLine")} data-kind="typical" style={{ left: x(peerMedian) }} />
        <span className={c("ch-fastLine")} data-kind="me" style={{ left: x(gap) }} />
      </div>
      <div className={c("ch-fastAxis")} aria-hidden="true">
        {[-600, -400, -200, 0, 200].map(t => (
          <span key={t} style={{ left: x(t) }}>
            {t === 0 ? "same" : t < 0 ? `${-t} lower` : `${t} higher`}
          </span>
        ))}
      </div>
      <p className={c("ch-fastKey")} aria-hidden="true">
        <span data-kind="me">Me: {lower(gap)}</span>
        <span data-kind="typical">Typical: {lower(peerMedian)}</span>
      </p>
    </figure>
  )
}

const group = key => say.names.groups.find(g => g.key === key)

// Usernames as kinds, not anyone's: the pattern, then an ellipsis.
export const Patterns = ({ of = "bad" }) => (
  <div className={c("ch-patterns")} role="img" aria-label={`Usernames like ${group(of).examples.join(", ")}`}>
    {group(of).examples.map(name => (
      <span key={name}>
        {name}
        <i aria-hidden="true">…</i>
      </span>
    ))}
  </div>
)

const PAWN = "M10 1.6a4.3 4.3 0 0 1 2.7 7.7c1.5.6 2.5 1.7 2.5 2.9H4.8c0-1.2 1-2.3 2.5-2.9A4.3 4.3 0 0 1 10 1.6zM6.8 13.4h6.4l1.6 8.1H5.2zM3.6 22.6h12.8l1 4.3H2.6z"

const Pawns = ({ share }) => (
  <span className={c("ch-pawns")} aria-hidden="true">
    {Array.from({ length: 10 }, (_, i) => {
      const lit = Math.max(0, Math.min(1, share * 10 - i))
      return (
        <svg key={i} viewBox="0 0 20 28">
          <path d={PAWN} className={c("ch-pawnOff")} />
          {lit > 0 ? <path d={PAWN} className={c("ch-pawnOn")} style={{ clipPath: `inset(0 ${(1 - lit) * 100}% 0 0)` }} /> : null}
        </svg>
      )
    })}
  </span>
)

const Row = ({ label, share, sub }) => (
  <div className={c("ch-pawnRow")} role="img" aria-label={`${label}: ${(share * 10).toFixed(1)} in 10 rated above a typical opponent${sub ? `, ${sub}` : ""}.`}>
    <span className={c("ch-pawnLabel")} aria-hidden="true">
      {label}
      <b>{(share * 10).toFixed(1).replace(/\.0$/, "")} in 10</b>
    </span>
    <Pawns share={share} />
  </div>
)

// Out of 10 opponents with a name like this, how many are rated above a typical
// opponent (the rating half of all opponents are above). A typical opponent is 5.
export const Above = ({ keys }) => (
  <div className={c("ch-above")}>
    {keys.map(key => (
      <Row key={key} label={group(key).label} share={group(key).above} sub={`from ${group(key).games.toLocaleString("en-GB")} games`} />
    ))}
    <Row label="Any opponent" share={0.5} />
  </div>
)

export const ABOVE_NOTE = `Rated above a typical opponent (${say.names.typical}) · each opponent counted once per game met`
