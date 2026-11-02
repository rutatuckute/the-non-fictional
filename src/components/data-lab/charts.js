import * as React from "react"

import styles from "./state.module.css"

// The figures of the Data Lab, drawn in SVG with no chart library, as the
// stories are. Identity is carried by emphasis rather than colour: the series
// a question is about is ink, its comparisons are grey, and each is named at
// its end. The accent marks only where the reader is pointing.

/* A tooltip that follows the pointer. The owner keeps its state and passes
   show/hide down, so one tooltip serves the whole section. */
export const useTip = () => {
  const [tip, setTip] = React.useState(null)
  const show = React.useCallback(
    (content, event) => setTip({ content, x: event.clientX, y: event.clientY }),
    [],
  )
  const hide = React.useCallback(() => setTip(null), [])
  const node = tip ? (
    <div
      className={styles.tip}
      role="status"
      style={{
        left: Math.min(
          tip.x + 14,
          (typeof window === "undefined" ? 1e4 : window.innerWidth) - 300,
        ),
        top: tip.y - 12,
      }}
    >
      {tip.content}
    </div>
  ) : null
  return [node, show, hide]
}

// A round step that gives at most five gridlines, whatever the scale.
const niceStep = span => {
  const mag = 10 ** Math.floor(Math.log10(span / 5))
  return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= 5)
}

const segments = (values, X, Y) => {
  const out = []
  let run = []
  values.forEach((v, i) => {
    if (v == null) {
      if (run.length) out.push(run)
      run = []
    } else run.push(`${X(i).toFixed(1)},${Y(v).toFixed(1)}`)
  })
  if (run.length) out.push(run)
  return out.map(r => r.join(" "))
}

