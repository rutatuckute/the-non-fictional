"use client"

import * as React from "react"

import NEAR from "./closeup.json"
import { Popup } from "./shared"
import styles from "./paris.module.css"

// What Locate Control shows, from the same snapshot: the streets a few
// hundred metres around Choiseul – Quatre Septembre (the station in the
// article's screenshot), a device beside it with its 250 m circle, and the
// station's popup open. Tap any station for its numbers.
const YOU = [NEAR.width / 2 - 26, NEAR.height / 2 + 44]

const pointsOf = d => d.slice(1).split("L").map(p => p.split(",").map(Number))
// One name per major street, along its longest stretch inside the frame,
// read left to right.
const LABELLED = (() => {
  const best = new Map()
  for (const w of NEAR.ways) {
    if (!w.name || !w.major) continue
    let pts = pointsOf(w.d)
    if (pts.at(-1)[0] < pts[0][0]) pts = pts.reverse()
    const length = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)
    const inside = pts.every(([x, y]) => x > 10 && x < NEAR.width - 10 && y > 10 && y < NEAR.height - 10)
    if (length > 150 && inside && (!best.has(w.name) || best.get(w.name).length < length)) {
      best.set(w.name, { name: w.name, length, d: "M" + pts.map(p => p.join(",")).join("L") })
    }
  }
  return [...best.values()]
})()

const LocateCloseUp = () => {
  const id = React.useId().replace(/:/g, "")
  const here = NEAR.stations.find(s => s.here)
  const [on, setOn] = React.useState(here)
  const pick = s => setOn(on === s ? null : s)
  return (
    <figure className={styles.pr}>
      <div className={styles.nearWrap}>
        <svg className={styles.near} viewBox={`0 0 ${NEAR.width} ${NEAR.height}`} role="group" aria-label="The stations around Choiseul – Quatre Septembre, with a device located beside it">
          <defs>{LABELLED.map((w, i) => <path key={i} id={`${id}-street-${i}`} d={w.d} />)}</defs>
          <g aria-hidden="true">
            {NEAR.ways.map((w, i) => <path key={i} className={styles.street} data-major={w.major ? "true" : "false"} d={w.d} />)}
            {LABELLED.map((w, i) => (
              <text key={i} className={styles.streetName}>
                <textPath href={`#${id}-street-${i}`} startOffset="50%" textAnchor="middle">{w.name}</textPath>
              </text>
            ))}
            <circle className={styles.accuracy} cx={YOU[0]} cy={YOU[1]} r={NEAR.radius} />
            <circle className={styles.you} cx={YOU[0]} cy={YOU[1]} r="6" />
          </g>
          {NEAR.stations.map(s => (
            <g
              key={s.name}
              className={styles.station}
              data-on={on === s ? "true" : "false"}
              tabIndex={0}
              role="button"
              aria-pressed={on === s}
              aria-label={`${s.name}: ${s.mechanical} mechanical bikes, ${s.ebike} e-bikes, ${s.docks} free docks`}
              onClick={() => pick(s)}
              onKeyDown={event => {
                if (event.key !== "Enter" && event.key !== " ") return
                event.preventDefault()
                pick(s)
              }}
            >
              <circle cx={s.x} cy={s.y} r="14" className={styles.stationHit} />
              <circle cx={s.x} cy={s.y} r={Math.max(4, Math.sqrt(s.mechanical + s.ebike) * 1.9)} />
            </g>
          ))}
        </svg>
        {on ? (
          <div
            className={`${styles.tip} ${styles.card}`}
            style={{ left: `${(on.x / NEAR.width) * 100}%`, top: `${(on.y / NEAR.height) * 100}%` }}
            data-side={on.x > NEAR.width * 0.6 ? "left" : "right"}
          >
            <Popup {...on} />
          </div>
        ) : null}
        <p className={styles.youLabel} style={{ left: `${(YOU[0] / NEAR.width) * 100}%`, top: `${(YOU[1] / NEAR.height) * 100}%` }} aria-hidden="true">
          You are here
        </p>
      </div>
      <figcaption className={styles.source}>The same snapshot, a few hundred metres around Choiseul – Quatre Septembre · tap a station</figcaption>
    </figure>
  )
}

export default LocateCloseUp
