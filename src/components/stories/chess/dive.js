"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, PinSteps, stepLine, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard } from "./investigation-parts"

// Continue the original club scene: its existing board and grid zoom together.
// Only the investigation choices are rendered here, over that same pinned stage.
const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
const gently = t => t * t * (3 - 2 * t)

export const Dive = ({ during }) => {
  const root = React.useRef(null)
  const steps = React.useContext(PinSteps)
  const still = useStill()
  const goal = () => {
    const node = steps?.current?.[during]
    if (!node) return 0
    return Math.max(0, Math.min(1, (stepLine() - node.getBoundingClientRect().top) / (window.innerHeight * 1.4)))
  }
  const paint = p => {
    const dive = still ? 0 : gently(within(p, 0, 0.65))
    const boards = still ? (p > 0.02 ? 1 : 0) : gently(within(p, 0.42, 0.78))
    const stage = root.current.parentElement
    stage.style.setProperty("--dive", dive.toFixed(4))
    stage.style.setProperty("--boards", boards.toFixed(4))
    root.current.dataset.boards = boards > 0.5 ? "true" : "false"
    root.current.inert = boards <= 0.5
    root.current.setAttribute("aria-hidden", boards <= 0.5 ? "true" : "false")
    stage.closest("[data-people]").dataset.diving = boards > 0.5 ? "true" : "false"
  }
  useFollow(goal, paint, { still, watch: root })

  return (
    <div className={c("ch-dive")} ref={root} data-boards="false" aria-label="The data">
      <div className={c("ch-diveTitle")}>
        <Text name="investigation-title" look="partTitle" />
      </div>
      <div className={c("ch-diveThree")}>
        <Text name="data-intro" look="lead" className={c("ch-diveWords")} />
        <ol className={c("ch-diveBoards")}>
          {INVESTIGATIONS.map((q, i) => (
            <li key={q.id}>
              <a href={`#${q.id}`}>
                <InvestigationBoard id={q.id} />
                <span>
                  <b>{i + 1}</b> {q.id === "what-we-choose" ? <>What our <em>choices</em> reveal</> : q.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