export const LineChart = ({
  x,
  series,
  fmtY,
  fmtV = fmtY,
  fmtX,
  ticks,
  reference,
  marks = [],
  height = 240,
  onTip,
  onTipEnd,
}) => {
  const [at, setAt] = React.useState(null)
  const n = x.length
  const W = 1000
  const all = series
    .flatMap(s => s.values)
    .filter(v => v != null)
    .concat(reference ? [reference.value] : [])
  const raw = [Math.min(0, ...all), Math.max(...all)]
  const step = niceStep(raw[1] - raw[0])
  const lo = Math.floor(raw[0] / step) * step
  const hi = Math.ceil(raw[1] / step) * step
  const X = i => ((i + 0.5) / n) * W
  const Y = v => height - ((v - lo) / (hi - lo)) * height
  const grid = []
  for (let v = lo; v <= hi + 1e-9; v += step)
    grid.push(Math.round(v * 100) / 100)

  // End labels, nudged apart so two series that end close don't collide.
  const ends = series
    .map(s => {
      let i = s.values.length - 1
      while (i >= 0 && s.values[i] == null) i--
      return i < 0
        ? null
        : { s, y: Y(s.values[i]), text: `${s.label} ${fmtV(s.values[i])}` }
    })
    .filter(Boolean)
    .sort((a, b) => a.y - b.y)
  ends.forEach((e, k) => {
    if (k && e.y - ends[k - 1].y < 16) e.y = ends[k - 1].y + 16
  })

  const move = event => {
    const r = event.currentTarget.getBoundingClientRect()
    const i = Math.max(
      0,
      Math.min(n - 1, Math.floor(((event.clientX - r.left) / r.width) * n)),
    )
    setAt(i)
    onTip?.(
      <>
        <span className={styles.tipKey}>{fmtX(x[i])}</span>
        {series.map(s => (
          <span className={styles.tipLine} key={s.label}>
            <b className={s.emph ? styles.tipEmph : undefined}>
              {fmtV(s.values[i])}
            </b>{" "}
            {s.label}
          </span>
        ))}
      </>,
      event,
    )
  }
  const leave = () => {
    setAt(null)
    onTipEnd?.()
  }

  return (
    <div className={styles.lc}>
      <div className={styles.lcPlot} style={{ height }}>
        <svg
          className={styles.lcSvg}
          viewBox={`0 0 ${W} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={series.map(s => s.label).join(", ")}
          onPointerMove={move}
          onPointerLeave={leave}
        >
          {grid.map(v => (
            <line
              key={v}
              x1={0}
              x2={W}
              y1={Y(v)}
              y2={Y(v)}
              className={v === 0 ? styles.lcZero : styles.lcGrid}
            />
          ))}
          {reference ? (
            <line
              x1={0}
              x2={W}
              y1={Y(reference.value)}
              y2={Y(reference.value)}
              className={styles.lcRef}
            />
          ) : null}
          {marks.map(m => (
            <line
              key={m.at}
              x1={X(m.at)}
              x2={X(m.at)}
              y1={0}
              y2={height}
              className={styles.lcMark}
            />
          ))}
          {[...series]
            .sort((a, b) => !!a.emph - !!b.emph)
            .flatMap(s =>
              segments(s.values, X, Y).map((points, k) => (
                <polyline
                  key={`${s.label}${k}`}
                  points={points}
                  className={
                    s.emph ? `${styles.lcLine} ${styles.isEmph}` : styles.lcLine
                  }
                  vectorEffect="non-scaling-stroke"
                />
              )),
            )}
          {at != null ? (
            <>
              <line
                x1={X(at)}
                x2={X(at)}
                y1={0}
                y2={height}
                className={styles.lcHair}
              />
              {series.map(s =>
                s.values[at] == null ? null : (
                  <circle
                    key={s.label}
                    cx={X(at)}
                    cy={Y(s.values[at])}
                    r={3.5}
                    className={
                      s.emph ? `${styles.lcDot} ${styles.isEmph}` : styles.lcDot
                    }
                    vectorEffect="non-scaling-stroke"
                  />
                ),
              )}
            </>
          ) : null}
        </svg>
        {grid.map(v => (
          <span
            key={v}
            className={styles.lcY}
            style={{ top: `${(Y(v) / height) * 100}%` }}
          >
            {fmtY(v)}
          </span>
        ))}
        {reference ? (
          <span
            className={styles.lcRefLabel}
            style={{ top: `${(Y(reference.value) / height) * 100}%` }}
          >
            {reference.label}
          </span>
        ) : null}
        {marks
          .filter(m => m.label)
          .map(m => (
            <span
              key={m.at}
              className={
                m.at > n * 0.6
                  ? `${styles.lcMarkLabel} ${styles.isRight}`
                  : styles.lcMarkLabel
              }
              style={{
                left: `${(X(m.at) / W) * 100}%`,
                top: (m.row ?? 0) * 30 - 2,
              }}
            >
              {m.label}
            </span>
          ))}
        {ends.map(e => (
          <span
            key={e.s.label}
            className={
              e.s.emph ? `${styles.lcEnd} ${styles.isEmph}` : styles.lcEnd
            }
            style={{ top: e.y }}
          >
            {e.text}
          </span>
        ))}
      </div>
      <div className={styles.lcX}>
        {ticks.map(i => (
          <span key={i} style={{ left: `${(X(i) / W) * 100}%` }}>
            {fmtX(x[i], true)}
          </span>
        ))}
      </div>
    </div>
  )
}

export const Spark = ({ values, width = 64, height = 18 }) => {
  const v = values.filter(x => x != null)
  const lo = Math.min(...v)
  const hi = Math.max(...v)
  const points = values
    .map((x, i) =>
      x == null
        ? null
        : `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 1 - ((x - lo) / (hi - lo || 1)) * (height - 2)).toFixed(1)}`,
    )
    .filter(Boolean)
    .join(" ")
  return (
    <svg
      className={styles.spark}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  )
}

// One bar per country for a single figure, France in ink and the averages
// set apart by a rule. Bars start at zero, so a negative value (a fall) reads
// as a bar of the same length with its sign in the label.
export const CompareBars = ({ rows, fmt, onTip, onTipEnd }) => {
  const max = Math.max(...rows.map(r => Math.abs(r.value)))
  return (
    <div className={styles.eu}>
      {rows.map(r => (
        <div
          key={r.key}
          className={`${styles.euRow} ${r.emph ? styles.isFr : ""} ${r.aggregate ? styles.isEa : ""}`}
          onPointerMove={event =>
            onTip?.(
              <>
                <span className={styles.tipKey}>{r.label}</span>
                <span className={styles.tipTitle}>{fmt(r.value)}</span>
                {r.note ? (
                  <span className={styles.tipLine}>{r.note}</span>
                ) : null}
              </>,
              event,
            )
          }
          onPointerLeave={onTipEnd}
        >
          <span className={styles.euName}>{r.label}</span>
          <span className={styles.euTrack}>
            <i
              className={`${styles.euBase} ${styles.euWhole}`}
              style={{ width: `${(Math.abs(r.value) / max) * 100}%` }}
            />
          </span>
          <span className={styles.euValue}>{fmt(r.value)}</span>
        </div>
      ))}
    </div>
  )
}

// The pump price in each country, split into the price before tax and the
// taxes, with a tick where it stood a year earlier.
export const EuBars = ({ data, countries, f, onTip, onTipEnd }) => {
  const max = Math.max(
    ...data.rows.map(r => r[1]),
    ...Object.values(data.yearAgo).filter(Boolean),
  )
  const share = v => `${(v / max) * 100}%`
  return (
    <div className={styles.eu}>
      <div className={styles.legend}>
        <span className={styles.legendKey}>
          <i className={`${styles.sw} ${styles.swBase}`} />
          {f.L(["Prix hors taxes", "Price before tax"])}
        </span>
        <span className={styles.legendKey}>
          <i className={`${styles.sw} ${styles.swTax}`} />
          {f.L(["Taxes", "Taxes"])}
        </span>
        <span className={styles.legendKey}>
          <i className={`${styles.sw} ${styles.swAgo}`} />
          {f.L(["Prix il y a un an", "Price a year ago"])}
        </span>
      </div>
      {data.rows.map(([g, withTax, beforeTax]) => (
        <div
          key={g}
          className={`${styles.euRow} ${g === "FR" ? styles.isFr : ""} ${g === "EA" ? styles.isEa : ""}`}
          onPointerMove={event =>
            onTip?.(
              <>
                <span className={styles.tipKey}>{f.L(countries[g])}</span>
                <span className={styles.tipTitle}>{f.eur(withTax)}</span>
                <span className={styles.tipLine}>
                  {f.L(["hors taxes", "before tax"])} {f.eur(beforeTax)} ·{" "}
                  {f.L(["taxes", "taxes"])} {f.eur(withTax - beforeTax)} (
                  {f.pct((1 - beforeTax / withTax) * 100, 0)})
                </span>
                <span className={styles.tipLine}>
                  {f.L(["il y a un an", "a year ago"])} :{" "}
                  {f.eur(data.yearAgo[g])}
                </span>
              </>,
              event,
            )
          }
          onPointerLeave={onTipEnd}
        >
          <span className={styles.euName}>{f.L(countries[g])}</span>
          <span className={styles.euTrack}>
            <i className={styles.euBase} style={{ width: share(beforeTax) }} />
            <i
              className={styles.euTax}
              style={{
                left: `calc(${share(beforeTax)} + 2px)`,
                width: `calc(${share(withTax - beforeTax)} - 2px)`,
              }}
            />
            {data.yearAgo[g] ? (
              <i
                className={styles.euAgo}
                style={{ left: share(data.yearAgo[g]) }}
              />
            ) : null}
          </span>
          <span className={styles.euValue}>{f.eur(withTax)}</span>
        </div>
      ))}
    </div>
  )
}
