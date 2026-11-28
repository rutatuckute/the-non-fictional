"use client"

import * as React from "react"
import { c } from "./parts"
import { INVESTIGATIONS, InvestigationBoard, InvestigationName } from "./investigation-parts"

// Where the reader is in Part III: the three questions' boards, small, at the top
// left of the screen, the one being read lit. Each question's board, large under its
// name when the question opens (opening.js), flies up into its place here on the
// reader's next scroll; the first brings the other two in beside it (the dive sets
// --dock and data-docked here). When a question ends, its board comes down into
// its recap and goes back (hub.js: data-away on its link, and its way there).
export const InvestigationHeader = () => {
  const header = React.useRef(null)
  const [active, setActive] = React.useState(INVESTIGATIONS[0].id)
  const [on, setOn] = React.useState(false)
  React.useLayoutEffect(() => {
    const root = header.current.closest('[data-part="investigation"]')
    let frame = 0
    const update = () => {
      frame = 0
      const rect = header.current.getBoundingClientRect()
      // what is pinned below keeps clear of the boards (from the top of the screen,
      // less the chapters' bar, which --investigation-top already counts)
      const bar = parseFloat(getComputedStyle(root).getPropertyValue("--bar")) || 0
      const height = `${Math.ceil(rect.bottom - bar + 10)}px`
      if (root.style.getPropertyValue("--investigation-header-height") !== height) root.style.setProperty("--investigation-header-height", height)
      // The question lit is the last whose board has landed here (opening.js
      // marks each data-land<i>): the ring moves when the board arrives.
      let current = 0
      INVESTIGATIONS.forEach((_, index) => { if (header.current.dataset[`land${index}`] === "true") current = index })
      const id = INVESTIGATIONS[current].id
      setActive(id)
      root.dataset.activeInvestigation = id
      // away when the part's end comes up to it
      setOn(root.getBoundingClientRect().bottom > rect.bottom + 24)
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(wake)
    observer.observe(header.current)
    // the openings mark what has landed on the header itself
    const marks = new MutationObserver(wake)
    marks.observe(header.current, { attributes: true, attributeFilter: INVESTIGATIONS.map((_, i) => `data-land${i}`) })
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    window.addEventListener("hashchange", wake)
    update()
    return () => {
      observer.disconnect()
      marks.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      window.removeEventListener("hashchange", wake)
      cancelAnimationFrame(frame)
    }
  }, [])
  const now = INVESTIGATIONS.findIndex(part => part.id === active)
  return (
    <nav className={c("ch-investigationHeader")} ref={header} data-investigation-header="true" data-on={on ? "true" : "false"} data-docked="false" aria-label="Looking for answers in the data: the three questions">
      {INVESTIGATIONS.map((part, index) => (
        <a
          key={part.id}
          href={`#${part.id}`}
          className={c("ch-investigationTab")}
          data-state={index < now ? "done" : index === now ? "now" : "next"}
          aria-current={index === now ? "step" : undefined}
        >
          <InvestigationBoard id={part.id} />
          <span className={c("ch-investigationName")}>
            <span className={c("ch-investigationNumber")}>{index + 1}</span> <InvestigationName id={part.id} />
          </span>
        </a>
      ))}
    </nav>
  )
}
