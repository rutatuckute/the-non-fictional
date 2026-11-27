"use client"

import * as React from "react"

import { useStill } from "./follow"
import { c, Guess, Pinned, Text } from "./parts"
import { useReader, useTell } from "./reader"
import { YourQueens } from "./you"
import { BOARD, Labels, Stage, VIEW } from "./wrong-stage"
import data from "./wrong.json"
import paths from "./wrong-paths.json"

// Part III, second question: what we do when things go wrong. One stage, as in
// the Part III prototype (wrong-stage.js): the same marks move from step to step.
//   observation  100 opponents who lost their queen against her: who resigned
//   decide       her own game, on the story's ivory and grey board, and the reader's choice
//   outcome      the rest of that game, played out on its own once the step is reached
//   guess        the board shrinks into one of 100 real games of players at her level
//                (rapid, rated 600–799), a queen down: how many of those who played on
//                did not lose?
//   play         the hundred play out, then fold into dots, those not lost first
//   payoff       the same dots as the price: resigning is −8 every time; playing on
//                is the same −8 at worst
//   taleb        the saved lift out of it, to 0 for a draw and +8 for a win
//   clock        the same dots again, by the other player's clock
//   levels       by rating: who gives up at once, and who is saved by staying
//   mine         her own games of that kind (and the reader's, in green, if found)
// The lone king is one beat (`king`): her game played out to the three-queens
// stalemate, with her own counts. Whoever wants more can open it ("go deeper"):
// the hundred real lone-king games, guess, play and payoff, come in after the
// beat. Then:
//   meet         both hundreds side by side, with the reader's guesses
//   you          her own words, her games a queen down: played on or resigned
// (wrong-paths.json from analysis/export_wrong_paths.py, her own numbers in it
// from export_wrong_her.py; wrong.json from export_wrong.py for her games.)
//
// Colours, as in the prototype: ivory, games not lost (and opponents who
// resigned); grey and dark, the rest; clay, the author; green, only ever the
// reader (their guesses, their choice, their games).

const D = data.decision
const KG = paths.kingGame
const HER = paths.her
const signed = v => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0")
const side = colour => (colour === "b" ? "Black" : "White")
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const pct = v => `${Math.round(v * 100)}%`

// The reader's own lost queens (you.js), while they belong to the name found
// at the start of Part III.
const useYours = () => {
  const said = useReader()
  const q = said.queens
  return q && said.chesscom && q.username === said.chesscom.username ? { ...q, rating: said.chesscom.rapid.rating } : null
}

// The author's two games, from the moment it went wrong to the end.
const GAMES = {
  queen: {
    fens: D.fens,
    date: D.date,
    flip: D.colour === "b",
    first: `Move ${D.move} · I play ${side(D.colour)} · Stockfish ${signed(D.eval)}: lost`,
    label: at => {
      const ply = at - 1
      return at ? `${D.move + Math.floor(ply / 2)}${ply % 2 ? "…" : "."} ${D.sans[ply]}` : `Move ${D.move}`
    },
    end: "my opponent resigned",
  },
  king: {
    fens: KG.fens,
    date: KG.date,
    flip: KG.colour === "b",
    first: `I play ${side(KG.colour)} · only my king is left`,
    label: at => KG.labels[at],
    end: "stalemate",
  },
}

// A game plays out on its own once its step is reached, as in the prototype: a
// move every PLY milliseconds, after the board has arrived; back to its first
// position when the step is left.
const PLY = 110
const START = 600
const usePlay = (on, last, still) => {
  const [at, setAt] = React.useState(0)
  React.useEffect(() => {
    if (!on) {
      setAt(0)
      return
    }
    if (still) {
      setAt(last)
      return
    }
    let k = 0
    setAt(0)
    let timer = window.setTimeout(function next() {
      k += 1
      setAt(k)
      if (k < last) timer = window.setTimeout(next, PLY)
    }, START)
    return () => window.clearTimeout(timer)
  }, [on, last, still])
  return Math.min(at, last)
}

