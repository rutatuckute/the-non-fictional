"use client"

import * as React from "react"
import { c, PinSteps, stepLine } from "./parts"
import { useFollow, useStill } from "./follow"
import data from "./ratings.json"
import pace from "./pace.json"
import { Message } from "./phone-scenes"

const T = data.timeline, S = data.scatter
const time = day => Date.parse(`${day}T00:00:00Z`)
const START = time("2026-01-01"), END = time(T.through)
const JULY = time("2026-07-01"), OCTOBER = time("2026-10-01")
const clamp = v => Math.max(0, Math.min(1, v))
const mix = (a, b, p) => a + (b - a) * p
const smooth = p => { const v = clamp(p); return v * v * (3 - 2 * v) }
const scale = (v, a, b, lo, hi) => mix(lo, hi, (v - a) / (b - a))
const path = points => points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
const typicalAt = r => {
  for (let i = 1; i < S.curve.length; i++)
    if (r <= S.curve[i].rapid) return scale(r, S.curve[i - 1].rapid, S.curve[i].rapid, S.curve[i - 1].bullet, S.curve[i].bullet)
  return S.curve.at(-1).bullet
}
const EXPECTED = Math.round(typicalAt(S.me[0]))
const WORLD_TICKS = Array.from({ length: 16 }, (_, i) => i * 200)

