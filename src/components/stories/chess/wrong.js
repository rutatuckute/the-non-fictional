"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, Guess, Pinned, PinSteps, Show, stepLine, Text, useNarrow, useUnit } from "./parts"
import { useReader, useTell } from "./reader"
import { YourQueens } from "./you"
import { CcBoard, lastMove } from "./cc-board"
import data from "./wrong.json"
import paths from "./wrong-paths.json"

// Part III, second question: what we do when things go wrong. On a
// Chess.com board (no phone): an opponent who loses the queen and resigns. Then
// two ways a game goes wrong, told one after the other, the second worse than
// the first: a queen down in the middle of the game, then only the king left.
//   decide   the author's own game, on its board, and the reader's choice
//   outcome  the rest of that game, as the reader scrolls
//   guess    100 real games of players at her level (rapid, rated 600–799):
//            how many of those who played on did not lose?
//   play     the hundred play out; the answer is told once they have
//   payoff   the same hundred as a chart: resigning is −8 every time;
//            playing on is the same −8 at worst, 0 for a draw, +8 for a win
//   taleb    the same chart, read as optionality
//   clock    the same hundred again, regrouped: the other player's clock
//   levels   by rating: who gives up at once, and who is saved by staying
//   mine     her own games of that kind (and, if the reader asks, theirs:
//            you.js counts them from Chess.com, in green beside hers)
// The lone king is one beat (`king`): her game played out to the three-queens
// stalemate, with her own counts. Whoever wants more can open it ("go deeper"):
// the hundred real lone-king games, guess, play and payoff, come in after the
// beat; the ideas it shares with the queen (the price of resigning, the clock)
// are not told twice. Then:
//   meet     both hundreds side by side, with the reader's guesses
//   you      her own words
// (wrong-paths.json from analysis/export_wrong_paths.py, her own numbers in it
// from export_wrong_her.py; wrong.json from export_wrong.py for her games.)
//
// Colours: clay is the author (her saved games full clay, the lost ones muted);
// data green is only ever the reader (controls, guesses, the choice they
// made); ivory, games saved by staying; grey, games lost; lavender, resigning.
// The boards the reader decides on are Chess.com's own (cc-board.js); the
// hundred are marks in a chart, so they stay quiet.

const D = data.decision
const KG = paths.kingGame
const HER = paths.her
const placement = fen => String(fen || "8/8/8/8/8/8/8/8").split(" ")[0]
const pct = v => `${Math.round(v * 100)}%`
const signed = v => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0")
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
const day = d => {
  const [y, m, dd] = String(d).split("-")
  return `${Number(dd)} ${MONTHS[Number(m) - 1]} ${y}`
}
const side = colour => (colour === "b" ? "Black" : "White")

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
    colour: D.colour,
    rating: D.rating,
    oppRating: D.oppRating,
    note: `Stockfish ${signed(D.eval)} · lost`,
    label: at => {
      const ply = at - 1
      return at ? `${D.move + Math.floor(ply / 2)}${ply % 2 ? "…" : "."} ${D.sans[ply]}` : `move ${D.move}`
    },
    end: "Opponent resigned",
    first: "Your queen is gone",
  },
  king: {
    fens: KG.fens,
    date: KG.date,
    colour: KG.colour,
    rating: KG.rating,
    oppRating: KG.oppRating,
    note: "Only my king. Three pawns on their way to becoming queens.",
    label: at => KG.labels[at],
    end: "Stalemate",
    first: "Only your king is left",
  },
}

// One position of the author's game, the move that led to it in yellow.
const GameBoard = ({ game, at, say, bottom }) => (
  <CcBoard
    fen={game.fens[at]}
    colour={game.colour}
    rating={game.rating}
    oppRating={game.oppRating}
    last={at ? lastMove(game.fens[at - 1], game.fens[at]) : []}
    top={`${day(game.date)} · I play ${side(game.colour)} · ${game.label(at)}`}
    bottom={bottom}
    say={say}
    label={`My game of ${day(game.date)}, ${game.label(at)}`}
  />
)

