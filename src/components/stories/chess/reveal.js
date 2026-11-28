"use client"

import * as React from "react"

import { c, Pinned, Text, useNarrow } from "./parts"
import { useTell } from "./reader"
import { useYourDials, YourDimensions } from "./you"
import { Stage } from "./wrong-stage"
import data from "./choose.json"

// Part III, third question: what our choices reveal. The professor saw a few
// moves of a game she played against her nature, the London System, and still
// said "aggressiveness is in your nature". Can you hide who you are at the board?
//
// One stage, as in the Part III prototype (data-stories
// chess-story/analysis/out/part3-prototype.html) and as "When things go wrong"
// (wrong-stage.js): the same marks are players, games and points in turn, and
// each step moves them instead of drawing a new chart.
//   cloud     the opening: a hundred players at her level around her, the
//             professor behind them
//   dials     the hundred go to the first line, then on to the next, leaving
//             their shadow behind; her dot hops along (travellers.js)
//   all       the four lines, the middle half shaded, her dots joined
//   games     one player's sixty games; split into two piles: thirty known,
//             thirty hidden
//   lineup    the known pile flies into its card among ten, the hidden into the
//             mystery card; then the rounds, from 1, 10 and 30 games (the reader
//             taps a card), random lineups, "find me", "find you"
//   curve     how often the computer finds the right player, by games seen: a
//             typical player, her, the reader, her in the London months; the
//             professor comes back for the club
//
// A reader found on Chess.com (you.js) can put their own games in, at the
// first step: then they are on the lines in green, get a "find you" lineup,
// and their own line on the curve (dials.js works it out in their browser).
//
// One unit everywhere: each dial as a z-score against the players of the
// recognition test (choose.json, from export_choose.py in the data-stories
// repository). Colours as in the rest of Part III: clay is the author, slate
// the other players, green the reader, ivory the mystery and the truth.
//
// The drawing is the prototype's, 800 units across; on a wide screen one camera
// for every scene (BOX), so a mark that moves is seen moving across the same
// picture. A phone has less room across: there the camera frames each scene
// closely (its `tight` box) and moves with the marks, as in Q2.

const DIALS = [
  { name: "Contact", what: "checks, captures, threats", lo: "builder", hi: "attacker", says: "force less often than I do" },
  { name: "Pace", what: "moves made in under 2 seconds", lo: "deep thinker", hi: "blitz thinker", says: "move more slowly" },
  { name: "Persistence", what: "lost games played to the end", lo: "gives up", hi: "keeps going", says: "give up more often" },
  { name: "Habit", what: "the same first three moves", lo: "explorer", hi: "creature of habit", says: "vary their openings more" },
]
const clamp = (v, m) => Math.max(-m, Math.min(m, v))
const games = n => `${n} game${n === 1 ? "" : "s"}`
const BOX = [86, 172, 822, 748]
const MOST = 1.05

// ── the hundred players at her level: a seeded sample of the 1,635, placed once
let seed = 7
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const SAMPLE = (() => {
  const idx = data.strips.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx.slice(0, 99).map(i => data.strips[i])
})()

// the dials: four lines, a player's place on each; a small swarm so none hides another
const dx = z => 140 + ((clamp(z, 3) + 3) / 6) * 520
const DY = [240, 360, 480, 600]
const SWARM = DY.map((_, d) => {
  const pts = SAMPLE.map((s, i) => [i, s[d]]).filter(p => p[1] != null).sort((a, b) => a[1] - b[1])
  const out = {}
  const placed = []
  for (const [i, z] of pts) {
    const x = dx(z)
    let off = -24
    for (let t = 0; t < 7; t++) {
      const o = t % 2 ? -Math.ceil(t / 2) * 8 : Math.ceil(t / 2) * 8
      if (!placed.some(p => Math.abs(p[0] - x) < 8 && p[1] === o)) {
        off = o
        break
      }
    }
    placed.push([x, off])
    out[i] = [x, off]
  }
  return out
})
// the middle half, from all 1,635
const quantile = (k, q) => {
  const v = data.strips.map(p => p[k]).filter(x => x != null).sort((a, b) => a - b)
  return v[Math.floor(q * (v.length - 1))]
}
const MIDDLE = DIALS.map((_, k) => [quantile(k, 0.25), quantile(k, 0.75)])

