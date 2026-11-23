"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, Guess, Pinned, PinSteps, Show, stepLine, Text } from "./parts"
import { PhonePosition } from "./phone-scenes"
import data from "./wrong.json"
import paths from "./wrong-paths.json"

// Part III, second question: what we do when things go wrong. On the same
// phone as Part II: an opponent who loses the queen and resigns. Then the
// reader picks one of two ways a game goes wrong, a queen down in the middle
// of the game or only the king left at the end, and walks it:
//   decide   the author's own game, on the phone, and the reader's choice
//   outcome  the rest of that game, as the reader scrolls
//   guess    100 real games of players at her level (rapid, rated 600–799):
//            how many of those who played on did not lose?
//   play     the hundred play out, with what they cost in rating
//   payoff   the same hundred as a chart: resigning is −8 every time;
//            playing on is the same −8 at worst, 0 for a draw, +8 for a win
//   taleb    the same chart, read as optionality
//   levels   by rating: who gives up at once, and who is saved by staying
//   clock    one lever, the other player's clock
//   mine     her own games of that kind
//   (queen)  the stalemate she counts as better than losing
//   meet     both paths side by side
//   you      her own words, and the way to the other path
// (wrong-paths.json from analysis/export_wrong_paths.py; wrong.json from
// export_wrong.py for the phone scenes.)
//
// Colours: clay is the author; data green, games that were saved; lavender,
// resigning; grey, games lost; the reader's guess is light. The boards the
// reader decides on are Chess.com's own (the phone); the hundred are marks in
// a chart, so they stay quiet.

const D = data.decision
const KG = paths.kingGame
const HER = paths.her
const placement = fen => String(fen || "8/8/8/8/8/8/8/8").split(" ")[0]
const pct = v => `${Math.round(v * 100)}%`
const signed = v => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : "0")

// The author's two games, from the moment it went wrong to the end.
const GAMES = {
  queen: {
    fens: D.fens,
    oppRating: D.oppRating,
    label: at => {
      const ply = at - 1
      return at ? `${D.move + Math.floor(ply / 2)}${ply % 2 ? "…" : "."} ${D.sans[ply]}` : `${D.move}.`
    },
    end: "Opponent resigned",
    first: "Your queen is gone",
  },
  king: {
    fens: KG.fens,
    oppRating: KG.oppRating,
    label: at => KG.labels[at],
    end: "Stalemate",
    first: "Only your king is left",
  },
}

// The phone, its screen showing a position: the opponent's bar at the top
// says only their rating (no names); `say` lies across the board.
const PhoneGame = ({ fen, rating, say, moves, small = false }) => (
  <div className={c("ch-wrongPhone")} data-small={small ? "true" : undefined}>
    <div className={c("ch-phoneBox")}>
      <img
        src="/images/stories/chess/phone-game.webp"
        srcSet="/images/stories/chess/phone-game-480.webp 480w, /images/stories/chess/phone-game.webp 800w"
        sizes="(max-width: 60rem) 45vw, 320px"
        alt=""
        width={800}
        height={1704}
        decoding="async"
      />
      <PhonePosition game={{ fen: placement(fen), last: "" }} />
      <div className={c("ch-screen")} aria-hidden="true">
        <div className={c("ch-screenBar")} data-on="true">
          <i style={{ background: "#55524d" }} />
          <b>Opponent</b>
          <span>({rating})</span>
        </div>
        {moves ? <span className={c("ch-phoneMove")}>{moves}</span> : null}
      </div>
      {say ? <span className={c("ch-wrongSay")}>{say}</span> : null}
    </div>
  </div>
)

// The two ways in, side by side; either phone picks its path.
const Fork = ({ path, onPath }) => (
  <div className={c("ch-wrongFork")}>
    {[
      ["queen", "A queen down", "in the middle of the game", D.fens[0], D.oppRating],
      ["king", "Only the king left", "at the end", KG.fens[0], KG.oppRating],
    ].map(([key, title, sub, fen, rating]) => (
      <button key={key} type="button" className={c("ch-wrongWay")} aria-pressed={path === key} onClick={() => onPath(key)}>
        <PhoneGame fen={fen} rating={rating} small />
        <b>{title}</b>
        <span>{sub}</span>
      </button>
    ))}
  </div>
)