// ── Where the marks go. The drawing is VIEW × VIEW (600).
const CELL = VIEW / 10
const G = i => [(i % 10 + 0.5) * CELL, (Math.floor(i / 10) + 0.5) * CELL]
const fromMiddle = (x, y) => Math.hypot(x - VIEW / 2, y - VIEW / 2)
const MIDDLE = 44 // the cell the big board shrinks into
const ORDER = Array.from({ length: 100 }, (_, i) => (i * 37 + 11) % 100) // the order in which they play out
const AFTER = new Map(ORDER.map((board, k) => [board, k]))
const boardsOf = P =>
  P.boards.map(([fen, final, end, how, rating, move, after, white]) => ({ fen, final, end, rating, move, after, flip: !white, saved: end !== "lost" }))
// those not lost first, then the lost, each in their own order
const savedRank = boards => {
  const rank = []
  ;[...boards.keys()].sort((a, b) => Number(boards[b].saved) - Number(boards[a].saved) || a - b).forEach((i, k) => (rank[i] = k))
  return rank
}
// the price, game by game: every game a dot in the −8 block, lost first; the
// saved lift out of it (draws to 0, wins to +8) and leave their places empty
const ROW = { 8: 168, 0: 300, "-8": 432 }
const PX0 = 52
const PSTEP = (VIEW - PX0 - 8) / 25
const payXY = (j, v) => [PX0 + (j % 25 + 0.5) * PSTEP, ROW[v] + Math.floor(j / 25) * 22]
const payOrder = boards => {
  const level = b => (b.end === "lost" ? 0 : b.end === "won" ? 2 : 1)
  const sorted = [...boards.keys()].sort((a, b) => level(boards[a]) - level(boards[b]) || a - b)
  const seen = { won: 0, drew: 0 }
  const out = []
  sorted.forEach((i, j) => {
    const b = boards[i]
    const k = b.end === "lost" ? null : b.end === "won" ? "won" : "drew"
    out[i] = { j, k: k ? seen[k]++ : null, row: k === "won" ? 8 : 0 }
  })
  return out
}
// by rating: a row a band; the bar, those who gave up at once; the dot, those who stayed and did not lose
const LV = { y: i => 76 + i * 54, x0: 128, bar: v => (v / 0.6) * 190, dot: v => 384 + (clamp(v, 0, 0.3) / 0.3) * 196 }
// her own games: twelve a row
const MINE = i => [(i % 12 + 0.5) * 50, (Math.floor(i / 12) + 0.5) * 50]
// both hundreds side by side
const MEET = (i, right) => [(right ? 318 : 10) + (i % 10 + 0.5) * 27.2, 168 + Math.floor(i / 10) * 27.2]

const PREP = {
  queen: (() => {
    const boards = boardsOf(paths.queen)
    return { boards, rank: savedRank(boards), pay: payOrder(boards), lit: 100 - paths.queen.counts.lost }
  })(),
  king: (() => {
    const boards = boardsOf(paths.king)
    return { boards, rank: savedRank(boards), pay: payOrder(boards), lit: 100 - paths.king.counts.lost }
  })(),
}

// Tells the scene which step the reader is on (the controls in the texts need it too).
const StepSpy = ({ at, onStep }) => {
  React.useEffect(() => onStep(at), [at, onStep])
  return null
}

// The steps, in reading order: the queen, then the lone king as one beat (and,
// if the reader opens it, its hundred games), then both.
const namesOf = deeper => [
  "observation", "decide", "outcome", "guess", "play", "payoff", "taleb", "clock", "levels", "mine",
  "king", ...(deeper ? ["guess-king", "play-king", "payoff-king"] : []),
  "meet", "you",
]
const pathOf = name => (name === "king" || name.endsWith("-king") ? "king" : "queen")
const kindOf = name => name.replace(/-king$/, "")
const both = value => ({ queen: value, king: value })
const WHAT = { queen: "a queen down", king: "only the king left" }

