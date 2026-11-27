"use client"

import * as React from "react"

import { c, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard, InvestigationName } from "./investigation-parts"
import { useReader } from "./reader"
import { useStill } from "./follow"
import { readerGap } from "./ratings"
import { gently, header, Opening, paintOpening, pinOf, timeline, UNPINS, within } from "./opening"
import { Knots } from "./thread"
import ratings from "./ratings.json"

const S = ratings.scatter

// The three questions of Part III, come back to after each investigation:
// the boards of the choice screen (dive.js), each answered one in turn with
// her answer (clay; the words are hers, in the draft as hub-<id>) and the
// reader's own part in it (green; reader.js). Her clay dot moves on to the
// question just answered. After the third, all three together, before Part IV.

// The reader's answer, beside mine: one short phrase from their own Chess.com
// games, on the same measure as mine (owner, 27 Nov): their rating gap, what they
// do a queen down, how soon the computer finds them. Nothing about the guessing
// games, and no line (nor green dot) without their games.
const HIGHER = Math.round((1 - S.shareLower - S.points.filter(([r, b]) => b === r).length / S.points.length) * 100)
const yours = (id, said) => {
  if (id === "what-we-say") {
    const you = readerGap(said.chesscom)
    if (!you) return null
    return you.gap < 0 ? "Worse at fast chess too: ordinary." : you.gap > 0 ? `Better at fast chess: like ${HIGHER} in 100.` : "The same in both: rare."
  }
  if (id === "when-things-go-wrong") {
    const q = said.queens && said.chesscom && said.queens.username === said.chesscom.username ? said.queens : null
    if (!q?.cases) return null
    return q.on * 2 >= q.cases ? "You play on too." : "You mostly resign."
  }
  const dials = said.dials && said.chesscom && said.dials.username === said.chesscom.username ? said.dials : null
  const at30 = dials?.curve?.at(-1)
  if (at30 == null) return null
  return at30 >= 0.5 ? "Recognisable too." : "Hard to recognise."
}

// Each question opens with its first line under its name (opening.js); where its
// first step says more, the rest stays in the step.
const FIRST = { "when-things-go-wrong": "wrong-observation", "what-we-choose": "choose-question" }
// A recap between two questions holds the screen for GATE - 1 screens: about one to
// read it, then the next question opens, ending as the hold does.
const GATE = 3.6
const GLIDE_AT = GATE - 1 - UNPINS

// When a question ends, the questions answered so far come back: each board comes
// down from its place at the top left, with my conclusion beside my dot and the
// reader's sentence beside theirs (travellers.js: the travelling dots go to the
// question just ended; the ones before keep a dot of their own). After the last,
// all three, under "What the data said". Between two questions the recap then goes
// back up, and the next question's board comes down from its place to open it
// (opening.js).
const ARRIVE = [0.95, 0.45] // the boards come down as the recap's first row rises from 95% of the screen to 45%
const LEAVE = [0.6, 0.95] // and goes back up over these screens of the hold

