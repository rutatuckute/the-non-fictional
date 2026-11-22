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

// Small original vector silhouettes, legible at the phone's scale.
const SHAPES = {
  p: "M22.5 7a6 6 0 1 1 0 12 6 6 0 0 1 0-12ZM17 21h11l3 13H14ZM12 35h21v4H12Z",
  r: "M10 7h6v6h4V7h5v6h4V7h6v12l-5 4 2 11H13l2-11-5-4ZM10 35h25v4H10Z",
  b: "M23 6c-7 6-10 10-10 14 0 4 4 6 9 6s10-2 10-6c0-4-4-9-9-14ZM17 27h11l4 7H13ZM10 35h25v4H10Z",
  n: "M13 8l8 4c10 0 14 10 13 22H13c0-6 7-9 11-12l-9 4-7-4 7-9ZM10 35h26v4H10Z",
  q: "M8 13l8 6 6-10 7 10 8-6-6 19H14ZM12 33h21v3H12ZM10 37h25v3H10Z",
  k: "M20 5h5v5h5v5h-5v5h-5v-5h-5v-5h5ZM12 22c-6-9 5-13 10-2 5-11 17-7 11 2l-4 11H16ZM12 34h21v3H12ZM10 38h25v3H10Z",
}

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
            fill={
              square === game.last
                ? "#c6d57e"
                : (file + row) % 2
                  ? "#78964e"
                  : "#ebedcf"
            }
          />
        )
      })}
      {pieces.map(({ piece, file, row }) => (
        <g
          key={`${file}-${row}`}
          transform={`translate(${file * 45} ${row * 45})`}
          fill={piece === piece.toUpperCase() ? "#f8f5e9" : "#555851"}
          stroke="#292c27"
          strokeWidth="1.3"
          strokeLinejoin="round"
        >
          <path d={SHAPES[piece.toLowerCase()]} />
          {piece.toLowerCase() === "b" && <path d="m23 12-5 8" fill="none" />}
          {piece.toLowerCase() === "n" && (
            <circle cx="19" cy="17" r="1.2" fill="#292c27" stroke="none" />
          )}
        </g>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <g
          key={i}
          fill={i % 2 ? "#ebedcf" : "#78964e"}
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
      <p className={c("ch-messagePop")} ref={bubble}>
        Hey! I do, but I only play 10/10min games, I would be soooo bad at blitz
        😀
      </p>
    </div>
  )
}
