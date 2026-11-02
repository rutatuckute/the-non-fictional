import * as React from "react"

import GEO from "./data/geo.json"
import styles from "./state.module.css"

// France by département, the overseas départements as insets on the left and
// Paris with the petite couronne enlarged top right, where they are too small
// to read at national scale. Values are shaded in five steps of the site's own
// neutrals, from near the ground to ink, so the map never competes with the
// accent. Départements without a value are hatched.
export const RAMP = ["#2b2926", "#4a4641", "#6f6a62", "#a39c91", "#e3dcd1"]
const EMPTY = "#1a1918"
const PARIS = ["75", "92", "93", "94", "77", "78", "91", "95"]

// Quantile steps over the values present, so each shade holds about as many
// départements as the next.
export const steps = values => {
  const v = values.filter(x => x != null).sort((a, b) => a - b)
  const cuts = [
    ...new Set(
      RAMP.slice(1).map(
        (_, i) => v[Math.floor(((i + 1) / RAMP.length) * (v.length - 1))],
      ),
    ),
  ]
  const offset = RAMP.length - 1 - cuts.length
  return {
    lo: v[0],
    hi: v[v.length - 1],
    color: x =>
      x == null
        ? "url(#dl-nodata)"
        : RAMP[
            Math.min(RAMP.length - 1, cuts.filter(c => x > c).length + offset)
          ],
  }
}

const NAMES = Object.fromEntries(GEO.deps.map(([code, name]) => [code, name]))

const FranceMap = ({ values, fmt, label, noData, onTip, onTipEnd }) => {
  const scale = React.useMemo(
    () => steps(GEO.deps.map(([code]) => values[code] ?? null)),
    [values],
  )
  const [x0, y0, x1, y1] = GEO.paris
  const frame = { w: 150, x: GEO.width - 160, y: 10 }
  const k = frame.w / (x1 - x0)
  const frameH = (y1 - y0) * k

  const hover = code => event =>
    onTip?.(
      <>
        <span className={styles.tipKey}>{code}</span>
        <span className={styles.tipTitle}>{NAMES[code]}</span>
        <span className={styles.tipLine}>
          {values[code] == null ? "—" : fmt(values[code])}
        </span>
      </>,
      event,
    )
  const dep = (code, d, extra = {}) => (
    <path
      key={code}
      d={d}
      className={styles.dep}
      style={{ fill: scale.color(values[code] ?? null) }}
      onPointerMove={hover(code)}
      onPointerLeave={onTipEnd}
      {...extra}
    />
  )

  return (
    <figure className={styles.map}>
      <svg
        viewBox={`0 0 ${GEO.width} ${GEO.height}`}
        className={styles.mapSvg}
        role="img"
        aria-label={label}
      >
        <defs>
          <pattern
            id="dl-nodata"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill={EMPTY} />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="#353737"
              strokeWidth="2"
            />
          </pattern>
          <clipPath id="dl-paris">
            <rect x={frame.x} y={frame.y} width={frame.w} height={frameH} />
          </clipPath>
        </defs>
        {GEO.insets.map(inset => (
          <rect
            key={inset.name}
            x={inset.box[0]}
            y={inset.box[1]}
            width={inset.box[2]}
            height={inset.box[3]}
            className={styles.insetBox}
          />
        ))}
        <g>{GEO.deps.map(([code, , d]) => dep(code, d))}</g>
        <rect
          x={frame.x}
          y={frame.y}
          width={frame.w}
          height={frameH}
          className={styles.insetBox}
        />
        <g clipPath="url(#dl-paris)">
          <g
            transform={`translate(${frame.x - x0 * k},${frame.y - y0 * k}) scale(${k})`}
          >
            {GEO.deps
              .filter(([code]) => PARIS.includes(code))
              .map(([code, , d]) =>
                dep(code, d, { vectorEffect: "non-scaling-stroke" }),
              )}
          </g>
        </g>
        {GEO.insets.map(inset => (
          <text
            key={inset.name}
            x={inset.box[0] + 6}
            y={inset.box[1] + inset.box[3] - 7}
            className={styles.insetName}
          >
            {inset.name}
          </text>
        ))}
        <text
          x={frame.x + 6}
          y={frame.y + frameH - 7}
          className={styles.insetName}
        >
          Paris et petite couronne
        </text>
      </svg>
      <figcaption className={styles.mapLegend}>
        <span>{fmt(scale.lo)}</span>
        <span className={styles.ramp} aria-hidden="true">
          {RAMP.map(c => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        <span>{fmt(scale.hi)}</span>
        <span className={styles.legendKey}>
          <i className={`${styles.sw} ${styles.swNoData}`} />
          {noData}
        </span>
      </figcaption>
    </figure>
  )
}

export default FranceMap
