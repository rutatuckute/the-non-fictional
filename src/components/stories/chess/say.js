"use client"

import * as React from "react"

import { c, Text } from "./parts"
import say from "./say.json"

// B1's guesses and B2's evidence, joined: anonymous patterns, one choice per
// group, then the corresponding row. Nothing is revealed merely by scrolling.
const GROUPS = say.names.groups
const OPTIONS = ["Rated lower", "About the same", "Rated higher"]
const truth = g =>
  g.high < 0.5 ? "Rated lower" : g.low > 0.5 ? "Rated higher" : "About the same"
const number = share => (share * 10).toFixed(1)
const PAWN =
  "M12 2.5a5 5 0 0 1 3.2 8.85c1 .5 1.8 1.2 1.8 2.15 0 .7-.5 1.2-1.3 1.5.3 3.4 1.6 6 4 8.2.8.8 1.3 1.6 1.3 2.6V27.5H3V25.8c0-1 .5-1.8 1.3-2.6 2.4-2.2 3.7-4.8 4-8.2-.8-.3-1.3-.8-1.3-1.5 0-.95.8-1.65 1.8-2.15A5 5 0 0 1 12 2.5Z"

const Pawns = ({ share }) => (
  <span className={c("ch-pawns")} aria-hidden="true">
    {Array.from({ length: 10 }, (_, i) => {
      const lit = Math.max(0, Math.min(1, share * 10 - i))
      return (
        <svg key={i} viewBox="0 0 24 30">
          <path d={PAWN} className={c("ch-pawnOff")} />
          {lit > 0 ? (
            <path
              d={PAWN}
              className={c("ch-pawnOn")}
              style={{ clipPath: `inset(0 ${(1 - lit) * 100}% 0 0)` }}
            />
          ) : null}
        </svg>
      )
    })}
  </span>
)

// One group's answer, as pawns: out of ten opponents with such a name, how
// many are rated above a typical opponent. Other people are drawn in ivory.
const Result = ({ group, choice }) => (
  <div className={c("ch-nameResult")}>
    <div className={c("ch-nameResultHead")}>
      <span>{group.label}</span>
      <b>
        {choice ? number(group.above) : "?"} <small>in 10</small>
      </b>
    </div>
    <Pawns share={choice ? group.above : 0} />
    {choice ? (
      <p className={c("ch-nameVerdict")}>
        {choice === truth(group) ? "You called it." : "A different story."} <strong>{truth(group)}.</strong>{" "}
        <span>
          Likely {number(group.low)}–{number(group.high)} in 10 · {group.people.toLocaleString("en-GB")} people
        </span>
      </p>
    ) : (
      <p className={c("ch-nameVerdict")} data-waiting="true">Make a guess to see.</p>
    )}
  </div>
)

const Baseline = () => (
  <div className={c("ch-nameBaseline")}>
    <div className={c("ch-nameResultHead")}>
      <span>Any opponent</span>
      <b>
        5 <small>in 10</small>
      </b>
    </div>
    <Pawns share={0.5} />
  </div>
)

export const Usernames = () => {
  const [guesses, setGuesses] = React.useState({})
  const [announcement, setAnnouncement] = React.useState("")
  const answered = GROUPS.filter(g => guesses[g.key])
  const correct = answered.filter(g => guesses[g.key] === truth(g)).length
  const complete = answered.length === GROUPS.length
  const select = (g, choice) => {
    setGuesses(before => ({ ...before, [g.key]: choice }))
    setAnnouncement(
      `${g.label}: ${choice === truth(g) ? "you called it" : "a different story"}. ${number(g.above)} in ten rated above a typical opponent; ${truth(g).toLowerCase()}.`,
    )
  }

  // One group at a time, as the reader scrolls: its names and a guess at
  // the left, its pawns against any opponent's at the right, shown once guessed.
  return (
    <section className={c("ch-usernames")} id="what-names-say" aria-labelledby="names-title">
      <header className={c("ch-namesIntro")}>
        <h3 id="names-title" className={c("ch-navHidden")}>What usernames say</h3>
        <Text name="say-guess" look="lead" />
      </header>
      {GROUPS.map((g, index) => (
        <div key={g.key} className={c("ch-nameRow")} data-answered={Boolean(guesses[g.key])}>
          <div className={c("ch-nameAsk")}>
            <p className={c("ch-nameCount")}>{index + 1} of {GROUPS.length}</p>
            <h4>{g.label}</h4>
            <p className={c("ch-nameExamples")}>
              {g.examples.map(name => (
                <span key={name}>
                  {name}
                  <i aria-hidden="true">…</i>
                </span>
              ))}
            </p>
            <p className={c("ch-namePrompt")}>Compared with a typical opponent, they are…</p>
            <div className={c("ch-nameChoices")} role="group" aria-label={`Your guess: ${g.label.toLowerCase()}`}>
              {OPTIONS.map(option => (
                <button key={option} type="button" className={c("ch-ask")} aria-pressed={guesses[g.key] === option} onClick={() => select(g, option)}>
                  <i aria-hidden="true" />
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={c("ch-nameShow")} aria-hidden={guesses[g.key] ? undefined : "true"}>
            <Result group={g} choice={guesses[g.key]} />
            <Baseline />
          </div>
        </div>
      ))}
      <div className={c("ch-namesAfter")}>
        {complete ? (
          <div className={c("ch-nameFinding")}>
            <p className={c("ch-nameScore")}>You called {correct} of 4.</p>
            <Text name="say-surprise" look="lead" />
          </div>
        ) : null}
        <p className={c("ch-nameMethod")}>
          Rapid games · July–September 2026 · each opponent counted once per game met. A typical opponent is rated {say.names.typical}: half are above,
          half below. Names above are patterns, not individual players. Ranges show the uncertainty from resampling people within each group (95% interval).
        </p>
        <Text name="say-limits" look="lead" className={c("ch-nameBridge")} />
      </div>
      <p className={c("ch-navHidden")} role="status">
        {announcement}
      </p>
    </section>
  )
}
