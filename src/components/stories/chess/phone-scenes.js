"use client"

import * as React from "react"
import { c, PinSteps } from "./parts"
import { useFollow, useStill } from "./follow"
import { useIsHim } from "./reader"

// Illustrative legal positions for the invented opponents, not records of
// particular games. Opening, developed opening, opposite-side castling, and
// a queenless middlegame. All four are White to move.
export const PHONE_GAMES = [
  {
    fen: "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQK2R",
    clocks: ["08:42", "09:06"],
    last: "d6",
    move: "5… d6",
  },
  {
    fen: "r1bq1rk1/p4ppp/1pnbpn2/2pp4/3P4/2PBPNB1/PP1N1PPP/R2QK2R",
    clocks: ["07:18", "06:54"],
    last: "b6",
    move: "8… b6",
  },
  {
    fen: "r2q1rk1/3nbppp/p2pbn2/1p2p3/4P1P1/1NN1BP2/PPPQ3P/2KR1B1R",
    clocks: ["04:37", "05:12"],
    last: "b5",
    move: "11… b5",
  },
  {
    fen: "r3k2r/2p1n1pp/1p1bbp2/p1p5/P3P3/2N1B3/1PPN1PPP/R2R2K1",
    clocks: ["02:16", "01:43"],
    last: "e7",
    move: "13… Ne7",
  },
]

// Chess.com's own pieces, cut from the author's first-game screenshot
// (scripts/stories/chess/make-phone-pieces.cjs), on Chess.com's own greens.
const PIECE = letter => `/images/stories/chess/cc-${letter === letter.toUpperCase() ? "w" : "b"}${letter.toLowerCase()}.webp`
const LIGHT = "#eeeed2"
const DARK = "#769656"
const LAST = ["#f6f669", "#baca2b"]

export const PhonePosition = ({ game }) => {
  const pieces = []
  game.fen.split("/").forEach((rank, row) => {
    let file = 0
    for (const piece of rank) {
      if (/\d/.test(piece)) file += Number(piece)
      else {
        pieces.push({ piece, file, row })
        file++
      }
    }
  })
  return (
    <svg
      className={c("ch-phonePosition")}
      viewBox="0 0 360 360"
      aria-hidden="true"
      data-fen={game.fen}
    >
      {Array.from({ length: 64 }, (_, i) => {
        const file = i % 8,
          row = Math.floor(i / 8),
          square = `${"abcdefgh"[file]}${8 - row}`
        return (
          <rect
            key={i}
            x={file * 45}
            y={row * 45}
            width={45}
            height={45}
            fill={square === game.last ? LAST[(file + row) % 2] : (file + row) % 2 ? DARK : LIGHT}
          />
        )
      })}
      {pieces.map(({ piece, file, row }) => (
        <image key={`${file}-${row}`} href={PIECE(piece)} x={file * 45} y={row * 45} width={45} height={45} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <g
          key={i}
          fill={i % 2 ? LIGHT : DARK}
          fontFamily="system-ui, sans-serif"
          fontSize="6"
        >
          <text x={i * 45 + 39} y="358">
            {"abcdefgh"[i]}
          </text>
          <text x="2" y={i * 45 + 7}>
            {8 - i}
          </text>
        </g>
      ))}
    </svg>
  )
}

