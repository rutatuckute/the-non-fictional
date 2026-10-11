import * as React from "react"

import { markStyles } from "./archiveFieldData"

// What the field's marks are: each one drawn as the field draws it, beside
// its name. The colours come from the stylesheet, by format.
const RULES = [
  { y: -0.62, width: 2.4 },
  { y: 0, width: 1.7 },
  { y: 0.62, width: 2.1 },
]
const SCALE = 0.58

const KEY = [
  ["essay", "Essay"],
  ["reflection", "Reflection"],
  ["data", "Data"],
  ["photography", "Photograph or series"],
]

const Glyph = ({ format }) => {
  const style = markStyles[format]

  if (format === "photography") {
    const extent = style.extent * SCALE
    const arm = style.armLength * SCALE

    return [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([dx, dy]) => (
      <path
        key={`${dx}${dy}`}
        d={`M ${dx * extent - dx * arm} ${dy * extent} L ${dx * extent} ${
          dy * extent
        } L ${dx * extent} ${dy * extent - dy * arm}`}
      />
    ))
  }

  return (
    <>
      {RULES.slice(0, style.ruleCount).map(rule => (
        <line
          key={rule.y}
          x1={(-style.size * rule.width * SCALE) / 2}
          x2={(style.size * rule.width * SCALE) / 2}
          y1={style.size * rule.y * SCALE}
          y2={style.size * rule.y * SCALE}
        />
      ))}
      {format === "data" ? (
        <circle
          cx="0"
          cy={-style.size * 0.62 * SCALE}
          r={style.dotRadius * SCALE}
        />
      ) : null}
    </>
  )
}

const FieldKey = ({ className }) => (
  <ul className={className} aria-label="Key">
    {KEY.map(([format, label]) => (
      <li key={format} data-format={format}>
        <svg viewBox="-10 -10 20 20" width="18" height="18" aria-hidden="true">
          <Glyph format={format} />
        </svg>
        {label}
      </li>
    ))}
  </ul>
)

export default FieldKey