const useCamera = (goal, immediate, automatic) => {
  const shown = React.useRef(0)
  const [value, setValue] = React.useState(null)
  if (goal === null) shown.current = automatic
  React.useEffect(() => {
    if (goal === null) { setValue(null); return }
    if (immediate) { shown.current = goal; setValue(goal); return }
    let frame, last = performance.now()
    const tick = now => {
      shown.current += (goal - shown.current) * (1 - Math.exp(-Math.min(64, now - last) / 100))
      if (Math.abs(goal - shown.current) < 0.0003) shown.current = goal
      last = now
      setValue(shown.current)
      if (shown.current !== goal) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [goal, immediate])
  return goal === null ? automatic : value ?? automatic
}

// These players retain their identity and world coordinates throughout both zooms.
// Memoization keeps 1,388 marks out of the per-frame React reconciliation work.
const RatingCloud = React.memo(function RatingCloud({ dot }) {
  return <g className={c("ch-ratingPeers")}>
    {S.points.map(([rapid, bullet], i) => <use key={i} href={`#${dot}`} x={rapid} y={-bullet}
      data-lower={bullet < rapid} data-near={Math.abs(rapid - S.me[0]) <= 100} />)}
  </g>
})
const OverviewCloud = React.memo(function OverviewCloud() {
  return <g fill="var(--ink-3)">{S.points.map(([x, y], i) => <circle key={i} cx={x / 3000 * 56} cy={34 - y / 3000 * 34} r={0.55} />)}</g>
})

// A histogram uses the separate pace cohort without implying that rating dots
// are the same players. Each half-second bin counts real exported observations.
const PACE_BINS = Array.from({ length: 36 }, (_, i) => pace.peers.seconds.filter(v => v >= i / 2 && v < (i + 1) / 2).length)
const PACE_MAX = Math.max(...PACE_BINS)

export const RatingStory = ({ step }) => {
  const box = React.useRef(null), canvas = React.useRef(null), steps = React.useContext(PinSteps)
  const [canvasTop, setCanvasTop] = React.useState(64)
  const [size, setSize] = React.useState({ width: 680, height: 460 })
  const [at, setAt] = React.useState(0)
  const [view, setView] = React.useState(null)
  const [keyboard, setKeyboard] = React.useState(false)
  const [summary, setSummary] = React.useState(false)
  const still = useStill()
  const id = React.useId().replace(/:/g, "")
  React.useLayoutEffect(() => {
    const scene = box.current.closest(`.${c("ch-scene")}`)
    const update = () => {
      const bounds = box.current.getBoundingClientRect()
      const width = bounds.width
      if (canvas.current) setCanvasTop(canvas.current.getBoundingClientRect().top - bounds.top)
      if (width) setSize({ width, height: Math.min(520, Math.max(100, scene.clientHeight - 218)) })
    }
    const observer = new ResizeObserver(update)
    observer.observe(scene); observer.observe(box.current); update()
    return () => observer.disconnect()
  }, [])
  useFollow(() => {
    // Read the same DOM thresholds as Pinned, without waiting a React render
    // for its new step prop. A stopped scroll must settle at the correct frame.
    const line = stepLine()
    const nodes = steps?.current || []
    let current = 0
    nodes.forEach((node, index) => { if (node?.firstElementChild.getBoundingClientRect().top < line) current = index })
    if (!current) return 0
    if (still) return current + 1
    const node = nodes[current]?.firstElementChild
    const progress = node ? clamp((stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 0.42)) : 1
    return current + progress
  }, setAt, { still, follow: 100, watch: box })
  const focus = useCamera(at < 6 || view === null ? null : view === "all" ? 0 : 1,
    still || keyboard, at < 6 ? 0 : smooth(at - 6))
  React.useEffect(() => { setSummary(false); if (step < 6) setView(null) }, [step])
  const chooseView = (next, event) => { setKeyboard(event.detail === 0); setView(next) }

  const w = size.width, h = size.height
  const left = w < 400 ? 35 : 44, right = w - 20, top = 36, bottom = h - 40
  const period = smooth(at - 3), morph = smooth(at - 4), out = smooth(at - 5)
  const bridge = smooth((at - 7) / 0.4), enterPace = smooth((at - 7.4) / 0.6)
  const entry = smooth(at - 2), exit = smooth(at - 9)
  const zoomTime = smooth(period / 0.65)
  const minTime = mix(START, JULY, zoomTime), maxTime = mix(END, OCTOBER, zoomTime)
  const tx = stamp => scale(typeof stamp === "string" ? time(stamp) : stamp, minTime, maxTime, left, right)
  const ty = value => scale(value, 100, 1100, bottom, top)
  const worldMax = mix(1100, 3000, out)
  const xMin = mix(0, 400, focus), xMax = mix(worldMax, 1000, focus)
  const yMin = mix(0, 100, focus), yMax = mix(worldMax, 850, focus)
  const sx = value => scale(value, xMin, xMax, left, right)
  const sy = value => scale(value, yMin, yMax, bottom, top)
  const px = value => scale(value, 0, 18, left, right)
  const timelineOpacity = entry * (1 - smooth(morph / 0.45))
  const scatterOpacity = smooth((morph - 0.45) / 0.55) * (1 - smooth(bridge / 0.5))
  const crowdOpacity = smooth(out / 0.65)
  const paceOpacity = smooth((enterPace - 0.2) / 0.6)
  const medianOpacity = smooth((period - 0.4) / 0.4) * (1 - bridge)
  const guideOpacity = medianOpacity * (1 - smooth(out / 0.7))
  const paceY = bottom - 12
  const revealDate = mix(time(T.bulletFirst), END, smooth((at - 2.35) / 0.65))
  const rapid = T.rapid.filter(q => time(q[0]) <= revealDate).at(-1)
  const bullet = T.bullet.filter(q => time(q[0]) <= revealDate).at(-1)
  const medianX = tx((JULY + OCTOBER) / 2)
  let meX = mix(tx(bullet?.[0] || T.bulletFirst), medianX, period)
  let meY = mix(ty(bullet?.[1] || 700), ty(S.me[1]), period)
  meX = mix(meX, sx(S.me[0]), morph); meY = mix(meY, sy(S.me[1]), morph)
  meX = mix(meX, (left + right) / 2, bridge); meY = mix(meY, (top + bottom) / 2, bridge)
  meX = mix(meX, px(pace.me.seconds), enterPace); meY = mix(meY, paceY, enterPace)

  const mode = step >= 7 ? "pace" : step >= 4 ? "scatter" : "timeline"
  const title = step === 3 ? "The same three months" : step === 4 ? "Two ratings. One player."
    : step === 5 ? "Me, among other players" : step === 6 ? "About where you'd expect"
      : step === 7 ? "How fast do I actually move?" : step >= 8 ? "Ten-minute games" : "My ratings, on their own"
  const subtitle = step === 3 ? "July–September · median rating in each format" : step === 4 ? "Normal chess across. Fast chess up."
    : step === 5 || step === 6 ? `${S.players.toLocaleString("en-GB")} players · July–September medians`
      : step >= 7 ? `${pace.peers.players.toLocaleString("en-GB")} peers at my level · July–September` : "2026 · last rating each day played"
  const help = mode === "pace"
    ? `Shaded bars count players by their typical seconds per move, in half-second intervals. Ten-minute games without increment, lasting at least 10 moves. ${pace.me.games} of my games; peers have median rapid ratings of ${pace.ratingBand[0]}–${pace.ratingBand[1]} and at least ${pace.minGames} qualifying games. For each game, clock time used divided by moves played; then the median across games for each player. The distribution uses values rounded to 0.1s; the percentile is calculated before rounding. This is a different qualifying peer sample from the rating chart.`
    : mode === "scatter"
      ? `One dot per player with at least 20 games in each format. The diagonal means equal ratings. The typical line joins median bullet ratings in 100-point rapid bands with at least 10 players. My dot uses the same July–September medians. The typical value at my exact rapid rating is interpolated between bands. My level zooms into nearby ratings; the overview shows this frame in the whole sample.`
      : "Lines connect days played. The early bullet drop is a new rating settling. Rapid and bullet have separate rating pools. The July–September portion is summarized by its two median ratings before those values become one player dot. The medians differ from my latest ratings."
  const label = step >= 9 ? "The pace chart dissolves into a question: And what about the others?"
    : step >= 7 ? "My pace: 5 seconds per move. Typical peer: 7.7 seconds. Faster than 93% of a separate sample of peers."
      : step >= 4 ? `Normal chess rating is horizontal; fast chess is vertical. ${step >= 5 ? "87% of sampled players are rated lower in fast chess." : ""} ${step === 6 ? "My gap is about typical at my level." : ""}`
        : "My normal and fast chess ratings through 2026, shown without numerical rating labels."
  const chartStyle = { opacity: entry * (1 - exit), transform: still ? undefined : `translateY(${-exit * 24}px)` }


  return (
    <figure ref={box} className={c("ch-ratings")} data-mode={mode} data-still={still} data-rating-step={step}
      data-progress={at.toFixed(3)} data-focus={focus.toFixed(3)}>
      <div className={c("ch-ratingPhone")} aria-hidden={step >= 3} style={{ visibility: entry >= 1 ? "hidden" : "visible" }}>
        <Message collapse={entry} target={{ x: tx(T.claim), y: top + canvasTop }} />
      </div>
      <figcaption className={c("ch-ratingTitle")} style={chartStyle} aria-hidden={step < 2 || step >= 9}>{title}</figcaption>
      <p className={c("ch-ratingSubtitle")} style={chartStyle} aria-hidden={step < 2 || step >= 9}>{subtitle}</p>
      <svg ref={canvas} className={c("ch-ratingCanvas")} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} aria-hidden={step < 2 || step >= 9} style={{ opacity: 1 - exit, transform: still ? undefined : `translateY(${-exit * 24}px)` }}>
        <defs>
          <g id={`${id}-player`}><circle r={w < 400 ? 1.35 : 1.8}
            transform={`scale(${(xMax - xMin) / (right - left)},${(yMax - yMin) / (bottom - top)})`} /></g>
          <clipPath id={`${id}-plot`}><rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} /></clipPath>
          <clipPath id={`${id}-reveal`}><rect x={left} y={top - 10} width={Math.max(0, Math.min(right, tx(revealDate)) - left)} height={bottom - top + 10} /></clipPath>
        </defs>
        <g opacity={timelineOpacity} aria-hidden="true" data-layer="timeline">
          {[200, 400, 600, 800, 1000].map(v => <g key={v}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={ty(v)} y2={ty(v)} /></g>)}
          <g clipPath={`url(#${id}-plot)`}>
            <rect className={c("ch-ratingWindow")} opacity={period * 0.14} x={tx(JULY)} y={top} width={tx(OCTOBER) - tx(JULY)} height={bottom - top} />
            <g clipPath={`url(#${id}-reveal)`} opacity={1 - period * 0.85}>
              <path className={c("ch-ratingRapid")} d={path(T.rapid.map(([d, v]) => [tx(d), ty(v)]))} />
              <path className={c("ch-ratingBullet")} d={path(T.bullet.map(([d, v]) => [tx(d), ty(v)]))} />
            </g>
            <g opacity={1 - period}>
              <line className={c("ch-ratingRef")} x1={tx(T.claim)} x2={tx(T.claim)} y1={top} y2={bottom} />
              <circle cx={tx(T.claim)} cy={top} r={3.5} fill="var(--thread)" />
              <text x={tx(T.claim) + 7} y={top + 14}>18 May · “soooo bad”</text>
            </g>
          </g>
          {[1, 3, 5, 7, 8, 9, 10, 11].map(m => {
            const x = tx(`2026-${String(m).padStart(2, "0")}-01`)
            return x >= left - 2 && x <= right + 2 && (period > 0.3 || m % 2) ? <text key={m} x={x} y={bottom + 22} textAnchor="middle">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][m - 1]}</text> : null
          })}
          <g opacity={1 - period}>
            {rapid && <text x={right} y={ty(rapid[1]) - 11} textAnchor="end" className={c("ch-ratingPale")}>Normal chess (rapid)</text>}
            {bullet && <text x={right} y={ty(bullet[1]) + 18} textAnchor="end" className={c("ch-ratingClay")}>Fast chess (bullet)</text>}
            <path className={c("ch-ratingGap")} opacity={smooth(at - 2)} d={`M${right - 18} ${ty(T.rapid.at(-1)[1])} h8 V${ty(T.bullet.at(-1)[1])} h-8`} />
          </g>
        </g>
        <g opacity={scatterOpacity} aria-hidden="true" data-layer="scatter">
          {WORLD_TICKS.map(v => {
            const x = sx(v), y = sy(v)
            const xAlpha = v % 1000 === 0 ? 1 : mix(clamp(((right - left) / (xMax - xMin) * 200 - 60) / 30), 1, focus)
            const yAlpha = v % 1000 === 0 ? 1 : mix(clamp(((bottom - top) / (yMax - yMin) * 200 - 40) / 25), 1, focus)
            return <g key={v}>
              {x >= left - 1 && x <= right + 1 && <text opacity={xAlpha} x={x} y={bottom + 22} textAnchor="middle">{v}</text>}
              {y >= top - 1 && y <= bottom + 1 && <g opacity={yAlpha}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={y} y2={y} /><text x={left - 8} y={y + 4} textAnchor="end">{v}</text></g>}
            </g>
          })}
          <text x={left} y={16}>Fast chess (bullet)</text><text x={(left + right) / 2} y={h - 1} textAnchor="middle">Normal chess (rapid)</text>
          <g clipPath={`url(#${id}-plot)`}>
            <g transform={`matrix(${(right - left) / (xMax - xMin)},0,0,${(bottom - top) / (yMax - yMin)},${left - xMin * (right - left) / (xMax - xMin)},${bottom + yMin * (bottom - top) / (yMax - yMin)})`}>
              <line x1={0} y1={0} x2={3000} y2={-3000} className={c("ch-ratingRef")} vectorEffect="non-scaling-stroke" />
              <g opacity={crowdOpacity} data-highlight={step === 5 ? "lower" : step === 6 ? "near" : "none"}><RatingCloud dot={`${id}-player`} /></g>
              <path className={c("ch-ratingTypical")} opacity={focus} vectorEffect="non-scaling-stroke" pathLength={1}
                strokeDasharray="1 1" strokeDashoffset={1 - focus} d={path(S.curve.map(q => [q.rapid, -q.bullet]))} />
            </g>
          </g>
          <text opacity={crowdOpacity * (1 - focus)} x={sx(1800)} y={sy(1800) - 12} textAnchor="middle">Same in both</text>
          <g opacity={focus}>
            <circle cx={sx(S.me[0])} cy={sy(EXPECTED)} r={4} className={c("ch-ratingExpected")} />
            <path className={c("ch-ratingRef")} d={`M${sx(S.me[0])} ${sy(EXPECTED)} h${Math.min(60, w * 0.1)}`} />
            <text x={sx(S.me[0]) + Math.min(60, w * 0.1) + 5} y={sy(EXPECTED) + 4}>Typical at my level</text>
          </g>
        </g>
        {/* Both period summaries physically become the two coordinate guides. */}
        <g opacity={guideOpacity} aria-hidden="true" data-layer="guides">
          <line className={c("ch-ratingRapid")} x1={mix(left, sx(S.me[0]), morph)} x2={mix(right, sx(S.me[0]), morph)}
            y1={mix(ty(S.me[0]), bottom, morph)} y2={mix(ty(S.me[0]), top, morph)} />
          <line className={c("ch-ratingBullet")} x1={left} x2={right} y1={mix(ty(S.me[1]), sy(S.me[1]), morph)} y2={mix(ty(S.me[1]), sy(S.me[1]), morph)} />
          <text className={c("ch-ratingPale")} x={mix(left + 8, sx(S.me[0]) + 8, morph)} y={mix(ty(S.me[0]) - 12, bottom - 12, morph)}>Normal chess</text>
          <text className={c("ch-ratingClay")} x={left + 8} y={mix(ty(S.me[1]), sy(S.me[1]), morph) - 12}>Fast chess</text>
        </g>
        <g opacity={paceOpacity} aria-hidden="true" data-layer="pace" data-highlight={step >= 8}>
          <text x={left} y={16}>Seconds per move · players at my level</text>
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
          {[0, 5, 10, 15].map(v => <text key={v} x={px(v)} y={bottom + 22} textAnchor="middle">{v}s</text>)}
          <text x={left} y={h - 1}>Faster</text><text x={right} y={h - 1} textAnchor="end">Slower</text>
          <g className={c("ch-paceDistribution")}>
            {PACE_BINS.map((count, i) => {
              const height = count / PACE_MAX * Math.max(20, bottom - 80)
              return <rect key={i} x={px(i / 2)} y={bottom - height} width={Math.max(1, (right - left) / 36 - 1)} height={height} data-slower={i / 2 >= pace.me.seconds} />
            })}
          </g>
          <line className={c("ch-ratingRef")} x1={px(pace.peers.median)} x2={px(pace.peers.median)} y1={57} y2={bottom - 8} />
          <text x={px(pace.peers.median) + 8} y={49}>Typical · 7.7s</text>
          <line className={c("ch-paceMeLine")} x1={px(pace.me.seconds)} x2={px(pace.me.seconds)} y1={35} y2={bottom - 8} />
          <text className={c("ch-ratingClay")} x={px(pace.me.seconds) - 8} y={27} textAnchor="end">Me · 5.0s</text>
        </g>
        {/* One author marker, retained from the timeline through the final pace plot. */}
        <g className={c("ch-ratingMe")} data-author-marker="true" opacity={entry * (1 - exit)}
          style={{ transform: `translate(${meX}px, ${meY}px)` }} aria-hidden="true">
          <circle r={step < 3 ? 4.5 : 6} />
          <text x={10} y={-12} opacity={smooth(morph / 0.6) * (1 - enterPace)}>Me</text>
        </g>
      </svg>
      <div className={c("ch-ratingLegend")} aria-hidden={step < 2 || step >= 7} style={{ ...chartStyle, visibility: step >= 7 ? "hidden" : undefined }}>
        <span><i />Normal chess (rapid) — 10 minutes per player.</span>
        <span><i />Fast chess (bullet) — 1 minute per player.</span>
      </div>
      <div className={c("ch-ratingReadout")} style={chartStyle} aria-hidden={step < 2 || step >= 9}>
        {step >= 8 ? <span>Faster than <b>9 in 10</b> players at my level</span>
          : step === 7 ? <span>Me <b>5 seconds</b> · typical peer 7.7 seconds per move</span>
            : step === 6 ? <span>My gap is about typical at my level</span>
              : step === 5 ? <span><b>87%</b> are rated lower in fast chess</span>
                : <span>July–September · the same period in both formats</span>}
      </div>
      <div className={c("ch-ratingTools")} style={chartStyle} inert={step < 2 || step >= 9} aria-hidden={step < 2 || step >= 9}>
        <div className={c("ch-ratingExplore")} inert={step !== 6} aria-hidden={step !== 6} data-visible={step === 6}>
          <div role="group" aria-label="Rating chart view" className={c("ch-ratingViews")}>
            <button type="button" aria-pressed={view !== "all"} onClick={e => chooseView("mine", e)}>My level</button>
            <button type="button" aria-pressed={view === "all"} onClick={e => chooseView("all", e)}>All players</button>
          </div>
          <button className={c("ch-ratingOverview")} type="button" aria-label={view === "all" ? "Zoom to my level" : "Show all players"}
            onClick={e => chooseView(view === "all" ? "mine" : "all", e)}>
            <svg viewBox="0 0 60 38" aria-hidden="true"><g transform="translate(2,2)"><OverviewCloud />
              <rect x={xMin / 3000 * 56} y={34 - yMax / 3000 * 34} width={(xMax - xMin) / 3000 * 56} height={(yMax - yMin) / 3000 * 34} className={c("ch-ratingFrame")} />
            </g></svg>
          </button>
        </div>
        <button className={c("ch-ratingDetails")} type="button" aria-expanded={summary} aria-controls={`${id}-notes`} onClick={() => setSummary(v => !v)}>About the data</button>
      </div>
      <div className={c("ch-ratingQuestion")} style={{ opacity: exit, transform: still ? undefined : `translateY(${(1 - exit) * 20}px)` }} aria-hidden={step < 9}>
        <h3>And what about the others?</h3>
        <p><span>badatchess…</span><span>chessmaster…</span><span>blundermaster…</span><span>futuregm…</span></p>
      </div>
      {summary && <p id={`${id}-notes`} className={c("ch-ratingHelp")}>{help}</p>}
    </figure>
  )
}
