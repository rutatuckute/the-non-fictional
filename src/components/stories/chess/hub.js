"use client"

import * as React from "react"

import { GROUPS, truth } from "./crowd"
import { c, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard } from "./investigation-parts"
import { useReader } from "./reader"
import { useStill } from "./follow"
import { readerGap } from "./ratings"
import { gently, header, Opening, paintOpening, pinOf, timeline, UNPINS, within } from "./opening"
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

// Each question opens with its first line under its name (opening.js); where its
// first step says more, the rest stays in the step.
const FIRST = { "when-things-go-wrong": "wrong-observation", "what-we-choose": "choose-question" }
// A recap between two questions holds the screen for GATE - 1 screens: about one to
// read it, then the next question opens, ending as the hold does.
const GATE = 3.6
const GLIDE_AT = GATE - 1 - UNPINS

export const Hub = ({ upto }) => {
  const said = useReader()
  const root = React.useRef(null)
  const stick = React.useRef(null)
  const still = useStill()
  // the dot sets off from the question before once the hub is in view
  const [arrived, setArrived] = React.useState(false)
  const spot = React.useRef(null)
  // After the first and second questions the recap holds the screen, and as the reader
  // goes on, the next question opens (opening.js). After the last, the three small
  // boards at the top left come down into the recap's three instead.
  const gate = upto < INVESTIGATIONS.length
  const all = upto === INVESTIGATIONS.length
  React.useEffect(() => {
    const node = root.current
    const next = INVESTIGATIONS[upto]
    let frame = 0
    const update = () => {
      frame = 0
      if (gate) {
        // screens scrolled since the recap filled the screen
        const s = Math.max(0, Math.min(GATE + 0.4, -node.getBoundingClientRect().top / window.innerHeight))
        paintOpening({ scope: node, item: node.querySelector('li[data-state="next"]'), spot: spot.current, index: upto, pin: pinOf(next.id), holder: stick.current, t: timeline(s - GLIDE_AT, still) })
        return
      }
      // the last recap: the three come down from the top left as its row comes up
      // (from 95% of the screen to 55%), each into its own board here
      const top = header()
      if (!top) return
      const y = node.querySelector("ol").getBoundingClientRect().top / window.innerHeight
      const q = still ? (y < 0.75 ? 1 : 0) : gently(within(0.95 - y, 0, 0.4))
      const targets = node.querySelectorAll("li a svg")
      top.querySelectorAll("a").forEach((tab, i) => {
        const svg = tab.querySelector("svg")
        const to = targets[i]?.getBoundingClientRect()
        if (!svg || !to) return
        // (measured on the link, which does not move, not on the board, which does)
        const from = tab.getBoundingClientRect()
        const x = (to.left + to.width / 2 - (from.left + from.width / 2)) * q
        const yy = (to.top + to.height / 2 - (from.top + from.height / 2)) * q
        svg.style.transform = q > 0 ? `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px) scale(${(1 + (to.width / from.width - 1) * q).toFixed(4)})` : ""
      })
      const returning = q > 0.001 ? "true" : "false"
      const returned = q > 0.999 ? "true" : "false"
      if (top.dataset.returning !== returning) top.dataset.returning = returning
      if (top.dataset.returned !== returned) top.dataset.returned = returned
      node.dataset.returned = returned
    }
    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    return () => {
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [gate, upto, still])
  React.useEffect(() => {
    const node = stick.current
    if (!node) return
    const seen = new IntersectionObserver(([entry]) => entry.isIntersecting && setArrived(true), { threshold: 0.5 })
    seen.observe(node)
    return () => seen.disconnect()
  }, [])
  const at = arrived || upto === 1 ? upto - 1 : upto - 2
  return (
    <section ref={root} className={c("ch-hub")} data-all={all ? "true" : "false"} data-gate={gate ? "true" : undefined} aria-label={all ? "What the data said" : `${upto} of ${INVESTIGATIONS.length} questions answered`}>
      <div ref={stick} className={c("ch-hubStick")}>
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
                <InvestigationBoard id={q.id} />
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
      {/* the next question opens here, as the recap goes (opening.js) */}
      {gate ? <Opening id={INVESTIGATIONS[upto].id} said={FIRST[INVESTIGATIONS[upto].id]} first ref={spot} /> : null}
      </div>
    </section>
  )
}