// ── The labels drawn on the stage, each shown in its own scenes.
const T = ({ x, y, anchor = "start", kind = "", children }) => (
  <text x={x} y={y} textAnchor={anchor} className={c("ch-stageText")} data-kind={kind || undefined}>
    {children}
  </text>
)
const Ring = ({ guess, at, r = 21 }) => {
  const [x, y] = at(clamp(guess, 1, 100) - 1)
  return (
    <>
      <circle cx={x} cy={y} r={r} className={c("ch-stageRing")} />
      <T x={x} y={y + r + 17} anchor="middle" kind="you">your guess</T>
    </>
  )
}
const PayoffLabels = ({ path, up }) => {
  const P = paths[path]
  const won = P.counts.won
  return (
    <>
      <rect x={PX0} y={ROW[8] - 26} width={VIEW - PX0 - 8} height={ROW[-8] - ROW[8] + 8} rx={6} className={c("ch-stageChance")} data-on={up ? "true" : "false"} />
      <T x={PX0 - 12} y={ROW[8] + 4} anchor="end">+8</T>
      <T x={PX0 - 12} y={ROW[0] + 4} anchor="end">0</T>
      <T x={PX0 - 12} y={ROW[-8] + 4} anchor="end">−8</T>
      <line x1={PX0} x2={VIEW - 8} y1={ROW[-8] - 18} y2={ROW[-8] - 18} className={c("ch-stageLine")} />
      <T x={PX0} y={ROW[-8] + 100}>Resign: −8, every time</T>
      <T x={PX0} y={ROW[8] - 44}>rating points, game by game</T>
      {up ? (
        <>
          {won ? <T x={PX0 + won * PSTEP + 10} y={ROW[8] + 4}>won</T> : <T x={PX0} y={ROW[8] + 4}>a lone king cannot win</T>}
          <T x={PX0 + (P.counts.drew + P.counts.stalemate) * PSTEP + 10} y={ROW[0] + 4}>drew</T>
          <T x={VIEW - 20} y={(ROW[8] + ROW[0]) / 2 + 6} anchor="end" kind="note">above the line: a chance, for free</T>
        </>
      ) : null}
    </>
  )
}
const LevelLabels = ({ you }) => {
  const R = paths.queen.byLevel
  const rows = R.length + (you ? 1 : 0)
  const bottom = LV.y(rows - 1) + 30
  const gave = you ? (you.resigned + you.left) / you.cases : 0
  const saved = you?.on ? you.saved / you.on : null
  return (
    <>
      <T x={LV.x0} y={34}>Resigned at once</T>
      <T x={LV.dot(0)} y={34}>Stayed, did not lose</T>
      {[0, 0.1, 0.2, 0.3].map(v => (
        <g key={v}>
          <line x1={LV.dot(v)} x2={LV.dot(v)} y1={50} y2={bottom} className={c("ch-stageGrid")} />
          <T x={LV.dot(v)} y={bottom + 20} anchor="middle">{pct(v)}</T>
        </g>
      ))}
      {R.map((r, i) => {
        const mine = r.band === paths.queen.level
        return (
          <g key={r.band}>
            <T x={LV.x0 - 12} y={LV.y(i) + 4} anchor="end" kind={mine ? "me" : ""}>{r.band}</T>
            <rect x={LV.x0} y={LV.y(i) - 11} width={LV.bar(r.resigned)} height={22} rx={3} className={c("ch-stageBar")} />
            <T x={LV.x0 + LV.bar(r.resigned) + 6} y={LV.y(i) + 4}>{pct(r.resigned)}</T>
            <T x={LV.dot(r.saved) + 13} y={LV.y(i) + 4}>{pct(r.saved)}</T>
          </g>
        )
      })}
      {you ? (
        <g className={c("ch-stageYou")}>
          <T x={LV.x0 - 12} y={LV.y(R.length) + 4} anchor="end" kind="you">You</T>
          <rect x={LV.x0} y={LV.y(R.length) - 11} width={Math.max(2, LV.bar(Math.min(0.6, gave)))} height={22} rx={3} />
          <T x={LV.x0 + Math.max(2, LV.bar(Math.min(0.6, gave))) + 6} y={LV.y(R.length) + 4} kind="you">{pct(gave)}</T>
          {saved != null ? (
            <>
              <circle cx={LV.dot(saved)} cy={LV.y(R.length)} r={7} data-dot="you" />
              <T x={LV.dot(saved) + 13} y={LV.y(R.length) + 4} kind="you">{pct(saved)}</T>
            </>
          ) : null}
        </g>
      ) : null}
    </>
  )
}
// the reader's own games a queen down, in green under hers: saved, lost, gave up at once
const YourGames = ({ you }) => {
  const kinds = [...Array(you.saved).fill("saved"), ...Array(you.on - you.saved).fill("lost"), ...Array(you.resigned + you.left).fill("gave")]
  const top = 486
  const cols = [12, 24, 40, 60, 100].find(n => Math.ceil(kinds.length / n) * (VIEW / n) <= 110) || 100
  const size = VIEW / cols
  return (
    <g className={c("ch-stageYou")}>
      <T x={0} y={top - 10} kind="you">You: {you.cases} games · stayed {you.on} · did not lose {you.saved}</T>
      {kinds.map((kind, i) => (
        <circle key={i} cx={(i % cols + 0.5) * size} cy={top + (Math.floor(i / cols) + 0.5) * size} r={size * 0.36} data-kind={kind} data-dot={i === 0 ? "you" : undefined} />
      ))}
    </g>
  )
}
// read as Q1's squares: whose (here, which game), then how many in 100, then the dots
const MeetLabels = ({ guesses }) =>
  ["queen", "king"].map((path, k) => {
    const x = (k ? 318 : 10) + 4
    return (
      <g key={path}>
        <T x={x} y={100} kind="name">{WHAT[path][0].toUpperCase() + WHAT[path].slice(1)}</T>
        <T x={x} y={142} kind="num">{PREP[path].lit}<tspan className={c("ch-stageUnit")}> in 100</tspan></T>
        {guesses[path] != null ? <Ring guess={guesses[path]} at={i => MEET(i, k === 1)} r={13} /> : null}
      </g>
    )
  })