// The rest of the author's game, a position per stretch of scrolling.
const PlayOut = ({ during, game, note }) => {
  const steps = React.useContext(PinSteps)
  const still = useStill()
  const [at, setAt] = React.useState(0)
  const box = React.useRef(null)
  const last = game.fens.length - 1
  useFollow(
    () => {
      const node = steps?.current?.[during]
      if (!node) return 0
      return Math.max(0, Math.min(1, (stepLine(node) - node.getBoundingClientRect().top) / (window.innerHeight * 1.1)))
    },
    // (kept to the game's own positions whatever the scroll reports, even after a long jump)
    p => setAt(still ? last : Math.max(0, Math.min(last, Math.round((Number.isFinite(p) ? p : 0) * last)))),
    { still, watch: box },
  )
  return (
    <div ref={box} className={c("ch-wrongPlay")}>
      <GameBoard game={game} at={Math.min(at, last)} bottom={note && at === 0 ? game.note : null} say={at >= last ? game.end : null} />
    </div>
  )
}

// ── The hundred: real positions, then where each game ended, then a chart.
const VIEW = 600
const ORDER = Array.from({ length: 100 }, (_, i) => (i * 37 + 11) % 100) // the order in which they play out
const AFTER = new Map(ORDER.map((board, k) => [board, k]))
const valueOf = end => (end === "won" ? 8 : end === "lost" ? -8 : 0)
const boardsOf = P =>
  P.boards.map(([fen, final, end, how, rating, move, after, white, change], i) => ({
    i, fen, final, end, how, rating, move, after, flip: !white, change,
    resign: end === "lost" ? change : change - 16 * (end === "won" ? 1 : 0.5),
    value: valueOf(end),
  }))
const PLOT = { x0: 56, x1: 588, y: v => 300 - v * 22 } // payoff chart, inside the 600 × 600 view
const MINI = 52
const parse = fen => {
  const out = []
  fen.split("/").forEach((row, r) => {
    let f = 0
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch)
      else out.push([r, f++, ch])
    }
  })
  return out
}
const Mini = ({ fen, flip, pattern }) => (
  <>
    <rect width={MINI} height={MINI} fill={`url(#${pattern})`} />
    {parse(fen).map(([r, f, ch]) => {
      const white = ch === ch.toUpperCase()
      const kind = ch.toLowerCase()
      const q = MINI / 8
      return (
        <circle
          key={`${r}${f}`}
          cx={(flip ? 7 - f : f) * q + q / 2}
          cy={(flip ? 7 - r : r) * q + q / 2}
          r={q * (kind === "k" ? 0.42 : kind === "p" ? 0.24 : 0.34)}
          className={c(white ? "ch-miniWhite" : "ch-miniBlack")}
        />
      )
    })}
  </>
)

const Board = React.memo(function Board({ fen, flip, pattern, state, x, y, scale, delay, title }) {
  return (
    <g className={c("ch-hBoard")} data-state={state} style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transitionDelay: `${delay}ms` }}>
      {title ? <title>{title}</title> : null}
      <Mini fen={fen} flip={flip} pattern={pattern} />
      <rect width={MINI} height={MINI} className={c("ch-hTint")} />
    </g>
  )
})

