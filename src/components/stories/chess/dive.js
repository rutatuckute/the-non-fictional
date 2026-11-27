"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, PinSteps, stepLine, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard, InvestigationName } from "./investigation-parts"
import { gently, header, Opening, paintOpening, pinOf, timeline, within } from "./opening"

// Continue the original club scene: its existing board and grid zoom together.
// Only the investigation choices are rendered here, over that same pinned stage.
// The first question then opens as every question does (opening.js).
const GLIDE_AT = 1.25

export const Dive = ({ during }) => {
  const root = React.useRef(null)
  const spot = React.useRef(null)
  const steps = React.useContext(PinSteps)
  const still = useStill()
  // where the scroll is in this step, in screens: the dive to the boards in the first
  // 1.1, then (if the reader just goes on) the first board moves to the middle and the
  // first question's name comes up under it, over its own scene (dimmed); on the next
  // scroll the board flies up to the top left, where it stays as the first of the
  // three, and the question's first line comes
  const goal = () => {
    const node = steps?.current?.[during]
    if (!node) return 0
    return Math.max(0, Math.min(3.7, (stepLine() - node.getBoundingClientRect().top) / window.innerHeight))
  }
  const paint = x => {
    const dive = still ? 0 : gently(within(x, 0, 0.91))
    const boards = still ? (x > 0.028 ? 1 : 0) : gently(within(x, 0.588, 1.092))
    const t = timeline(x - GLIDE_AT, still)
    const stage = root.current.parentElement
    paintOpening({ scope: root.current, item: root.current.querySelector("li"), spot: spot.current, index: 0, pin: pinOf(INVESTIGATIONS[0].id), holder: stage.parentElement, t })
    // before the first board has landed, the other two come in beside it
    const top = header()
    if (top) {
      top.style.setProperty("--dock", t.dock.toFixed(4))
      top.dataset.docked = t.dock > 0.999 ? "true" : "false"
      top.inert = t.dock <= 0.999
    }
    stage.style.setProperty("--dive", dive.toFixed(4))
    stage.style.setProperty("--boards", boards.toFixed(4))
    root.current.dataset.boards = boards > 0.5 ? "true" : "false"
    root.current.inert = boards <= 0.5
    root.current.setAttribute("aria-hidden", boards <= 0.5 ? "true" : "false")
    stage.closest("[data-people]").dataset.diving = boards > 0.5 ? "true" : "false"
  }
  useFollow(goal, paint, { still, watch: root })

  return (
    <div className={c("ch-dive")} ref={root} data-boards="false" data-into="false" aria-label="The data">
      <div className={c("ch-diveThree")}>
        <Text name="investigation-title" look="partTitle" className={c("ch-diveTitle")} />
        <Text name="data-intro" look="quiet" className={c("ch-diveWords")} />
        <ol className={c("ch-diveBoards")}>
          {INVESTIGATIONS.map((q, i) => (
            <li key={q.id}>
              <a href={`#${q.id}`}>
                <InvestigationBoard id={q.id} />
                <span>
                  <b>{i + 1}</b> <InvestigationName id={q.id} />
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
      {/* the first question, named before it begins (opening.js) */}
      <Opening id={INVESTIGATIONS[0].id} said="say-message" ref={spot} />
    </div>
  )
}
