"use client"

import * as React from "react"

import { GROUPS, truth } from "./crowd"
import { c, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard } from "./investigation-parts"
import { useReader } from "./reader"
import { readerGap } from "./ratings"
import { Knots } from "./thread"
import paths from "./wrong-paths.json"

// The three questions of Part III, come back to after each investigation:
// the boards of the choice screen (dive.js), each answered one in turn with
// her answer (clay; the words are hers, in the draft as hub-<id>) and the
// reader's own part in it (green; reader.js). Her clay dot moves on to the
// question just answered. After the third, all three together, before Part IV.

const inHundred = v => Math.round(v * 100)
const pathRate = key => {
  const p = paths[key]
  return { resign: inHundred(p.resigned), on: inHundred(1 - p.resigned - p.left) }
}

const yours = (id, said) => {
  if (id === "what-we-say") {
    const names = said.names || {}
    const answered = GROUPS.filter(g => names[g.key])
    const guessed = answered.length
      ? `You called ${answered.filter(g => names[g.key] === truth(g)).length} of ${answered.length} usernames.`
      : "You didn’t guess the usernames."
    // with their Chess.com ratings (you.js), their own gap too
    const you = readerGap(said.chesscom)
    if (!you) return guessed
    const gap = you.gap === 0 ? "the same in both formats" : `${Math.abs(you.gap)} points ${you.gap < 0 ? "lower" : "higher"} in fast chess`
    return `On Chess.com you’re ${gap}. ${guessed}`
  }
  if (id === "when-things-go-wrong") {
    const decision = said.decisions || {}
    const told = [
      ["queen", "A queen down"],
      ["king", "With a lone king"],
    ]
      .filter(([key]) => decision[key])
      .map(([key, when], i) => {
        const rate = pathRate(key)
        const who = i === 0 ? " players at my level" : ""
        return decision[key] === "Resign" ? `${when}, you resigned, like ${rate.resign} in 100${who}.` : `${when}, you played on, like ${rate.on} in 100${who}.`
      })
    // with their own games counted (you.js), what they did when it happened
    const q = said.queens && said.chesscom && said.queens.username === said.chesscom.username ? said.queens : null
    const decided = told.length ? told.join(" ") : "You didn’t decide."
    return q ? `${decided} On Chess.com you lost your queen like this ${q.cases} times, stayed ${q.on} and saved ${q.saved}.` : decided
  }
  // the game (reveal.js): the three rounds, the random lineups, her, and
  // themselves; with their own games read (you.js), how soon they are found
  const game = said.choose
  const dials = said.dials && said.chesscom && said.dials.username === said.chesscom.username ? said.dials : null
  const at30 = dials?.curve?.at(-1)
  const known = at30 == null ? "" : ` From thirty of your games, the computer finds you ${Math.round(at30 * 100)} times in 100.`
  if (!game) return dials ? `You didn’t play the game.${known}` : "You didn’t play the game."
  const rounds = game.rounds.map((hit, i) => (hit == null ? null : [["one game", "ten games", "thirty games"][i], hit])).filter(Boolean)
  const found = rounds.filter(([, hit]) => hit).map(([n]) => n)
  const parts = []
  if (rounds.length) parts.push(found.length ? `You found the stranger from ${found.join(" and ")}.` : "You didn’t find the stranger.")
  if (game.played.n) parts.push(`With players drawn at random, you found ${game.played.you} of ${game.played.n}; the computer, ${game.played.cpu}.`)
  if (game.findme != null) parts.push(game.findme ? "And you found me." : "And you missed me.")
  if (game.findyou != null) parts.push(game.findyou ? "You found yourself." : "You didn’t find yourself.")
  return parts.join(" ") + known
}

export const Hub = ({ upto }) => {
  const said = useReader()
  const root = React.useRef(null)
  // the dot sets off from the question before once the hub is in view
  const [arrived, setArrived] = React.useState(false)
  React.useEffect(() => {
    const node = root.current
    if (!node) return
    const seen = new IntersectionObserver(([entry]) => entry.isIntersecting && setArrived(true), { threshold: 0.5 })
    seen.observe(node)
    return () => seen.disconnect()
  }, [])
  const at = arrived || upto === 1 ? upto - 1 : upto - 2
  const all = upto === INVESTIGATIONS.length
  return (
    <section ref={root} className={c("ch-hub")} data-all={all ? "true" : "false"} aria-label={all ? "What the data said" : `${upto} of ${INVESTIGATIONS.length} questions answered`}>
      {all ? <Text name="hub-title" look="partTitle" className={c("ch-hubTitle")} /> : null}
      <div className={c("ch-hubRow")} style={{ "--at": at }}>
      <span className={c("ch-hubTravel")} aria-hidden="true" />
      {/* after the last question the story's thread leaves from the last dot, on into Part IV */}
      {all ? (
        <Knots
          of={{
            b: [
              ["calc(100% * 5 / 6)", "calc(var(--hub-board) * 84 / 80 + 13px)", 8, "100%"],
              ["97%", "calc(var(--hub-board) * 84 / 80 + 7px)", 8, "100%"],
              ["104%", "calc(var(--hub-board) * 84 / 80 + 90px)", 8, "100%"],
              ["104%", "100%", 8, "100%"],
            ],
          }}
        />
      ) : null}
      <ol className={c("ch-hubBoards")}>
        {INVESTIGATIONS.map((q, i) => {
          const state = i < upto ? "done" : i === upto ? "next" : "later"
          return (
            <li key={q.id} data-state={state} data-here={i === at ? "true" : "false"}>
              <a href={`#${q.id}`} className={c("ch-hubBoard")} aria-label={q.label}>
                <InvestigationBoard id={q.id} compact />
                <span className={c("ch-hubDot")} aria-hidden="true" />
              </a>
              <div className={c("ch-hubWords")}>
                <h4>{q.id === "what-we-choose" ? <>What our <em>choices</em> reveal</> : q.label}</h4>
                {state === "done" ? (
                  <>
                    <Text name={`hub-${q.id}`} className={c("ch-hubHer")} />
                    <p className={c("ch-hubYou")}>{yours(q.id, said)}</p>
                  </>
                ) : (
                  <p className={c("ch-hubNext")}>{state === "next" ? "Next" : "Still to come"}</p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      </div>
    </section>
  )
}