const Hundred = ({ P, path, mode, guess, revealed, clockAt, choice }) => {
  const unit = useUnit()
  const boards = React.useMemo(() => boardsOf(P), [P])
  const rank = React.useMemo(() => {
    const sorted = boards.slice().sort((a, b) => a.value - b.value || a.change - b.change)
    return new Map(sorted.map((b, k) => [b.i, k]))
  }, [boards])
  const chart = mode === "payoff"
  const grid = mode === "clock"
  const step = (PLOT.x1 - PLOT.x0) / 100
  const scale = (step * 0.92) / MINI
  const counts = P.counts
  const lost = counts.lost
  const drew = counts.drew + counts.stalemate
  const shown = chart || grid ? 100 : mode === "play" ? revealed : 0
  const done = boards.filter(b => AFTER.get(b.i) < shown)
  const saved = done.filter(b => b.end !== "lost").length
  const on = Math.round(done.reduce((a, b) => a + b.change, 0))
  const res = Math.round(done.reduce((a, b) => a + b.resign, 0))
  const what = path === "queen" ? "a queen down" : "only the king left"
  // the clock: the same hundred marks, regrouped ten by ten, as many lit as in 100 such games were saved
  const [, share, n] = P.clock.find(g => g[0] === clockAt) || P.clock[P.clock.length - 1]
  const lit = Math.round(share * 100)
  const CELL = 48
  const GRID_TOP = 120
  const gridScale = (CELL * 0.78) / MINI
  return (
    <figure className={c("ch-hundred")} data-mode={mode}>
      <figcaption className={c("ch-hundredTitle")}>
        {chart ? (
          <>
            What each game cost or earned
            <small>rating points, as on Chess.com: −8 a loss, 0 a draw, +8 a win</small>
            {choice ? (
              <small className={c("ch-youChose")}>
                You chose to {choice === "Resign" ? "resign: the dashed line" : "play on: the solid line"}.
              </small>
            ) : null}
          </>
        ) : grid ? (
          <>
            Their clock: {P.clockLabels[clockAt]}
            <small>players rated under 800 who stayed · {n.toLocaleString("en-GB")} games</small>
          </>
        ) : (
          <>
            100 players at my level, {what}
            <small>
              {mode === "guess"
                ? `Your guess: ${guess} of 100 did not lose`
                : shown >= 100
                  ? `${saved} of 100 did not lose`
                  : `${shown} of 100 played out · ${saved} did not lose`}
            </small>
          </>
        )}
      </figcaption>
      <svg ref={unit} viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={grid ? `${lit} in 100 did not lose when the other player had ${P.clockLabels[clockAt]} left.` : `100 games, ${what}: ${100 - lost} did not lose, ${lost} lost.`}>
        <defs>
          <pattern id={`ch-wrong-check-${path}`} width={MINI / 4} height={MINI / 4} patternUnits="userSpaceOnUse">
            <rect width={MINI / 4} height={MINI / 4} fill="#2b2927" />
            <rect width={MINI / 8} height={MINI / 8} fill="#3a3734" />
            <rect x={MINI / 8} y={MINI / 8} width={MINI / 8} height={MINI / 8} fill="#3a3734" />
          </pattern>
        </defs>
        <g className={c("ch-payoff")} data-on={chart ? "true" : "false"} aria-hidden="true">
          {[-8, 0, 8].map(v => (
            <g key={v}>
              <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y(v)} y2={PLOT.y(v)} className={c("ch-payoffGrid")} />
              <text x={PLOT.x0 - 10} y={PLOT.y(v) + 4} textAnchor="end" className={c("ch-payoffTick")}>{signed(v)}</text>
            </g>
          ))}
          <line x1={PLOT.x0} x2={PLOT.x1} y1={PLOT.y(-8)} y2={PLOT.y(-8)} className={c("ch-payoffResign")} />
          <text x={PLOT.x0} y={PLOT.y(-8) + 30} className={c("ch-payoffNote")} data-kind="resign">Resign: −8, every time</text>
          <path
            className={c("ch-payoffLine")}
            d={`M${PLOT.x0} ${PLOT.y(-8)} H${PLOT.x0 + lost * step} V${PLOT.y(0)} H${PLOT.x0 + (lost + drew) * step}${counts.won ? ` V${PLOT.y(8)} H${PLOT.x1}` : ""}`}
          />
          <text x={PLOT.x0 + (lost * step) / 2} y={PLOT.y(-8) - 16} textAnchor="middle" className={c("ch-payoffNote")}>{lost} lost anyway: the same −8</text>
          <text x={PLOT.x0 + lost * step - 8} y={PLOT.y(0) - 12} textAnchor="end" className={c("ch-payoffNote")} data-kind="saved">{drew} drew: 0</text>
          {counts.won ? (
            <text x={PLOT.x1} y={PLOT.y(8) - 16} textAnchor="end" className={c("ch-payoffNote")} data-kind="saved">{counts.won} won: +8</text>
          ) : (
            <text x={PLOT.x1} y={PLOT.y(8) - 16} textAnchor="end" className={c("ch-payoffNote")} data-kind="none">A lone king cannot win: no +8</text>
          )}
        </g>
        <g className={c("ch-payoff")} data-on={grid ? "true" : "false"} aria-hidden="true">
          <text x={0} y={74} className={c("ch-hundredBig")}>{lit}</text>
          <text x={lit >= 10 ? 118 : 64} y={74} className={c("ch-payoffNote")}>in 100 did not lose</text>
        </g>
        {boards.map(b => {
          const k = rank.get(b.i)
          const order = AFTER.get(b.i)
          const x = grid ? (order % 10) * CELL + (CELL - MINI * gridScale) / 2 : chart ? PLOT.x0 + k * step + (step - MINI * scale) / 2 : (b.i % 10) * 60 + 4
          const y = grid ? GRID_TOP + Math.floor(order / 10) * CELL + (CELL - MINI * gridScale) / 2 : chart ? PLOT.y(b.value) - (MINI * scale) / 2 : Math.floor(b.i / 10) * 60 + 4
          const over = order < shown
          const state = grid
            ? order < lit ? "saved-mark" : "lost-mark"
            : chart ? `${b.end === "lost" ? "lost" : "saved"}-mark` : over ? (b.end === "lost" ? "lost" : "saved") : mode === "guess" && b.i < guess ? "guessed" : "open"
          return (
            <Board
              key={b.i}
              pattern={`ch-wrong-check-${path}`}
              fen={over || chart || grid ? b.final : b.fen}
              flip={b.flip}
              state={state}
              x={x}
              y={y}
              scale={grid ? gridScale : chart ? scale : 1}
              delay={grid ? order * 4 : (chart ? k : 99 - k) * 5}
              title={grid ? "" : `A player rated ${b.rating}, ${path === "queen" ? "queen lost" : "king left alone"} on move ${b.move}${over || chart ? `: ${b.end === "lost" ? "lost" : b.end === "won" ? "won" : b.end === "stalemate" ? "stalemate" : "drew"}, ${b.after} more moves` : ""}`}
            />
          )
        })}
      </svg>
      {mode === "play" ? (
        <p className={c("ch-hundredSum")}>
          Played on: <b>{signed(on)}</b> rating points · had they all resigned: <b>{signed(res)}</b>
        </p>
      ) : chart ? (
        // (as words under the chart, not in it: at a phone's width they would not fit the drawing;
        // on a phone the step's own words already say it, and the chart needs the room)
        <p className={`${c("ch-hundredSum")} ${c("ch-payoffSum")}`}>
          On average, playing on: <b>{(P.ratingOn / 100).toFixed(1)}</b> a game; resigning: <b>{(P.ratingResign / 100).toFixed(1)}</b>
          <br />
          The price of staying: about {Math.round(P.moves)} more moves a game. Nothing else.
        </p>
      ) : null}
    </figure>
  )
}