// the games, and the lineup
const grid = (x0, y0, cols, cell) => i => [x0 + ((i % cols) + 0.5) * cell, y0 + (Math.floor(i / cols) + 0.5) * cell]
const SIXTY = grid(200, 260, 10, 40)
const KNOWN = grid(140, 260, 5, 40)
const HIDDEN = grid(460, 260, 5, 40)
const CW = 118
const CG = 16
const CX0 = (800 - (5 * CW + 4 * CG)) / 2
const cardXY = i => [CX0 + (i % 5) * (CW + CG), 380 + Math.floor(i / 5) * (CW + 26)]
const MYS = [400 - CW / 2, 190]
// the explainer uses a player the reader never plays (the last lineup): a card seen
// here could otherwise be told by its shape alone in the rounds
const EXAMPLE_AT = data.lineups.length - 1
const EXAMPLE = data.lineups[EXAMPLE_AT]

// the curve
const C = data.curves
const cx = n => 140 + ((n - 1) / 29) * 560
const cy = v => 690 - v * 480

// ── the labels: words and lines drawn under the marks
const T = ({ x, y, anchor = "start", kind = "", children }) => (
  <text x={x} y={y} textAnchor={anchor} className={c("ch-stageText")} data-kind={kind || undefined}>
    {children}
  </text>
)
// a group that fades in once the marks have moved (or, "faint", stays in the back;
// "quick", at once: the travelling dots' marks, so a dot always has one to go to)
const Lab = ({ on, faint = false, quick = false, children }) => (
  <g className={c("ch-stageLabels")} data-on={on ? "true" : "false"} data-faint={faint ? "true" : undefined} data-quick={quick ? "true" : undefined} aria-hidden="true">
    {children}
  </g>
)

// The four lines. Line d is shown from step d on; its players' shadows (and her
// dot) once the players have moved on to the next line. The current line holds
// her mark (and the reader's), which the travelling dots stand in for.
const DialLines = ({ upto, all, you, narrow }) => (
  <>
    {DIALS.map((d, k) => {
      const y = DY[k]
      const on = upto >= k
      const left = k < upto || all
      const yz = you && Number.isFinite(you.z[k]) ? you.z[k] : null
      return (
        <g key={d.name}>
          <Lab on={on}>
            <rect x={dx(MIDDLE[k][0])} y={y - 26} width={dx(MIDDLE[k][1]) - dx(MIDDLE[k][0])} height={52} rx={4} className={c("ch-rvBand")} />
            <line x1={140} x2={660} y1={y} y2={y} className={c("ch-stageGrid")} />
            <T x={140} y={y - 34} kind="name">
              {d.name}
              <tspan className={c("ch-rvWhat")} dx={10}>{d.what}</tspan>
            </T>
            <T x={140} y={y + 44}>← {d.lo}</T>
            <T x={660} y={y + 44} anchor="end">{d.hi} →</T>
          </Lab>
          <Lab on={on && left}>
            {Object.values(SWARM[k]).map(([x, o], i) => (
              <circle key={i} cx={x} cy={y + o} r={2.6} className={c("ch-rvShadow")} />
            ))}
          </Lab>
          <Lab on={on} quick>
            {/* hers: a dot left on each line she has moved on from; and a mark (hidden) on
                every line shown, the travelling dot standing in for the last one, so it
                hops from line to line (travellers.js) */}
            {k < upto ? <circle cx={dx(data.her.z[k])} cy={y} r={5.5} className={c("ch-rvHerDot")} /> : null}
            <circle cx={dx(data.her.z[k])} cy={y} r={5.5} className={c("ch-rvHerDot")} data-dot="me" />
          </Lab>
          {you ? (
            <Lab on={on} quick>
              {Number.isFinite(you.median[k]) ? <line x1={dx(you.median[k])} x2={dx(you.median[k])} y1={y - 11} y2={y + 11} className={c("ch-rvYouTick")} /> : null}
              {yz != null ? (
                <>
                  {k < upto ? <circle cx={dx(yz)} cy={y} r={5.5} className={c("ch-rvYouDot")} /> : null}
                  <circle cx={dx(yz)} cy={y} r={5.5} className={c("ch-rvYouDot")} data-dot="you" />
                  <T x={dx(yz)} y={y + 26} anchor={dx(yz) > 520 ? "end" : "start"} kind="you">
                    {narrow ? `you · ${you.above[k]}` : `you · above ${you.above[k]} at your level`}
                  </T>
                </>
              ) : null}
            </Lab>
          ) : null}
        </g>
      )
    })}
    <Lab on={all}>
      {all ? <polyline points={DY.map((y, k) => `${dx(data.her.z[k])},${y}`).join(" ")} pathLength="1" className={c("ch-rvJoin")} /> : null}
    </Lab>
  </>
)

