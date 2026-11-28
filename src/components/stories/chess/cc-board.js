"use client"

import * as React from "react"

import { c } from "./parts"

// A game as Chess.com draws it, without the phone: the opponent's bar above
// the board, the author's below, Chess.com's greens and its own pieces (cut
// from the author's screenshot), coordinates in the corner squares, the last
// move in yellow. The board is turned to the author's side, as Chess.com does.

const PIECE = letter => `/images/stories/chess/cc-${letter === letter.toUpperCase() ? "w" : "b"}${letter.toLowerCase()}.webp`
const LIGHT = "#eeeed2"
const DARK = "#769656"
const LAST = ["#f6f669", "#baca2b"]
const Q = 45

const squaresOf = fen => {
  const out = new Map()
  String(fen || "8/8/8/8/8/8/8/8")
    .split(" ")[0]
    .split("/")
    .forEach((rank, row) => {
      let file = 0
      for (const ch of rank) {
        if (/\d/.test(ch)) file += Number(ch)
        else out.set(row * 8 + file++, ch)
      }
    })
  return out
}

// The squares a move touched, from the positions before and after: the two
// squares of an ordinary move; for castling, the king's two.
export const lastMove = (before, after) => {
  if (!before || !after) return []
  const a = squaresOf(before)
  const b = squaresOf(after)
  const changed = []
  for (let i = 0; i < 64; i++) if (a.get(i) !== b.get(i)) changed.push(i)
  if (changed.length === 2) return changed
  const king = changed.filter(i => /k/i.test(a.get(i) || "") || /k/i.test(b.get(i) || ""))
  return king.length === 2 ? king : []
}

const Bar = ({ name, rating, mine }) => (
  <div className={c("ch-ccBar")} data-mine={mine ? "true" : undefined}>
    <i aria-hidden="true" data-dot={mine ? "me" : undefined} />
    <b>{name}</b>
    {rating ? <span>({rating})</span> : null}
  </div>
)

export const CcBoard = ({ fen, colour = "w", rating, oppRating, last = [], say, top, bottom, small = false, label }) => {
  const flip = colour === "b"
  const pieces = squaresOf(fen)
  const lit = new Set(last)
  const at = i => {
    const row = Math.floor(i / 8)
    const file = i % 8
    return flip ? [7 - file, 7 - row] : [file, row]
  }
  return (
    <figure className={c("ch-cc")} data-small={small ? "true" : undefined}>
      {top && !small ? <figcaption className={c("ch-ccNote")}>{top}</figcaption> : null}
      <Bar name="Opponent" rating={oppRating} />
      <div className={c("ch-ccBoardBox")}>
        <svg viewBox="0 0 360 360" role="img" aria-label={label || "A chess position"} data-fen={String(fen).split(" ")[0]}>
          {Array.from({ length: 64 }, (_, i) => {
            const [x, y] = at(i)
            const dark = (x + y) % 2 === 1
            return <rect key={i} x={x * Q} y={y * Q} width={Q} height={Q} fill={lit.has(i) ? LAST[dark ? 1 : 0] : dark ? DARK : LIGHT} />
          })}
          {small
            ? null
            : Array.from({ length: 8 }, (_, k) => (
                <React.Fragment key={k}>
                  <text x={2.5} y={k * Q + 10} className={c("ch-ccCoord")} fill={k % 2 ? LIGHT : DARK}>
                    {flip ? k + 1 : 8 - k}
                  </text>
                  <text x={k * Q + Q - 2.5} y={360 - 3} textAnchor="end" className={c("ch-ccCoord")} fill={k % 2 ? DARK : LIGHT}>
                    {"abcdefgh"[flip ? 7 - k : k]}
                  </text>
                </React.Fragment>
              ))}
          {[...pieces].map(([i, ch]) => {
            const [x, y] = at(i)
            return <image key={`${i}${ch}`} href={PIECE(ch)} x={x * Q} y={y * Q} width={Q} height={Q} />
          })}
        </svg>
        {say ? <span className={c("ch-ccSay")}>{say}</span> : null}
      </div>
      <Bar name="Me" rating={rating} mine />
      {bottom && !small ? <p className={c("ch-ccNote")}>{bottom}</p> : null}
    </figure>
  )
}