// By rating: who gave up at once, and of those who stayed, who did not lose.
const Levels = ({ P, path }) => {
  const R = P.byLevel
  const unit = useUnit()
  // the reader, in green, a row of their own under the sample's: how often they
  // gave up at once, and of the times they stayed, how often they were saved
  const you = useYours()
  const yourGave = you ? (you.resigned + you.left) / you.cases : 0
  const yourSaved = you?.on ? you.saved / you.on : null
  const rows = R.length + (you ? 1 : 0)
  const top = path === "queen" ? 0.3 : 0.45
  // (room for "1000–1199" and both headings at 12 px on a phone)
  const x0 = 130
  const xs0 = 350
  const x1 = 540
  const rh = 40
  const bar = v => (v / 0.6) * (xs0 - 40 - x0)
  const dot = v => xs0 + (v / top) * (x1 - xs0)
  return (
    <figure className={c("ch-levels")}>
      <figcaption className={c("ch-hundredTitle")}>
        By rating
        <small>{path === "queen" ? "a queen down" : "only the king left"} · rapid games of the sample</small>
        {you ? <small className={c("ch-youChose")}>In green, you: your rapid games on Chess.com</small> : null}
      </figcaption>
      <svg
        ref={unit}
        viewBox={`0 0 600 ${rows * rh + 70}`}
        role="img"
        aria-label={
          R.map(r => `${r.band}: ${pct(r.resigned)} gave up at once, ${pct(r.saved)} of those who stayed did not lose`).join("; ") +
          (you ? `; you: ${pct(yourGave)} gave up at once${yourSaved != null ? `, ${pct(yourSaved)} of the times you stayed you did not lose` : ""}` : "")
        }
      >
        <text x={x0} y={20} className={c("ch-levelsHead")}>{path === "queen" ? "Resigned at once" : "Gave up at once"}</text>
        <text x={xs0} y={20} className={c("ch-levelsHead")}>Stayed, did not lose</text>
        {[0, top / 3, (2 * top) / 3, top].map(v => (
          <g key={v}>
            <line x1={dot(v)} x2={dot(v)} y1={34} y2={34 + rows * rh} className={c("ch-payoffGrid")} />
            <text x={dot(v)} y={52 + rows * rh} textAnchor="middle" className={c("ch-payoffTick")}>{pct(v)}</text>
          </g>
        ))}
        {R.map((r, i) => {
          const y = 34 + i * rh
          const mine = r.band === P.level
          return (
            <g key={r.band} data-mine={mine ? "true" : undefined}>
              <text x={x0 - 12} y={y + rh / 2 + 4} textAnchor="end" className={c("ch-levelsBand")}>{r.band}</text>
              <rect x={x0} y={y + rh * 0.24} width={bar(r.resigned)} height={rh * 0.52} rx={3} className={c("ch-levelsResign")} />
              <text x={x0 + bar(r.resigned) + 6} y={y + rh / 2 + 4} className={c("ch-payoffTick")}>{pct(r.resigned)}</text>
              <circle cx={dot(r.saved)} cy={y + rh / 2} r={6.5} className={c("ch-levelsSaved")} />
              <text x={dot(r.saved) + 11} y={y + rh / 2 + 4} className={c("ch-payoffTick")}>{pct(r.saved)}</text>
            </g>
          )
        })}
        {you
          ? (() => {
              const y = 34 + R.length * rh
              const gave = Math.min(0.6, yourGave)
              return (
                <g className={c("ch-levelsYou")}>
                  <line x1={x0 - 60} x2={x1 + 50} y1={y + 1} y2={y + 1} />
                  <text x={x0 - 12} y={y + rh / 2 + 4} textAnchor="end">You</text>
                  <rect x={x0} y={y + rh * 0.24} width={Math.max(2, bar(gave))} height={rh * 0.52} rx={3} />
                  <text x={x0 + Math.max(2, bar(gave)) + 6} y={y + rh / 2 + 4}>{pct(yourGave)}</text>
                  {yourSaved != null ? (
                    <>
                      <circle cx={dot(Math.min(top, yourSaved))} cy={y + rh / 2} r={6.5} />
                      <text x={dot(Math.min(top, yourSaved)) + 11} y={y + rh / 2 + 4}>{pct(yourSaved)}</text>
                    </>
                  ) : null}
                </g>
              )
            })()
          : null}
      </svg>
    </figure>
  )
}

