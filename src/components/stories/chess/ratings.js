"use client"

import * as React from "react"
import { c, PinSteps, stepLine } from "./parts"
import { useFollow, useStill } from "./follow"
import data from "./ratings.json"
import pace from "./pace.json"

const T = data.timeline, S = data.scatter
const time = day => Date.parse(`${day}T00:00:00Z`)
const start = time("2026-01-01"), end = time(T.through), claim = time(T.claim)
const scale = (v, a, b, lo, hi) => lo + (v - a) / (b - a) * (hi - lo)
const clamp = v => Math.max(0, Math.min(1, v))
const path = points => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
const atDay = (series, date) => series.filter(d => d[0] <= date).at(-1)
const typicalAt = r => {
  const curve = S.curve
  for (let i = 1; i < curve.length; i++)
    if (r <= curve[i].rapid) return scale(r, curve[i - 1].rapid, curve[i].rapid, curve[i - 1].bullet, curve[i].bullet)
  return curve.at(-1).bullet
}
const expected = Math.round(typicalAt(S.me[0]))
const bins = Array.from({ length: 36 }, (_, i) => ({ seconds: i / 2, count: pace.peers.seconds.filter(s => s >= i / 2 && s < (i + 1) / 2).length }))
const maxBin = Math.max(...bins.map(b => b.count))