// A card's four short lines, a dot on each (none where it can't be told yet).
const Glyph = ({ x, y, z, tone }) =>
  z.map((v, k) => {
    const yy = y + 24 + k * 24
    const x0 = x + 14
    const x1 = x + CW - 14
    return (
      <g key={k}>
        <line x1={x0} x2={x1} y1={yy} y2={yy} className={c("ch-rvGlyphLine")} data-unknown={v == null ? "true" : undefined} />
        {v == null ? null : <circle cx={x0 + ((clamp(v, 2.5) + 2.5) / 5) * (x1 - x0)} cy={yy} r={4.5} className={c("ch-rvGlyphDot")} data-tone={tone} />}
      </g>
    )
  })

// who the right card is: a stranger, her, or the reader
const WHO = {
  other: { mys: "mystery player", truth: "the player", tone: "truth" },
  her: { mys: "me", truth: "me", tone: "her" },
  you: { mys: "you", truth: "you", tone: "you" },
}

// The lineup: the mystery card on top, the ten below. In the rounds the reader
// taps a card; then the right one is ringed, and the computer's pick named.
const Cards = ({ g, intro, open, mine, onPick }) => {
  const who = WHO[g.who]
  const [mx, my] = MYS
  return (
    <g className={c("ch-rvCards")} data-intro={intro ? "true" : "false"}>
      <rect x={mx} y={my} width={CW} height={CW} rx={8} className={c("ch-rvMystery")} />
      <T x={400} y={my - 10} anchor="middle" kind="note">
        {intro ? "the mystery games" : `${who.mys} · ${games(g.n)}`}
      </T>
      {intro ? (
        <T x={400} y={my + CW / 2 + 6} anchor="middle" kind="name">?</T>
      ) : (
        <Glyph x={mx} y={my} z={g.mystery} tone="mystery" />
      )}
      {g.cards.map((z, i) => {
        const [x, y] = cardXY(i)
        const truth = open && i === g.truth
        const comp = open && i === g.pick
        const picked = mine === i
        const can = !intro && !open
        const pick = () => can && onPick(i)
        return (
          <g
            key={`${g.key}-${i}`}
            className={c("ch-rvCard")}
            style={{ "--i": i }}
            data-truth={truth ? who.tone : undefined}
            data-you={picked ? "true" : undefined}
            data-dim={open && !truth && !picked && !comp ? "true" : undefined}
            role={can ? "button" : undefined}
            tabIndex={can ? 0 : undefined}
            aria-label={can ? `Card ${i + 1}` : undefined}
            onClick={pick}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                pick()
              }
            }}
          >
            <rect x={x} y={y} width={CW} height={CW} rx={8} className={c("ch-rvCardBox")} />
            <T x={x + 10} y={y + 16}>{i + 1}</T>
            <Glyph x={x} y={y + 8} z={z} tone="card" />
            {truth ? <T x={x + CW / 2} y={y + CW + 17} anchor="middle" kind={g.who === "other" ? "note" : g.who === "her" ? "me" : "you"}>{who.truth}</T> : null}
            {comp ? <T x={x + CW / 2} y={y - 7} anchor="middle">computer’s pick</T> : null}
            {picked && !(truth && g.who === "you") ? (
              <T x={x + CW / 2} y={y + CW + (truth ? 32 : 17)} anchor="middle" kind="you">{g.who === "you" ? "your pick" : "you"}</T>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

// The curve: found, in 100 tries, by games seen.
const SERIES = {
  typical: { v: C.typical, kind: "other", label: "a typical player", short: "typical" },
  her: { v: C.her, kind: "me", label: "me" },
  disguise: { v: C.disguise, kind: "me", label: "me, in London", short: "London", dash: true },
}
const lastOf = v => v.reduce((at, x, i) => (x == null ? at : i), -1)
const CurveLines = ({ lines, drawn, mine, narrow }) => {
  const S = mine ? { ...SERIES, you: { v: mine, kind: "you", label: "you" } } : SERIES
  const shown = lines.filter(id => S[id] && lastOf(S[id].v) >= 0)
  // the end labels, nudged apart where they would touch
  const ends = shown
    .map(id => ({ id, y: cy(S[id].v[lastOf(S[id].v)]) + 4, x: cx(C.ns[lastOf(S[id].v)]) + 10 }))
    .sort((a, b) => a.y - b.y)
    .reduce((all, e) => [...all, { ...e, y: all.length && e.y - all.at(-1).y < 15 ? all.at(-1).y + 15 : e.y }], [])
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <g key={v}>
          <line x1={140} x2={700} y1={cy(v)} y2={cy(v)} className={c("ch-stageGrid")} />
          <T x={130} y={cy(v) + 4} anchor="end">{v * 100}</T>
        </g>
      ))}
      {[1, 10, 20, 30].map(n => (
        <T key={n} x={cx(n)} y={712} anchor="middle">{n}</T>
      ))}
      <T x={700} y={736} anchor="end" kind="note">games seen →</T>
      <T x={140} y={186} kind="note">found, in 100 tries</T>
      <line x1={140} x2={700} y1={cy(0.1)} y2={cy(0.1)} className={c("ch-stageLine")} />
      <T x={700} y={cy(0.1) - 8} anchor="end">blind pick</T>
      {shown.map(id => {
        const s = S[id]
        const pts = C.ns.slice(0, lastOf(s.v) + 1).map((n, i) => `${cx(n).toFixed(1)},${cy(s.v[i] ?? 0).toFixed(1)}`)
        return (
          <polyline
            key={id + (id === drawn ? "-drawn" : "")}
            points={pts.join(" ")}
            pathLength="1"
            className={c("ch-rvSeries")}
            data-kind={s.kind}
            data-dash={s.dash ? "true" : undefined}
            data-draw={id === drawn && !s.dash ? "true" : undefined}
          />
        )
      })}
      {ends.map(e => (
        <T key={e.id} x={e.x} y={e.y} kind={S[e.id].kind === "other" ? "other" : S[e.id].kind}>
          {narrow && S[e.id].short ? S[e.id].short : S[e.id].label}
        </T>
      ))}
    </>
  )
}

// The steps, and what each shows. `you`: only once the reader's games are in
// ("find" also needs 35 of them: 30 for the card and 5 to find).
const STEPS = [
  ["choose-question", { view: "cloud" }],
  ["choose-contact", { view: "dial", d: 0 }],
  ["choose-pace", { view: "dial", d: 1 }],
  ["choose-persistence", { view: "dial", d: 2 }],
  ["choose-habit", { view: "dial", d: 3 }],
  ["choose-all", { view: "all" }],
  ["choose-games", { view: "games" }],
  ["choose-split", { view: "split" }],
  ["choose-lineup", { view: "lineup" }],
  ["choose-round-1", { view: "round", round: 0 }],
  ["choose-round-10", { view: "round", round: 1 }],
  ["choose-round-30", { view: "round", round: 2 }],
  ["choose-play", { view: "play" }],
  ["choose-curve", { view: "curve", lines: ["typical"], drawn: "typical" }],
  ["choose-me", { view: "curve", lines: ["typical", "her"], drawn: "her" }],
  ["choose-findme", { view: "findme" }],
  ["choose-findyou", { view: "findyou", you: "find" }],
  ["choose-you", { view: "curve", lines: ["typical", "her", "you"], drawn: "you", you: true }],
  ["choose-club", { view: "club" }],
  ["choose-disguise", { view: "curve", lines: ["typical", "her", "disguise"], drawn: "disguise" }],
]

// The lineup a step plays: a round of the first lineup, a random one, her, or the reader.
const dealOf = (v, game, find) => {
  if (v.view === "findme") {
    const f = data.findme
    return { key: "findme", n: f.n, cards: f.cards, mystery: f.mystery, pick: f.pick, truth: f.truth, who: "her" }
  }
  if (v.view === "findyou") return { key: "findyou", n: find.n, cards: find.cards, mystery: find.mystery, pick: find.pick, truth: find.truth, who: "you" }
  if (v.view === "lineup") {
    const r = EXAMPLE.rounds[2]
    return { key: "intro", n: r.n, cards: r.cards, mystery: null, pick: r.pick, truth: EXAMPLE.truth, who: "other" }
  }
  const lineup = v.view === "play" ? game.lineup : 0
  const round = v.view === "play" ? game.round : v.round
  const L = data.lineups[lineup]
  const r = L.rounds[round]
  return { key: `${lineup}:${round}`, n: r.n, cards: r.cards, mystery: r.mystery, pick: r.pick, truth: L.truth, who: "other" }
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
      const at = [1, 10, 30].map(n => [n, curve[C.ns.indexOf(n)]]).filter(([, v]) => v != null)
      const told = at.map(([n, v], i) => `${i ? `from ${number(n)}, ` : `From ${number(n)} of your games, the computer picks you out `}${Math.round(v * 100)}${i ? "" : " times in 100"}`)
      const short = curve.at(-1) == null && curve.some(v => v != null) && you.games < 60 ? ` Thirty would take more of your ten-minute games than the ${you.games} there are.` : ""
      return `${told.join("; ")}.${short}`
    }
    default:
      return null
  }
}

