"use client"

import * as React from "react"

import { c } from "./parts"
import social from "./social.json"
import time from "./time.json"

// Recorded elapsed time in live games, not total app screen time. The source
// export applies a centred Gaussian (σ=10 days), truncated at ±40 days and
// renormalised at the ends. Keep every exported point, including the peak.
export const DROP = 26
const TOP = 125
const DAY = 86400000
const first = Date.parse(time.from)
const yOf = minutes => 1 - minutes / TOP
const peak = time.points.reduce((best, point) => point[1] > best[1] ? point : best)
const YEARS = [2023, 2024, 2025, 2026].map(year => ({ year, x: Math.max(0, (Date.parse(`${year}-01-01`) - first) / DAY / (time.days - 1)) }))
const LABEL = `How much chess am I playing. Recorded minutes in live games per day, ${time.from} to ${time.to}, including days without play. Gaussian smoothing with a 10-day standard deviation and an 81-day window. The peak is ${time.max} minutes a day, in March 2026. Puzzles, analysis, lessons and time between games are excluded.`

// Beside it, dashed and a little soft, an estimate of the author's time on
// social media (social.json): there is no data for it, so it is drawn through
// a few rough points only, smoothly, with nothing that would pass for data.
// It comes in with "A winning trade-off?" (`social`, from wooden.js).
const xOfDate = iso => (Date.parse(iso) - first) / DAY / (time.days - 1)
const SOCIAL = social.points.map(([iso, minutes]) => [xOfDate(iso), yOf(minutes)])
// A smooth line through points that never overshoots them (monotone cubic).
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
const SOCIAL_LABEL = ` Dashed: time on social media, a rough estimate and not a measurement, about ${social.points[0][1]} minutes a day until early 2026, falling to about ${social.points[social.points.length - 1][1]}.`

export const TimeChart = ({ social: showSocial = true }) => {
  const plot = React.useRef(null)
  const [size, setSize] = React.useState(null)
  const title = React.useId()
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(plot.current)
    return () => observer.disconnect()
  }, [])
  const line = size ? `M0,${(size.height + DROP).toFixed(1)} ` + time.points.map(([day, minutes]) => `L${(day / (time.days - 1) * size.width).toFixed(1)},${(yOf(minutes) * size.height).toFixed(1)}`).join(" ") : ""
  return (
    <figure className={c("ch-chart")} aria-labelledby={title}>
      <h3 className={c("ch-timeTitle")} id={title}>How much chess am I playing</h3>
      <div className={c("ch-plot")} ref={plot} data-plot="" role="img" aria-label={LABEL + (showSocial ? SOCIAL_LABEL : "")}>
        <span className={c("ch-timeUnit")} aria-hidden="true">min / day</span>
        {[60, 120].map(minutes => (
          <React.Fragment key={minutes}>
            <i className={c("ch-grid")} style={{ top: `${yOf(minutes) * 100}%` }} />
            <span className={c("ch-tick")} style={{ top: `${yOf(minutes) * 100}%` }}>{minutes}</span>
          </React.Fragment>
        ))}
        <i className={c("ch-base")} />
        {YEARS.map(({ year, x }) => <span key={year} className={c("ch-year")} style={{ left: `${x * 100}%` }}>{year}</span>)}
        {size && (
          <svg className={c("ch-lines")} width={size.width} height={size.height} aria-hidden="true">
            <path className={c("ch-estimate")} data-on={showSocial ? "true" : "false"} d={smoothPath(SOCIAL, size.width, size.height)} />
            <path className={c("ch-measured")} d={line} />
          </svg>
        )}
        <span className={c("ch-estimateLabel")} data-on={showSocial ? "true" : "false"} style={{ left: "30%", top: `${yOf(social.points[0][1]) * 100}%` }} aria-hidden="true">
          time on social media, approx
        </span>
        <div className={c("ch-timePeak")} style={{ left: `${(peak[0] / (time.days - 1)) * 100}%` }}>
          <span>~100 minutes a day<small>at the peak</small></span>
        </div>
        {size && <svg className={c("ch-peakPointer")} width={size.width} height={size.height} aria-hidden="true"><path d={`M${(peak[0] / (time.days - 1) * size.width).toFixed(1)},${(yOf(peak[1]) * size.height).toFixed(1)} v-${(yOf(peak[1]) * size.height + 8).toFixed(1)}`} /><circle cx={peak[0] / (time.days - 1) * size.width} cy={yOf(peak[1]) * size.height} r="3" /></svg>}
      </div>
    </figure>
  )
}