// The comparison uses period medians, not the timeline's latest ratings.
// Establish those values before adding the crowd. Pace gets a separate chart.
export const RatingStory = ({ step }) => {
  const box = React.useRef(null), steps = React.useContext(PinSteps)
  const [size, setSize] = React.useState({ width: 560, height: 340 })
  const [reveal, setReveal] = React.useState(0)
  const [summary, setSummary] = React.useState(false)
  const still = useStill()
  const id = React.useId().replace(/:/g, "")
  React.useLayoutEffect(() => {
    const scene = box.current.closest(`.${c("ch-scene")}`)
    const update = () => {
      const width = box.current.getBoundingClientRect().width
      if (!width) return
      setSize({ width, height: Math.min(380, Math.max(150, scene.clientHeight - 162)) })
    }
    const observer = new ResizeObserver(update)
    observer.observe(scene)
    observer.observe(box.current)
    update()
    return () => observer.disconnect()
  }, [])
  useFollow(() => {
    if (step < 1) return (claim - start) / (end - start)
    if (step >= 2 || still) return 1
    const node = steps?.current?.[1]?.firstElementChild
    if (!node) return 1
    const p = clamp((stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 0.32))
    const cut = (time(T.bulletFirst) - start) / (end - start)
    return cut + (1 - cut) * p
  }, setReveal, { still, watch: box })
  React.useEffect(() => setSummary(false), [step])

  const mode = step >= 6 ? "pace" : step >= 4 ? "scatter" : "timeline"
  const period = step === 3, typical = step === 5
  const w = size.width, h = size.height, left = 36, right = w - 20, top = 36, bottom = h - 34
  const tx = v => scale(time(v), start, end, left, right)
  const ty = v => scale(v, 100, 1100, bottom, top)
  const sx = v => scale(v, 0, 3000, left, right)
  const sy = v => scale(v, 0, 3000, bottom, top)
  const px = v => scale(v, 0, 18, left, right)
  const shown = start + (end - start) * reveal
  const date = new Date(shown).toISOString().slice(0, 10)
  const rapid = atDay(T.rapid, date), bullet = atDay(T.bullet, date)
  const crowd = React.useMemo(() => S.points.map((q, i) => (
    <circle key={i} cx={sx(q[0])} cy={sy(q[1])} r={w < 400 ? 1.5 : 2}
      data-near={Math.abs(q[0] - S.me[0]) <= 100 ? "true" : "false"} />
  )), [w, h])
  const title = mode === "pace" ? "Ten-minute games" : mode === "scatter" ? "Me, among other players" : period ? "The same three months" : "My ratings, on their own"
  const subtitle = mode === "pace" ? "Seconds per move · one value per player" : mode === "scatter" ? "July–September medians · one dot, one player" : period ? "July–September · median rating in each format" : "2026 · last rating each day played"
  const description = mode === "pace"
    ? `In ten-minute games I use ${pace.me.seconds.toFixed(1)} seconds per move, compared with a peer median of ${pace.peers.median.toFixed(1)}. Faster than ${Math.round(pace.fasterThan * 100)}% of ${pace.peers.players} peers.`
    : mode === "scatter"
      ? `Rapid rating horizontally, bullet vertically. ${Math.round(S.shareLower * 100)}% of ${S.players} sampled players are lower in bullet. My period medians are rapid ${S.me[0]}, bullet ${S.me[1]}. ${typical ? `Typical bullet at my rapid rating is about ${expected}.` : ""}`
      : `My rapid and bullet ratings. I sent the message on 18 May. Bullet began seven weeks later, on 6 July. After ${T.bulletGames} games its rating settled in the 400s. ${period ? `July–September medians: rapid ${S.me[0]}, bullet ${S.me[1]}.` : ""}`
  const foot = mode === "pace" ? `${pace.me.games} of my games · ${pace.peers.players.toLocaleString("en-GB")} peers at my level · July–September`
    : mode === "scatter" ? `${S.players.toLocaleString("en-GB")} players · at least 20 games in each format`
      : period ? "These same period medians become my dot in the next chart."
        : "Rapid and bullet have separate rating pools."
  const help = mode === "pace"
    ? `Ten-minute games without increment, lasting at least 10 moves. For each game, clock time used divided by moves played; then the median across games for each player. Peers have a median rapid rating of ${pace.ratingBand[0]}–${pace.ratingBand[1]} and at least ${pace.minGames} qualifying games. Percentile calculated before rounding. This describes speed within rapid.`
    : mode === "scatter"
      ? "The diagonal means equal ratings. The typical line joins median bullet ratings in 100-point rapid bands with at least 10 players. My dot uses the same July–September medians as everyone else's; the typical value at my exact rapid rating is interpolated between bands."
      : "Lines connect days played. The early bullet drop is a new rating settling, rather than a loss of skill. The shaded July–September period uses the same dates as the comparison sample; its medians differ from my latest ratings."

  return (
    <figure ref={box} className={c("ch-ratings")} data-mode={mode} data-still={still} data-rating-step={step}>
      <figcaption className={c("ch-ratingTitle")}>{title}</figcaption>
      <p className={c("ch-ratingSubtitle")}>{subtitle}</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={description}>
        <defs><clipPath id={id}><rect x={left - 3} y={top - 15} width={Math.max(0, scale(shown, start, end, left, right) - left + 4)} height={bottom - top + 25} /></clipPath></defs>
        {mode === "timeline" && <g key="timeline" className={c("ch-ratingLayer")} aria-hidden="true">
          {period && <rect className={c("ch-ratingWindow")} x={tx("2026-07-01")} y={top} width={tx("2026-10-01") - tx("2026-07-01")} height={bottom - top} />}
          {[200, 400, 600, 800, 1000].map(t => <g key={t}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={ty(t)} y2={ty(t)} /><text x={left - 8} y={ty(t) + 4} textAnchor="end">{t}</text></g>)}
          {[1, 3, 5, 7, 9, 11].map((m, i) => <text key={m} x={tx(`2026-${String(m).padStart(2, "0")}-01`)} y={bottom + 22} textAnchor="middle">{["Jan", "Mar", "May", "Jul", "Sep", "Nov"][i]}</text>)}
          {!period && <><line className={c("ch-ratingRef")} x1={tx(T.claim)} x2={tx(T.claim)} y1={top} y2={bottom} /><text x={tx(T.claim) + 7} y={top - 12}>18 May · “soooo bad”</text></>}
          <g clipPath={`url(#${id})`} opacity={period ? 0.3 : 1}>
            <path className={c("ch-ratingRapid")} d={path(T.rapid.map(([d, v]) => [tx(d), ty(v)]))} />
            <path className={c("ch-ratingBullet")} d={path(T.bullet.map(([d, v]) => [tx(d), ty(v)]))} />
          </g>
          {period ? S.me.map((v, i) => <g key={i}>
            <line className={c(i ? "ch-ratingBullet" : "ch-ratingRapid")} x1={tx("2026-07-01")} x2={tx("2026-10-01")} y1={ty(v)} y2={ty(v)} />
            <text x={tx("2026-07-01") + 5} y={ty(v) - 9} className={c(i ? "ch-ratingClay" : "ch-ratingPale")}>{i ? "Bullet" : "Rapid"} {v}</text>
          </g>) : <>
            {rapid && <g><circle cx={tx(rapid[0])} cy={ty(rapid[1])} r={3} fill="var(--ink-2)" /><text x={right} y={ty(rapid[1]) - 12} textAnchor="end" className={c("ch-ratingPale")}>Rapid</text></g>}
            {bullet && <g><circle cx={tx(bullet[0])} cy={ty(bullet[1])} r={4} fill="var(--thread)" /><text x={right} y={ty(bullet[1]) + 19} textAnchor="end" className={c("ch-ratingClay")}>Bullet</text></g>}
          </>}
        </g>}
        {mode === "scatter" && <g key="scatter" className={c("ch-ratingLayer")} aria-hidden="true">
          {[0, 1000, 2000, 3000].map(t => <g key={t}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={sy(t)} y2={sy(t)} /><text x={left - 8} y={sy(t) + 4} textAnchor="end">{t}</text><text x={sx(t)} y={bottom + 19} textAnchor="middle">{t}</text></g>)}
          <text x={left} y={14}>Bullet rating</text><text x={(left + right) / 2} y={h - 1} textAnchor="middle">Rapid rating</text>
          <line x1={sx(0)} y1={sy(0)} x2={sx(3000)} y2={sy(3000)} className={c("ch-ratingRef")} />
          <text x={sx(1800)} y={sy(1800) - 12} textAnchor="middle">Same in both</text>
          {typical && <rect x={sx(S.me[0] - 100)} y={top} width={sx(200) - sx(0)} height={bottom - top} className={c("ch-ratingWindow")} />}
          <g className={c("ch-ratingPeers")} data-focus={typical}>{crowd}</g>
          {typical && <path className={c("ch-ratingTypical")} d={path(S.curve.map(q => [sx(q.rapid), sy(q.bullet)]))} />}
          <g className={c("ch-ratingMe")} transform={`translate(${sx(S.me[0])},${sy(S.me[1])})`}>
            <circle r={6} /><text x={10} y={-10}>Me</text>
          </g>
        </g>}
        {mode === "pace" && <g key="pace" className={c("ch-ratingLayer")} aria-hidden="true">
          <text x={left} y={68}>Players</text>
          {bins.map(bin => <rect key={bin.seconds} className={c("ch-paceBin")} data-slower={step >= 7 && bin.seconds >= pace.me.seconds}
            x={px(bin.seconds) + 1} y={bottom - bin.count / maxBin * (bottom - 74)}
            width={Math.max(1, px(0.5) - px(0) - 2)} height={bin.count / maxBin * (bottom - 74)} />)}
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
          {[0, 5, 10, 15].map(v => <text key={v} x={px(v)} y={bottom + 20} textAnchor="middle">{v}s</text>)}
          <text x={left} y={h - 1}>Faster</text><text x={right} y={h - 1} textAnchor="end">Slower</text>
          <line className={c("ch-paceMeLine")} x1={px(pace.me.seconds)} x2={px(pace.me.seconds)} y1={31} y2={bottom} />
          <text className={c("ch-ratingClay")} x={px(pace.me.seconds) - 8} y={22} textAnchor="end">Me · {pace.me.seconds.toFixed(1)}s</text>
          <line className={c("ch-ratingRef")} x1={px(pace.peers.median)} x2={px(pace.peers.median)} y1={55} y2={bottom} />
          <text x={px(pace.peers.median) + 8} y={46}>Typical · {pace.peers.median.toFixed(1)}s</text>
        </g>}
      </svg>
      <div className={c("ch-ratingReadout")}>
        {mode === "pace" ? (step >= 7 ? <span>Faster than <b>{Math.round(pace.fasterThan * 100)}%</b> of peers</span> : null)
          : mode === "scatter" ? (typical ? <><span className={c("ch-ratingClay")}>My bullet: {S.me[1]}</span><span>Typical at my level: ≈{expected}</span></> : <><span>My rapid {S.me[0]}</span><span className={c("ch-ratingClay")}>My bullet {S.me[1]}</span></>)
            : period ? <><span>Rapid {S.me[0]}</span><span className={c("ch-ratingClay")}>Bullet {S.me[1]}</span></>
              : step >= 2 ? <><span>Rapid {T.rapid.at(-1)[1]}</span><span className={c("ch-ratingClay")}>Bullet {T.bullet.at(-1)[1]}</span></> : "Bullet began on 6 July · seven weeks after the message"}
      </div>
      <div className={c("ch-ratingFooter")}>
        <p className={c("ch-ratingFoot")}>{foot}</p>
        <button className={c("ch-ratingDetails")} type="button" aria-expanded={summary} aria-controls={`${id}-notes`} onClick={() => setSummary(v => !v)}>About the data</button>
      </div>
      {summary && <p id={`${id}-notes`} className={c("ch-ratingHelp")}>{help}</p>}
    </figure>
  )
}
