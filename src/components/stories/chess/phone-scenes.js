"use client"

import * as React from "react"
import { c, PinSteps } from "./parts"
import { useFollow, useStill } from "./follow"

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

export const Message = () => {
  const box = React.useRef(null),
    bubble = React.useRef(null)
  const steps = React.useContext(PinSteps)
  const still = useStill()
  useFollow(
    () => {
      const card = steps?.current?.[0]?.firstElementChild
      if (!card) return 0
      return Math.max(
        0,
        Math.min(
          1,
          (window.innerHeight * 0.9 - card.getBoundingClientRect().top) /
            (window.innerHeight * 0.35),
        ),
      )
    },
    progress => {
      if (!bubble.current) return
      bubble.current.style.transform = `translate(-50%, -50%) scale(${still ? 1 : 0.55 + 0.45 * progress})`
      bubble.current.style.opacity = still
        ? "1"
        : String(0.78 + 0.22 * progress)
    },
    { still, watch: box },
  )
  return (
    <div className={c("ch-messagePhone")} ref={box} data-still={still}>
      <img
        src="/images/stories/chess/phone-empty.webp"
        width={800}
        height={1704}
        alt="A phone, with my message lifting out of its screen."
        decoding="async"
      />
      {/* when it was sent, as the screenshot shows it */}
      <p className={c("ch-messageTime")}>18 May 2026</p>
      <p className={c("ch-messagePop")} ref={bubble}>
        Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz
        😀
      </p>
    </div>
  )
}

// Part IV: the message that started it, and her answer, written on the blank
// phone as the page's own text (not a screenshot of any app): her bubble in
// the thread's clay, his in a quiet grey, the day above them.
export const Chat = () => (
  <div className={c("ch-chat")} role="img" aria-label="A phone showing two messages, 18 May 2026. His: “heyy, do you play on chess.com? what’s your rating on blitz? xd”. Mine: “Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀”.">
    <img src="/images/stories/chess/phone-empty.webp" width={800} height={1704} alt="" loading="lazy" decoding="async" />
    <div className={c("ch-chatScreen")} aria-hidden="true">
      <p className={c("ch-chatDay")}>18 May 2026</p>
      <p className={c("ch-chatTheirs")}>heyy, do you play on chess.com? what’s your rating on blitz? xd</p>
      <p className={c("ch-chatMine")}>Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz 😀</p>
    </div>
  </div>
)
