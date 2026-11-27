"use client"

import * as React from "react"

import { c, Pinned, Show, Text, useNarrow } from "./parts"
import { useTell } from "./reader"
import { useYourDials, YourDials } from "./you"
import data from "./choose.json"

// Part III, third question: what our choices reveal. The professor saw a few
// moves of a game she played against her nature, the London System, and still
// said "aggressiveness is in your nature". Can you hide who you are at the board?
//
// One stage, four views, each passing into the next:
//   the dials    four strips, the 1,635 players rated 600-900 and her (clay);
//                then all four with the middle half of players shaded
//   the split    one player's 60 games: 30 known make their card, 30 hidden
//   the game     ten cards, the mystery games laid over each (a ring per dial,
//                a line for the gap); from 1, 10, then 30 games; the reader
//                picks, the computer takes the smallest gaps; then random
//                lineups to play; later, her among nine others
//   the curve    how often the computer finds the right player, by games seen:
//                a blind pick, a typical player, her, her in the London months
//
// A reader found on Chess.com (you.js) can put their own games in, at the
// first step: then they are on the strips in green (with what is typical at
// their level), get a "find you" lineup, and their own line on the curve
// (dials.js works it all out in their browser, with the story's rules).
//
// One unit everywhere: each dial as a z-score against the players of the
// recognition test (choose.json, from export_choose.py in the data-stories
// repository), so a horizontal distance on any line is the distance the
// computer measures. Colours as in the rest of Part III: clay is the author,
// grey the other players, green the reader (their picks), ivory the mystery.

const DIALS = [
  { name: "Contact", short: "contact", what: "checks, captures, threats", lo: "builder", hi: "attacker" },
  { name: "Pace", short: "pace", what: "moves in under 2 seconds", lo: "deep thinker", hi: "blitz thinker" },
  { name: "Persistence", short: "persist.", what: "lost games played to the end", lo: "gives up", hi: "keeps going" },
  { name: "Habit", short: "habit", what: "the same first three moves", lo: "explorer", hi: "creature of habit" },
]
const Z = 3 // the strips' reach, in spreads either side of the average
const CZ = 2.5 // the cards' reach
const LETTERS = "ABCDEFGHIJ"
const clamp = (v, m) => Math.max(-m, Math.min(m, v))
const games = n => `${n} game${n === 1 ? "" : "s"}`

// ── the players at her level, placed once: a cloud on each line, wider where they are many
const PLAYERS = data.strips
let seed = 1
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const JITTER = PLAYERS.map(() => [0, 0, 0, 0])
for (let k = 0; k < 4; k++) {
  const bins = new Array(61).fill(0)
  const bin = z => Math.round(((clamp(z, Z) + Z) / (2 * Z)) * 60)
  PLAYERS.forEach(p => p[k] != null && bins[bin(p[k])]++)
  const most = Math.max(...bins)
  PLAYERS.forEach((p, i) => {
    if (p[k] != null) JITTER[i][k] = (rand() * 2 - 1) * Math.sqrt(bins[bin(p[k])] / most)
  })
}
// habit takes few values (k in 30 games): spread within one step, for the eye only
const HABITS = [...new Set(PLAYERS.map(p => p[3]).filter(v => v != null))].sort((a, b) => a - b)
const HSTEP = Math.min(...HABITS.slice(1).map((v, i) => v - HABITS[i]).filter(d => d > 1e-6))
const SIDEWAYS = PLAYERS.map(() => (rand() - 0.5) * HSTEP * 0.9)
const shown = (p, i, k) => (k === 3 ? p[k] + SIDEWAYS[i] : p[k])
// the middle half of players, per dial
const quantile = (k, q) => {
  const v = PLAYERS.map(p => p[k]).filter(x => x != null).sort((a, b) => a - b)
  return v[Math.floor(q * (v.length - 1))]
}
const MIDDLE = DIALS.map((_, k) => [quantile(k, 0.25), quantile(k, 0.75)])

// The size of a box, kept up to date.
const useBox = () => {
  const ref = React.useRef(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setBox({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) }))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, box]
}
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

