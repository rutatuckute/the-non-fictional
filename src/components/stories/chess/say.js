"use client"

import * as React from "react"

import { c } from "./parts"
import { GROUPS, truth } from "./crowd"

// The usernames game, on the chart itself (ratings.js places this over its
// SVG): each kind waits as a pile on the typical opponent's line, with
// "Lower" at its left and "Higher" at its right. A guess opens that row. The
// story never waits for an answer; rows not guessed open, without a verdict,
// once the reader scrolls on.
export const NameButtons = ({ bands, guesses, onGuess, open, top, narrow }) => (
  <div className={c("ch-nameButtons")} style={{ top }} data-open={open ? "true" : "false"} inert={!open} aria-hidden={!open}>
    {bands.map(b => {
      const g = b.group
      const value = guesses[g.key]
      const y = (b.bandTop + b.bandBottom) / 2
      return (
        <div key={g.key} role="group" aria-label={`${g.label}: lower or higher than a typical opponent?`} className={c("ch-nameGuess")}
          data-guessed={value ? "true" : "false"}>
          {[["lower", "← Lower", b.pileLeft - 8, "end"], ["higher", "Higher →", b.pileRight + 8, "start"]].map(([key, text, x, side]) => (
            <button key={key} type="button" className={c("ch-nameButton")} data-side={side} data-right={value === key ? String(key === truth(g)) : undefined}
              aria-pressed={value === key} disabled={Boolean(value)} onClick={() => onGuess(g.key, key)}
              style={{ top: y, left: x, transform: `translate(${side === "end" ? "-100%" : "0"}, -50%)` }}>
              {narrow ? text.replace(/ ?[←→] ?/, "") : text}
            </button>
          ))}
        </div>
      )
    })}
  </div>
)

export const NameScore = ({ guesses }) => {
  const answered = GROUPS.filter(g => guesses[g.key])
  if (!answered.length) return null
  const correct = answered.filter(g => guesses[g.key] === truth(g)).length
  return <p className={c("ch-nameScore")} role="status">You called {correct} of {answered.length}</p>
}