const pct = v => Math.round(v * 100)
// (the boxes start above their first words, the dial's name at DY[0] − 34 and the
// mystery card's label, so on a phone they stay clear of the caption above)
const DIAL_BOX = [128, 164, 672, 652]
const GAMES_BOX = [128, 232, 672, 520]
const CARDS_BOX = [68, 146, 732, 690]
const found = v => (v == null ? "–" : pct(v))

// ── What the stage shows at each step.
const sceneOf = (v, { you, curve, game, setGame, narrow }) => {
  const head = (title, ...chips) => ({ title, chips })
  const dialHead = head("How we play · 4 dimensions", ["crowd", "A player"], ["band", "The middle half"], ["me", "Me"], ...(you ? [["you", "You"]] : []))
  switch (v.view) {
    case "cloud":
      return {
        head: head("Players at my level", ["crowd", "A player"], ["me", "Me"]),
        cap: "",
        professor: true,
        tight: [150, 270, 650, 610],
        atoms: i => {
          if (i >= 100) return null
          const a = i * 2.39996
          const r = 15 * Math.sqrt(i)
          return { x: 330 + r * Math.cos(a), y: 440 + r * Math.sin(a), s: i ? 9 : 15, role: i ? "crowd" : "me", dot: i ? undefined : "me", delay: i * 6 }
        },
      }
    case "dial":
      return {
        head: dialHead,
        num: { n: data.her.above[v.d], unit: "in 100" },
        cap: `players at my level ${DIALS[v.d].says}`,
        tight: DIAL_BOX,
        labels: <DialLines upto={v.d} all={false} you={you} narrow={narrow} />,
        atoms: i => {
          if (i === 0 || i >= 100) return null
          const p = SWARM[v.d][i - 1]
          return p ? { x: p[0], y: DY[v.d] + p[1], s: 7, role: "crowd", delay: (i * 11) % 500 } : { x: 400, y: DY[v.d], s: 7, o: 0 }
        },
      }
    case "all":
      return {
        head: dialHead,
        num: { n: data.her.distAbove, unit: "in 100" },
        cap: "players at my level are closer to typical than I am",
        tight: DIAL_BOX,
        labels: <DialLines upto={3} all you={you} narrow={narrow} />,
        atoms: i => (i >= 100 ? null : { x: 400, y: 420, s: 6, role: "crowd", o: 0 }),
      }
    case "games":
      return {
        head: head("One player, sixty games", ["crowd", "A game"]),
        cap: "one player · sixty ten-minute games",
        tight: GAMES_BOX,
        atoms: i => {
          if (i >= 60) return null
          const [x, y] = SIXTY(i)
          return { x, y, s: 30, r: 0.12, role: "crowd", delay: i * 8 }
        },
      }
    case "split":
      return {
        head: head("One player, sixty games", ["crowd", "Known"], ["hollow", "Hidden"]),
        cap: "",
        tight: GAMES_BOX,
        labels: (
          <Lab on>
            <T x={240} y={244} anchor="middle" kind="note">30 known: their card</T>
            <T x={560} y={244} anchor="middle" kind="note">30 hidden</T>
          </Lab>
        ),
        atoms: i => {
          if (i >= 60) return null
          const left = i < 30
          const j = left ? i : i - 30
          const [x, y] = (left ? KNOWN : HIDDEN)(j)
          return { x, y, s: 30, r: 0.12, role: left ? "crowd" : "hollow", delay: j * 10 }
        },
      }
    case "lineup": {
      const g = dealOf(v, game)
      const [tx, ty] = cardXY(g.truth)
      return {
        head: head("The lineup", ["ring", "The mystery games"]),
        num: { n: 1, unit: "in 10" },
        cap: "right by blind pick",
        tight: CARDS_BOX,
        cards: { g, intro: true, open: false, mine: null },
        atoms: i => {
          if (i >= 60) return null
          // the known pile into its card, the hidden one into the mystery card
          if (i < 30) return { x: tx + CW / 2, y: ty + CW / 2, s: 8, r: 0.12, role: "crowd", o: 0, delay: i * 10 }
          return { x: 400, y: MYS[1] + CW / 2, s: 8, r: 0.12, role: "hollow", o: 0, delay: (i - 30) * 10 }
        },
      }
    }
    case "round":
    case "play":
    case "findme":
    case "findyou": {
      const g = dealOf(v, game, you?.find)
      const mine = game.picks[g.key]
      const open = Boolean(game.shown[g.key]) || mine != null
      const right = (a, b) => (a === b ? "right" : "wrong")
      const said = open ? `you: ${mine == null ? "no pick" : right(mine, g.truth)} · computer: ${right(g.pick, g.truth)}` : g.who === "her" ? "tap the card you think is mine" : g.who === "you" ? "tap the card you think is yours" : "tap the card you think is the mystery player’s"
      const score = v.view === "play" ? tally(game, true) : null
      const truthChip = g.who === "her" ? ["me", "Me"] : g.who === "you" ? ["you", "You"] : ["ring", "The player"]
      return {
        head: head(g.who === "her" ? "Find me" : g.who === "you" ? "Find yourself" : "The lineup", truthChip, ...(g.who === "you" ? [] : [["you", "Your pick"]])),
        num:
          v.view === "round"
            ? { n: `Round ${v.round + 1}`, unit: `of 3 · from ${games(g.n)}` }
            : { n: `From ${games(g.n)}`, unit: v.view === "play" ? "a player drawn at random" : g.who === "her" ? "mine, among nine players of my level" : "yours, among nine players of your level" },
        cap: `${said}${score && score.n ? ` · so far: you ${score.you} of ${score.n}, the computer ${score.cpu} of ${score.n}` : ""}`,
        tight: CARDS_BOX,
        cards: { g, intro: false, open, mine, onPick: i => setGame(all => (all.picks[g.key] != null ? all : { ...all, picks: { ...all.picks, [g.key]: i } })) },
        atoms: () => null,
      }
    }
    case "curve":
    case "club": {
      const club = v.view === "club"
      const lines = club ? ["typical", "her"] : v.lines
      const has = id => lines.includes(id)
      const mine = you && curve && has("you") ? curve : null
      const lastMine = mine ? lastOf(mine) : -1
      const latest = has("disguise") ? "disguise" : has("you") ? "you" : has("her") ? "her" : "typical"
      const num = {
        typical: { n: `${found(C.typical[0])} → ${found(C.typical.at(-1))}`, unit: "in 100", cap: "found from one game → from thirty, for a typical player" },
        her: { n: `${found(C.her[0])} → ${found(C.her.at(-1))}`, unit: "in 100", cap: "found from one game → from thirty: me" },
        you: { n: `${found(mine?.[0])} → ${found(lastMine >= 0 ? mine[lastMine] : null)}`, unit: "in 100", cap: `found from one game → from ${lastMine >= 0 ? C.ns[lastMine] : "thirty"}: you` },
        disguise: { n: `${found(C.disguise[0])} → ${found(C.disguise.at(-1))}`, unit: "in 100", cap: "found from one game → from thirty: me, in my London games" },
      }[latest]
      return {
        head: head(
          "Found, in 100 tries",
          ["crowd", "A typical player"],
          ...(has("her") ? [["me", "Me"]] : []),
          ...(has("you") ? [["you", "You"]] : []),
          ...(has("disguise") ? [["meHollow", "Me, in London"]] : []),
        ),
        num: club ? null : { n: num.n, unit: num.unit },
        cap: club ? "" : num.cap,
        professor: club,
        tight: [92, 172, 790, 748],
        labels: (
          <Lab on faint={club}>
            <CurveLines lines={lines} drawn={club ? null : v.drawn} mine={mine} narrow={narrow} />
          </Lab>
        ),
        atoms: i => {
          const k = i % 7
          const line = Math.floor(i / 7)
          const fade = club ? { o: 0.15 } : {}
          if (line === 0) return { x: cx(C.ns[k]), y: cy(C.typical[k]), s: 10, role: has("her") ? "faint" : "crowd", delay: v.drawn === "typical" ? k * 120 : 0, ...fade }
          if (line === 1 && has("her")) return { x: cx(C.ns[k]), y: cy(C.her[k]), s: 12, role: "me", dot: !club && k === 6 ? "me" : undefined, delay: v.drawn === "her" ? k * 120 : 0, ...fade }
          if (line === 2 && has("disguise")) return { x: cx(C.ns[k]), y: cy(C.disguise[k]), s: 12, role: "meHollow", delay: v.drawn === "disguise" ? k * 120 : 0 }
          if (line === 3 && mine && mine[k] != null) return { x: cx(C.ns[k]), y: cy(mine[k]), s: 12, role: "you", dot: k === lastMine ? "you" : undefined, delay: v.drawn === "you" ? k * 120 : 0 }
          return null
        },
      }
    }
    default:
      return { atoms: () => null }
  }
}

