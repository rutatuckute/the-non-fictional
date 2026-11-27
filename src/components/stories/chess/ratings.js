"use client"

import * as React from "react"
import { c, PinSteps, stepLine } from "./parts"
import { useFollow, useStill } from "./follow"
import data from "./ratings.json"
import pace from "./pace.json"
import { Message } from "./phone-scenes"
import { useReader } from "./reader"
import { crowdLayout, crowdStage, dotAt, CrowdMarks, GROUPS, TYPICAL, MY_RAPID, MY_RESIGN, resignedOf } from "./crowd"
import { NameButtons, NameScore } from "./say"
import { useYourSay } from "./you-say"

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
// The reader's own ratings (you.js), and where they stand against the curve:
// a typical bullet rating is given only inside the curve's range of rapid.
export const readerGap = you => {
  if (!you) return null
  const rapid = you.rapid.rating, bullet = you.bullet.rating
  const inside = rapid >= S.curve[0].rapid && rapid <= S.curve.at(-1).rapid
  return { rapid, bullet, gap: bullet - rapid, typical: inside ? Math.round(typicalAt(rapid)) : null }
}
const points = n => `${Math.abs(n).toLocaleString("en-GB")} ${Math.abs(n) === 1 ? "point" : "points"}`
const gapWords = g => (g.gap === 0 ? "the same in both" : `${points(g.gap)} ${g.gap < 0 ? "lower" : "higher"} in fast chess`)
// Where the reader's dot goes off the zoomed view, an arrow points to it.
const ARROWS = { "1,-1": "↗", "1,0": "→", "1,1": "↘", "0,-1": "↑", "0,1": "↓", "-1,-1": "↖", "-1,0": "←", "-1,1": "↙" }
const LINKED_SCATTER = new Set(pace.peers.scatterIndices.filter(i => i !== null))
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
    {S.points.map(([rapid, bullet], i) => LINKED_SCATTER.has(i) ? null : <use key={i} href={`#${dot}`} x={rapid} y={-bullet}
      data-lower={bullet < rapid} data-near={Math.abs(rapid - S.me[0]) <= 100} />)}
  </g>
})
const OverviewCloud = React.memo(function OverviewCloud() {
  return <g fill="var(--ink-3)">{S.points.map(([x, y], i) => <circle key={i} cx={x / 3000 * 56} cy={34 - y / 3000 * 34} r={0.55} />)}</g>
})

// Deterministic beeswarm: x is the recorded pace, y only prevents collisions.
// Source-linked identities are retained for the players shared by both cohorts.
const packPace = (width, left, right, top, bottom) => {
  const radius = width < 400 ? 1 : 1.65
  const diameter = radius * 2 + 0.5
  const points = []
  const centre = (top + bottom) / 2
  for (const { seconds, index } of pace.peers.seconds.map((seconds, index) => ({ seconds, index })).sort((a, b) => a.seconds - b.seconds)) {
    const x = scale(seconds, 0, 18, left, right)
    const neighbours = []
    for (let i = points.length - 1; i >= 0 && x - points[i].x < diameter; i--) neighbours.push(points[i])
    let offset = 0
    for (let k = 0; k < pace.peers.players * 2; k++) {
      offset = k === 0 ? 0 : Math.ceil(k / 2) * diameter * (k % 2 ? 1 : -1)
      if (neighbours.every(q => (x - q.x) ** 2 + (centre + offset - q.y) ** 2 >= diameter ** 2 - 0.01)) break
    }
    points.push({ x, y: centre + offset, seconds, index, scatterIndex: pace.peers.scatterIndices[index] })
  }
  // Compress the packing vertically if needed; x continues to encode exact pace.
  const extent = Math.max(...points.map(q => Math.abs(q.y - centre)), 1)
  const compression = Math.min(1, ((bottom - top) / 2 - radius) / extent)
  return { radius, points: points.map(q => ({ ...q, y: centre + (q.y - centre) * compression })) }
}
// From the "others" beat on, every dot is drawn where its stage puts it
// (crowd.js); CSS carries it there, so the change reads as one movement.
const crowdStyle = (target, x, y, i) => target ? {
  transform: `translate(${(target.x - x).toFixed(2)}px, ${(target.y - y).toFixed(2)}px)`,
  opacity: target.opacity, transitionDelay: `${(i * 37) % 420}ms`,
} : undefined
const PaceCloud = React.memo(function PaceCloud({ swarm, targets }) {
  return <g className={c("ch-paceCloud")} data-crowd={targets ? "true" : undefined}>
    {swarm.points.filter(q => q.scatterIndex === null).map(q => {
      const t = targets?.[q.index]
      return <circle key={q.index} data-pace-index={q.index} cx={q.x} cy={q.y} r={t?.r ?? swarm.radius} data-slower={q.seconds > pace.me.seconds}
        data-tone={t?.tone} style={crowdStyle(t, q.x, q.y, q.index)} />
    })}
  </g>
})

