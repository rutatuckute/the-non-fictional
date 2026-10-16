"use client"

import * as React from "react"

import MAP from "./map.json"
import { Popup } from "./shared"
import styles from "./paris.module.css"

// The script's map, drawn from one snapshot of Paris Open Data's Vélib'
// availability: every station a dot, its area the count, over the
// arrondissements and the rivers. Choose what the dots count; point at a
// station for the popup the script makes. See scripts/stories/paris.
const METRICS = [
  ["all", "All bikes"],
  ["mechanical", "Mechanical"],
  ["ebike", "E-bikes"],
  ["docks", "Free docks"],
]
const NOUN = { all: "bikes", mechanical: "mechanical bikes", ebike: "e-bikes", docks: "free docks" }
// A station: [x, y, mechanical, e-bikes, free docks, name, in Paris].
const valueOf = (row, metric) =>
  metric === "mechanical" ? row[2] : metric === "ebike" ? row[3] : metric === "docks" ? row[4] : row[2] + row[3]
const radius = v => Math.sqrt(v) * 1.05

const n = new Intl.NumberFormat("en-US")
const TOTAL = {
  stations: MAP.stations.length,
  bikes: MAP.stations.reduce((a, r) => a + r[2] + r[3], 0),
  docks: MAP.stations.reduce((a, r) => a + r[4], 0),
}

const StationMap = () => {
  const [metric, setMetric] = React.useState("all")
  const [hit, setHit] = React.useState(null)
  const svgRef = React.useRef(null)
  const items = React.useMemo(() => MAP.stations.map(r => ({ x: r[0], y: r[1], row: r, v: valueOf(r, metric) })), [metric])

  // The nearest station to the pointer, within reach, in the map's units.
  const find = event => {
    const svg = svgRef.current
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse())
    let best = null
    let bestD = 14 * 14
    for (const item of items) {
      const d = (item.x - point.x) ** 2 + (item.y - point.y) ** 2
      if (d < bestD) {
        best = item
        bestD = d
      }
    }
    setHit(best)
  }
  const shown = hit ? items.find(item => item.row === hit.row) : null

  return (
    <figure className={`${styles.pr} ${styles.wide}`}>
      <header className={styles.head}>
        <p className={styles.kicker}>Vélib' stations · one snapshot</p>
        <p className={styles.title}>{MAP.label}</p>
        <p className={styles.totals}>
          <span><b>{n.format(TOTAL.stations)}</b> stations</span>
          <span><b>{n.format(TOTAL.bikes)}</b> bikes</span>
          <span><b>{n.format(TOTAL.docks)}</b> free docks</span>
        </p>
      </header>
      <div className={styles.metrics} role="group" aria-label="What the map counts">
        <span className={styles.metricsLabel}>Show</span>
        {METRICS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={metric === id} onClick={() => setMetric(id)}>{label}</button>
        ))}
      </div>
      <div className={styles.mapWrap}>
        <svg
          ref={svgRef}
          className={styles.map}
          viewBox={`0 0 ${MAP.width} ${MAP.height}`}
          role="img"
          aria-label={`Map of ${n.format(TOTAL.stations)} Vélib' stations, each sized by its ${NOUN[metric]}`}
          onPointerMove={find}
          onPointerLeave={() => setHit(null)}
          onClick={find}
        >
          <g aria-hidden="true">
            {MAP.arrondissements.map(a => <path key={a.n} className={styles.arr} d={a.d} />)}
            {MAP.rivers.map((r, i) => <path key={i} className={styles.river} d={r.d} />)}
          </g>
          <g className={styles.dots}>
            {items.map((s, i) =>
              s.v > 0 ? <circle key={i} cx={s.x} cy={s.y} r={radius(s.v)} /> : <circle key={i} className={styles.empty} cx={s.x} cy={s.y} r={1.6} />,
            )}
          </g>
          {shown ? <circle className={styles.hit} cx={shown.x} cy={shown.y} r={Math.max(4, radius(shown.v)) + 3} /> : null}
        </svg>
        {shown ? (
          <div
            className={styles.tip}
            style={{ left: `${(shown.x / MAP.width) * 100}%`, top: `${(shown.y / MAP.height) * 100}%` }}
            data-side={shown.x > MAP.width * 0.62 ? "left" : "right"}
          >
            <Popup name={shown.row[5]} mechanical={shown.row[2]} ebike={shown.row[3]} docks={shown.row[4]} />
          </div>
        ) : null}
        <div className={styles.legend} aria-hidden="true">
          {[1, 10, 30].map(v => (
            <span key={v}>
              <svg width="22" height="22" viewBox="-11 -11 22 22"><circle r={radius(v) * 1.4} /></svg>
              {v}
            </span>
          ))}
          <span className={styles.legendEmpty}>
            <svg width="10" height="22" viewBox="-5 -11 10 22"><circle r="2.2" /></svg>
            none
          </span>
        </div>
      </div>
      <figcaption className={styles.source}>Source: Paris Open Data, Vélib' availability · point at a station for its numbers</figcaption>
    </figure>
  )
}

export default StationMap