export const Hub = ({ upto }) => {
  const said = useReader()
  const root = React.useRef(null)
  const stick = React.useRef(null)
  const items = React.useRef([])
  const spot = React.useRef(null)
  const still = useStill()
  const done = INVESTIGATIONS.slice(0, upto)
  const next = INVESTIGATIONS[upto]
  // between two questions the recap holds the screen; after the last it does not
  const gate = Boolean(next)
  // the opening is as wide as the story's column, not the recap's (opening.js, CSS)
  React.useLayoutEffect(() => {
    const node = root.current
    const story = node?.closest(`.${c("ch-story")}`)
    if (!story) return
    const fit = () => {
      const s = story.getBoundingClientRect()
      const r = node.getBoundingClientRect()
      node.style.setProperty("--story-l", `${(s.left - r.left).toFixed(1)}px`)
      node.style.setProperty("--story-r", `${(r.right - s.right).toFixed(1)}px`)
    }
    const observer = new ResizeObserver(fit)
    observer.observe(story)
    observer.observe(node)
    fit()
    return () => observer.disconnect()
  }, [])
  React.useEffect(() => {
    const node = root.current
    let frame = 0
    // the boards at the top left are shared by the three recaps: one only moves them
    // while it is showing them, and puts them back once when it stops
    let holding = false
    const update = () => {
      frame = 0
      const tabs = header()?.querySelectorAll("a") || []
      // screens scrolled since the recap filled the screen
      const s = Math.max(0, Math.min(GATE + 0.4, -node.getBoundingClientRect().top / window.innerHeight))
      const leave = gate ? (still ? (s > 0.8 ? 1 : 0) : gently(within(s, LEAVE[0], LEAVE[1]))) : 0
      // the answered questions' small boards come down into the recap together, as its
      // first row rises (on a phone the others are lower down), and go back together
      const y = (items.current[0]?.getBoundingClientRect().top ?? window.innerHeight) / window.innerHeight
      const arrive = still ? (y < 0.7 ? 1 : 0) : gently(within(ARRIVE[0] - y, 0, ARRIVE[0] - ARRIVE[1]))
      const q = arrive * (1 - leave)
      const mine = q > 0.001
      const touch = mine || holding
      holding = mine
      items.current.forEach((item, i) => {
        if (!item) return
        const board = item.querySelector("svg")
        item.style.setProperty("--here", q.toFixed(4))
        item.dataset.here = q > 0.999 ? "true" : "false"
        const tab = tabs[i]
        const svg = tab?.querySelector("svg")
        if (!svg || !touch) return
        // (measured on the link, which does not move, not on the board, which does)
        const from = tab.getBoundingClientRect()
        const to = board.getBoundingClientRect()
        const x = (to.left + to.width / 2 - (from.left + from.width / 2)) * q
        const yy = (to.top + to.height / 2 - (from.top + from.height / 2)) * q
        svg.style.transform = q > 0.001 && q < 0.999 ? `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px) scale(${(1 + (to.width / from.width - 1) * q).toFixed(4)})` : ""
        const away = q > 0.999 ? "here" : q > 0.001 ? "going" : "home"
        if (tab.dataset.away !== away) tab.dataset.away = away
      })
      // as the recap goes, the dots wait for the next question, not the last (travellers.js)
      const ahead = gate && leave > 0.001 ? "true" : "false"
      const top = header()
      if (top && top.dataset[`next${upto}`] !== ahead) top.dataset[`next${upto}`] = ahead
      if (gate) paintOpening({ scope: node, item: spot.current, spot: spot.current, index: upto, pin: pinOf(next.id), holder: stick.current, t: timeline(s - GLIDE_AT, still), fromSlot: true })
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
  return (
    <section ref={root} className={c("ch-hub")} data-gate={gate ? "true" : undefined} data-last={gate ? undefined : "true"} aria-label={gate ? `${upto} of ${INVESTIGATIONS.length} questions answered` : "What the data said"}>
      <div ref={stick} className={c("ch-hubStick")}>
        {gate ? null : <Text name="hub-title" look="partTitle" className={c("ch-hubTitle")} />}
        <ol className={c("ch-hubAll")} style={{ "--answered": done.length }}>
          {done.map((q, i) => {
            const latest = i === done.length - 1
            return (
              <li key={q.id} ref={node => { items.current[i] = node }} className={c("ch-hubOne")}>
                <span className={c("ch-hubBoard")}>
                  <InvestigationBoard id={q.id} />
                </span>
                <div className={c("ch-hubWords")}>
                  <h4 className={c("ch-hubName")}><InvestigationName id={q.id} /></h4>
                  {/* my conclusion beside my dot (only its first, bold sentence is shown); the
                      travelling dot comes to the question just ended, the others keep their own */}
                  <div className={c("ch-hubLine")}>
                    <b className={c("ch-dotMark", "ch-hubMark")} data-dot={latest ? "me" : undefined} data-who="me" />
                    <Text name={`hub-${q.id}`} className={c("ch-hubHer")} />
                    {/* after the last question the story's thread leaves from my dot, on into Part IV */}
                    {!gate && latest ? (
                      <Knots
                        of={{
                          b: [
                            ["-14px", "50%", "-14px", "50%"],
                            ["-34px", "calc(100% + 70px)", "-22px", "calc(100% + 60px)"],
                          ],
                        }}
                      />
                    ) : null}
                  </div>
                  {yours(q.id, said) ? (
                    <p className={c("ch-hubYou")}>
                      <b className={c("ch-dotMark", "ch-hubMark")} data-dot={latest ? "you" : undefined} data-who="you" />
                      {/* the reader's answer, highlighted like mine, in their green */}
                      <span><mark className={c("ch-hl", "ch-hl-you")}>{yours(q.id, said)}</mark></span>
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
        {/* the next question opens here: its board comes down from its place (opening.js) */}
        {gate ? (
          <Opening id={next.id} said={FIRST[next.id]} first index={upto} ref={spot}>
            <InvestigationBoard id={next.id} />
          </Opening>
        ) : null}
      </div>
    </section>
  )
}
