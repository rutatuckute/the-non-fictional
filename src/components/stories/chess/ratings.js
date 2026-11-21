"use client"

import * as React from "react"
import { c, PinSteps, stepLine } from "./parts"
import { useFollow, useStill } from "./follow"
import data from "./ratings.json"

const T = data.timeline, S = data.scatter
const time = day => Date.parse(`${day}T00:00:00Z`)
const start = time("2026-01-01"), end = time(T.through), claim = time(T.claim)
const scale = (v, a, b, lo, hi) => lo + (v - a) / (b - a) * (hi - lo)
const path = points => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
const dateLabel = day => new Date(time(day)).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const days = [...new Set([...T.rapid, ...T.bullet].map(d => d[0]))].sort()
const atDay = (series, date) => series.filter(d => d[0] <= date).at(-1)

// One persistent stage. Scroll opens the diary, then the two last ratings become
// one clay dot on a different pair of axes. The captions name the measure change.
export const RatingStory = ({ step }) => {
  const box = React.useRef(null), steps = React.useContext(PinSteps)
  const [size, setSize] = React.useState({ width: 560, height: 400 })
  const [reveal, setReveal] = React.useState(0)
  const [picked, setPicked] = React.useState(null)
  const [hover, setHover] = React.useState(null)
  const [summary, setSummary] = React.useState(false)
  const still = useStill()
  const id = React.useId().replace(/:/g, "")
  React.useLayoutEffect(() => {
    const update = () => setSize({ width: Math.max(240, box.current.getBoundingClientRect().width), height: Math.min(400, window.innerHeight * (window.innerWidth <= 960 ? (window.innerHeight < 700 ? 0.24 : 0.30) : 0.48)) })
    const observer = new ResizeObserver(update)
    observer.observe(box.current)
    window.addEventListener("resize", update)
    update()
    return () => { observer.disconnect(); window.removeEventListener("resize", update) }
  }, [])
  useFollow(() => {
    if (still) return step >= 2 ? 1 : (claim - start) / (end - start)
    if (step >= 3) return 1
    if (step < 1) return 0
    const node = steps?.current?.[step]?.firstElementChild
    if (!node) return 0
    const p = Math.max(0, Math.min(1, (stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 0.55)))
    const cut = (claim - start) / (end - start)
    return step === 1 ? cut * (0.5 + 0.5 * p) : cut + (1 - cut) * p
  }, setReveal, { still, watch: box })
  React.useEffect(() => { setPicked(null); setHover(null); setSummary(false) }, [step])

  const wide = step >= 4, typical = step >= 5
  const w = size.width, h = size.height, left = 40, right = w - 18, top = 38, bottom = h - 34
  const tx = v => scale(time(v), start, end, left, right)
  const ty = v => scale(v, 100, 1100, bottom, top)
  const sx = v => scale(v, 0, 3000, left, right)
  const sy = v => scale(v, 0, 3000, bottom, top)
  const shown = picked === null ? start + (end - start) * reveal : time(days[picked])
  const date = new Date(shown).toISOString().slice(0, 10)
  const rapid = atDay(T.rapid, date), bullet = atDay(T.bullet, date)
  const latest = T.bullet.at(-1)
  const peers = React.useMemo(() => S.points.map((q, i) => <circle key={i} cx={sx(q[0])} cy={sy(q[1])} r={w < 400 ? 1.5 : 2.1} />), [w, h])
  const meX = wide ? sx(S.me[0]) : tx(bullet?.[0] || latest[0])
  const meY = wide ? sy(S.me[1]) : ty(bullet?.[1] || latest[1])
  const selected = hover && wide ? hover : null
  const inspect = event => {
    if (!wide) return
    const r = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - r.left) / r.width * w, py = (event.clientY - r.top) / r.height * h
    let nearest = null, distance = 400
    for (const q of S.points) {
      const d = (sx(q[0]) - px) ** 2 + (sy(q[1]) - py) ** 2
      if (d < distance) { distance = d; nearest = q }
    }
    setHover(nearest)
  }

  return (
    <figure ref={box} className={c("ch-ratings")} data-wide={wide} data-still={still}>
      <figcaption className={c("ch-ratingTitle")}>{wide ? "Me, among everyone else" : "What it looked like from where I stood"}</figcaption>
      <div className={c("ch-ratingKey")}>
        {wide ? <><span>One dot, one player</span><span data-kind="me">Me</span>{typical && <span data-kind="typical">Typical bullet rating</span>}</> : <><span data-kind="rapid">My rapid rating</span><span data-kind="me">My bullet rating</span></>}
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={wide ? `Rapid and bullet median ratings for ${S.players} sampled players, July to September 2026. ${Math.round(S.shareLower * 100)}% rated lower in bullet. My rapid ${S.me[0]}, bullet ${S.me[1]}, close to the typical line.` : `My daily last ratings through 2026. Claim around 19 May. Bullet began on 6 July, seven weeks later; 309 games through 24 September.`} onPointerMove={inspect} onPointerDown={inspect} onPointerLeave={() => setHover(null)}>
        <defs><clipPath id={id}><rect x={left - 3} y={top - 15} width={Math.max(0, scale(shown, start, end, left, right) - left + 4)} height={bottom - top + 25} /></clipPath></defs>
        <g className={c("ch-ratingLayer")} opacity={wide ? 0 : 1} aria-hidden="true">
          {[200, 400, 600, 800, 1000].map(t => <g key={t}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={ty(t)} y2={ty(t)} /><text x={left - 8} y={ty(t) + 4} textAnchor="end">{t}</text></g>)}
          {[0, 2, 4, 6, 8, 10].map(m => <text key={m} x={tx(`2026-${String(m + 1).padStart(2, "0")}-01`)} y={bottom + 22} textAnchor="middle">{["Jan", "Mar", "May", "Jul", "Sep", "Nov"][m / 2]}</text>)}
          <text x={left} y={16}>My rating · 2026</text>
          <line className={c("ch-ratingRef")} x1={tx(T.claim)} x2={tx(T.claim)} y1={top} y2={bottom} />
          <text x={tx(T.claim) + 7} y={top + 12}>19 May</text>
          <text x={tx(T.claim) + 7} y={top + 27}>“soooo bad”</text>
          <g clipPath={`url(#${id})`}>
            <path className={c("ch-ratingRapid")} d={path(T.rapid.map(([d, v]) => [tx(d), ty(v)]))} />
            <path className={c("ch-ratingBullet")} d={path(T.bullet.map(([d, v]) => [tx(d), ty(v)]))} />
          </g>
          {rapid && <circle cx={tx(rapid[0])} cy={ty(rapid[1])} r={3} fill="var(--ink-2)" />}
        </g>
        <g className={c("ch-ratingLayer")} opacity={wide ? 1 : 0} aria-hidden="true">
          {[0, 1000, 2000, 3000].map(t => <g key={t}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={sy(t)} y2={sy(t)} /><text x={left - 8} y={sy(t) + 4} textAnchor="end">{t}</text><text x={sx(t)} y={bottom + 19} textAnchor="middle">{t}</text></g>)}
          <text x={left} y={16}>Bullet rating</text><text x={(left + right) / 2} y={h - 1} textAnchor="middle">Rapid rating</text>
          <line x1={sx(0)} y1={sy(0)} x2={sx(3000)} y2={sy(3000)} className={c("ch-ratingRef")} />
          <text x={sx(1700)} y={sy(1700) - 12} textAnchor="middle">Same in both</text>
          <g className={c("ch-ratingPeers")}>{peers}</g>
          <path className={c("ch-ratingTypical")} opacity={typical ? 1 : 0} d={path(S.curve.map(q => [sx(q.rapid), sy(q.bullet)]))} />
          {selected && <circle cx={sx(selected[0])} cy={sy(selected[1])} r={5} fill="none" stroke="var(--ink)" />}
        </g>
        <g className={c("ch-ratingMe")} style={{ transform: `translate(${meX}px, ${meY}px)`, opacity: wide || bullet ? 1 : 0 }} aria-hidden="true">
          <circle r={wide ? 6 : 4} /><text x={10} y={-10}>{wide ? "Me" : "Bullet"}</text>
        </g>
      </svg>
      <div className={c("ch-ratingReadout")} aria-live="polite">
        {wide ? (selected ? `One player · rapid ${selected[0]} · bullet ${selected[1]}` : `Me · rapid ${S.me[0]} · bullet ${S.me[1]}`) : `${dateLabel(date)} · rapid ${rapid?.[1] ?? "—"} · bullet ${bullet?.[1] ?? "not yet played"}`}
      </div>
      {!wide && <label className={c("ch-ratingScrub")}>Explore my ratings<input type="range" min={0} max={days.length - 1} value={picked ?? Math.max(0, days.findLastIndex(d => d <= date))} onChange={e => setPicked(Number(e.target.value))} aria-valuetext={`${dateLabel(date)}: rapid ${rapid?.[1] ?? "not played"}, bullet ${bullet?.[1] ?? "not played"}`} /></label>}
      <div className={c("ch-ratingFooter")}><p className={c("ch-ratingFoot")}>{wide ? `${S.players.toLocaleString("en-GB")} sampled players · July–September medians · ≥20 games in each format. Ratings are separate pools.` : "Last rating each day played. A new rating settles quickly; the early bullet drop is not a loss of skill."}</p>
      <button className={c("ch-ratingDetails")} type="button" aria-expanded={summary} aria-controls={`${id}-notes`} onClick={() => setSummary(v => !v)}>How to read this</button></div>
      {summary && <p id={`${id}-notes`} className={c("ch-ratingHelp")}>{wide ? `The diagonal means equal ratings. ${Math.round(S.shareLower * 100)}% sit below it. The typical line is the median bullet rating in each 100-point rapid band (at least 10 players). My dot uses the same July–September medians as everyone else.` : "Scroll to unfold the two lines, or use the slider. Around 19 May I predicted I would be bad. I first played bullet on 6 July. Lines connect days played; they do not imply games on every day."}</p>}
    </figure>
  )
}
