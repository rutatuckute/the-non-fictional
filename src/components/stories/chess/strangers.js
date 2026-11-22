"use client"

import * as React from "react"

import { c } from "./parts"
import { PhonePosition, PHONE_GAMES } from "./phone-scenes"

// The strangers of Part II, on the same phone that rested under the chart
// (wooden.js moves it; this file draws what is on its screen and around it).
// An opponent is a username, a rating, a country and moves. These three are
// invented: none is anyone's username (checked against Chess.com's public
// player pages on 19 November 2026, where each was unknown), and how each is
// pictured is the author's imagination, said so on the page. `figure` names
// each one's picture, and `focus` the point in it (its hands) that the picture
// fades out around.
export const STRANGERS = [
  { name: "torre_torta_07", rating: 743, country: "Brazil", flag: "br", tone: "#6f5a4a", figure: "stranger-1", focus: "42% 46%", game: 0 },
  { name: "pawn_wala_19", rating: 812, country: "India", flag: "in", tone: "#4f5f6b", figure: "stranger-2", focus: "68% 42%", game: 1 },
  { name: "krzywy_goniec", rating: 905, country: "Poland", flag: "pl", tone: "#6a5266", figure: "stranger-4", focus: "36% 40%", game: 3 },
].map(stranger => ({ ...stranger, ...PHONE_GAMES[stranger.game] }))

// The board before anyone is found: the starting position, nothing played.
const SEARCHING = { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", clocks: ["10:00", "10:00"], last: "", move: "" }

// A country's flag, drawn: small enough that three simple ones are all it takes.
const FLAGS = {
  br: (
    <>
      <rect width="6" height="4" fill="#1f9a48" />
      <polygon points="3,0.45 5.5,2 3,3.55 0.5,2" fill="#f7d117" />
      <circle cx="3" cy="2" r="0.85" fill="#2a4b9b" />
    </>
  ),
  in: (
    <>
      <rect width="6" height="4" fill="#ffffff" />
      <rect width="6" height="1.34" fill="#f4a13a" />
      <rect y="2.66" width="6" height="1.34" fill="#1c8a3a" />
      <circle cx="3" cy="2" r="0.42" fill="none" stroke="#2a3f9b" strokeWidth="0.16" />
    </>
  ),
  pl: (
    <>
      <rect width="6" height="4" fill="#ffffff" />
      <rect y="2" width="6" height="2" fill="#d8323c" />
    </>
  ),
}
export const Flag = ({ of }) => (
  <svg className={c("ch-flag")} viewBox="0 0 6 4" aria-hidden="true">
    {FLAGS[of]}
  </svg>
)

// What the phone's screen shows: `who` is the stranger matched (-1 while it
// searches). The frame is phone-game.webp; the board, the bar and the clocks
// are written over it.
export const PhoneScreen = ({ who }) => {
  const game = who >= 0 ? STRANGERS[who] : SEARCHING
  return (
    <div className={c("ch-phoneBox")}>
      <img
        src="/images/stories/chess/phone-game.webp"
        srcSet="/images/stories/chess/phone-game-480.webp 480w, /images/stories/chess/phone-game.webp 800w"
        sizes="(max-width: 60rem) 45vw, 330px"
        alt=""
        width={800}
        height={1704}
        decoding="async"
      />
      <PhonePosition game={game} />
      <div className={c("ch-screen")} aria-hidden="true">
        <div className={c("ch-screenBar", "ch-searching")} data-on={who < 0 ? "true" : "false"}>
          <i />
          <b>Searching for opponent…</b>
        </div>
        {STRANGERS.map((each, index) => (
          <div key={each.name} className={c("ch-screenBar")} data-on={index === who ? "true" : "false"}>
            <i style={{ background: each.tone }} />
            <b>{each.name}</b>
            <span>({each.rating})</span>
            <Flag of={each.flag} />
          </div>
        ))}
        {game.move ? <span className={c("ch-phoneMove")}>{game.move}</span> : null}
        <span className={c("ch-clock")} data-whose="theirs">{game.clocks[0]}</span>
        <span className={c("ch-clock")} data-whose="mine">{game.clocks[1]}</span>
      </div>
    </div>
  )
}

// Beside the phone: who it is, and how the author pictures them. The picture
// draws itself in as it is imagined (`--drawn`, 0 to 1, written by wooden.js).
export const Pictured = React.forwardRef(function Pictured({ who }, ref) {
  return (
    <div className={c("ch-pictured")} ref={ref} aria-hidden="true">
      {STRANGERS.map((each, index) => (
        <div key={each.name} className={c("ch-who")} data-on={index === who ? "true" : "false"} data-who={index}>
          <b>{each.name}</b>
          <span>
            <Flag of={each.flag} />
            {each.rating}
          </span>
          <img
            src={`/images/stories/chess/${each.figure}.webp`}
            srcSet={`/images/stories/chess/${each.figure}-300.webp 300w, /images/stories/chess/${each.figure}.webp 520w`}
            sizes="(max-width: 60rem) 40vw, 220px"
            alt=""
            decoding="async"
            style={{ "--at": each.focus }}
          />
          <em>imagined</em>
        </div>
      ))}
    </div>
  )
})

export const STRANGERS_LABEL = `Three invented opponents, one after another, each with a game in progress on the phone and pictured beside it as the author imagines them: ${STRANGERS.map(
  each => `${each.name}, rated ${each.rating}, ${each.country}`,
).join("; ")}.`

// Each stranger's life crosses the story's for one game: a grey thread comes
// in from the edge of the screen, through the phone, and away by another edge.
// `ways` are [from, to] as shares of the stage, wide screens then narrow ones.
const WAYS = [
  [[[0.56, -0.02], [-0.02, 0.86]], [[1.02, 0.34], [-0.02, 0.92]]],
  [[[-0.02, 0.2], [0.5, 1.02]], [[-0.02, 0.4], [0.72, 1.02]]],
  [[[0.08, 1.02], [0.6, -0.02]], [[0.2, 1.02], [1.02, 0.46]]],
]
export const crossing = (index, narrow, width, height, through) => {
  const [[x0, y0], [x1, y1]] = WAYS[index][narrow ? 1 : 0]
  const a = [x0 * width, y0 * height]
  const b = [x1 * width, y1 * height]
  const [cx, cy] = through
  // through the phone's middle, leaving it the way it came in, softly
  return `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${((a[0] + cx) / 2).toFixed(1)},${cy.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)} T${b[0].toFixed(1)},${b[1].toFixed(1)}`
}

// 2,007 games, 1,938 different people: one faint thread for each, each from
// one edge to another, the same every time (seeded).
export const PEOPLE = 1938
export const strands = (width, height) => {
  let h = 2166136261
  const random = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
  const edge = () => {
    const side = Math.floor(random() * 4)
    const t = random()
    return side === 0 ? [t * width, -4] : side === 1 ? [width + 4, t * height] : side === 2 ? [t * width, height + 4] : [-4, t * height]
  }
  return Array.from({ length: PEOPLE }, () => {
    const a = edge()
    let b = edge()
    while (Math.hypot(b[0] - a[0], b[1] - a[1]) < Math.min(width, height) * 0.5) b = edge()
    const m = [(a[0] + b[0]) / 2 + (random() - 0.5) * width * 0.5, (a[1] + b[1]) / 2 + (random() - 0.5) * height * 0.5]
    return [a, m, b]
  })
}
