"use client"

import * as React from "react"

import { c } from "./parts"
import { GROUPS, TYPICAL, truth } from "./crowd"

// The usernames, asked about in the words beside the crowd (crowd.js). The
// story never waits for an answer; rows not guessed are shown, without a
// verdict, once the reader scrolls on to the result.
// (on a phone the middle choice is shortened: its `short`)
const OPTIONS = [["lower", "Lower"], ["same", "About the same", "Same"], ["higher", "Higher"]]

// All four kinds at once, one compact row each: the guess places that row's
// dots on the rating line, and every row can be answered in any order.
export const NameAsks = ({ guesses, onChange }) => (
  <div className={c("ch-nameAsks")}>
    {GROUPS.map(group => {
      const value = guesses[group.key]
      const right = truth(group)
      return (
        <div key={group.key} className={c("ch-nameRow")}>
          <h4>{group.label}</h4>
          <p className={c("ch-nameExamples")}>
            {group.examples.map(name => <span key={name}>{name}<i aria-hidden="true">…</i></span>)}
          </p>
          <div className={c("ch-nameChoices")} role="group" aria-label={`Your guess: ${group.label.toLowerCase()}`}>
            {OPTIONS.map(([key, text, short]) => (
              <button key={key} type="button" className={c("ch-ask")} aria-pressed={value === key} onClick={() => onChange(group.key, key)}>
                {short ? (
                  <>
                    <span className={c("ch-nameLong")}>{text}</span>
                    <span className={c("ch-nameShort")}>{short}</span>
                  </>
                ) : (
                  text
                )}
              </button>
            ))}
          </div>
          <p className={c("ch-nameVerdict")} role="status" data-shown={value ? "true" : "false"}>
            {value ? (
              <>
                <strong>{value === right ? "You called it." : "Not quite."}</strong>
                <span className={c("ch-nameMore")}> Median {group.median}, against {TYPICAL} for a typical opponent.</span>
              </>
            ) : null}
          </p>
        </div>
      )
    })}
  </div>
)

export const NameScore = ({ guesses }) => {
  const answered = GROUPS.filter(g => guesses[g.key])
  if (!answered.length) return null
  const correct = answered.filter(g => guesses[g.key] === truth(g)).length
  return <p className={c("ch-nameScore")}>You called {correct} of {answered.length}.</p>
}
