"use client"

import * as React from "react"

import { c } from "./parts"
import social from "./social.json"
import time from "./time.json"

// Where Chess.com arrives, the story's thread becomes a line of data: the
// minutes a day the author spent in live games (time.json, from her own
// games). Beside it, dashed, runs an estimate of her time on social media
// (social.json): there is no data for it, so it is drawn through a few
// guessed points, smoothly and without any wiggle that would pass for data.
//
// The chart stands still in a pinned scene (wooden.js), which says how much of
// it shows by two numbers written on it: --drawn, how far across the two
// lines are drawn (0 to 1), and --asked, how many of the question marks
// around the climb have appeared (0 to 1). Without either, all of it shows.
//
// The line of data comes up out of the phone that rests under the chart's
// near corner, where the time axis begins: DROP is how far under the axis the
// phone's top is, in pixels.
export const DROP = 30

// The scale: minutes up to a little above the highest of either line.
const TOP = 135
// Hours, so each label carries its unit and stays short enough for the gutter.
const TICKS = [60, 120]
const first = Date.parse(time.from)
const DAY = 86400000
const span = time.days - 1
const xOfDay = day => day / span
const xOfDate = iso => (Date.parse(iso) - first) / DAY / span
const yOf = minutes => 1 - minutes / TOP

const CHESS = time.points.map(([day, minutes]) => [Math.round(xOfDay(day) * 10000) / 10000, Math.round(yOf(minutes) * 10000) / 10000])
const SOCIAL = social.points.map(([iso, minutes]) => [xOfDate(iso), yOf(minutes)])
const YEARS = [2024, 2025, 2026].map(year => ({ year, x: xOfDate(`${year}-01-01`) }))
const END = CHESS[CHESS.length - 1][1] * 100

const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
const LABEL =
  `Minutes a day, ${LONG.format(new Date(time.from))} to ${LONG.format(new Date(time.to))}. ` +
  `Solid line: time in live games on Chess.com, from the author's own games, smoothed. It stays close to zero until early 2026, ` +
  `rises to about ${Math.round(time.max)} minutes a day in March 2026 and is about ${Math.round(time.points[time.points.length - 1][1])} at the end. ` +
  `Dashed line: time on social media, an estimate and not a measurement, about ${social.points[0][1]} minutes a day ` +
  `until early 2026, falling to about ${social.points[social.points.length - 1][1]}. ` +
  `Question marks gather around the solid line where it climbs.`

// A smooth line through points that never overshoots them (monotone cubic,
// after Fritsch and Carlson), in the box's own pixels.
const smoothPath = (points, width, height) => {
  const p = points.map(([x, y]) => [x * width, y * height])
  const n = p.length
  const slope = p.slice(1).map((q, i) => (q[1] - p[i][1]) / (q[0] - p[i][0] || 1))
  const m = p.map((_, i) => (i === 0 ? slope[0] : i === n - 1 ? slope[n - 2] : slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2))
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = m[i + 1] = 0
      continue
    }
    const a = m[i] / slope[i]
    const b = m[i + 1] / slope[i]
    const h = Math.hypot(a, b)
    if (h > 3) {
      m[i] = (3 / h) * a * slope[i]
      m[i + 1] = (3 / h) * b * slope[i]
    }
  }
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const dx = (p[i + 1][0] - p[i][0]) / 3
    d += ` C${(p[i][0] + dx).toFixed(1)},${(p[i][1] + m[i] * dx).toFixed(1)} ${(p[i + 1][0] - dx).toFixed(1)},${(p[i + 1][1] - m[i + 1] * dx).toFixed(1)} ${p[i + 1][0].toFixed(1)},${p[i + 1][1].toFixed(1)}`
  }
  return d
}

const useSize = () => {
  const ref = React.useRef(null)
  const [size, setSize] = React.useState(null)
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

// The questions the games raised, where the line climbs: [how far across, at
// how many minutes, size, turn]. Few and small at first, then larger.
const ASKS = [
  [0.615, 14, 12, -8],
  [0.66, 27, 13, 6],
  [0.7, 19, 14, -4],
  [0.728, 45, 15, 10],
  [0.752, 68, 17, -6],
  [0.8, 119, 20, 8],
  [0.86, 100, 22, -10],
  [0.915, 85, 24, 6],
  [0.965, 90, 26, -4],
]

export const TimeChart = ({ className = "" }) => {
  const [plot, size] = useSize()
  const line = size
    ? `M0,${(size.height + DROP).toFixed(1)} ` + CHESS.map(([x, y]) => `L${(x * size.width).toFixed(1)},${(y * size.height).toFixed(1)}`).join(" ")
    : ""
  return (
    <figure className={`${c("ch-chart")} ${className}`} role="img" aria-label={LABEL}>
      <div className={c("ch-legend")} aria-hidden="true">
        <span>
          <i className={c("ch-key")} data-line="chess" />
          Time in games on Chess.com
        </span>
        <span>
          <i className={c("ch-key")} data-line="social" />
          Time on social media, positive approx estimate
        </span>
      </div>
      <div className={c("ch-plot")} ref={plot} data-plot="" aria-hidden="true">
        {TICKS.map(minutes => (
          <React.Fragment key={minutes}>
            <i className={c("ch-grid")} style={{ top: `${yOf(minutes) * 100}%` }} />
            <span className={c("ch-tick")} style={{ top: `${yOf(minutes) * 100}%` }}>
              {minutes / 60} h
            </span>
          </React.Fragment>
        ))}
        <i className={c("ch-base")} />
        {YEARS.map(({ year, x }) => (
          <span key={year} className={c("ch-year")} style={{ left: `${x * 100}%` }}>
            {year}
          </span>
        ))}
        {size ? (
          <svg className={c("ch-lines")} width={size.width} height={size.height}>
            <path className={c("ch-estimate")} d={smoothPath(SOCIAL, size.width, size.height)} />
            {/* every point of the data as given, after the short way up from the phone */}
            <path className={c("ch-measured")} d={line} />
          </svg>
        ) : null}
        {ASKS.map(([x, minutes, big, turn], index) => (
          <span
            key={index}
            className={c("ch-ask")}
            style={{ left: `${x * 100}%`, top: `${yOf(minutes) * 100}%`, "--size": big, "--turn": `${turn}deg`, "--from": (index / ASKS.length).toFixed(3) }}
          >
            ?
          </span>
        ))}
      </div>
    </figure>
  )
}
