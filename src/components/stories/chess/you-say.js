"use client"

import * as React from "react"

import { clocksOf, readRapid } from "./queens"
import { useReader } from "./reader"

// "What we say about ourselves", for the reader: two numbers from the rapid
// games already read at the hinge (you.js, queens.js keeps them for this
// reading), so nothing more is asked of Chess.com.
// - pace: the rule of pace.json (export_say_ideas.py, A7): ten-minute games
//   without increment, at least 20 half-moves; per game (600 minus their final
//   clock) divided by their own moves; then the median across games.
// - resigning: of their rapid games not won or drawn, the share they ended by
//   pressing resign (names_give_up.py's rule), and (28 Nov) how all of them
//   ended: resigned, checkmated, out of time, abandoned.
// Only the numbers and their counts are kept.

export const MIN_PACE_GAMES = 20
export const MIN_LOSSES = 20
const DRAWS = new Set(["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"])

const median = values => {
  const sorted = values.slice().sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export const measure = (games, username) => {
  const name = username.toLowerCase()
  const paces = []
  let losses = 0, resigned = 0
  const ends = { resigned: 0, checkmated: 0, timeout: 0, abandoned: 0 }
  for (const game of games) {
    const white = String(game.white?.username || "").toLowerCase() === name
    const black = String(game.black?.username || "").toLowerCase() === name
    if (white === black) continue
    const side = white ? game.white : game.black
    const result = side?.result
    if (result && result !== "win" && !DRAWS.has(result)) {
      losses += 1
      if (result === "resigned") resigned += 1
      if (result in ends) ends[result] += 1
    }
    if (game.time_control !== "600" || game.rules !== "chess") continue
    const clocks = clocksOf(game.pgn)
    if (clocks.length < 20) continue
    const own = clocks.filter((_, i) => (i % 2 === 0) === white)
    const last = own.filter(v => v != null).at(-1)
    if (last == null || !own.length) continue
    paces.push((600 - last) / own.length)
  }
  return {
    pace: paces.length >= MIN_PACE_GAMES ? { seconds: Math.round(median(paces) * 10) / 10, games: paces.length } : null,
    resign: losses >= MIN_LOSSES ? { share: resigned / losses, losses, resigned, ends } : null,
  }
}

// { pace, resign } once the reader's games are read, else null.
export const useYourSay = () => {
  const said = useReader()
  const name = said.chesscom?.username || null
  const ready = Boolean(name) && said.rapidRead === name
  const [value, setValue] = React.useState(null)
  React.useEffect(() => {
    setValue(null)
    if (!ready) return
    const working = new AbortController()
    readRapid(name, working.signal)
      .then(read => !working.signal.aborted && setValue(read.kind === "ok" ? measure(read.games, name) : null))
      .catch(() => {})
    return () => working.abort()
  }, [ready, name])
  return value
}