// The rest of the author's game, a position per stretch of scrolling.
const PlayOut = ({ during, game }) => {
  const steps = React.useContext(PinSteps)
  const still = useStill()
  const [at, setAt] = React.useState(0)
  const box = React.useRef(null)
  const last = game.fens.length - 1
  useFollow(
    () => {
      const node = steps?.current?.[during]
      if (!node) return 0
      return Math.max(0, Math.min(1, (stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 1.1)))
    },
    // (kept to the game's own positions whatever the scroll reports, even after a long jump)
    p => setAt(still ? last : Math.max(0, Math.min(last, Math.round((Number.isFinite(p) ? p : 0) * last)))),
    { still, watch: box },
  )
  return (
    <div ref={box}>
      <PhoneGame fen={game.fens[Math.min(at, last)]} rating={game.oppRating} moves={game.label(Math.min(at, last))} say={at >= last ? game.end : null} />
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
const Mini = ({ fen, flip }) => (
  <>
    <rect width={MINI} height={MINI} fill="url(#ch-wrong-check)" />
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

const Board = React.memo(function Board({ fen, flip, state, x, y, scale, delay, title }) {
  return (
    <g className={c("ch-hBoard")} data-state={state} style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transitionDelay: `${delay}ms` }}>
      <title>{title}</title>
      <Mini fen={fen} flip={flip} />
      <rect width={MINI} height={MINI} className={c("ch-hTint")} />
    </g>
  )
})

const Hundred = ({ P, path, mode, guess, revealed }) => {
  const boards = React.useMemo(() => boardsOf(P), [P])
  const rank = React.useMemo(() => {
    const sorted = boards.slice().sort((a, b) => a.value - b.value || a.change - b.change)
    return new Map(sorted.map((b, k) => [b.i, k]))
  }, [boards])
  const chart = mode === "payoff"
  const step = (PLOT.x1 - PLOT.x0) / 100
  const scale = (step * 0.92) / MINI
  const counts = P.counts
  const lost = counts.lost
  const drew = counts.drew + counts.stalemate
  const shown = chart ? 100 : mode === "play" ? revealed : 0
  const done = boards.filter(b => AFTER.get(b.i) < shown)
  const saved = done.filter(b => b.end !== "lost").length
  const on = Math.round(done.reduce((a, b) => a + b.change, 0))
  const res = Math.round(done.reduce((a, b) => a + b.resign, 0))
  const what = path === "queen" ? "a queen down" : "only the king left"
  return (
    <figure className={c("ch-hundred")} data-mode={mode}>
      <figcaption className={c("ch-hundredTitle")}>
        {chart ? (
          <>
            What each game cost or earned
            <small>rating points, as on Chess.com: −8 a loss, 0 a draw, +8 a win</small>
          </>
        ) : (
          <>
            100 players rated {P.level}, {what}
            <small>
              {mode === "guess"
                ? `Your guess: ${guess} of 100 did not lose`
                : shown >= 100
                  ? `${saved} of 100 did not lose. You guessed ${guess}.`
                  : `${shown} of 100 played out · ${saved} did not lose`}
            </small>
          </>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={`100 games, ${what}: ${100 - lost} did not lose, ${lost} lost.`}>
        <defs>
          <pattern id="ch-wrong-check" width={MINI / 4} height={MINI / 4} patternUnits="userSpaceOnUse">
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
          <text x={PLOT.x0} y={PLOT.y(8) + 30} className={c("ch-payoffNote")} data-kind="dim">
            On average, playing on: {(P.ratingOn / 100).toFixed(1)} a game; resigning: {(P.ratingResign / 100).toFixed(1)}
          </text>
          <rect x={PLOT.x0} y={548} width={PLOT.x1 - PLOT.x0} height={5} rx={2.5} className={c("ch-payoffPrice")} />
          <text x={PLOT.x0} y={576} className={c("ch-payoffNote")} data-kind="dim">
            The price of staying: about {Math.round(P.moves)} more moves a game. Nothing else.
          </text>
        </g>
        {boards.map(b => {
          const k = rank.get(b.i)
          const x = chart ? PLOT.x0 + k * step + (step - MINI * scale) / 2 : (b.i % 10) * 60 + 4
          const y = chart ? PLOT.y(b.value) - (MINI * scale) / 2 : Math.floor(b.i / 10) * 60 + 4
          const over = AFTER.get(b.i) < shown
          const state = chart ? `${b.end === "lost" ? "lost" : "saved"}-mark` : over ? (b.end === "lost" ? "lost" : "saved") : mode === "guess" && b.i < guess ? "guessed" : "open"
          return (
            <Board
              key={b.i}
              fen={over || chart ? b.final : b.fen}
              flip={b.flip}
              state={state}
              x={x}
              y={y}
              scale={chart ? scale : 1}
              delay={(chart ? k : 99 - k) * 5}
              title={`A player rated ${b.rating}, ${path === "queen" ? "queen lost" : "king left alone"} on move ${b.move}${over || chart ? `: ${b.end === "lost" ? "lost" : b.end === "won" ? "won" : b.end === "stalemate" ? "stalemate" : "drew"}, ${b.after} more moves` : ""}`}
            />
          )
        })}
      </svg>
      {mode === "play" ? (
        <p className={c("ch-hundredSum")}>
          Played on: <b>{signed(on)}</b> rating points · had they all resigned: <b>{signed(res)}</b>
        </p>
      ) : null}
    </figure>
  )
}

// By rating: who gave up at once, and of those who stayed, who did not lose.
const Levels = ({ P, path }) => {
  const R = P.byLevel
  const top = path === "queen" ? 0.3 : 0.45
  const x0 = 96
  const xs0 = 360
  const x1 = 572
  const rh = 40
  const bar = v => (v / 0.6) * (xs0 - 40 - x0)
  const dot = v => xs0 + (v / top) * (x1 - xs0)
  return (
    <figure className={c("ch-levels")}>
      <figcaption className={c("ch-hundredTitle")}>
        By rating
        <small>{path === "queen" ? "a queen down" : "only the king left"} · rapid games of the sample</small>
      </figcaption>
      <svg viewBox={`0 0 600 ${R.length * rh + 70}`} role="img" aria-label={R.map(r => `${r.band}: ${pct(r.resigned)} gave up at once, ${pct(r.saved)} of those who stayed did not lose`).join("; ")}>
        <text x={x0} y={20} className={c("ch-levelsHead")}>{path === "queen" ? "Resigned at once" : "Gave up at once"}</text>
        <text x={xs0} y={20} className={c("ch-levelsHead")}>Stayed, did not lose</text>
        {[0, top / 3, (2 * top) / 3, top].map(v => (
          <g key={v}>
            <line x1={dot(v)} x2={dot(v)} y1={34} y2={34 + R.length * rh} className={c("ch-payoffGrid")} />
            <text x={dot(v)} y={52 + R.length * rh} textAnchor="middle" className={c("ch-payoffTick")}>{pct(v)}</text>
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

const Clock = ({ P, at }) => {
  const [, share, n] = P.clock.find(g => g[0] === at) || P.clock[P.clock.length - 1]
  const lit = Math.round(share * 100)
  return (
    <figure className={c("ch-lever")}>
      <figcaption className={c("ch-hundredTitle")}>
        Their clock: {P.clockLabels[at]}
        <small>players rated under 800 who stayed · {n.toLocaleString("en-GB")} games</small>
      </figcaption>
      <p className={c("ch-bigShare")}>
        {lit} <span>in 100 did not lose</span>
      </p>
      <Waffle lit={lit} label={`${lit} in 100 did not lose`} />
    </figure>
  )
}

// Her own games of the path's kind, one square each.
const Mine = ({ path }) => {
  const q = HER.queen
  const k = HER.king
  const kinds =
    path === "queen"
      ? [...Array(q.saved).fill("saved"), ...Array(q.on - q.saved).fill("lost"), ...Array(q.resigned).fill("gave")]
      : [...Array(k.saved).fill("saved"), ...Array(k.lone - k.saved - k.gaveup).fill("lost"), ...Array(k.gaveup).fill("gave")]
  const cols = path === "queen" ? 12 : 20
  const size = 600 / cols
  return (
    <figure className={c("ch-mine")}>
      <figcaption className={c("ch-hundredTitle")}>
        {path === "queen" ? `Every time I lost my queen like this: ${q.cases} games` : `Every time only my king was left: ${k.lone} games`}
        <small>
          {path === "queen"
            ? `${q.on} times I stayed · ${q.saved} I did not lose (${q.won} won, ${q.drew} drew) · players in my exact situations: ${q.expected} · resigned ${q.resigned} (outlined)`
            : `${k.saved} I did not lose, ${k.stalemate} of them by stalemate · gave up ${k.gaveup} (outlined) · every time control`}
        </small>
      </figcaption>
      <svg viewBox={`0 0 600 ${Math.ceil(kinds.length / cols) * size}`} role="img" aria-label={`${kinds.filter(x => x === "saved").length} saved of ${kinds.length}`}>
        {kinds.map((kind, i) => (
          <rect key={i} x={(i % cols) * size + 2} y={Math.floor(i / cols) * size + 2} width={size - 4} height={size - 4} rx={3} data-kind={kind} className={c("ch-mineSquare")} />
        ))}
      </svg>
    </figure>
  )
}

// Where both paths meet.
const Meet = ({ path }) => (
  <figure className={c("ch-meet")}>
    {["queen", "king"].map(key => {
      const lit = 100 - paths[key].counts.lost
      return (
        <div key={key} data-on={key === path ? "true" : "false"}>
          <p className={c("ch-meetTitle")}>{key === "queen" ? "A queen down" : "Only the king left"}</p>
          <p className={c("ch-bigShare")}>
            {lit} <span>in 100</span>
          </p>
          <Waffle lit={lit} label={`${lit} in 100 did not lose`} />
        </div>
      )
    })}
    <figcaption>players rated {paths.queen.level} who stayed and did not lose</figcaption>
  </figure>
)

const GUESS_STEP = 4

// Tells the scene which step the reader is on (the controls in the texts need it too).
const StepSpy = ({ at, onStep }) => {
  React.useEffect(() => onStep(at), [at, onStep])
  return null
}

export const Wrong = ({ guess }) => {
  const [path, setPath] = React.useState("queen")
  const [hundredGuess, setHundredGuess] = React.useState(30)
  const [revealed, setRevealed] = React.useState(0)
  const [clockAt, setClockAt] = React.useState(3)
  const [step, setStep] = React.useState(0)
  const still = useStill()
  const P = paths[path]
  const game = GAMES[path]
  const other = path === "queen" ? "king" : "queen"

  // switching paths: the hundred start again; from further on, back to the guess
  const choose = (key, jump = false) => {
    if (key === path && !jump) return
    setPath(key)
    setRevealed(0)
    setClockAt(3)
    if (jump || step > GUESS_STEP) {
      window.requestAnimationFrame(() => {
        // a third of the way from the guess's card to the next one: past the line, whatever the screen
        const pin = document.querySelector('section[aria-label="What we do when things go wrong"]')
        const node = pin?.querySelector(`[data-step="${GUESS_STEP}"]`)
        const next = pin?.querySelector(`[data-step="${GUESS_STEP + 1}"]`)
        if (node && next) {
          // (the step counts from its card, as the scene does)
          const a = (node.firstElementChild || node).getBoundingClientRect().top
          const b = (next.firstElementChild || next).getBoundingClientRect().top
          window.scrollTo({ top: window.scrollY + a + (b - a) / 3 - stepLine(), behavior: still ? "auto" : "smooth" })
        }
      })
    }
  }

  const names = [
    "observation", "fork", "decide", "outcome", "guess", "play", "payoff", "taleb", "levels", "clock", "mine",
    ...(path === "queen" ? ["stalemate"] : []),
    "meet", "you",
  ]
  const name = names[step] || "observation"

  // the hundred play out once the reader reaches them, one game at a time
  React.useEffect(() => {
    if (name !== "play" || revealed >= 100) return
    if (still) {
      setRevealed(100)
      return
    }
    const timer = window.setTimeout(() => setRevealed(n => Math.min(100, n + 1)), revealed ? 28 : 320)
    return () => window.clearTimeout(timer)
  }, [name, revealed, still])

  const k = path === "king" ? "-king" : ""
  const texts = {
    observation: <Text name="wrong-observation" look="lead" />,
    fork: (
      <>
        <Text name="wrong-fork" look="lead" />
        <Guess label="Which way" options={["A queen down", "Only the king left"]} value={path === "queen" ? "A queen down" : "Only the king left"} onChange={v => choose(v === "A queen down" ? "queen" : "king")} />
      </>
    ),
    decide: (
      <>
        <Text name={`wrong-decide${k}`} look="lead" />
        <Guess label="Your decision" options={["Resign", "Play on"]} {...guess} />
      </>
    ),
    outcome: <Text name={`wrong-outcome${k}`} look="lead" />,
    guess: (
      <>
        <Text name={`wrong-guess${k}`} look="lead" />
        <label className={c("ch-wrongRange")}>
          <span>
            <b>{hundredGuess}</b> of 100
          </span>
          <input type="range" min={0} max={100} value={hundredGuess} onChange={e => setHundredGuess(Number(e.target.value))} aria-label="Your guess: how many of the 100 did not lose" />
        </label>
      </>
    ),
    play: (
      <>
        <Text name={`wrong-play${k}`} look="lead" />
        <div className={c("ch-guess")}>
          <button type="button" onClick={() => setRevealed(0)}>Play them out again</button>
        </div>
      </>
    ),
    payoff: <Text name="wrong-payoff" look="lead" />,
    taleb: <Text name={`wrong-taleb${k}`} look="lead" />,
    levels: <Text name={`wrong-levels${k}`} look="lead" />,
    clock: (
      <>
        <Text name={`wrong-clock${k}`} look="lead" />
        <Guess label="Their clock" options={[3, 2, 1, 0].map(i => P.clockLabels[i])} value={P.clockLabels[clockAt]} onChange={v => setClockAt(P.clockLabels.indexOf(v))} />
      </>
    ),
    mine: <Text name={`wrong-mine${k}`} look="lead" />,
    stalemate: <Text name="wrong-stalemate" look="lead" />,
    meet: <Text name="wrong-meet" look="lead" />,
    you: (
      <>
        <Text name="wrong-you" look="lead" />
        <div className={c("ch-guess")}>
          <button type="button" onClick={() => choose(other, true)}>
            Walk the other path: {other === "queen" ? "a queen down" : "only the king left"}
          </button>
        </div>
      </>
    ),
  }

  return (
    <Pinned
      reading
      mark="when-things-go-wrong"
      className={c("ch-wrong")}
      label="What we do when things go wrong"
      steps={names.map(n => ({ text: texts[n], ...(n === "outcome" ? { rest: 0.6 } : {}) }))}
    >
      {at => {
        const now = names[at] || "observation"
        const hundred = ["guess", "play", "payoff", "taleb"].includes(now)
        return (
          <div className={c("ch-wrongScene")} data-path={path}>
            <StepSpy at={at} onStep={setStep} />
            <Show on={now === "observation"} className={c("ch-wrongLayer")}>
              <PhoneGame fen={data.resigned.fen} rating={data.resigned.oppRating} moves={`${data.resigned.move}. …`} say="Opponent resigned" />
            </Show>
            <Show on={now === "fork"} className={c("ch-wrongLayer")}>
              <Fork path={path} onPath={choose} />
            </Show>
            <Show on={now === "decide"} className={c("ch-wrongLayer")}>
              <PhoneGame fen={game.fens[0]} rating={game.oppRating} moves={game.label(0)} say={guess.value ? `You chose: ${guess.value.toLowerCase()}` : game.first} />
            </Show>
            <Show on={now === "outcome"} className={c("ch-wrongLayer")}>
              <PlayOut key={path} during={names.indexOf("outcome")} game={game} />
            </Show>
            <Show on={hundred} className={c("ch-wrongLayer")}>
              <Hundred key={path} P={P} path={path} mode={now === "taleb" ? "payoff" : hundred ? now : "guess"} guess={hundredGuess} revealed={revealed} />
            </Show>
            <Show on={now === "levels"} className={c("ch-wrongLayer")}>
              <Levels P={P} path={path} />
            </Show>
            <Show on={now === "clock"} className={c("ch-wrongLayer")}>
              <Clock P={P} at={clockAt} />
            </Show>
            <Show on={now === "mine"} className={c("ch-wrongLayer")}>
              <Mine path={path} />
            </Show>
            <Show on={now === "stalemate"} className={c("ch-wrongLayer")}>
              <PhoneGame fen={data.stalemate.fen} rating={data.stalemate.oppRating} moves={`${data.stalemate.moves + 1}.`} say="Stalemate" />
            </Show>
            <Show on={now === "meet" || now === "you"} className={c("ch-wrongLayer")}>
              <Meet path={path} />
            </Show>
          </div>
        )
      }}
    </Pinned>
  )
}
