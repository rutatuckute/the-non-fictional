"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, Guess, Pinned, PinSteps, Show, stepLine, Text } from "./parts"
import { PhonePosition } from "./phone-scenes"
import data from "./wrong.json"

// Part III, second question: what we do when things go wrong. On the same
// phone as Part II: an opponent who loses the queen and resigns; then the
// reader is put in the author's place, a queen down on move 9 (her game of 22
// Sep 2026, lost by the engine), and asked; then the rest of that game plays
// out as the reader scrolls, to the opponent's resignation 37 moves later.
// Then what players do, a hundred at a time, by rating (wrong.json, from
// explore_resign.py); then her own games, in the thread's clay; and the
// stalemate of 25 Apr 2026, her lone king against three queens.
//
// Colours, as everywhere in Part III: clay is the author, ivory and grey are
// other people, the reader's choices are the light buttons.

const D = data.decision
const H = data.her
const placement = fen => String(fen || "8/8/8/8/8/8/8/8").split(" ")[0]

// The phone, its screen showing a position: the opponent's bar at the top
// says only their rating (no names); `say` lies across the board.
const PhoneGame = ({ fen, rating, say, moves }) => (
  <div className={c("ch-wrongPhone")}>
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

// A hundred players, as pawns: what they did after losing the queen.
const KINDS = [
  ["resigned", "resigned"],
  ["left", "left the game"],
  ["lost", "played on, lost"],
  ["saved", "played on, saved"],
]
const PAWN =
  "M12 2.5a5 5 0 0 1 3.2 8.85c1 .5 1.8 1.2 1.8 2.15 0 .7-.5 1.2-1.3 1.5.3 3.4 1.6 6 4 8.2.8.8 1.3 1.6 1.3 2.6V27.5H3V25.8c0-1 .5-1.8 1.3-2.6 2.4-2.2 3.7-4.8 4-8.2-.8-.3-1.3-.8-1.3-1.5 0-.95.8-1.65 1.8-2.15A5 5 0 0 1 12 2.5Z"
const hundred = band => {
  const counts = KINDS.map(([key]) => Math.round(band[key] * 100))
  counts[2] += 100 - counts.reduce((a, b) => a + b, 0)
  return counts.flatMap((n, i) => Array.from({ length: n }, () => KINDS[i][0]))
}
const Crowd = ({ index, onIndex, focus }) => {
  const band = data.bands[index]
  const pawns = hundred(band)
  const onShare = band.saved / (band.saved + band.lost)
  return (
    <figure className={c("ch-crowd")} data-focus={focus ? "saved" : undefined}>
      <figcaption className={c("ch-crowdTitle")}>
        After losing the queen, rated {band.band}
        <small>100 players, as {band.n.toLocaleString("en-GB")} in the sample did</small>
      </figcaption>
      <div className={c("ch-crowdPawns")} role="img" aria-label={KINDS.map(([key, label]) => `${Math.round(band[key] * 100)} ${label}`).join(", ")}>
        {pawns.map((kind, i) => (
          <svg key={i} viewBox="0 0 24 30" data-kind={kind} aria-hidden="true">
            <path d={PAWN} />
          </svg>
        ))}
      </div>
      <ul className={c("ch-crowdKey")}>
        {KINDS.map(([key, label]) => (
          <li key={key} data-kind={key}>
            <b>{Math.round(band[key] * 100)}</b> {label}
          </li>
        ))}
      </ul>
      <p className={c("ch-crowdOn")}>Of those who played on, {Math.round(onShare * 100)}% were saved.</p>
      <div className={c("ch-crowdBands")} role="group" aria-label="Rating">
        {data.bands.map((b, i) => (
          <button key={b.band} type="button" className={c("ch-ask")} aria-pressed={i === index} onClick={() => onIndex(i)}>
            {b.band}
          </button>
        ))}
      </div>
    </figure>
  )
}

// The author's own: every game in which she lost her queen, one clay pawn
// each, those she saved lit.
const Hers = () => (
  <figure className={c("ch-hers")}>
    <figcaption className={c("ch-crowdTitle")}>
      My rapid games a queen down
      <small>
        {H.lostQueen} games · {H.saved} saved ({H.won} won, {H.drew} drawn)
      </small>
    </figcaption>
    <div className={c("ch-crowdPawns")} role="img" aria-label={`${H.lostQueen} games a queen down, ${H.saved} saved`}>
      {Array.from({ length: H.lostQueen }, (_, i) => (
        <svg key={i} viewBox="0 0 24 30" data-kind={i < H.saved ? "mine" : "minelost"} aria-hidden="true">
          <path d={PAWN} />
        </svg>
      ))}
    </div>
  </figure>
)

// The rest of the 22 Sep game, a position per stretch of scrolling.
const PlayOut = ({ during }) => {
  const steps = React.useContext(PinSteps)
  const still = useStill()
  const [at, setAt] = React.useState(0)
  const box = React.useRef(null)
  useFollow(
    () => {
      const node = steps?.current?.[during]
      if (!node) return 0
      return Math.max(0, Math.min(1, (stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 1.1)))
    },
    // (kept to the game's own positions whatever the scroll reports, even after a long jump)
    p => setAt(still ? D.fens.length - 1 : Math.max(0, Math.min(D.fens.length - 1, Math.round((Number.isFinite(p) ? p : 0) * (D.fens.length - 1))))),
    { still, watch: box },
  )
  const done = at >= D.fens.length - 1
  // the move just made: White's on the even plies from the decision, Black's on the odd
  const ply = at - 1
  const shown = at ? `${D.move + Math.floor(ply / 2)}${ply % 2 ? "…" : "."} ${D.sans[ply]}` : `${D.move}.`
  return (
    <div ref={box}>
      <PhoneGame
        fen={D.fens[at]}
        rating={D.oppRating}
        moves={shown}
        say={done ? "Opponent resigned" : null}
      />
    </div>
  )
}

export const Wrong = ({ guess }) => {
  const [band, setBand] = React.useState(2)
  return (
    <Pinned
      reading
      mark="when-things-go-wrong"
      className={c("ch-wrong")}
      label="What we do when things go wrong"
      steps={[
        { text: <Text name="wrong-observation" look="lead" /> },
        {
          text: (
            <>
              <Text name="wrong-decide" look="lead" />
              <Guess label="Your decision" options={["Resign", "Play on"]} {...guess} />
            </>
          ),
        },
        { text: <Text name="wrong-outcome" look="lead" />, rest: 0.6 },
        { text: <Text name="wrong-crowd" look="lead" /> },
        { text: <Text name="wrong-right" look="lead" /> },
        { text: <Text name="wrong-you" look="lead" /> },
        { text: <Text name="wrong-stalemate" look="lead" /> },
      ]}
    >
      {step => (
        <div className={c("ch-wrongScene")}>
          <Show on={step === 0} className={c("ch-wrongLayer")}>
            <PhoneGame fen={data.resigned.fen} rating={data.resigned.oppRating} moves={`${data.resigned.move}. …`} say="Opponent resigned" />
          </Show>
          <Show on={step === 1} className={c("ch-wrongLayer")}>
            <PhoneGame fen={D.fens[0]} rating={D.oppRating} moves={`${D.move}.`} say={guess.value ? `You chose: ${guess.value.toLowerCase()}` : "Your queen is gone"} />
          </Show>
          <Show on={step === 2} className={c("ch-wrongLayer")}>
            <PlayOut during={2} />
          </Show>
          <Show on={step === 3 || step === 4} className={c("ch-wrongLayer")}>
            <Crowd index={band} onIndex={setBand} focus={step === 4} />
          </Show>
          <Show on={step === 5} className={c("ch-wrongLayer")}>
            <Hers />
          </Show>
          <Show on={step === 6} className={c("ch-wrongLayer")}>
            <PhoneGame fen={data.stalemate.fen} rating={data.stalemate.oppRating} moves={`${data.stalemate.moves + 1}.`} say="Stalemate" />
          </Show>
        </div>
      )}
    </Pinned>
  )
}