// A hundred dots, some of them lit: how many in 100 did not lose.
const Waffle = ({ lit, label }) => (
  <svg viewBox="0 0 200 200" className={c("ch-waffle")} role="img" aria-label={label}>
    {Array.from({ length: 100 }, (_, i) => (
      <circle key={i} cx={(i % 10) * 20 + 10} cy={Math.floor(i / 10) * 20 + 10} r={7} data-on={i < lit ? "true" : "false"} style={{ transitionDelay: `${i * 4}ms` }} />
    ))}
  </svg>
)

// Her own games of the path's kind, one square each.
const Mine = ({ path }) => {
  const q = HER.queen
  const k = HER.king
  const you = useYours()
  const unit = useUnit()
  // the reader's, as hers: saved, lost, gave up at once (resigned or left)
  const yours =
    path === "queen" && you
      ? [...Array(you.saved).fill("saved"), ...Array(you.on - you.saved).fill("lost"), ...Array(you.resigned + you.left).fill("gave")]
      : []
  const kinds =
    path === "queen"
      ? [...Array(q.saved).fill("saved"), ...Array(q.on - q.saved).fill("lost"), ...Array(q.resigned).fill("gave")]
      : [...Array(k.saved).fill("saved"), ...Array(k.lone - k.saved - k.gaveup).fill("lost"), ...Array(k.gaveup).fill("gave")]
  const cols = path === "queen" ? 12 : 20
  const size = 600 / cols
  const herHeight = Math.ceil(kinds.length / cols) * size
  // (theirs smaller when there are many, so both fit the scene)
  const yourCols = yours.length <= 48 ? 12 : yours.length <= 192 ? 24 : 40
  const yourSize = 600 / yourCols
  const yourTop = herHeight + 64
  const height = yours.length ? yourTop + Math.ceil(yours.length / yourCols) * yourSize : herHeight
  return (
    <figure className={c("ch-mine")}>
      <figcaption className={c("ch-hundredTitle")}>
        {path === "queen" ? `Every time I lost my queen like this: ${q.cases} games` : `Every time only my king was left: ${k.lone} games`}
        <small>
          {path === "queen"
            ? `${q.on} times I stayed · ${q.saved} I did not lose (${q.won} won, ${q.drew} drew) · players in my exact situations: ${q.expected} · resigned ${q.resigned} (outlined)`
            : `${k.saved} I did not lose, ${k.stalemate} of them by stalemate · gave up ${k.gaveup} (outlined) · rapid games`}
        </small>
        {yours.length ? (
          <small className={c("ch-youChose")}>
            Below, in green, yours: {you.cases} games · stayed {you.on} · did not lose {you.saved} · players at your level: about {Math.round(you.expected)} · gave up at once {you.resigned + you.left} (outlined)
          </small>
        ) : null}
      </figcaption>
      <svg
        ref={unit}
        viewBox={`0 0 600 ${height}`}
        role="img"
        aria-label={`Mine: ${kinds.filter(x => x === "saved").length} saved of ${kinds.length}.${yours.length ? ` Yours: ${you.saved} saved of ${yours.length}.` : ""}`}
      >
        {kinds.map((kind, i) => (
          <rect key={i} x={(i % cols) * size + 2} y={Math.floor(i / cols) * size + 2} width={size - 4} height={size - 4} rx={3} data-kind={kind} className={c("ch-mineSquare")} />
        ))}
        {yours.length ? (
          <g className={c("ch-mineYou")}>
            <text x={0} y={herHeight + 42}>You</text>
            {yours.map((kind, i) => (
              <rect
                key={i}
                x={(i % yourCols) * yourSize + yourSize * 0.06}
                y={yourTop + Math.floor(i / yourCols) * yourSize + yourSize * 0.06}
                width={yourSize * 0.88}
                height={yourSize * 0.88}
                rx={Math.min(3, yourSize * 0.08)}
                data-kind={kind}
                className={c("ch-mineSquare")}
              />
            ))}
          </g>
        ) : null}
      </svg>
    </figure>
  )
}

