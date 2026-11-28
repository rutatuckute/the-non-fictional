"use client"

import * as React from "react"

import { c } from "./parts"
import { GROUPS, activeKind, diffWords, truth } from "./crowd"

// The usernames game, in the words' column beside the chart (owner, 28 Nov): the
// chart is where the reader looks, the words are where they think and choose.
// One pair of buttons asks about one kind of username at a time; an answer opens
// that kind's row on the chart (its rating difference to a typical opponent), says here whether the reader called it, and moves on to the next.
// Words by place: "better or worse" is the human question (the buttons, here);
// "higher or lower" the statistical answer (the chart's axis and its numbers).
// The story never waits for an answer: rows not answered open once the reader
// scrolls on (scenes.js).
const WORD = { lower: "Worse", higher: "Better" }
const HOLD = 1700 // ms the answer stays before the next kind is asked

export const NameQuiz = ({ guesses, onGuess }) => {
  const active = activeKind(guesses)
  // the kind just answered, held a moment so its answer can be read
  const [just, setJust] = React.useState(null)
  React.useEffect(() => {
    if (!just) return
    const timer = setTimeout(() => setJust(null), HOLD)
    return () => clearTimeout(timer)
  }, [just])
  const answer = (key, value) => { onGuess(key, value); setJust(key) }

  const answered = GROUPS.filter(g => guesses[g.key])
  const correct = answered.filter(g => guesses[g.key] === truth(g)).length
  const shown = just ? GROUPS.find(g => g.key === just) : GROUPS.find(g => g.key === active)
  const index = shown ? GROUPS.indexOf(shown) : GROUPS.length

  if (!shown) {
    return (
      <div className={c("ch-nameQuiz")} data-done="true">
        <p className={c("ch-nameQuizScore")} role="status">You called {correct} of {GROUPS.length}.</p>
      </div>
    )
  }
  const value = guesses[shown.key]
  const right = value ? value === truth(shown) : null
  return (
    <div className={c("ch-nameQuiz")} role="group" aria-label={`${shown.label}: better or worse than a typical opponent?`}>
      <p className={c("ch-nameQuizCount")}>{index + 1} of {GROUPS.length}</p>
      <p className={c("ch-nameQuizKind")}>{shown.label}</p>
      <p className={c("ch-nameQuizExamples")}>{shown.examples.slice(0, 3).join(" · ")}</p>
      {value ? (
        <div className={c("ch-nameQuizAnswer")} role="status" data-right={String(right)}>
          <p className={c("ch-nameQuizVerdict")}>{right ? `✓ ${WORD[truth(shown)]}, as you said.` : `✗ Actually ${WORD[truth(shown)].toLowerCase()}.`}</p>
          <p className={c("ch-nameQuizData")}>{diffWords(shown)}</p>
        </div>
      ) : (
        <div className={c("ch-nameQuizButtons")}>
          {["lower", "higher"].map(key => (
            <button key={key} type="button" className={c("ch-nameButton")} onClick={() => answer(shown.key, key)}>{WORD[key]}</button>
          ))}
        </div>
      )}
    </div>
  )
}