// ── the dials: four strips. Where they lie, for the strips and for the
// picture that folds them into a card (Journey).
const stripsAt = (w, h, narrow, you) => {
  const top = narrow ? 44 : 64
  // the reader's labels hang below each line, under the ends' names
  const bottom = you ? (narrow ? 50 : 64) : narrow ? 34 : 44
  const gap = (h - top - bottom) / 3
  return {
    amp: Math.max(6, Math.min(gap * 0.2, narrow ? 15 : 28)),
    ys: [0, 1, 2, 3].map(k => top + gap * k),
    x: z => 4 + ((clamp(z, Z) + Z) / (2 * Z)) * (w - 8),
  }
}
const Strips = ({ on, middle, narrow, you }) => {
  const [ref, { w, h }] = useBox()
  const canvas = React.useRef(null)
  const now = React.useRef([0, 0, 0, 0])
  const { amp, ys, x } = React.useMemo(() => stripsAt(w, h, narrow, you), [w, h, narrow, you])
  const lit = on.map(Number).join("")

  // the clouds fade in and out on the canvas, one line at a time
  React.useEffect(() => {
    const node = canvas.current
    if (!node || !w || !h) return
    const ratio = window.devicePixelRatio || 1
    node.width = w * ratio
    node.height = h * ratio
    const ctx = node.getContext("2d")
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    const ink = getComputedStyle(node).color
    const target = on.map(v => (v ? (middle ? 0.5 : 1) : 0))
    const from = [...now.current]
    const start = performance.now()
    const length = reduced() ? 1 : 700
    let frame = 0
    const paint = () => {
      const t = Math.min(1, (performance.now() - start) / length)
      const e = 1 - Math.pow(1 - t, 3)
      now.current = from.map((v, k) => v + (target[k] - v) * e)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = ink
      for (let k = 0; k < 4; k++) {
        const a = now.current[k]
        if (a < 0.01) continue
        ctx.globalAlpha = 0.5 * a
        PLAYERS.forEach((p, i) => {
          if (p[k] == null) return
          ctx.beginPath()
          ctx.arc(x(shown(p, i, k)), ys[k] + JITTER[i][k] * amp, narrow ? 1.3 : 1.7, 0, 6.2832)
          ctx.fill()
        })
      }
      ctx.globalAlpha = 1
      if (t < 1) frame = requestAnimationFrame(paint)
    }
    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [lit, middle, w, h, x, amp, narrow]) // `on` is read through `lit`, its value

  const her = data.her
  return (
    <div ref={ref} className={c("ch-rvStrips")}>
      <canvas ref={canvas} className={c("ch-rvCloud")} style={{ width: w, height: h }} aria-hidden="true" />
      {w ? (
        <svg width={w} height={h} role="img" aria-label={`Four dials, players rated 600 to 900. Me: contact above ${her.above[0]} in 100, pace ${her.above[1]}, persistence ${her.above[2]}, habit ${her.above[3]}.${you ? ` You, at your level: ${DIALS.map((d, k) => `${d.short} ${you.above[k] ?? "unknown"}`).join(", ")}.` : ""}`}>
          {DIALS.map((d, k) => {
            const at = x(her.z[k])
            const left = at > w * 0.62
            const yz = you && Number.isFinite(you.z[k]) ? you.z[k] : null
            const yat = yz == null ? 0 : x(yz)
            return (
              <g key={d.name} className={c("ch-rvLine")} data-on={on[k] ? "true" : "false"}>
                <rect className={c("ch-rvMiddle")} data-on={middle ? "true" : "false"} x={x(MIDDLE[k][0])} width={x(MIDDLE[k][1]) - x(MIDDLE[k][0])} y={ys[k] - amp - 4} height={2 * amp + 8} rx="4" />
                <line className={c("ch-rvAxis")} x1="0" x2={w} y1={ys[k]} y2={ys[k]} />
                <text className={c("ch-rvName")} x="0" y={ys[k] - amp - (narrow ? 16 : 22)}>
                  {d.name}
                  {narrow ? null : <tspan className={c("ch-rvWhat")} dx="10">{d.what}</tspan>}
                </text>
                <text className={c("ch-rvEnd")} x="0" y={ys[k] + amp + 17}>← {d.lo}</text>
                <text className={c("ch-rvEnd")} x={w} y={ys[k] + amp + 17} textAnchor="end">{d.hi} →</text>
                {you ? (
                  <g className={c("ch-rvYou")} data-on={on[k] ? "true" : "false"}>
                    {Number.isFinite(you.median[k]) ? <line className={c("ch-rvYouTick")} x1={x(you.median[k])} x2={x(you.median[k])} y1={ys[k] - 9} y2={ys[k] + 9} /> : null}
                    {yz != null ? (
                      <>
                        <line x1={yat} x2={yat} y1={ys[k] + 7} y2={ys[k] + amp + 19} />
                        <circle cx={yat} cy={ys[k]} r={narrow ? 5 : 6} data-dot="you" />
                        <text x={yat} y={ys[k] + amp + 31} textAnchor={yat > w * 0.62 ? "end" : "start"}>
                          {narrow ? `you · ${you.above[k]}` : `you · above ${you.above[k]} in 100 at your level`}
                        </text>
                      </>
                    ) : null}
                  </g>
                ) : null}
                <g className={c("ch-rvHer")} data-on={on[k] ? "true" : "false"}>
                  <line x1={at} x2={at} y1={ys[k] - 7} y2={ys[k] - amp - 2} />
                  <circle cx={at} cy={ys[k]} r={narrow ? 5 : 6} data-dot="me" />
                  <text x={at} y={ys[k] - amp - 6} textAnchor={left ? "end" : "start"}>
                    {narrow ? `me · ${her.above[k]}` : `me · above ${her.above[k]} in 100`}
                  </text>
                </g>
              </g>
            )
          })}
        </svg>
      ) : null}
    </div>
  )
}

// ── a player's card: four short lines, their dial on each; the mystery games
// as a ring per dial and the gap between them as a line
const AY = [18, 40, 62, 84]
export const Card = ({ z, mystery, tone = "other", big = false }) => {
  const W = big ? 132 : 100
  const x0 = big ? 38 : 8
  const x1 = W - 8
  const x = v => x0 + ((clamp(v, CZ) + CZ) / (2 * CZ)) * (x1 - x0)
  return (
    <svg className={c("ch-rvCardSvg")} viewBox={`0 0 ${W} 96`} data-tone={tone} aria-hidden="true">
      {AY.map((y, k) => {
        const m = mystery ? mystery[k] : null
        const p = z ? z[k] : null
        return (
          <g key={k}>
            <line className={c("ch-rvCardAxis")} x1={x0} x2={x1} y1={y} y2={y} />
            <line className={c("ch-rvCardAxis")} x1={(x0 + x1) / 2} x2={(x0 + x1) / 2} y1={y - 3} y2={y + 3} />
            {big ? <text className={c("ch-rvCardLabel")} x="3" y={y + 2.5}>{DIALS[k].short}</text> : null}
            {p != null && m != null ? <line className={c("ch-rvGap")} x1={x(p)} x2={x(m)} y1={y} y2={y} /> : null}
            {p != null ? <circle className={c("ch-rvDot")} cx={x(p)} cy={y} r="3" /> : null}
            {mystery && m != null ? <circle className={c("ch-rvRing")} cx={x(m)} cy={y} r={z ? 3.6 : 4.2} /> : null}
            {mystery && m == null ? <text className={c("ch-rvUnknown")} x={x1} y={y - 3} textAnchor="end">?</text> : null}
          </g>
        )
      })}
    </svg>
  )
}

// ── The middle of the section as one picture that moves, from the strips to
// the lineup, so the reader sees what each thing is made of:
//   "card"    one player's four dots leave the strips and fold into a card,
//             their sixty games beside it
//   "split"   thirty known games go into the card; thirty stay hidden
//   "lineup"  the card takes its place among ten; a few hidden games become
//             the mystery card
// Then it hands over to the lineup (Lineup), which draws the same card in the
// same place. The player is one the reader never plays (the last lineup): in
// the rounds, a card seen here could be told by its shape alone.
const EXAMPLE_AT = data.lineups.length - 1
const EXAMPLE = data.lineups[EXAMPLE_AT]
const EXAMPLE_Z = EXAMPLE.rounds[2].cards[EXAMPLE.truth]
const DRAWN = 5 // hidden games seen going into the mystery card (the picture's few)
const cardX = z => 8 + ((clamp(z, CZ) + CZ) / (2 * CZ)) * 84 // on a card (100 x 96)

// The card and the sixty games, side by side, in the stage's pixels.
const splitAt = (w, h, narrow) => {
  const S = Math.min(narrow ? 1.2 : 1.7, (w * 0.34) / 100) // card pixels per card unit
  const gap = narrow ? 22 : 64
  const room = w - 100 * S - gap - (narrow ? 0 : 24)
  const s = Math.min(narrow ? 13 : 20, room / 12.7)
  const step = s * 1.3
  const gridW = 10 * step - s * 0.3
  const mid = h * 0.44
  const left = (w - (100 * S + gap + gridW)) / 2
  const gx = left + 100 * S + gap
  const block = rows => rows * step - s * 0.3
  return {
    S,
    s,
    card: { x: left, y: mid - 48 * S },
    centre: [left + 50 * S, mid],
    gx,
    top: rows => mid - block(rows) / 2,
    at: (i, rows) => [gx + (i % 10) * step, mid - block(rows) / 2 + Math.floor(i / 10) * step],
  }
}

const Journey = ({ stage, from, narrow, you, spots }) => {
  const [ref, { w, h }] = useBox()
  return (
    <div ref={ref} className={c("ch-rvJourney")} data-stage={stage} data-from={from} aria-hidden="true">
      {w && h ? <JourneyDrawn stage={stage} w={w} h={h} narrow={narrow} you={you} spots={spots} /> : null}
    </div>
  )
}
const JourneyDrawn = ({ stage, w, h, narrow, you, spots }) => {
  const st = stripsAt(w, h, narrow, you)
  const sp = splitAt(w, h, narrow)
  const { S, card } = sp
  const folded = stage !== "strips"
  const known = stage === "split" || stage === "lineup" || stage === "game"
  const drawn = stage === "lineup" || stage === "game"
  // the card: at its place beside the games, or in the lineup's slot
  const slot = drawn && spots ? spots.slot : null
  const trip = slot ? `translate(${slot.x}px, ${slot.y}px) scale(${slot.w / 100})` : `translate(${card.x}px, ${card.y}px) scale(${S})`
  // on the strips, a card row is that strip: x stretched, moved to its line (in card units)
  const A = ((2 * CZ) / 84) * ((w - 8) / (2 * Z)) / S
  const B = (4 + (((-8 * 2 * CZ) / 84 - CZ + Z) / (2 * Z)) * (w - 8) - card.x) / S
  const label = (text, x, y, at, end) => (
    <text className={c("ch-rvJLabel")} data-in={at} x={x} y={y} textAnchor={end ? "end" : "start"}>
      {text}
    </text>
  )
  return (
    <svg width={w} height={h}>
      {label(narrow ? "one player" : "one player’s four dials", card.x, card.y - 12, "card")}
      {label(narrow ? "their 60 games" : "their 60 ten-minute games", sp.gx, sp.top(6) - 12, "card")}
      {label(narrow ? "30 known → card" : "their card: 30 known games", card.x, card.y - 12, "split")}
      {label(narrow ? "30 hidden" : "30 hidden: the mystery games", sp.gx, sp.top(3) - 12, "split")}
      {Array.from({ length: 60 }, (_, i) => {
        const hidden = i >= 30
        const j = hidden ? i - 30 : i
        let [x, y] = sp.at(i, 6)
        let k = 1
        let gone = false
        if (known && !hidden) {
          ;[x, y] = [sp.centre[0] - sp.s / 2, sp.centre[1] - sp.s / 2]
          k = 0.15
          gone = true
        } else if (known) [x, y] = sp.at(j, 3)
        const into = drawn && hidden && j < DRAWN && spots
        if (into) [x, y, k] = [spots.mys[0] - sp.s / 2, spots.mys[1] - sp.s / 2, 0.3]
        if (drawn && hidden) gone = true
        return (
          <rect
            key={i}
            className={c("ch-rvJGame")}
            data-hidden={known && hidden ? "true" : "false"}
            data-gone={gone ? "true" : "false"}
            data-drawn={into ? "true" : "false"}
            width={sp.s}
            height={sp.s}
            rx="2"
            style={{ transform: `translate(${x}px, ${y}px) scale(${k})`, "--d": `${j * 14}ms` }}
          />
        )
      })}
      <g className={c("ch-rvTrip")} style={{ transform: trip }}>
        <g className={c("ch-rvTripFrame")}>
          <rect width="100" height="96" rx={10 / S} />
          {AY.map(y => (
            <line key={y} x1="50" x2="50" y1={y - 3} y2={y + 3} />
          ))}
        </g>
        {AY.map((y, k) => (
          <line
            key={k}
            className={c("ch-rvTripRow")}
            x1="8"
            x2="92"
            y1={y}
            y2={y}
            style={{
              transform: folded ? "translate(0px, 0px) scale(1, 1)" : `translate(${B}px, ${(st.ys[k] - card.y) / S - y}px) scale(${A}, 1)`,
              strokeWidth: folded ? 0.8 : 1 / S,
            }}
          />
        ))}
        {EXAMPLE_Z.map((z, k) =>
          z == null ? null : (
            <circle
              key={k}
              className={c("ch-rvTripDot")}
              r="3"
              style={{ transform: folded ? `translate(${cardX(z)}px, ${AY[k]}px)` : `translate(${(st.x(z) - card.x) / S}px, ${(st.ys[k] - card.y) / S}px)` }}
            />
          ),
        )}
      </g>
    </svg>
  )
}

// ── the game
const roundOf = (game, view, find) => {
  if (view.mode === "findme") {
    const f = data.findme
    return { key: "findme", deal: "findme", n: f.n, cards: f.cards, mystery: f.mystery, pick: f.pick, truth: f.truth, who: "her" }
  }
  if (view.mode === "findyou") return { key: "findyou", deal: "findyou", n: find.n, cards: find.cards, mystery: find.mystery, pick: find.pick, truth: find.truth, who: "you" }
  // the explainer shows the example player's lineup (Journey); the rounds, lineup 0
  const lineup = view.mode === "play" ? game.lineup : view.mode === "intro" ? EXAMPLE_AT : 0
  const round = view.mode === "play" ? game.round : view.mode === "intro" ? 2 : view.round
  const L = data.lineups[lineup]
  const r = L.rounds[round]
  return { key: `${lineup}:${round}`, deal: String(lineup), n: r.n, cards: r.cards, mystery: view.mode === "intro" ? null : r.mystery, pick: r.pick, truth: L.truth, rating: L.rating, who: "other" }
}

// who the right card is: a stranger, her, or the reader
const WHO = {
  other: { found: "You found them. ", cpu: ["The computer got it.", "The computer missed."], truth: ["this one", "truth"], mine: "you" },
  her: { found: "You found me. ", cpu: ["The computer got it.", "The computer missed."], truth: ["me", "her"], mine: "you" },
  you: { found: "You found yourself. ", cpu: ["The computer found you.", "The computer missed you, this time."], truth: ["you", "you"], mine: "your pick" },
}
// `wait`: the example's card is still on its way (Journey), so its slot stays empty.
const Lineup = ({ view, game, setGame, find, wait = false }) => {
  const g = roundOf(game, view, find)
  const who = WHO[g.who]
  const intro = view.mode === "intro"
  const mine = game.picks[g.key]
  const open = !intro && (game.shown[g.key] || mine != null)
  const pick = i => setGame(all => (all.picks[g.key] != null ? all : { ...all, picks: { ...all.picks, [g.key]: i } }))
  const show = () => setGame(all => ({ ...all, shown: { ...all.shown, [g.key]: true } }))
  const said = !open
    ? ""
    : `${mine == null ? "" : mine === g.truth ? who.found : "Not that one. "}${who.cpu[g.pick === g.truth ? 0 : 1]}`
  const score = view.mode === "play" ? tally(game, true) : null
  return (
    <div className={c("ch-rvLineup")}>
      <div className={c("ch-rvMys")}>
        <div className={c("ch-rvCard", "ch-rvMysCard")} data-empty={intro ? "true" : "false"} data-mystery="">
          {intro ? <span>?</span> : <Card mystery={g.mystery} big />}
        </div>
        <p className={c("ch-rvMysWords")}>
          {intro ? (
            <>
              <b>The mystery games,</b> drawn from one of these ten players’ hidden games.
              <small>Ten players rated about {g.rating.toLocaleString("en-GB")}. A blind pick is right 1 time in 10.</small>
            </>
          ) : (
            <>
              <b>{g.who === "her" ? `Me, from ${games(g.n)}.` : g.who === "you" ? `You, from ${games(g.n)}.` : `The mystery player, from ${games(g.n)}.`}</b>{" "}
              {g.who === "her" ? "Which card is me?" : g.who === "you" ? "Which card is yours?" : "Which card?"}
              <small>Rings: the mystery games, on every card. Lines: the gaps.{g.mystery.some(v => v == null) ? " “?”: can’t be told yet." : ""}</small>
            </>
          )}
        </p>
      </div>
      <div className={c("ch-rvBar")}>
        <p className={c("ch-rvVerdict")} role="status" aria-live="polite">
          {said}
          {score && score.n ? <small> So far: you {score.you} of {score.n}, the computer {score.cpu} of {score.n}.</small> : null}
        </p>
        {view.mode === "play" ? (
          <div className={c("ch-rvPlay")}>
            <div className={c("ch-rvSeg")} role="group" aria-label="Games seen">
              {data.lineups[game.lineup].rounds.map((r, i) => (
                <button key={r.n} type="button" aria-pressed={game.round === i} onClick={() => setGame(all => ({ ...all, round: i }))}>
                  {games(r.n)}
                </button>
              ))}
            </div>
            <button type="button" className={c("ch-ask")} onClick={() => setGame(all => ({ ...all, lineup: all.lineup >= data.lineups.length - 2 ? 1 : all.lineup + 1, round: 0 }))}>
              <i aria-hidden="true" />
              Another player
            </button>
          </div>
        ) : null}
        {!open && !intro ? (
          <button type="button" className={c("ch-rvShow")} onClick={show}>
            Show me
          </button>
        ) : null}
      </div>
      {/* a new lineup is dealt: the cards come in one after another */}
      <ol key={g.deal} className={c("ch-rvGrid")}>
        {g.cards.map((z, i) => {
          const truth = open && i === g.truth
          const flags = open
            ? [truth ? who.truth : null, mine === i ? [who.mine, "you"] : null, i === g.pick ? ["computer", "cpu"] : null].filter(Boolean)
            : []
          const role = flags.map(([t]) => t).join(", ")
          return (
            <li key={i} style={{ "--i": i }}>
              <button
                type="button"
                className={c("ch-rvCard")}
                disabled={intro || open}
                onClick={() => pick(i)}
                data-truth={truth ? (g.who === "other" ? "true" : g.who) : "false"}
                data-you={open && mine === i ? "true" : "false"}
                data-cpu={open && i === g.pick ? "true" : "false"}
                data-dim={open && !flags.length ? "true" : "false"}
                data-slot={i}
                data-arrive={intro && i === g.truth ? (wait ? "wait" : "now") : undefined}
                aria-label={`Player ${LETTERS[i]}${role ? `: ${role}` : ""}`}
              >
                <span className={c("ch-rvTag")}>{LETTERS[i]}</span>
                <Card z={z} mystery={g.mystery} tone={truth ? (g.who === "other" ? "truth" : g.who) : intro && i === g.truth ? "truth" : "other"} />
              </button>
              {flags.length ? (
                <span className={c("ch-rvFlags")}>
                  {flags.map(([t, kind], j) => (
                    <span key={t} data-kind={kind}>{j ? ` · ${t}` : t}</span>
                  ))}
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

// The reader's picks, counted: the three rounds, the random lineups, and her.
const tally = (game, playOnly = false) => {
  let you = 0
  let cpu = 0
  let n = 0
  for (const [key, i] of Object.entries(game.picks)) {
    if (key === "findme" || key === "findyou") continue
    const [lineup, round] = key.split(":").map(Number)
    if (playOnly !== lineup > 0) continue
    const L = data.lineups[lineup]
    n += 1
    you += i === L.truth
    cpu += L.rounds[round].pick === L.truth
  }
  return { you, cpu, n }
}

// ── the curve: how often the right player is found, by games seen
const SERIES = {
  chance: { v: data.curves.ns.map(() => 0.1), kind: "chance", label: "blind pick", short: "blind" },
  typical: { v: data.curves.typical, kind: "typical", label: "a typical player", short: "typical", points: true },
  her: { v: data.curves.her, kind: "her", label: "me", points: true },
  disguise: { v: data.curves.disguise, kind: "disguise", label: "me, in London", short: "London", points: true },
}
const Curve = ({ lines, narrow, mine }) => {
  const [ref, { w, h }] = useBox()
  // the reader's line, as far as it is worked out (or as far as their games go)
  const S = mine ? { ...SERIES, you: { v: mine, kind: "you", label: "you", points: true } } : SERIES
  lines = lines.filter(id => S[id] && S[id].v.some(v => v != null))
  const last = id => S[id].v.reduce((at, v, i) => (v == null ? at : i), -1)
  const m = { l: narrow ? 30 : 44, r: narrow ? 64 : 140, t: narrow ? 30 : 44, b: narrow ? 40 : 56 }
  const xs = n => m.l + ((Math.sqrt(n) - 1) / (Math.sqrt(30) - 1)) * (w - m.l - m.r)
  const ys = v => h - m.b - v * (h - m.t - m.b)
  const ends = lines
    .map(id => ({ id, y: ys(S[id].v[last(id)]), x: last(id) === data.curves.ns.length - 1 ? w - m.r + 10 : xs(data.curves.ns[last(id)]) + 10 }))
    .sort((a, b) => a.y - b.y)
    .reduce((all, e) => [...all, { ...e, y: all.length && e.y - all.at(-1).y < 16 ? all.at(-1).y + 16 : e.y }], [])
  // two numbers at the same point: the lower line's goes under its dot
  const below = (id, i) => lines.some(o => o !== id && S[o].points && S[o].v[i] != null && S[o].v[i] >= S[id].v[i] && S[o].v[i] - S[id].v[i] < 0.07 && (S[o].v[i] > S[id].v[i] || o < id))
  const said = lines
    .filter(id => id !== "chance")
    .map(id => `${S[id].label}: ${Math.round(S[id].v[0] * 100)} in 100 from one game, ${Math.round(S[id].v[last(id)] * 100)} from ${games(data.curves.ns[last(id)])}`)
    .join("; ")
  return (
    <div ref={ref} className={c("ch-rvCurve")}>
      {w ? (
        <svg width={w} height={h} role="img" aria-label={`How often the right player is picked out of ten, by games seen. A blind pick: 10 in 100. ${said}.`}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <g key={v}>
              <line className={c("ch-rvGrid0")} data-zero={v ? "false" : "true"} x1={m.l} x2={w - m.r} y1={ys(v)} y2={ys(v)} />
              <text className={c("ch-rvTick")} x={m.l - 8} y={ys(v) + 4} textAnchor="end">{v * 100}</text>
            </g>
          ))}
          <text className={c("ch-rvTick")} x={m.l - 8} y={ys(1) - 14}>{narrow ? "found, in 100 tries" : "times in 100 the right player is picked out of ten"}</text>
          {[1, 5, 10, 20, 30].map(n => (
            <text key={n} className={c("ch-rvTick")} x={xs(n)} y={h - m.b + 20} textAnchor="middle">{n}</text>
          ))}
          <text className={c("ch-rvTick")} x={(m.l + w - m.r) / 2} y={h - m.b + 40} textAnchor="middle">games seen</text>
          {lines.map(id => {
            const s = S[id]
            const pts = data.curves.ns.map((n, i) => [xs(n), ys(s.v[i] ?? 0)]).slice(0, last(id) + 1)
            return (
              <g key={id} className={c("ch-rvSeries")} data-kind={s.kind}>
                <path pathLength="1" d={`M${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join("L")}`} />
                {/* where my line (or the reader's) ends, the dot (travellers.js) */}
                {(s.kind === "her" || s.kind === "you") && pts.length ? <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="5" data-dot={s.kind === "her" ? "me" : "you"} /> : null}
                {s.points
                  ? [0, 4, 6].filter(i => i < pts.length).map(i => (
                      <g key={i}>
                        <circle cx={pts[i][0]} cy={pts[i][1]} r="3.5" />
                        <text x={pts[i][0]} y={below(id, i) ? pts[i][1] + 18 : pts[i][1] - 9} textAnchor="middle">{Math.round(s.v[i] * 100)}</text>
                      </g>
                    ))
                  : null}
              </g>
            )
          })}
          {ends.map(e => (
            <text key={e.id} className={c("ch-rvEndLabel")} data-kind={S[e.id].kind} x={e.x} y={e.y + 4}>
              {narrow && S[e.id].short ? S[e.id].short : S[e.id].label}
            </text>
          ))}
        </svg>
      ) : null}
    </div>
  )
}

// The steps, and what each shows. `you`: only once the reader's games are in
// ("find" also needs 35 of them: 30 for the card and 5 to find).
const STEPS = [
  ["choose-question", { view: "dials", on: [0, 0, 0, 0] }],
  ["choose-contact", { view: "dials", on: [1, 0, 0, 0] }],
  ["choose-pace", { view: "dials", on: [1, 1, 0, 0] }],
  ["choose-persistence", { view: "dials", on: [1, 1, 1, 0] }],
  ["choose-habit", { view: "dials", on: [1, 1, 1, 1] }],
  ["choose-all", { view: "dials", on: [1, 1, 1, 1], middle: true }],
  ["choose-games", { view: "split", stage: "card" }],
  ["choose-split", { view: "split", stage: "split" }],
  ["choose-lineup", { view: "game", mode: "intro", stage: "lineup" }],
  ["choose-round-1", { view: "game", mode: "rounds", round: 0 }],
  ["choose-round-10", { view: "game", mode: "rounds", round: 1 }],
  ["choose-round-30", { view: "game", mode: "rounds", round: 2 }],
  ["choose-play", { view: "game", mode: "play" }],
  ["choose-curve", { view: "curve", lines: ["chance", "typical"] }],
  ["choose-me", { view: "curve", lines: ["chance", "typical", "her"] }],
  ["choose-findme", { view: "game", mode: "findme" }],
  ["choose-findyou", { view: "game", mode: "findyou", you: "find" }],
  ["choose-you", { view: "curve", lines: ["chance", "typical", "her", "you"], you: true }],
  ["choose-club", { view: "curve", lines: ["chance", "her"] }],
  ["choose-disguise", { view: "curve", lines: ["chance", "her", "disguise"] }],
  ["choose-end", { view: "curve", lines: ["chance", "her", "disguise"] }],
]
const ON = [false, false, false, false]

// What the reader's games say, in green, under a step's words.
const number = n => (n === 1 ? "one" : n === 10 ? "ten" : n === 30 ? "thirty" : String(n))
const youSay = (name, you, curve) => {
  if (!you) return null
  const level = `players at your level (rated ${you.band[0].toLocaleString("en-GB")}–${you.band[1].toLocaleString("en-GB")})`
  const above = k => (you.above[k] == null ? (k === 2 ? "no lost games to tell yet" : "not enough to tell yet") : `above ${you.above[k]} in 100`)
  switch (name) {
    case "choose-contact":
      return `You, in green: ${above(0)} ${you.above[0] == null ? "" : level}. The green tick is what’s typical there.`
    case "choose-pace":
      return `You: ${above(1)}.`
    case "choose-persistence":
      return `You: ${above(2)}.`
    case "choose-habit":
      return `You: ${above(3)}.`
    case "choose-all":
      return `At your level, you’re outside the middle half on ${["none", "one", "two", "three", "all four"][you.outside]}${you.outside === 4 ? "" : " of the four"}: further from typical than ${you.distAbove} in 100 players.`
    case "choose-you": {
      if (!curve || curve.every(v => v == null)) return "Working out your line…"
      const at = [1, 10, 30].map(n => [n, curve[data.curves.ns.indexOf(n)]]).filter(([, v]) => v != null)
      const told = at.map(([n, v], i) => `${i ? `from ${number(n)}, ` : `From ${number(n)} of your games, the computer picks you out `}${Math.round(v * 100)}${i ? "" : " times in 100"}`)
      const short = curve.at(-1) == null && curve.some(v => v != null) && you.games < 60 ? ` Thirty would take more of your ten-minute games than the ${you.games} there are.` : ""
      return `${told.join("; ")}.${short}`
    }
    default:
      return null
  }
}

// Where the moving picture is (Journey): before the games, the strips; after
// the lineup's explainer, the game.
const FIRST = STEPS.findIndex(([, v]) => v.stage)
const stageOf = name => {
  const i = STEPS.findIndex(([n]) => n === name)
  return STEPS[i][1].stage || (i < FIRST ? "strips" : "game")
}

const Scene = ({ step, narrow, you, curve, game, setGame }) => {
  const [name, v] = step
  const on = v.on ? v.on.map(Boolean) : ON
  const stage = stageOf(name)
  // the stage it came from, kept until the next change (some moves wait for others)
  const last = React.useRef({ stage, from: stage })
  if (last.current.stage !== stage) last.current = { stage, from: last.current.stage }
  // where the card lands in the lineup, and the mystery card, in the scene's pixels
  const root = React.useRef(null)
  const [spots, setSpots] = React.useState(null)
  const lineup = v.view === "game" || v.view === "split"
  React.useLayoutEffect(() => {
    const scene = root.current
    if (!scene || !lineup) return
    const measure = () => {
      const base = scene.getBoundingClientRect()
      const slot = scene.querySelector(`[data-slot="${EXAMPLE.truth}"][data-arrive] svg`)
      const mys = scene.querySelector("[data-mystery]")
      if (!slot || !mys) return
      const r = slot.getBoundingClientRect()
      const m = mys.getBoundingClientRect()
      const next = { slot: { x: r.left - base.left, y: r.top - base.top, w: r.width }, mys: [m.left - base.left + m.width / 2, m.top - base.top + m.height / 2] }
      setSpots(old => (old && JSON.stringify(old) === JSON.stringify(next) ? old : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(scene)
    return () => observer.disconnect()
  }, [lineup, stage, narrow])
  return (
    <div ref={root} className={c("ch-rvScene")} data-view={v.view} data-stage={stage} data-from={last.current.from}>
      <Show on={v.view === "dials"} className={c("ch-rvView", "ch-rvDials")}>
        <Strips on={v.view === "dials" ? on : [true, true, true, true]} middle={Boolean(v.middle)} narrow={narrow} you={you} />
      </Show>
      <Show on={v.view === "game"} className={c("ch-rvView")}>
        {lineup ? <Lineup view={v.view === "split" ? { mode: "intro" } : v} game={game} setGame={setGame} find={you?.find} wait={stage !== "lineup"} /> : null}
      </Show>
      <Show on={v.view === "curve"} className={c("ch-rvView")}>
        <Curve lines={v.view === "curve" ? v.lines : ["chance"]} narrow={narrow} mine={you ? curve : null} />
      </Show>
      <Journey stage={stage} from={last.current.from} narrow={narrow} you={you} spots={spots} />
    </div>
  )
}

export const Reveal = () => {
  const narrow = useNarrow()
  const dials = useYourDials()
  const you = dials.read
  const steps = STEPS.filter(([, v]) => !v.you || (you && (v.you !== "find" || you.find)))
  const [game, setGame] = React.useState({ picks: {}, shown: {}, lineup: 1, round: 0 })
  // a new reading of the reader's games is a new "find you"
  React.useEffect(() => {
    setGame(all => {
      const { findyou: _p, ...picks } = all.picks
      const { findyou: _s, ...shown } = all.shown
      return { ...all, picks, shown }
    })
  }, [you])
  // for the hub: the three rounds, the random lineups, and whether they found her, and themselves
  const told = React.useMemo(() => {
    const rounds = [0, 1, 2].map(r => (game.picks[`0:${r}`] == null ? null : game.picks[`0:${r}`] === data.lineups[0].truth))
    const played = tally(game, true)
    const findme = game.picks.findme == null ? null : game.picks.findme === data.findme.truth
    const findyou = game.picks.findyou == null || !you?.find ? null : game.picks.findyou === you.find.truth
    return rounds.every(r => r == null) && !played.n && findme == null && findyou == null ? null : { rounds, played, findme, findyou }
  }, [game, you])
  useTell("choose", told)

  return (
    <Pinned
      reading
      mark="what-we-choose"
      className={c("ch-reveal")}
      label="What our choices reveal"
      steps={steps.map(([name]) => {
        const green = youSay(name, you, dials.curve)
        return {
          text: (
            <>
              {/* (the question's first line opens it under its name, opening.js; the rest is here) */}
              <Text name={name} look="lead" className={name === "choose-question" ? c("ch-afterFirst") : ""} />
              {green ? <p className={c("ch-rvSaid")}>{green}</p> : null}
              {name === "choose-question" ? <YourDials {...dials} /> : null}
            </>
          ),
        }
      })}
    >
      {now => <Scene step={steps[now] || steps[0]} narrow={narrow} you={you} curve={dials.curve} game={game} setGame={setGame} />}
    </Pinned>
  )
}