// Where both paths meet: the two hundreds, with what the reader guessed for each.
const Meet = ({ guesses }) => (
  <figure className={c("ch-meet")}>
    {["queen", "king"].map(key => {
      const lit = 100 - paths[key].counts.lost
      return (
        <div key={key}>
          <p className={c("ch-meetTitle")}>{key === "queen" ? "A queen down" : "Only the king left"}</p>
          <p className={c("ch-bigShare")}>
            {lit} <span>in 100</span>
          </p>
          <Waffle lit={lit} label={`${lit} in 100 did not lose`} />
          {guesses[key] != null ? (
            <p className={c("ch-meetGuess")}>
              You guessed <b>{guesses[key]}</b>
            </p>
          ) : null}
        </div>
      )
    })}
    <figcaption>players at my level (rated {paths.queen.level}) who stayed and did not lose</figcaption>
  </figure>
)

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
const HUNDRED = { queen: ["guess", "play", "payoff", "taleb", "clock"], king: ["guess-king", "play-king", "payoff-king"] }
// what the hundred show at each of their steps
const modeOf = (path, now) => {
  const k = kindOf(now)
  return k === "taleb" ? "payoff" : k
}
const both = value => ({ queen: value, king: value })

export const Wrong = () => {
  const [guess, setGuess] = React.useState(both(30))
  const [guessed, setGuessed] = React.useState(both(false))
  const [revealed, setRevealed] = React.useState(both(0))
  const [played, setPlayed] = React.useState(both(false))
  const [decision, setDecision] = React.useState(both(null))
  useTell("decisions", decision)
  const [clockAt, setClockAt] = React.useState(3)
  const [step, setStep] = React.useState(0)
  // the lone king's hundred games come in after its beat only if the reader asks
  const [deeper, setDeeper] = React.useState(false)
  const NAMES = React.useMemo(() => namesOf(deeper), [deeper])
  // (with the reader's own count under her words, the step gets more room to read it in)
  const found = Boolean(useReader().chesscom)
  const still = useStill()
  const narrow = useNarrow()
  const name = NAMES[step] || "observation"
  const set = (setter, path, value) => setter(all => ({ ...all, [path]: typeof value === "function" ? value(all[path]) : value }))

  // the hundred play out once the reader reaches them, three games a beat (each beat
  // redraws the hundred, so fewer, larger beats keep it to about two seconds)
  const playing = kindOf(name) === "play" ? pathOf(name) : null
  React.useEffect(() => {
    if (!playing || revealed[playing] >= 100) return
    if (still) {
      set(setRevealed, playing, 100)
      return
    }
    const timer = window.setTimeout(() => set(setRevealed, playing, n => Math.min(100, n + 3)), revealed[playing] ? 50 : 320)
    return () => window.clearTimeout(timer)
  }, [playing, revealed, still])
  // what they came to is told once they have played out, not before (and stays told)
  React.useEffect(() => {
    for (const path of ["queen", "king"]) if (revealed[path] >= 100 && !played[path]) set(setPlayed, path, true)
  }, [revealed, played])

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
            It was <strong>{100 - paths[path].counts.lost}</strong>.
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

  // the reader's decision on the board: what it costs, said at once
  const said = path => (decision[path] === "Resign" ? "You resigned · −8" : decision[path] === "Play on" ? "You played on" : GAMES[path].first)

  return (
    <Pinned
      reading
      mark="when-things-go-wrong"
      className={c("ch-wrong")}
      label="What we do when things go wrong"
      steps={NAMES.map(n => ({ text: texts[n], ...(kindOf(n) === "outcome" || n === "king" ? { rest: 0.6 } : n === "mine" && found ? { rest: 0.5 } : {}) }))}
    >
      {at => {
        const now = NAMES[at] || "observation"
        return (
          <div className={c("ch-wrongScene")} data-path={pathOf(now)}>
            <StepSpy at={at} onStep={setStep} />
            <Show on={now === "observation"} className={c("ch-wrongLayer")}>
              <CcBoard
                fen={data.resigned.fen}
                colour={data.resigned.colour}
                rating={data.resigned.rating}
                oppRating={data.resigned.oppRating}
                top={`${day(data.resigned.date)} · I play ${side(data.resigned.colour)} · move ${data.resigned.move}`}
                say="Opponent resigned"
                label="The opponent, a queen down, resigned."
              />
            </Show>
            {/* the queen: the author's game, then the hundred, then her own games */}
            <Show on={now === "decide"} className={c("ch-wrongLayer")}>
              <GameBoard game={GAMES.queen} at={0} bottom={GAMES.queen.note} say={said("queen")} />
            </Show>
            <Show on={now === "outcome"} className={c("ch-wrongLayer")}>
              <PlayOut during={NAMES.indexOf("outcome")} game={GAMES.queen} />
            </Show>
            <Show on={now === "mine"} className={c("ch-wrongLayer")}>
              <Mine path="queen" />
            </Show>
            {/* the lone king: her game played out to the stalemate, in one beat */}
            <Show on={now === "king"} className={c("ch-wrongLayer")}>
              <PlayOut during={NAMES.indexOf("king")} game={GAMES.king} note={!narrow} />
            </Show>
            {["queen", "king"].map(path => (
              <Show key={path} on={HUNDRED[path].includes(now)} className={c("ch-wrongLayer")}>
                <Hundred
                  P={paths[path]}
                  path={path}
                  mode={modeOf(path, now)}
                  guess={guess[path]}
                  revealed={revealed[path]}
                  clockAt={clockAt}
                  choice={decision[path]}
                />
              </Show>
            ))}
            <Show on={now === "levels"} className={c("ch-wrongLayer")}>
              <Levels P={paths.queen} path="queen" />
            </Show>
            <Show on={now === "meet" || now === "you"} className={c("ch-wrongLayer")}>
              <Meet guesses={{ queen: guessed.queen ? guess.queen : null, king: guessed.king ? guess.king : null }} />
            </Show>
          </div>
        )
      }}
    </Pinned>
  )
}
