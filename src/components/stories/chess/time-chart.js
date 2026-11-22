"use client"

import * as React from "react"

import { c } from "./parts"
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
const LABEL = `How much chess I was playing. Recorded minutes in live games per day, ${time.from} to ${time.to}, including days without play. Gaussian smoothing with a 10-day standard deviation and an 81-day window. The peak of the smoothed series is ${time.max} minutes a day, in March 2026. Puzzles, analysis, lessons and time between games are excluded.`

export const TimeChart = () => {
  const plot = React.useRef(null)
  const [size, setSize] = React.useState(null)
  const title = React.useId()
  const caption = React.useId()
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(plot.current)
    return () => observer.disconnect()
  }, [])
  const line = size ? `M0,${(size.height + DROP).toFixed(1)} ` + time.points.map(([day, minutes]) => `L${(day / (time.days - 1) * size.width).toFixed(1)},${(yOf(minutes) * size.height).toFixed(1)}`).join(" ") : ""
  return (
    <figure className={c("ch-chart")} aria-labelledby={title} aria-describedby={caption}>
      <h3 className={c("ch-timeTitle")} id={title}>How much chess I was playing</h3>
      <div className={c("ch-plot")} ref={plot} data-plot="" role="img" aria-label={LABEL}>
        <span className={c("ch-timeUnit")} aria-hidden="true">min / day</span>
        {[60, 120].map(minutes => (
          <React.Fragment key={minutes}>
            <i className={c("ch-grid")} style={{ top: `${yOf(minutes) * 100}%` }} />
            <span className={c("ch-tick")} style={{ top: `${yOf(minutes) * 100}%` }}>{minutes}</span>
          </React.Fragment>
        ))}
        <i className={c("ch-base")} />
        {YEARS.map(({ year, x }) => <span key={year} className={c("ch-year")} style={{ left: `${x * 100}%` }}>{year}</span>)}
        {size && <svg className={c("ch-lines")} width={size.width} height={size.height} aria-hidden="true"><path className={c("ch-measured")} d={line} /></svg>}
        <div className={c("ch-timePeak")}>
          <span>Around 100 minutes a day<small>at the peak of the smoothed series</small></span>
        </div>
        {size && <svg className={c("ch-peakPointer")} width={size.width} height={size.height} aria-hidden="true"><path d={`M${(peak[0] / (time.days - 1) * size.width).toFixed(1)},${(yOf(peak[1]) * size.height).toFixed(1)} v-${(yOf(peak[1]) * size.height + 8).toFixed(1)}`} /><circle cx={peak[0] / (time.days - 1) * size.width} cy={yOf(peak[1]) * size.height} r="3" /></svg>}
      </div>
      <figcaption className={c("ch-timeCaption")} id={caption}>
        Recorded minutes in live games per day · Apr 2023–Nov 2026. Gaussian smoothing: 10-day spread (σ), 81-day window. Days without play included; puzzles, analysis and time between games excluded.
      </figcaption>
    </figure>
  )
}