// The message that starts the first question, on its own: no phone, just the day,
// the message she answers (its words held back until Part IV) and her bubble. Until the words come (`revealed`) the bubble is a placeholder
// of the same size, so the message does not jump when it is read; then it
// collapses into the point on the rating line where it was sent.
export const Message = ({ collapse = 0, target, revealed = true }) => {
  const him = useIsHim()
  const box = React.useRef(null),
    bubble = React.useRef(null)
  const steps = React.useContext(PinSteps)
  const still = useStill()
  const paint = progress => {
    if (!bubble.current) return
    const node = box.current, pop = bubble.current
    const grow = still ? 1 : 0.55 + 0.45 * progress
    const rect = node.getBoundingClientRect(), parent = node.offsetParent.getBoundingClientRect()
    // where the bubble sits when untransformed, in the stage's own coordinates
    const cx = rect.left - parent.left + pop.offsetLeft + pop.offsetWidth / 2
    const cy = rect.top - parent.top + pop.offsetTop + pop.offsetHeight / 2
    const dx = target ? target.x - cx : 0
    const dy = target ? target.y - cy : 0
    pop.style.transform = `translate(${still ? 0 : dx * collapse}px, ${still ? 0 : dy * collapse}px) scale(${still ? 1 : grow * (1 - collapse) + 10 / pop.offsetWidth * collapse}, ${still ? 1 : grow * (1 - collapse) + 10 / pop.offsetHeight * collapse})`
    pop.style.borderRadius = `${22 + collapse * 120}px`
    pop.style.opacity = String(1 - Math.max(0, (collapse - 0.85) / 0.15))
  }
  React.useLayoutEffect(() => { paint(1) }, [collapse, target?.x, target?.y, still])
  useFollow(
    () => {
      const card = steps?.current?.[0]?.firstElementChild
      return card ? Math.max(0, Math.min(1, (window.innerHeight * 0.9 - card.getBoundingClientRect().top) / (window.innerHeight * 0.35))) : 0
    }, paint, { still, watch: box },
  )
  return (
    <div className={c("ch-sayMessage")} ref={box} data-still={still} role="img"
      aria-label={revealed ? "My answer to a message, 18 May 2026: “Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀”" : "A message and my answer, 18 May 2026, not yet shown."}>
      {/* the day it was sent: no hour */}
      <p className={c("ch-sayMessageDay")} style={{ opacity: 1 - Math.min(1, collapse * 2) }}>18 May 2026</p>
      {/* the message mine answers: its words are kept for the end (Part IV) */}
      <p className={c("ch-sayTheirs")} style={{ opacity: 1 - Math.min(1, collapse * 2) }} aria-hidden="true">
        <i /><i />
        {/* his dot, if he is the one reading (reader.js) */}
        {him ? <b className={c("ch-dotMark", "ch-dotBeside")} data-dot="you" /> : null}
      </p>
      <p className={c("ch-sayBubble")} ref={bubble} data-revealed={revealed ? "true" : "false"}>
        {/* my dot waits beside my message (travellers.js) */}
        <b className={c("ch-dotMark", "ch-dotBeside")} data-dot="me" />
        <span className={c("ch-sayBubbleText")} style={{ opacity: 1 - Math.min(1, collapse * 3) }}>
          <span aria-hidden="true">Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀</span>
        </span>
      </p>
    </div>
  )
}

// Part IV: the message that started it, and her answer, drawn as at the start
// of Part III (Message, above): no phone, just the day, his message in a quiet
// grey, now with its words, and hers in the thread's clay. His grows in as the
// reader comes to it, as hers did there.
export const Chat = () => {
  const him = useIsHim()
  const box = React.useRef(null)
  const bubble = React.useRef(null)
  const still = useStill()
  useFollow(
    () => Math.max(0, Math.min(1, (window.innerHeight * 0.9 - box.current.getBoundingClientRect().top) / (window.innerHeight * 0.35))),
    progress => {
      bubble.current.style.transform = `scale(${still ? 1 : 0.55 + 0.45 * progress})`
      bubble.current.style.opacity = still ? "1" : String(0.78 + 0.22 * progress)
    },
    { still, watch: box },
  )
  return (
    <div className={c("ch-sayMessage", "ch-chat")} ref={box} data-still={still} role="img" aria-label="Two messages, 18 May 2026. His: “heyy, do you play on chess.com? what’s your rating on blitz? xd”. Mine: “Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀”.">
      <p className={c("ch-sayMessageDay")} aria-hidden="true">18 May 2026</p>
      <p className={c("ch-sayTheirs", "ch-chatTheirs")} ref={bubble} aria-hidden="true">
        {/* his green dot again, now beside his words (no dot travels in Part IV: it simply waits here) */}
        {him ? <b className={c("ch-dotMark", "ch-dotBeside", "ch-dotYou")} /> : null}
        heyy, do you play on chess.com? what’s your rating on blitz? xd
      </p>
      <p className={c("ch-sayBubble")} aria-hidden="true">
        {/* my dot beside my words, as at the start of Part III (drawn: nothing travels here) */}
        <b className={c("ch-dotMark", "ch-dotBeside", "ch-dotMe")} />
        Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀
      </p>
    </div>
  )
}
