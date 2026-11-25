"use client"

import * as React from "react"
import { c, Text } from "./parts"
import { INVESTIGATIONS, InvestigationBoard } from "./investigation-parts"

export const InvestigationHeader = () => {
  const header = React.useRef(null)
  const [active, setActive] = React.useState(INVESTIGATIONS[0].id)
  React.useLayoutEffect(() => {
    const root = header.current.closest('[data-part="investigation"]')
    const sections = Array.from(root.querySelectorAll('[data-investigation-part]'))
    let frame = 0
    const update = () => {
      frame = 0
      const rect = header.current.getBoundingClientRect()
      const height = `${Math.ceil(rect.height)}px`
      if (root.style.getPropertyValue("--investigation-header-height") !== height) root.style.setProperty("--investigation-header-height", height)
      // A section takes the title once it fills most of the screen below the
      // header (its top past 45% of the screen), not only when it reaches the
      // header: the new words and picture never stand under the old title.
      const line = Math.max(rect.bottom + 12, window.innerHeight * 0.45)
      let current = sections[0]?.dataset.investigationPart
      for (const section of sections) if (section.getBoundingClientRect().top <= line) current = section.dataset.investigationPart
      if (current) { setActive(current); root.dataset.activeInvestigation = current }
    }
    const wake = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = new ResizeObserver(wake)
    observer.observe(header.current)
    sections.forEach(section => observer.observe(section))
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    window.addEventListener("hashchange", wake)
    update()
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      window.removeEventListener("hashchange", wake)
      cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <div className={c("ch-investigationHeader")} ref={header} data-investigation-header="true">
      <Text name="investigation-title" className={c("ch-investigationEyebrow")} />
      <div className={c("ch-investigationStates")}>
        {INVESTIGATIONS.map(part => <div key={part.id} className={c("ch-investigationState")} data-active={active === part.id} aria-hidden={active !== part.id}>
          <InvestigationBoard id={part.id} compact />
          <h3>{part.id === "what-we-choose" ? <>What our <em>choices</em> reveal</> : part.label}</h3>
        </div>)}
      </div>
    </div>
  )
}