const Scene = ({ step, narrow, you, curve, game, setGame }) => {
  const [, v] = step
  const scene = React.useMemo(() => {
    const s = sceneOf(v, { you, curve, game, setGame, narrow })
    const cards = s.cards ? <Cards {...s.cards} /> : null
    return {
      ...s,
      box: narrow ? s.tight || BOX : BOX,
      most: narrow ? 1.2 : MOST,
      labels: (
        <>
          {s.labels}
          {cards}
        </>
      ),
    }
  }, [v, you, curve, game, setGame, narrow])
  return (
    <div className={c("ch-rvScene")} data-view={v.view}>
      <Stage scene={scene} cell={[400, 400]} label={scene.head?.title} />
      {/* the professor: behind the players at the opening, and back at the club */}
      <img
        className={c("ch-rvProfessor")}
        data-on={scene.professor ? "true" : "false"}
        src="/images/stories/chess/professor-300.webp"
        srcSet="/images/stories/chess/professor-300.webp 300w, /images/stories/chess/professor.webp 520w"
        sizes="(max-width: 60rem) 30vw, 260px"
        alt=""
        aria-hidden="true"
        decoding="async"
      />
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

  // the controls under a step's words: "Show me" for a lineup, and for the random
  // ones the games seen and another player
  const controls = v => {
    if (!["round", "play", "findme", "findyou"].includes(v.view)) return null
    if (v.view === "findyou" && !you?.find) return null
    const g = dealOf(v, game, you?.find)
    const open = Boolean(game.shown[g.key]) || game.picks[g.key] != null
    const show = () => setGame(all => ({ ...all, shown: { ...all.shown, [g.key]: true } }))
    return (
      <div className={c("ch-rvControls")}>
        {v.view === "play" ? (
          <>
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
          </>
        ) : null}
        {open ? null : (
          <button type="button" className={c("ch-rvShow")} onClick={show}>
            Show me
          </button>
        )}
      </div>
    )
  }

  return (
    <Pinned
      reading
      mark="what-we-choose"
      className={c("ch-reveal")}
      label="What our choices reveal"
      steps={steps.map(([name, v]) => {
        const green = youSay(name, you, dials.curve)
        return {
          text: (
            <>
              {/* (the question's first line opens it under its name, opening.js; the rest is here) */}
              <Text name={name} look="lead" className={name === "choose-question" ? c("ch-afterFirst") : ""} />
              {green ? <p className={c("ch-rvSaid")}>{green}</p> : null}
              {controls(v)}
              {name === "choose-question" ? <YourDimensions {...dials} /> : null}
            </>
          ),
        }
      })}
    >
      {now => <Scene step={steps[now] || steps[0]} narrow={narrow} you={you} curve={dials.curve} game={game} setGame={setGame} />}
    </Pinned>
  )
}