// The chart's legend: coloured tags under its title, one look for every chart.
const Chips = ({ chips, extra }) => (
  <div className={c("ch-ratingChips")} aria-hidden="true">
    {chips.map(([tone, text, shown = true]) => <span key={tone + text} className={c("ch-ratingChip")} data-tone={tone} data-shown={shown ? "true" : "false"}>{text}</span>)}
    {extra}
  </div>
)

export const RatingStory = ({ step, revealed = {}, guesses = {}, onGuess = () => {} }) => {
  const box = React.useRef(null), canvas = React.useRef(null), steps = React.useContext(PinSteps)
  const [canvasTop, setCanvasTop] = React.useState(64)
  const [size, setSize] = React.useState({ width: 680, height: 460 })
  const [at, setAt] = React.useState(0)
  const [view, setView] = React.useState(null)
  const [keyboard, setKeyboard] = React.useState(false)
  const still = useStill()
  const id = React.useId().replace(/:/g, "")
  const you = readerGap(useReader().chesscom)
  // the reader's pace and resigning, from the games read at the hinge (you-say.js)
  const yours = useYourSay()
  const yourPace = yours?.pace?.seconds ?? null, yourResign = yours?.resign ?? null
  React.useLayoutEffect(() => {
    const scene = box.current.closest(`.${c("ch-scene")}`)
    const update = () => {
      const bounds = box.current.getBoundingClientRect()
      const width = bounds.width
      if (canvas.current) setCanvasTop(canvas.current.getBoundingClientRect().top - bounds.top)
      // On short phones the names beats keep the chart's title and drop its
      // subtitle and readout (the words above say the same), so the rows stay
      // readable. The charts before them keep their size and legend.
      const compact = window.matchMedia("(max-width: 60rem)").matches && scene.clientHeight < 440
      const fit = (less, most = 600) => Math.min(most, Math.max(100, scene.clientHeight - less))
      // the names and the lost games take the taller frame; the charts before them keep theirs
      if (width) setSize({ width, compact, height: fit(150), tall: compact ? fit(112, 700) : fit(150, 700) })
    }
    const observer = new ResizeObserver(update)
    observer.observe(scene); observer.observe(box.current); update()
    return () => observer.disconnect()
  }, [])
  useFollow(() => {
    // Read the same DOM thresholds as Pinned, without waiting a React render
    // for its new step prop. A stopped scroll must settle at the correct frame.
    const nodes = steps?.current || []
    const line = stepLine(nodes.find(Boolean))
    let current = 0
    nodes.forEach((node, index) => { if (node?.firstElementChild.getBoundingClientRect().top < line) current = index })
    if (!current) return 0
    if (still) return current + 1
    const node = nodes[current]?.firstElementChild
    const progress = node ? clamp((stepLine(node) - node.getBoundingClientRect().top) / (window.innerHeight * 0.42)) : 1
    return current + progress
  }, setAt, { still, follow: 100, watch: box })
  const focus = useCamera(at < 6 || view === null ? null : view === "all" ? 0 : 1,
    still || keyboard, at < 6 ? 0 : smooth(at - 6))
  React.useEffect(() => { if (step < 6) setView(null) }, [step])
  const chooseView = (next, event) => { setKeyboard(event.detail === 0); setView(next) }

  const stage = crowdStage(step)
  const w = size.width, h = stage ? size.tall ?? size.height : size.height
  // The earlier charts keep the base height, so their dots never move when the
  // names beats take the taller frame; only the crowd uses the extra room.
  const left = w < 400 ? 35 : 44, right = w - 20, top = 36, bottom = size.height - 40, crowdBottom = h - 40
  const period = smooth(at - 3), morph = smooth(at - 4), out = smooth(at - 5)
  // scatter to pace, in one movement: first the other players go (7–7.3) and only the
  // ones at my level stay, on the scatter's axes; they travel to their pace (7.1–7.85)
  // as the scatter's axes go (7.3–7.6) and the pace chart's come in (7.45–7.85)
  const bridge = smooth((at - 7.3) / 0.3), enterPace = smooth((at - 7.1) / 0.75), others = 1 - smooth((at - 7) / 0.3)
  const entry = smooth(at - 2)
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
  const paceOpacity = smooth((at - 7.45) / 0.4)
  const medianOpacity = smooth((period - 0.4) / 0.4) * (1 - bridge)
  const guideOpacity = medianOpacity * (1 - smooth(out / 0.7))
  const swarm = React.useMemo(() => packPace(w, left, right, 68, bottom - 12), [w, left, right, bottom])
  const paceY = (68 + bottom - 12) / 2
  const narrow = w < 560
  const withYou = Boolean(yourResign)
  const layout = React.useMemo(() => crowdLayout({ total: pace.peers.players, left, right, top: top + 22, bottom: crowdBottom, width: w, you: withYou }), [w, left, right, crowdBottom, withYou])
  const revealKey = GROUPS.map(g => (revealed[g.key] ? 1 : 0)).join("")
  const targets = React.useMemo(() => stage ? Array.from({ length: pace.peers.players }, (_, i) => dotAt(layout, i, { stage, revealed, you: yourResign })) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, stage, revealKey, yourResign])
  const revealDate = mix(time(T.bulletFirst), END, smooth((at - 2.35) / 0.65))
  const rapid = T.rapid.filter(q => time(q[0]) <= revealDate).at(-1)
  const bullet = T.bullet.filter(q => time(q[0]) <= revealDate).at(-1)
  const medianX = tx((JULY + OCTOBER) / 2)
  let meX = mix(tx(bullet?.[0] || T.bulletFirst), medianX, period)
  let meY = mix(ty(bullet?.[1] || 700), ty(S.me[1]), period)
  meX = mix(meX, sx(S.me[0]), morph); meY = mix(meY, sy(S.me[1]), morph)
  meX = mix(meX, px(pace.me.seconds), enterPace); meY = mix(meY, paceY, enterPace)
  // From the crowd on, the marker is placed by stage and carried by CSS.
  let meOpacity = entry
  if (stage === "crowd") { meX = (left + right) / 2; meY = (top + bottom) / 2 + 10 }
  else if (stage === "me") { meX = layout.rx(MY_RAPID); meY = top + 20 }
  else if (stage) { meX = layout.rx(MY_RAPID); meY = top + 20; meOpacity = 0 }

  const mode = stage === "giveup" || stage === "us" ? "giveup" : stage && stage !== "crowd" ? "names" : stage ? "crowd" : step >= 7 ? "pace" : step >= 4 ? "scatter" : "timeline"
  // one title per chart, kept while the chart changes (the crowd has none)
  const title = stage === "us" ? "How our games end" : mode === "giveup" ? "How their games end" : mode === "names" ? "What their names say" : mode === "crowd" ? "\u00a0"
    : mode === "pace" ? "How fast do I actually play" : mode === "scatter" ? "1-minute VS 10-minute games" : "My chess ratings"
  const youChip = ["you", "You"]
  const chips = mode === "giveup" ? [["crowd", "Resigned"], ["dim", "Ended otherwise"], ...(stage === "us" ? [["me", "Me"], ...(yourResign ? [youChip] : [])] : [])]
    : mode === "names" ? (stage === "me" ? [["me", "Me"], ...(you ? [youChip] : [])] : [])
      : mode === "crowd" ? []
        : mode === "pace" ? [["me", "Me"], ["crowd", "Players at my level"], ...(yourPace !== null ? [youChip] : [])]
          : step >= 5 ? [["me", "Me"], ["crowd", "Other players"], ...(you ? [youChip] : [])]
            : [["rapid", "10-minute games"], ["bullet", "1-minute games", at >= 2.35]]
  const resignWords = key => `${resignedOf(key, yourResign)} in 100`
  const label = mode === "giveup" ? `Of 100 lost rapid games, players whose names say they are bad resigned ${resignWords("bad")}; everyone else ${resignWords("everyone")}.${stage === "us" ? ` Me: ${MY_RESIGN.resigned} of my ${MY_RESIGN.losses} losses.${yourResign ? ` You: ${yourResign.resigned} of your ${yourResign.losses}.` : ""}` : ""}`
    : mode === "names" ? `Rapid ratings by what usernames say, against a typical opponent at ${TYPICAL}. ${GROUPS.filter(g => revealed[g.key]).map(g => `${g.label}: median ${g.median}`).join(". ")}${stage === "me" ? ". My own rating sits next to the group that says it is bad." : ""}`
      : mode === "crowd" ? "The pace chart's axis goes; its dots become a crowd of other players, some wearing usernames."
        : step >= 7 ? `My pace: 5 seconds per move. Typical peer: 7.7 seconds. Faster than 93% of a separate sample of peers.${yourPace !== null ? ` You, in green: ${yourPace} seconds.` : ""}`
      : step >= 4 ? `10-minute rating is horizontal; 1-minute rating is vertical. ${step >= 5 ? "87% of sampled players are rated lower in 1-minute games." : ""} ${step === 6 ? "My gap is about typical at my level." : ""}`
        : "My rating through 2026, last rating each day: 10-minute games, then 1-minute games from July."
  const fullLabel = you && (step === 5 || step === 6) ? `${label} You, in green: rapid ${you.rapid}, bullet ${you.bullet}, ${gapWords(you)}.` : label
  const chartStyle = { opacity: entry }


  return (
    <figure ref={box} className={c("ch-ratings")} data-mode={mode} data-compact={size.compact && stage ? "true" : undefined} data-still={still} data-rating-step={step}
      data-progress={at.toFixed(3)} data-focus={focus.toFixed(3)}>
      <div className={c("ch-ratingPhone")} aria-hidden={step >= 3} style={{ visibility: entry >= 1 ? "hidden" : "visible" }}>
        <Message collapse={entry} revealed={step >= 1} target={{ x: tx(T.claim), y: top + canvasTop }} />
      </div>
      <figcaption className={c("ch-ratingTitle")} style={chartStyle} aria-hidden={step < 2}>{title}</figcaption>
      <div style={chartStyle}>
        <Chips chips={chips} extra={mode === "names" ? <NameScore guesses={guesses} /> : null} />
      </div>
      <svg ref={canvas} className={c("ch-ratingCanvas")} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={fullLabel} aria-hidden={step < 2}>
        <defs>
          <g id={`${id}-player`}><circle r={w < 400 ? 1.35 : 1.8}
            transform={`scale(${(xMax - xMin) / (right - left)},${(yMax - yMin) / (bottom - top)})`} /></g>
          <clipPath id={`${id}-plot`}><rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} /></clipPath>
          <clipPath id={`${id}-reveal`}><rect x={left} y={top - 10} width={Math.max(0, Math.min(right, tx(revealDate)) - left)} height={bottom - top + 10} /></clipPath>
        </defs>
        <g opacity={timelineOpacity} aria-hidden="true" data-layer="timeline">
          {/* no grid and no rating numbers: the two lines and the gap between them are the point */}
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
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
            return x >= left - 2 && x <= right + 2 && (period > 0.3 || m % 2) ? <text key={m} x={x} y={bottom + 22} textAnchor="middle">{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][m - 1]}{m === 1 ? " 2026" : ""}</text> : null
          })}
          <g opacity={1 - period}>
            {rapid && <text x={right} y={ty(rapid[1]) - 11} textAnchor="end" className={c("ch-ratingPale")}>10-minute</text>}
            {bullet && <text x={right} y={ty(bullet[1]) + 18} textAnchor="end" className={c("ch-ratingClay")}>1-minute</text>}
            <path className={c("ch-ratingGap")} opacity={smooth(at - 2)} d={`M${right - 18} ${ty(T.rapid.at(-1)[1])} h8 V${ty(T.bullet.at(-1)[1])} h-8`} />
          </g>
        </g>
        <g opacity={scatterOpacity} aria-hidden="true" data-layer="scatter">
          {/* the grid and its numbers carry "Two ratings. One player."; once the other players come
              in they go (as on the ratings chart), leaving the diagonal and the axis names */}
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
          <line className={c("ch-ratingGrid")} x1={left} x2={left} y1={top} y2={bottom} />
          <g opacity={1 - smooth((at - 4.55) / 0.4)}>
          {WORLD_TICKS.map(v => {
            const x = sx(v), y = sy(v)
            const xAlpha = v % 1000 === 0 ? 1 : mix(clamp(((right - left) / (xMax - xMin) * 200 - 60) / 30), 1, focus)
            const yAlpha = v % 1000 === 0 ? 1 : mix(clamp(((bottom - top) / (yMax - yMin) * 200 - 40) / 25), 1, focus)
            return <g key={v}>
              {x >= left - 1 && x <= right + 1 && <text opacity={xAlpha} x={x} y={bottom + 22} textAnchor="middle">{v}</text>}
              {y >= top - 1 && y <= bottom + 1 && <g opacity={yAlpha}><line className={c("ch-ratingGrid")} x1={left} x2={right} y1={y} y2={y} /><text x={left - 8} y={y + 4} textAnchor="end">{v}</text></g>}
            </g>
          })}
          </g>
          <text x={left} y={16}>1-minute rating ↑</text><text x={right} y={bottom + 22 + 16} textAnchor="end">10-minute rating →</text>
          <g clipPath={`url(#${id}-plot)`}>
            <g transform={`matrix(${(right - left) / (xMax - xMin)},0,0,${(bottom - top) / (yMax - yMin)},${left - xMin * (right - left) / (xMax - xMin)},${bottom + yMin * (bottom - top) / (yMax - yMin)})`}>
              <line x1={0} y1={0} x2={3000} y2={-3000} className={c("ch-ratingRef")} vectorEffect="non-scaling-stroke" />
              <g opacity={crowdOpacity * others} data-highlight={step === 5 ? "lower" : step >= 6 ? "near" : "none"}><RatingCloud dot={`${id}-player`} /></g>
              <path className={c("ch-ratingTypical")} opacity={focus * others} vectorEffect="non-scaling-stroke" pathLength={1}
                strokeDasharray="1 1" strokeDashoffset={1 - focus} d={path(S.curve.map(q => [q.rapid, -q.bullet]))} />
            </g>
          </g>
          <text opacity={crowdOpacity * (1 - focus) * others} x={sx(1800)} y={sy(1800) - 12} textAnchor="middle">Same in both</text>
          <g opacity={focus * others}>
            <circle cx={sx(S.me[0])} cy={sy(EXPECTED)} r={4} className={c("ch-ratingExpected")} />
            <path className={c("ch-ratingRef")} d={`M${sx(S.me[0])} ${sy(EXPECTED)} h${Math.min(60, w * 0.1)}`} />
            <text x={sx(S.me[0]) + Math.min(60, w * 0.1) + 5} y={sy(EXPECTED) + 4}>Typical at my level</text>
          </g>
          {you ? (() => {
            // The reader, in green, with the crowd. Off the view (zoomed in on
            // my level), the dot waits at the edge with an arrow towards them.
            const x = sx(you.rapid), y = sy(you.bullet)
            const dx = x < left ? -1 : x > right ? 1 : 0, dy = y < top ? -1 : y > bottom ? 1 : 0
            const off = dx || dy
            const cx = Math.max(left + 6, Math.min(right - 6, x)), cy = Math.max(top + 6, Math.min(bottom - 6, y))
            const flip = cx > right - 70
            // "Me" is labelled above to the right: near it, "You" goes below.
            const below = cy < top + 20 || Math.hypot(cx - sx(S.me[0]), cy - sy(S.me[1])) < 48
            return <g className={c("ch-ratingYou")} opacity={crowdOpacity * (yourPace !== null ? 1 - smooth((at - 7) / 0.15) : 1)} data-off={off ? "true" : "false"}>
              <circle cx={cx} cy={cy} r={off ? 4 : 6} data-dot="you" />
              <text x={flip ? cx - 10 : cx + 10} y={cy + (below ? 18 : -10)} textAnchor={flip ? "end" : undefined}>
                {off ? `You ${ARROWS[`${dx},${dy}`]}` : "You"}
              </text>
            </g>
          })() : null}
        </g>
        {/* Both period summaries physically become the two coordinate guides. */}
        <g opacity={guideOpacity} aria-hidden="true" data-layer="guides">
          <line className={c("ch-ratingRapid")} x1={mix(left, sx(S.me[0]), morph)} x2={mix(right, sx(S.me[0]), morph)}
            y1={mix(ty(S.me[0]), bottom, morph)} y2={mix(ty(S.me[0]), top, morph)} />
          <line className={c("ch-ratingBullet")} x1={left} x2={right} y1={mix(ty(S.me[1]), sy(S.me[1]), morph)} y2={mix(ty(S.me[1]), sy(S.me[1]), morph)} />
          <text className={c("ch-ratingPale")} x={mix(left + 8, sx(S.me[0]) + 8, morph)} y={mix(ty(S.me[0]) - 12, bottom - 12, morph)}>10-minute</text>
          <text className={c("ch-ratingClay")} x={left + 8} y={mix(ty(S.me[1]), sy(S.me[1]), morph) - 12}>1-minute</text>
        </g>
        <g opacity={paceOpacity} aria-hidden="true" data-layer="pace-dots" data-highlight={step === 8}>
          <PaceCloud swarm={swarm} targets={targets} />
        </g>
        <g aria-hidden="true" data-layer="pace" className={c("ch-crowdFade")} data-settled={step >= 8 ? "true" : undefined} style={{ opacity: stage ? 0 : paceOpacity }}>
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
          {[0, 5, 10, 15].map(v => <text key={v} x={px(v)} y={bottom + 22} textAnchor="middle">{v}s</text>)}
          <text x={right} y={bottom + 22 + 16} textAnchor="end">Seconds per move →</text>
          <line className={c("ch-ratingRef")} x1={px(pace.peers.median)} x2={px(pace.peers.median)} y1={57} y2={bottom - 8} />
          <text x={px(pace.peers.median) + 8} y={49}>Typical · {pace.peers.median}s</text>
          <line className={c("ch-paceMeLine")} x1={px(pace.me.seconds)} x2={px(pace.me.seconds)} y1={35} y2={bottom - 8} />
          <text className={c("ch-ratingClay")} x={px(pace.me.seconds) - 8} y={27} textAnchor="end">Me · {pace.me.seconds}s</text>
        </g>
        {yourPace !== null && !stage ? (() => {
          // the reader, travelling from their place on the scatter to their pace
          const fromX = Math.max(left + 6, Math.min(right - 6, sx(you?.rapid ?? 0))), fromY = Math.max(top + 6, Math.min(bottom - 6, sy(you?.bullet ?? 0)))
          const toX = Math.max(left + 4, Math.min(right - 4, px(yourPace)))
          const x = mix(fromX, toX, enterPace), y = mix(fromY, paceY, enterPace)
          const flip = toX > right - 90
          return <g className={c("ch-ratingYou")} aria-hidden="true" data-layer="pace-you" style={{ opacity: at < 7 ? 0 : 1 }}>
            <line className={c("ch-paceYouLine")} x1={toX} x2={toX} y1={35} y2={bottom - 8} opacity={paceOpacity} />
            <text x={toX + (flip ? -8 : 8)} y={27} textAnchor={flip ? "end" : undefined} opacity={paceOpacity}>You · {yourPace}s{px(yourPace) > right ? " →" : ""}</text>
            <circle cx={x} cy={y} r={6} data-dot="you" />
          </g>
        })() : null}
        {/* These are the same source players in both charts, never an arbitrary pairing. */}
        <g clipPath={`url(#${id}-plot)`} aria-hidden="true" data-layer="linked-peers"
          opacity={smooth((morph - 0.45) / 0.55) * crowdOpacity}>
          {swarm.points.filter(q => q.scatterIndex !== null).map(q => {
            const [rapid, bullet] = S.points[q.scatterIndex]
            const alpha = step >= 8 ? (q.seconds > pace.me.seconds ? 1 : 0.3)
              : step >= 7 ? 0.85 : step === 6 ? (Math.abs(rapid - S.me[0]) <= 100 ? 0.85 : 0.2)
                : step === 5 ? (bullet < rapid ? 0.9 : 0.18) : 0.65
            const t = targets?.[q.index]
            if (t) return <circle key={q.scatterIndex} data-linked-peer="true" data-scatter-index={q.scatterIndex} data-pace-index={q.index}
              className={c("ch-crowdDot")} data-tone={t.tone} r={t.r ?? swarm.radius} cx={q.x} cy={q.y} style={crowdStyle(t, q.x, q.y, q.index)} />
            const fill = step >= 8 && q.seconds > pace.me.seconds ? "var(--ink)"
              : step === 7 || step === 6 && Math.abs(rapid - S.me[0]) <= 100 || step === 5 && bullet < rapid ? "var(--ink-2)" : "var(--ink-3)"
            return <circle key={q.scatterIndex} data-linked-peer="true" data-scatter-index={q.scatterIndex} data-pace-index={q.index}
              r={mix(w < 400 ? 1.35 : 1.8, swarm.radius, enterPace)} fill={fill} opacity={alpha}
              cx={mix(sx(rapid), q.x, enterPace)} cy={mix(sy(bullet), q.y, enterPace)} className={c("ch-crowdDot")} data-settled={step >= 8 ? "true" : undefined} />
          })}
        </g>
        <CrowdMarks layout={layout} stage={stage} revealed={revealed} guesses={guesses} you={yourResign} yourRating={you?.rapid}
          left={left} right={right} top={top + 22} bottom={crowdBottom} />
        {/* One author marker, retained from the timeline through the pace plot, into the crowd, and next to the names. */}
        <g className={c("ch-ratingMe")} data-author-marker="true" data-settled={step >= 8 ? "true" : undefined}
          style={{ transform: `translate(${meX}px, ${meY}px)`, opacity: meOpacity }} aria-hidden="true">
          <circle r={step < 3 ? 4.5 : 6} data-dot="me" />
          <text x={stage === "me" ? -10 : 10} y={-12} textAnchor={stage === "me" ? "end" : undefined}
            opacity={stage === "crowd" || stage === "me" ? 1 : smooth(morph / 0.6) * (1 - enterPace)}>Me</text>
        </g>
      </svg>
      <NameButtons bands={layout.bands} guesses={guesses} onGuess={onGuess} open={stage === "rows"} top={canvasTop} narrow={narrow} />
      <div className={c("ch-ratingTools")} style={chartStyle} inert={step < 2} aria-hidden={step < 2}>
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
      </div>
    </figure>
  )
}