export const Wrong = () => {
  const [guess, setGuess] = React.useState(both(30))
  const [guessed, setGuessed] = React.useState(both(false))
  const [revealed, setRevealed] = React.useState(both(0))
  const [played, setPlayed] = React.useState(both(false))
  // once the hundred have played out, they fold into dots a moment later
  const [settled, setSettled] = React.useState(both(false))
  const [decision, setDecision] = React.useState(both(null))
  useTell("decisions", decision)
  const [clockAt, setClockAt] = React.useState(3)
  const [step, setStep] = React.useState(0)
  // the lone king's hundred games come in after its beat only if the reader asks
  const [deeper, setDeeper] = React.useState(false)
  const NAMES = React.useMemo(() => namesOf(deeper), [deeper])
  // (with the reader's own count under her words, the step gets more room to read it in)
  const found = Boolean(useReader().chesscom)
  const you = useYours()
  const still = useStill()
  const name = NAMES[step] || "observation"
  const set = (setter, path, value) => setter(all => ({ ...all, [path]: typeof value === "function" ? value(all[path]) : value }))

  // her two games play out on their own when their step is reached
  const queenAt = usePlay(name === "outcome", GAMES.queen.fens.length - 1, still)
  const kingAt = usePlay(name === "king", GAMES.king.fens.length - 1, still)

  // the hundred play out once the reader reaches them, three games a beat
  const playing = kindOf(name) === "play" ? pathOf(name) : null
  React.useEffect(() => {
    if (!playing || revealed[playing] >= 100) return
    if (still) {
      set(setRevealed, playing, 100)
      return
    }
    const timer = window.setTimeout(() => set(setRevealed, playing, n => Math.min(100, n + 3)), revealed[playing] ? 50 : 700)
    return () => window.clearTimeout(timer)
  }, [playing, revealed, still])
  // what they came to is told once they have played out, not before (and stays told)
  React.useEffect(() => {
    for (const path of ["queen", "king"]) if (revealed[path] >= 100 && !played[path]) set(setPlayed, path, true)
  }, [revealed, played])
  React.useEffect(() => {
    const timers = []
    for (const path of ["queen", "king"]) {
      const done = revealed[path] >= 100
      if (done && !settled[path]) timers.push(window.setTimeout(() => set(setSettled, path, true), still ? 0 : 900))
      if (!done && settled[path]) set(setSettled, path, false)
    }
    return () => timers.forEach(window.clearTimeout)
  }, [revealed, settled, still])

  const decide = path => (
    <Guess label="Your decision" options={["Resign", "Play on"]} value={decision[path]} onChange={v => set(setDecision, path, v)} />
  )
  const askHundred = path => (
    <label className={c("ch-wrongRange")}>
      <span>
        <b>{guess[path]}</b> of 100
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={guess[path]}
        onChange={e => {
          set(setGuess, path, Number(e.target.value))
          set(setGuessed, path, true)
        }}
        aria-label="Your guess: how many of the 100 did not lose"
      />
    </label>
  )
  const afterPlay = (path, text) => (
    <div>
      <p className={c("ch-guessReply")} aria-live="polite">
        {guessed[path] ? (
          <>
            You guessed <b>{guess[path]}</b>.{" "}
          </>
        ) : null}
        {played[path] ? (
          <>
            It was <strong>{PREP[path].lit}</strong>.
          </>
        ) : (
          "Let’s see."
        )}
      </p>
      <div className={c("ch-afterPlay")} data-on={played[path] ? "true" : "false"} aria-hidden={played[path] ? undefined : "true"}>
        <Text name={text} look="lead" />
        <div className={c("ch-guess")}>
          <button type="button" onClick={() => set(setRevealed, path, 0)}>Play them out again</button>
        </div>
      </div>
    </div>
  )

  const texts = {
    // (its first line opens the question under its name, opening.js; the rest is here)
    observation: <Text name="wrong-observation" look="lead" className={c("ch-afterFirst")} />,
    decide: (
      <>
        <Text name="wrong-decide" look="lead" />
        {decide("queen")}
      </>
    ),
    outcome: <Text name="wrong-outcome" look="lead" />,
    guess: (
      <>
        <Text name="wrong-guess" look="lead" />
        {askHundred("queen")}
      </>
    ),
    play: afterPlay("queen", "wrong-play"),
    payoff: <Text name="wrong-payoff" look="lead" />,
    taleb: <Text name="wrong-taleb" look="lead" />,
    clock: (
      <>
        <Text name="wrong-clock" look="lead" />
        <Guess label="Their clock" options={[3, 2, 1, 0].map(i => paths.queen.clockLabels[i])} value={paths.queen.clockLabels[clockAt]} onChange={v => setClockAt(paths.queen.clockLabels.indexOf(v))} />
      </>
    ),
    levels: <Text name="wrong-levels" look="lead" />,
    mine: (
      <>
        <Text name="wrong-mine" look="lead" />
        <YourQueens />
      </>
    ),
    king: (
      <div className={c("ch-kingBeat")}>
        <Text name="wrong-king" look="lead" />
        <Text name="wrong-outcome-king" look="lead" />
        <Text name="wrong-mine-king" look="lead" />
        <div className={c("ch-guess")}>
          <button type="button" disabled={deeper} onClick={() => setDeeper(true)}>
            {deeper ? "The hundred games are below" : "Go deeper: 100 real lone-king games"}
          </button>
        </div>
      </div>
    ),
    "guess-king": (
      <>
        <Text name="wrong-guess-king" look="lead" />
        {askHundred("king")}
      </>
    ),
    "play-king": afterPlay("king", "wrong-play-king"),
    "payoff-king": <Text name="wrong-payoff-king" look="lead" />,
    meet: <Text name="wrong-meet" look="lead" />,
    you: <Text name="wrong-you" look="lead" />,
  }

  // ── What the stage shows at each step.
  const scene = React.useMemo(() => {
    const kind = kindOf(name)
    const path = pathOf(name)
    const { boards, rank, pay, lit } = PREP[path]
    const chose = decision[path] ? [["you", decision[path] === "Resign" ? "You: resign" : "You: play on"]] : []
    const what = WHAT[path]
    const hidden = () => ({ x: VIEW / 2, y: 240, s: 4, o: 0 })
    const gameScene = (game, at, playing) => ({
      // named by the case it is, the same names as in the words: a queen down, a lone king
      head: { title: path === "queen" ? "Queen down" : "Lone king", chips: path === "queen" ? chose : [] },
      board: {
        fen: game.fens[at],
        flip: game.flip,
        at: "full",
        caption: !playing || at === 0 ? game.first : `${game.label(at)}${at >= game.fens.length - 1 ? ` · ${game.end}` : ""}`,
      },
      atoms: hidden,
      box: [BOARD.x, BOARD.y, BOARD.x + BOARD.size, BOARD.y + BOARD.size + 40],
      most: 0.72, // the board about 345 px
    })
    const out = (() => {
      switch (kind) {
        case "observation": {
          const o = HER.opponents
          return {
            head: { title: "My opponents, a queen down", chips: [["ivory", "Resigned at once"], ["faint", "Resigned later"], ["dim", "Played on"]] },
            num: { n: o.resignedAny, unit: "in 100 resigned" },
            atoms: i => {
              if (i >= o.cases) return null
              const [x, y] = G(i)
              return { x, y, s: 32, role: i < o.resignedAtOnce ? "crowd" : i < o.resignedAny ? "faint" : "dim", delay: i * 5 }
            },
          }
        }
        case "decide":
          return gameScene(GAMES.queen, 0, false)
        case "outcome":
          return gameScene(GAMES.queen, queenAt, true)
        case "king":
          return { ...gameScene(GAMES.king, kingAt, true), head: { title: "Lone king", chips: [] } }
        case "guess":
          return {
            head: { title: `100 players at my level, ${what}`, chips: [] },
            num: { n: guess[path], unit: "your guess", tone: "you" },
            board: { fen: (path === "queen" ? GAMES.queen : GAMES.king).fens[0], flip: false, at: "cell" },
            atoms: i => {
              if (i >= 100) return null
              const [x, y] = G(i)
              return { x, y, s: 0, b: 1, bs: 50, fen: boards[i].fen, flip: boards[i].flip, delay: fromMiddle(x, y) * 1.2 }
            },
          }
        case "play": {
          const fold = settled[path]
          return {
            head: { title: `100 players at my level, ${what}`, chips: [["ivory", "Did not lose"], ["dim", "Lost"], ...(fold && guessed[path] ? [["you", "Your guess"]] : [])] },
            num: fold ? { n: lit, unit: "in 100 did not lose" } : { n: guess[path], unit: "your guess", tone: "you" },
            atoms: i => {
              if (i >= 100) return null
              const b = boards[i]
              if (fold) {
                const [x, y] = G(rank[i])
                return { x, y, s: 32, role: b.saved ? "crowd" : "dim", b: 0, bs: 32, fen: b.final, flip: b.flip, delay: rank[i] * 6 }
              }
              const [x, y] = G(i)
              const over = AFTER.get(i) < revealed[path]
              return { x, y, s: 0, b: over ? (b.saved ? 1 : 0.18) : 1, bs: 50, fen: over ? b.final : b.fen, flip: b.flip, delay: 0, title: `A player rated ${b.rating}${over ? `: ${b.saved ? "did not lose" : "lost"}, ${b.after} more moves` : ""}` }
            },
          }
        }
        case "payoff":
        case "taleb": {
          const up = kind === "taleb" || path === "king"
          return {
            head: { title: "The price, game by game", chips: [["faint", "Played on, lost"], ["ivory", "Did not lose"], ...chose] },
            num: up ? { n: Math.round(paths[path].moves), unit: "more moves: the price of staying" } : { n: "−8", unit: "rating points, resigning or losing" },
            box: [14, ROW[8] - 62, VIEW, ROW[-8] + 110],
            most: 0.95,
            atoms: i => {
              if (i >= 100) return null
              const { j, k, row } = pay[i]
              if (!up || k === null) {
                const [x, y] = payXY(j, -8)
                return { x, y, s: 15, role: boards[i].saved ? "crowd" : "faint", delay: j * 5 }
              }
              const [x, y] = payXY(k, row)
              return { x, y, s: 15, role: "crowd", delay: 150 + k * 70 }
            },
          }
        }
        case "clock": {
          const [, share] = paths.queen.clock.find(g => g[0] === clockAt) || paths.queen.clock[3]
          const n = Math.round(share * 100)
          return {
            head: { title: `When the other player had ${paths.queen.clockLabels[clockAt]} left`, chips: [["ivory", "Did not lose"], ["dim", "Lost"]] },
            num: { n, unit: "in 100 did not lose" },
            atoms: i => {
              if (i >= 100) return null
              const [x, y] = G(i)
              return { x, y, s: 32, role: i < n ? "crowd" : "dim", delay: i * 4 }
            },
          }
        }
        case "levels": {
          const R = paths.queen.byLevel
          return {
            box: [44, 18, 630, LV.y(R.length - (you ? 0 : 1)) + 60],
            most: 0.95,
            head: { title: "By rating, a queen down", chips: [["faint", "Resigned at once"], ["ivory", "Stayed, did not lose"], ["me", "My level"], ...(you ? [["you", "You"]] : [])] },
            atoms: i => {
              if (i >= R.length) return null
              const mine = R[i].band === paths.queen.level
              return { x: LV.dot(R[i].saved), y: LV.y(i), s: 14, role: mine ? "me" : "crowd", dot: mine ? "me" : undefined, delay: i * 40 }
            },
          }
        }
        case "mine":
        case "you": {
          const q = HER.queen
          const mine = kind === "mine"
          return {
            head: {
              title: mine ? "Every time I lost my queen like this" : "My games, a queen down",
              dot: "me",
              chips: mine ? [["me", "Saved"], ["meHollow", "Played on, lost"], ["meDim", "Resigned"], ...(you ? [["you", "You"]] : [])] : [["me", "Played on"], ["meDim", "Resigned"]],
            },
            box: [0, 0, VIEW, mine && you ? VIEW : Math.ceil(q.cases / 12) * 50],
            num: mine ? { n: `${q.saved} of ${q.cases}`, unit: "saved", tone: "me" } : { n: `${q.on} of ${q.cases}`, unit: "played on", tone: "me" },
            atoms: i => {
              if (i >= q.cases) return null
              const [x, y] = MINE(i)
              const role = mine ? (i < q.saved ? "me" : i < q.on ? "meHollow" : "meDim") : i < q.on ? "me" : "meDim"
              return { x, y, s: 34, role, delay: i * 5 }
            },
          }
        }
        case "meet":
          return {
            box: [10, 70, 590, 168 + 10 * 27.2 + 30],
            most: 0.95, // two squares side by side, as Q1's give-up squares
            head: { title: "Played on and did not lose", chips: [["ivory", "Did not lose"], ["dim", "Lost"], ...(guessed.queen || guessed.king ? [["you", "Your guesses"]] : [])] },
            atoms: i => {
              const right = i >= 100
              const P = PREP[right ? "king" : "queen"]
              const j = i % 100
              const [x, y] = MEET(P.rank[j], right)
              return { x, y, s: 19, role: P.boards[j].saved ? "crowd" : "dim", delay: P.rank[j] * 5 + (right ? 200 : 0) }
            },
          }
        default:
          return { atoms: () => null }
      }
    })()
    const on = k => kind === k
    out.labels = (
      <>
        <Labels on={(on("payoff") || on("taleb")) && path === "queen"}>
          <PayoffLabels path="queen" up={on("taleb")} />
        </Labels>
        <Labels on={on("payoff") && path === "king"}>
          <PayoffLabels path="king" up />
        </Labels>
        <Labels on={on("play") && path === "queen" && settled.queen && guessed.queen}>
          <Ring guess={guess.queen} at={G} />
        </Labels>
        <Labels on={on("play") && path === "king" && settled.king && guessed.king}>
          <Ring guess={guess.king} at={G} />
        </Labels>
        <Labels on={on("levels")}>
          <LevelLabels you={you} />
        </Labels>
        <Labels on={on("mine") && Boolean(you)}>{you ? <YourGames you={you} /> : null}</Labels>
        <Labels on={on("meet")}>
          <MeetLabels guesses={{ queen: guessed.queen ? guess.queen : null, king: guessed.king ? guess.king : null }} />
        </Labels>
      </>
    )
    return out
  }, [name, decision, queenAt, kingAt, guess, guessed, revealed, settled, clockAt, you])

  return (
    <Pinned
      reading
      mark="when-things-go-wrong"
      className={c("ch-wrong")}
      label="What we do when things go wrong"
      steps={NAMES.map(n => ({ text: texts[n], ...(n === "mine" && found ? { rest: 0.5 } : {}) }))}
    >
      {at => (
        <div className={c("ch-wrongScene")} data-path={pathOf(NAMES[at] || "observation")}>
          <StepSpy at={at} onStep={setStep} />
          <Stage scene={scene} cell={G(MIDDLE)} />
        </div>
      )}
    </Pinned>
  )
}
