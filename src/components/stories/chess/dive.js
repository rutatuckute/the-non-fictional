"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, PinSteps, stepLine, Text } from "./parts"

// Continue the original club scene: its existing board and grid zoom together.
// Only the investigation choices are rendered here, over that same pinned stage.
const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
const gently = t => t * t * (3 - 2 * t)

// A small board in the page's greys, as the thousand are drawn.
const Squares = () =>
  Array.from({ length: 64 }, (_, i) => (
    <rect key={i} x={(i % 8) * 10} y={Math.floor(i / 8) * 10} width="10" height="10" fill={(i % 8 + Math.floor(i / 8)) % 2 ? "#1c1b19" : "#2c2a27"} />
  ))

const QUESTIONS = [
  {
    id: "what-we-say",
    label: "What we say about ourselves",
    // a claim, in the author's clay
    mark: (
      <g>
        <rect x="9" y="22" width="62" height="26" rx="9" className={c("ch-diveClay")} />
        <path d="M58 47 l6 9 l-14 -9 z" className={c("ch-diveClay")} />
        <text x="40" y="39" textAnchor="middle">soooo bad</text>
      </g>
    ),
  },
  {
    id: "when-things-go-wrong",
    label: "What we do when things go wrong",
    // the queen, gone
    mark: (
      <g>
        <image href="/images/stories/chess/cc-wq.webp" x="27" y="27" width="26" height="26" opacity="0.35" />
        <path d="M30 30 L50 50 M50 30 L30 50" className={c("ch-diveLine")} />
      </g>
    ),
  },
  {
    id: "what-we-choose",
    label: "What our choices reveal",
    // 1. d4 or 1. e4
    mark: (
      <g>
        <path d="M30 66 V44 M26 48 L30 42 L34 48" className={c("ch-diveGrey")} />
        <path d="M50 66 V44 M46 48 L50 42 L54 48" className={c("ch-diveLine")} />
        <text x="30" y="77" textAnchor="middle" className={c("ch-diveSmall")}>d4</text>
        <text x="50" y="77" textAnchor="middle" className={c("ch-diveSmall")}>e4</text>
      </g>
    ),
  },
]

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
    <div className={c("ch-dive")} ref={root} data-boards="false" aria-label="Looking for answers in the data">
      <div className={c("ch-diveTitle")}>
        <Text name="investigation-title" look="partTitle" />
      </div>
      <div className={c("ch-diveThree")}>
        <Text name="data-intro" look="lead" className={c("ch-diveWords")} />
        <ol className={c("ch-diveBoards")}>
          {QUESTIONS.map((q, i) => (
            <li key={q.id}>
              <a href={`#${q.id}`}>
                <svg viewBox="0 0 80 84" aria-hidden="true">
                  <Squares />
                  {q.mark}
                </svg>
                <span>
                  <b>{i + 1}</b> {q.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
