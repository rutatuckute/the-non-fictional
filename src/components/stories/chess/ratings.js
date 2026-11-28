"use client"

import * as React from "react"
import { c, PinSteps, stepBox, stepLine } from "./parts"
import { useFollow, useStill } from "./follow"
import data from "./ratings.json"
import pace from "./pace.json"
import paceLevels from "./pace-levels.json"
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
const RatingCloud = React.memo(function RatingCloud({ dot, yours }) {
  return <g className={c("ch-ratingPeers")}>
    {S.points.map(([rapid, bullet], i) => LINKED_SCATTER.has(i) ? null : <use key={i} href={`#${dot}`} x={rapid} y={-bullet}
      data-lower={bullet < rapid} data-near={Math.abs(rapid - S.me[0]) <= 100}
      data-near-you={yours != null && Math.abs(rapid - yours) <= 100 ? "true" : "false"} />)}
  </g>
})

// Deterministic beeswarm: x is the recorded pace, y only prevents collisions.
// Source-linked identities are retained for the players shared by both cohorts.
const packPace = (width, left, right, top, bottom) => {
  const packed = packSeconds(pace.peers.seconds, width, left, right, top, bottom)
  return { ...packed, points: packed.points.map(q => ({ ...q, scatterIndex: pace.peers.scatterIndices[q.index] })) }
}
// The players at the reader's level, for "Your level" on the pace chart
// (pace-levels.json, export_pace_levels.py): within 100 points of their rapid
// rating, widened by 50 at a time until there are at least 40.
export const paceLevelOf = rapid => {
  const { halfWidth, minPlayers } = paceLevels.level
  for (let half = halfWidth; half <= 3000; half += 50) {
    const seconds = paceLevels.seconds.filter((_, i) => Math.abs(paceLevels.rating[i] - rapid) <= half)
    if (seconds.length >= minPlayers || half >= 3000) {
      const sorted = seconds.slice().sort((a, b) => a - b)
      return { seconds, half, from: rapid - half, to: rapid + half, median: sorted[Math.floor(sorted.length / 2)] }
    }
  }
  return null
}
// The pace chart's seconds: 2 to 17 (her level runs 2.9–16.3), a closer view than 0–18.
const PACE_FROM = 2, PACE_TO = 17
const packSeconds = (all, width, left, right, top, bottom) => {
  const radius = width < 400 ? 1.2 : 2.1
  const diameter = radius * 2 + 0.5
  const points = []
  const centre = (top + bottom) / 2
  for (const { seconds, index } of all.map((seconds, index) => ({ seconds, index })).sort((a, b) => a.seconds - b.seconds)) {
    const x = scale(seconds, PACE_FROM, PACE_TO, left, right)
    const neighbours = []
    for (let i = points.length - 1; i >= 0 && x - points[i].x < diameter; i--) neighbours.push(points[i])
    let offset = 0
    for (let k = 0; k < all.length * 2; k++) {
      offset = k === 0 ? 0 : Math.ceil(k / 2) * diameter * (k % 2 ? 1 : -1)
      if (neighbours.every(q => (x - q.x) ** 2 + (centre + offset - q.y) ** 2 >= diameter ** 2 - 0.01)) break
    }
    points.push({ x, y: centre + offset, seconds, index })
  }
  // Compress the packing vertically if needed; x continues to encode exact pace.
  const extent = Math.max(...points.map(q => Math.abs(q.y - centre)), 1)
  const compression = Math.min(1, ((bottom - top) / 2 - radius) / extent)
  return { radius, points: points.map(q => ({ ...q, y: centre + (q.y - centre) * compression })) }
}
// The players at the reader's level, drawn in place of mine while "Your level" is on.
const YourPaceCloud = React.memo(function YourPaceCloud({ swarm, mine }) {
  return <g className={c("ch-paceCloud")}>
    {swarm.points.map(q => <circle key={q.index} cx={q.x} cy={q.y} r={swarm.radius} data-slower={q.seconds > mine} />)}
  </g>
})

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
// A tag may carry a small note under it (the ratings chart: what "normal" and
// "fast" chess are, 28 Nov, owner's mock-up); the note takes no height of its own.
const Chips = ({ chips, extra }) => (
  <div className={c("ch-ratingChips")} aria-hidden="true">
    {chips.map(([tone, text, shown = true, note]) => note ? (
      <span key={tone + text} className={c("ch-ratingChipBox")} data-shown={shown ? "true" : "false"}>
        <span className={c("ch-ratingChip")} data-tone={tone}>{text}</span>
        <span className={c("ch-ratingChipNote")}>{note}</span>
      </span>
    ) : <span key={tone + text} className={c("ch-ratingChip")} data-tone={tone} data-shown={shown ? "true" : "false"}>{text}</span>)}
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
      // (150 for the title, its small line and the legend: 20 of it is the small line)
      if (width) setSize({ width, compact, height: fit(170), tall: compact ? fit(112, 700) : fit(170, 700) })
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
    nodes.forEach((node, index) => { if (node && stepBox(node).getBoundingClientRect().top < line) current = index })
    if (!current) return 0
    if (still) return current + 1
    const node = stepBox(nodes[current])
    const progress = node ? clamp((stepLine(node) - node.getBoundingClientRect().top) / (window.innerHeight * 0.42)) : 1
    return Math.min(8, current + progress)
  // (nothing on the chart changes past 8, when the pace chart is all there: held
  // there, the crowd, the names and the lost games are not drawn again in every
  // frame of scrolling, which on a phone made the page stutter)
  }, value => setAt(Math.min(8, value)), { still, follow: 100, watch: box })
  const focus = useCamera(at < 6 || view === null ? null : view === "all" ? 0 : 1,
    still || keyboard, at < 6 ? 0 : smooth(at - 6))
  // "Your level" (with a Chess.com username): the same zoom, centred on the reader
  const pan = useCamera(at < 6 || view === null ? null : view === "yours" ? 1 : 0, still || keyboard, 0)
  React.useEffect(() => { if (step < 6) setView(null) }, [step])
  React.useEffect(() => { if (!you && view === "yours") setView("mine") }, [you, view])
  const chooseView = (next, event) => { setKeyboard(event.detail === 0); setView(next) }

  const stage = crowdStage(step)
  const w = size.width, h = stage && size.compact ? size.tall ?? size.height : size.height
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
  // my level: rapid 400–1000, bullet 100–850; the reader's: as wide, centred on them
  const yourMiddle = you ? (you.bullet + (you.typical ?? you.bullet)) / 2 : 475
  const yourX = you ? Math.max(0, you.rapid - 300) : 400, yourY = you ? Math.max(0, yourMiddle - 375) : 100
  const xMin = mix(0, mix(400, yourX, pan), focus), xMax = mix(worldMax, mix(1000, yourX + 600, pan), focus)
  const yMin = mix(0, mix(100, yourY, pan), focus), yMax = mix(worldMax, mix(850, yourY + 750, pan), focus)
  const sx = value => scale(value, xMin, xMax, left, right)
  const sy = value => scale(value, yMin, yMax, bottom, top)
  const px = value => scale(value, PACE_FROM, PACE_TO, left, right)
  const timelineOpacity = entry * (1 - smooth(morph / 0.45))
  const scatterOpacity = smooth((morph - 0.45) / 0.55) * (1 - smooth(bridge / 0.5))
  const crowdOpacity = smooth(out / 0.65)
  const paceOpacity = smooth((at - 7.45) / 0.4)
  const medianOpacity = smooth((period - 0.4) / 0.4) * (1 - bridge)
  const guideOpacity = medianOpacity * (1 - smooth(out / 0.7))
  const swarm = React.useMemo(() => packPace(w, left, right, 68, bottom - 12), [w, left, right, bottom])
  // "Your level" on the pace chart: the same chart with the players at the reader's level
  const level = React.useMemo(() => (you ? paceLevelOf(you.rapid) : null), [you?.rapid])
  const yourSwarm = React.useMemo(() => (level ? packSeconds(level.seconds, w, left, right, 68, bottom - 12) : null), [level, w, left, right, bottom])
  const paceStep = step >= 7 && !stage
  const atYours = Boolean(level) && view === "yours" && paceStep
  const typicalPace = atYours ? level.median : pace.peers.median
  const yourShare = level && yourPace !== null ? Math.round((level.seconds.filter(v => v > yourPace).length / level.seconds.length) * 100) : null
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
  else if (stage) { meX = layout.rx(MY_RAPID); meY = top + 20; meOpacity = 0 }

  const mode = stage === "giveup" || stage === "us" ? "giveup" : stage && stage !== "crowd" ? "names" : stage ? "crowd" : step >= 7 ? "pace" : step >= 4 ? "scatter" : "timeline"
  // one title per chart, kept while the chart changes (the crowd has none)
  const title = stage === "us" ? "How our games end" : mode === "giveup" ? "How their games end" : mode === "names" ? "What their names say" : mode === "crowd" ? "\u00a0"
    : mode === "pace" ? "How fast do I actually play" : mode === "scatter" ? "Normal chess vs fast chess" : "My chess ratings"
  // a small line under the title; its place is kept under every title so no chart moves
  const subtitle = mode === "scatter" ? "Comparing ratings across the two time controls" : "\u00a0"
  const youChip = ["you", "You"]
  // the give-up squares: colour says whose, the mark says how it ended (a dot resigned, a ring did not)
  const chips = mode === "giveup" ? [["filled", "Resigned"], ["ring", "Ended otherwise"]]
    : mode === "names" ? []
      : mode === "crowd" ? []
        : mode === "pace" ? [["me", "Me"], ["crowd", atYours ? "Players at your level" : "Players at my level"], ...(yourPace !== null ? [youChip] : [])]
          : step >= 5 ? [["me", "Me"], ["crowd", "Other players"], ...(you ? [youChip] : [])]
            : [["rapid", "Normal chess", true, "Rapid · 10-minute games"], ["bullet", "Fast chess", at >= 2.35, "Bullet · 2-minute games"]]
  const resignWords = key => `${resignedOf(key, yourResign)} in 100`
  const label = mode === "giveup" ? `Of 100 lost rapid games, players whose names say they are bad resigned ${resignWords("bad")}; everyone else ${resignWords("everyone")}.${stage === "us" ? ` Me: ${MY_RESIGN.resigned} of my ${MY_RESIGN.losses} losses.${yourResign ? ` You: ${yourResign.resigned} of your ${yourResign.losses}.` : ""}` : ""}`
    : mode === "names" ? `Rapid ratings by what usernames say, against a typical opponent at ${TYPICAL}. ${GROUPS.filter(g => revealed[g.key]).map(g => `${g.label}: median ${g.median}`).join(". ")}`
      : mode === "crowd" ? "The pace chart's axis goes; its dots become a crowd of other players, some wearing usernames."
        : step >= 7 ? `My pace: 5 seconds per move. Typical peer: 7.7 seconds. Faster than 93% of a separate sample of peers.${yourPace !== null ? ` You, in green: ${yourPace} seconds.` : ""}${atYours ? ` Shown: ${level.seconds.length} players rated ${level.from}–${level.to}, typical ${level.median} seconds${yourShare !== null ? `; you are faster than ${yourShare} in 100 of them` : ""}.` : ""}`
      : step >= 4 ? `Normal chess (10-minute) rating is horizontal; fast chess (2-minute) rating is vertical. ${step >= 5 ? "87% of sampled players are rated lower in fast chess." : ""} ${step === 6 ? "My gap is about typical at my level." : ""}`
        : "My rating through 2026, last rating each day: normal chess (rapid, 10-minute games), then fast chess (bullet, 2-minute games) from July."
  const fullLabel = you && (step === 5 || step === 6) ? `${label} You, in green: rapid ${you.rapid}, bullet ${you.bullet}, ${gapWords(you)}.` : label
  const chartStyle = { opacity: entry }
  // A layer at no opacity is still painted, and on a phone its hundreds of dots
  // were drawn again in every frame of scrolling: hidden, it costs nothing.
  const gone = o => (o <= 0.001 ? "hidden" : undefined)


  return (
    <figure ref={box} className={c("ch-ratings")} data-mode={mode} data-compact={size.compact && stage ? "true" : undefined} data-still={still} data-rating-step={step}
      data-progress={at.toFixed(3)} data-focus={focus.toFixed(3)}>
      <div className={c("ch-ratingPhone")} aria-hidden={step >= 3} style={{ visibility: entry >= 1 ? "hidden" : "visible" }}>
        <Message collapse={entry} revealed={step >= 1} target={{ x: tx(T.claim), y: top + canvasTop }} />
      </div>
      <figcaption className={c("ch-ratingTitle")} style={chartStyle} aria-hidden={step < 2}>{title}<span className={c("ch-ratingSub")}>{subtitle}</span></figcaption>
      {/* the legend, and at its right the view switch (where a chart has one), close to the chart */}
      <div className={c("ch-ratingHeadRow")} style={chartStyle} inert={step < 2} aria-hidden={step < 2}>
        <Chips chips={chips} extra={mode === "names" ? <NameScore guesses={guesses} /> : null} />
        <div className={c("ch-ratingExplore")} inert={!(step === 6 || (paceStep && level))} aria-hidden={!(step === 6 || (paceStep && level))} data-visible={step === 6 || Boolean(paceStep && level)}>
          <div role="group" aria-label={paceStep ? "Pace chart view" : "Rating chart view"} className={c("ch-ratingViews")}>
            <button type="button" aria-pressed={view !== "all" && view !== "yours"} onClick={e => chooseView("mine", e)}>My level</button>
            {you ? <button type="button" className={c("ch-ratingYourView")} aria-pressed={view === "yours"} onClick={e => chooseView("yours", e)}>Your level</button> : null}
            {paceStep ? null : <button type="button" aria-pressed={view === "all"} onClick={e => chooseView("all", e)}>All players</button>}
          </div>
        </div>
      </div>
      <svg ref={canvas} className={c("ch-ratingCanvas")} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={fullLabel} aria-hidden={step < 2}>
        <defs>
          <g id={`${id}-player`}><circle r={w < 400 ? 1.35 : 1.8}
            transform={`scale(${(xMax - xMin) / (right - left)},${(yMax - yMin) / (bottom - top)})`} /></g>
          <clipPath id={`${id}-plot`}><rect x={left} y={top - 10} width={right - left} height={bottom - top + 10} /></clipPath>
          <clipPath id={`${id}-reveal`}><rect x={left} y={top - 10} width={Math.max(0, Math.min(right, tx(revealDate)) - left)} height={bottom - top + 10} /></clipPath>
        </defs>
        <g opacity={timelineOpacity} visibility={gone(timelineOpacity)} aria-hidden="true" data-layer="timeline">
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
            {rapid && <text x={right} y={ty(rapid[1]) - 11} textAnchor="end" className={c("ch-ratingPale")}>Normal chess</text>}
            {bullet && <text x={right} y={ty(bullet[1]) + 18} textAnchor="end" className={c("ch-ratingClay")}>Fast chess</text>}
            <path className={c("ch-ratingGap")} opacity={smooth(at - 2)} d={`M${right - 18} ${ty(T.rapid.at(-1)[1])} h8 V${ty(T.bullet.at(-1)[1])} h-8`} />
          </g>
        </g>
        <g opacity={scatterOpacity} visibility={gone(scatterOpacity)} aria-hidden="true" data-layer="scatter">
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
              {y >= top - 1 && y <= bottom + 1 && <text opacity={yAlpha} x={left - 8} y={y + 4} textAnchor="end">{v}</text>}
            </g>
          })}
          </g>
          <text x={left} y={16}>Fast chess rating ↑</text><text x={right} y={bottom + 22 + 16} textAnchor="end">Normal chess rating →</text>
          <g clipPath={`url(#${id}-plot)`}>
            <g transform={`matrix(${(right - left) / (xMax - xMin)},0,0,${(bottom - top) / (yMax - yMin)},${left - xMin * (right - left) / (xMax - xMin)},${bottom + yMin * (bottom - top) / (yMax - yMin)})`}>
              <line x1={0} y1={0} x2={3000} y2={-3000} className={c("ch-ratingRef")} vectorEffect="non-scaling-stroke" />
              <g opacity={crowdOpacity * others} visibility={gone(crowdOpacity * others)} data-highlight={step === 5 ? "lower" : step >= 6 ? (view === "yours" ? "yours" : "near") : "none"}><RatingCloud dot={`${id}-player`} yours={you?.rapid} /></g>
              <path className={c("ch-ratingTypical")} opacity={focus * others} vectorEffect="non-scaling-stroke" pathLength={1}
                strokeDasharray="1 1" strokeDashoffset={1 - focus} d={path(S.curve.map(q => [q.rapid, -q.bullet]))} />
            </g>
          </g>
          {/* along the diagonal, just above it (28 Nov, owner) */}
          <text opacity={sx(1800) > right - 30 || sy(1800) < top + 10 ? 0 : crowdOpacity * (1 - focus) * others} x={sx(1800)} y={sy(1800) - 8} textAnchor="middle"
            transform={`rotate(${(Math.atan2(sy(1900) - sy(1700), sx(1900) - sx(1700)) * 180 / Math.PI).toFixed(2)} ${sx(1800).toFixed(1)} ${sy(1800).toFixed(1)})`}>Same in both</text>
          {you?.typical != null ? (
            <g className={c("ch-ratingYou")} opacity={focus * pan * others}>
              <circle cx={sx(you.rapid)} cy={sy(you.typical)} r={4} className={c("ch-ratingExpected")} />
              <path className={c("ch-ratingRef")} d={`M${sx(you.rapid)} ${sy(you.typical)} h${Math.min(60, w * 0.1)}`} />
              {/* (under its line when the reader's own dot sits on it, so "You" stays clear) */}
              <text x={sx(you.rapid) + Math.min(60, w * 0.1) + 5} y={sy(you.typical) + (Math.abs(sy(you.bullet) - sy(you.typical)) < 24 ? 18 : 4)}>Typical at your level</text>
            </g>
          ) : null}
          <g opacity={focus * (1 - pan) * others}>
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
        <g opacity={guideOpacity} visibility={gone(guideOpacity)} aria-hidden="true" data-layer="guides">
          <line className={c("ch-ratingRapid")} x1={mix(left, sx(S.me[0]), morph)} x2={mix(right, sx(S.me[0]), morph)}
            y1={mix(ty(S.me[0]), bottom, morph)} y2={mix(ty(S.me[0]), top, morph)} />
          <line className={c("ch-ratingBullet")} x1={left} x2={right} y1={mix(ty(S.me[1]), sy(S.me[1]), morph)} y2={mix(ty(S.me[1]), sy(S.me[1]), morph)} />
          <text className={c("ch-ratingPale")} x={mix(left + 8, sx(S.me[0]) + 8, morph)} y={mix(ty(S.me[0]) - 12, bottom - 12, morph)}>Normal chess</text>
          <text className={c("ch-ratingClay")} x={left + 8} y={mix(ty(S.me[1]), sy(S.me[1]), morph) - 12}>Fast chess</text>
        </g>
        <g opacity={paceOpacity} visibility={gone(paceOpacity)} aria-hidden="true" data-layer="pace-dots" data-highlight={step === 8}>
          <g className={c("ch-paceSwap")} data-off={atYours ? "true" : undefined}><PaceCloud swarm={swarm} targets={targets} /></g>
          {yourSwarm ? <g className={c("ch-paceSwap")} data-off={atYours ? undefined : "true"} data-layer="pace-yours"><YourPaceCloud swarm={yourSwarm} mine={pace.me.seconds} /></g> : null}
        </g>
        <g aria-hidden="true" data-layer="pace" className={c("ch-crowdFade")} data-settled={step >= 8 ? "true" : undefined} style={{ opacity: stage ? 0 : paceOpacity }}>
          <line className={c("ch-ratingGrid")} x1={left} x2={right} y1={bottom} y2={bottom} />
          {[5, 10, 15].map(v => <text key={v} x={px(v)} y={bottom + 22} textAnchor="middle">{v}s</text>)}
          <text x={right} y={bottom + 22 + 16} textAnchor="end">Seconds per move →</text>
          <g className={c("ch-paceTypical")} style={{ transform: `translateX(${px(typicalPace).toFixed(1)}px)` }}>
            <line className={c("ch-ratingRef")} x1={0} x2={0} y1={57} y2={bottom - 8} />
            <text x={8} y={49}>{atYours ? "Typical at your level" : "Typical"} · {typicalPace}s</text>
          </g>
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
            {(() => {
              // with "Your level" the label carries the result; it is pulled left to stay on the chart
              // (shorter on a phone), and never further left than its own line
              const words = `You · ${yourPace}s${atYours && yourShare !== null ? ` · faster than ${yourShare} in 100${narrow ? "" : " at your level"}` : ""}${px(yourPace) > right ? " →" : ""}`
              const long = atYours && yourShare !== null
              const width = words.length * (w < 400 ? 6.1 : 6.9)
              const x = long ? Math.max(toX - width + 8, Math.min(toX + 8, right - width)) : toX + (flip ? -8 : 8)
              return <text x={x} y={27} textAnchor={!long && flip ? "end" : undefined} opacity={paceOpacity}>{words}</text>
            })()}
            <circle cx={x} cy={y} r={6} data-dot="you" />
          </g>
        })() : null}
        {/* These are the same source players in both charts, never an arbitrary pairing. */}
        <g className={c("ch-paceSwap")} data-off={atYours ? "true" : undefined}>
        <g clipPath={`url(#${id}-plot)`} aria-hidden="true" data-layer="linked-peers"
          opacity={smooth((morph - 0.45) / 0.55) * crowdOpacity} visibility={gone(smooth((morph - 0.45) / 0.55) * crowdOpacity)}>
          {swarm.points.filter(q => q.scatterIndex !== null).map(q => {
            const [rapid, bullet] = S.points[q.scatterIndex]
            const alpha = step >= 8 ? (q.seconds > pace.me.seconds ? 1 : 0.3)
              : step >= 7 ? 0.85 : step === 6 ? (Math.abs(rapid - S.me[0]) <= 100 ? 0.85 : 0.2)
                : step === 5 ? (bullet < rapid ? 0.9 : 0.18) : 0.65
            const t = targets?.[q.index]
            if (t) return <circle key={q.scatterIndex} data-linked-peer="true" data-scatter-index={q.scatterIndex} data-pace-index={q.index}
              className={c("ch-crowdDot")} data-tone={t.tone} r={t.r ?? swarm.radius} cx={q.x} cy={q.y} style={crowdStyle(t, q.x, q.y, q.index)} />
            // the same players as the rest of the cloud, so the same slate; their opacity says which are lit
            const fill = "var(--them)"
            return <circle key={q.scatterIndex} data-linked-peer="true" data-scatter-index={q.scatterIndex} data-pace-index={q.index}
              r={mix(w < 400 ? 1.35 : 1.8, swarm.radius, enterPace)} fill={fill} opacity={alpha}
              cx={mix(sx(rapid), q.x, enterPace)} cy={mix(sy(bullet), q.y, enterPace)} className={c("ch-crowdDot")} data-settled={step >= 8 ? "true" : undefined} />
          })}
        </g>
        </g>
        <CrowdMarks layout={layout} stage={stage} revealed={revealed} guesses={guesses} you={yourResign}
          left={left} right={right} top={top + 22} bottom={crowdBottom} />
        {/* One author marker, retained from the timeline through the pace plot, into the crowd, and next to the names. */}
        <g className={c("ch-ratingMe")} data-author-marker="true" data-settled={step >= 8 ? "true" : undefined}
          style={{ transform: `translate(${meX}px, ${meY}px)`, opacity: meOpacity }} aria-hidden="true">
          <circle r={step < 3 ? 4.5 : 6} data-dot="me" />
          <text x={10} y={-12} opacity={stage === "crowd" ? 1 : smooth(morph / 0.6) * (1 - enterPace)}>Me</text>
        </g>
        {/* The reader's marker, as mine: on their pace, then it slides into the crowd of
            usernames beside me, so their green dot (travellers.js) never loses it on the way */}
        {you ? (() => {
          const atCrowd = stage === "crowd"
          const pacing = yourPace !== null && !stage && step >= 8
          const on = atCrowd || pacing
          const x = atCrowd ? (left + right) / 2 + 58 : Math.max(left + 4, Math.min(right - 4, px(yourPace ?? 0)))
          const y = atCrowd ? (top + bottom) / 2 + 46 : paceY
          return (
            <g className={c("ch-ratingYou", "ch-crowdYouMark")} data-on={on ? "true" : "false"} style={{ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` }} aria-hidden="true">
              <circle r={6} data-dot={on ? "you" : undefined} />
              <text x={10} y={18} opacity={atCrowd ? 1 : 0}>You</text>
            </g>
          )
        })() : null}
      </svg>
      <NameButtons bands={layout.bands} guesses={guesses} onGuess={onGuess} open={stage === "rows"} top={canvasTop} narrow={narrow} />
    </figure>
  )
}
