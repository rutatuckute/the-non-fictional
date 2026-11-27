"use client"

import * as React from "react"

import { c } from "./parts"
import { useReader } from "./reader"
import { useStill } from "./follow"

// Two dots travel through Part III: mine (clay) and the reader's (green, once they
// have given their Chess.com username). Each sits on its own mark in whatever is
// shown — next to my message on the phone, on "Me" in a chart, on "you" — and hops
// from one chart to the next. Where a picture has no mark for it, or while a
// question is being named, it waits under the lit board at the top left
// (investigation-header.js). A mark is any element with data-dot="me" or "you";
// the mark itself is hidden (CSS), the dot stands in for it.

const SEEN = 0.55 // how opaque a mark (with everything around it) must be to count
const HOP = 720 // ms for a hop from one mark to another
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// How opaque an element really is: its own opacity and its parents' multiplied.
// Hidden (but not the mark's own visibility: the mark is hidden, the dot stands in
// for it) or off the screen: 0.
const shown = (el, rect) => {
  if (!rect.width && !rect.height) return 0
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return 0
  let alpha = 1
  for (let node = el; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node)
    if ((node !== el && style.visibility === "hidden") || style.display === "none") return 0
    alpha *= Number(style.opacity)
    if (alpha < SEEN) return alpha
  }
  return alpha
}

// The mark a dot goes to: the last one shown, in the order of the page (so in the
// dials, the one just turned on).
const markOf = (root, who) => {
  let best = null
  for (const el of root.querySelectorAll(`[data-dot="${who}"]`)) {
    const rect = el.getBoundingClientRect()
    if (shown(el, rect) >= SEEN) best = { el, rect }
  }
  return best
}

// Where they wait: under the lit board at the top left, side by side.
const waiting = (header, who, two) => {
  if (!header || header.dataset.on !== "true" || header.dataset.docked !== "true") return null
  const tab = header.querySelector('a[aria-current="step"]') || header.querySelector("a")
  const rect = tab?.getBoundingClientRect()
  if (!rect) return null
  const gap = two ? 7 : 0
  return { x: rect.left + rect.width / 2 + (who === "me" ? -gap : gap), y: rect.bottom + 9, size: 8, el: tab }
}

export const Travellers = () => {
  const root = React.useRef(null)
  const dots = { me: React.useRef(null), you: React.useRef(null) }
  const reader = Boolean(useReader().chesscom)
  const still = useStill()
  React.useEffect(() => {
    const part = root.current.closest('[data-part="investigation"]')
    part.dataset.travelling = "true"
    const state = {}
    for (const who of ["me", "you"]) state[who] = { x: null, y: null, size: 8, on: 0, el: undefined, hop: null }
    let frame = 0
    const tick = time => {
      frame = window.requestAnimationFrame(tick)
      const box = part.getBoundingClientRect()
      // only while Part III is on the screen
      if (box.bottom < 0 || box.top > window.innerHeight) {
        for (const who of ["me", "you"]) if (dots[who].current) dots[who].current.style.opacity = "0"
        return
      }
      const header = part.querySelector("[data-investigation-header]")
      for (const who of ["me", "you"]) {
        const dot = dots[who].current
        if (!dot) continue
        const s = state[who]
        const mark = markOf(part, who)
        const goal = mark
          ? { x: mark.rect.left + mark.rect.width / 2, y: mark.rect.top + mark.rect.height / 2, size: Math.max(8, Math.min(14, mark.rect.width)), el: mark.el }
          : waiting(header, who, reader)
        if (!goal) {
          // nowhere to be: it fades where it is
          s.on = Math.max(0, s.on - 0.08)
          dot.style.opacity = s.on.toFixed(3)
          s.el = undefined
          continue
        }
        if (s.x === null) {
          s.x = goal.x
          s.y = goal.y
          s.size = goal.size
        } else if (goal.el !== s.el && !still) {
          // a new mark (or the wait under the board): hop there, following it if it moves
          const far = Math.hypot(goal.x - s.x, goal.y - s.y)
          s.hop = far > 6 ? { from: { x: s.x, y: s.y, size: s.size }, start: time, lift: Math.min(110, far * 0.28) } : null
        }
        s.el = goal.el
        if (s.hop) {
          const t = Math.min(1, (time - s.hop.start) / HOP)
          const k = easeInOut(t)
          s.x = s.hop.from.x + (goal.x - s.hop.from.x) * k
          s.y = s.hop.from.y + (goal.y - s.hop.from.y) * k - s.hop.lift * 4 * t * (1 - t)
          s.size = s.hop.from.size + (goal.size - s.hop.from.size) * k
          if (t >= 1) s.hop = null
        } else {
          // on its mark: it goes with it
          s.x = goal.x
          s.y = goal.y
          s.size = goal.size
        }
        // on a phone the words scroll over the picture in boxes: under one, the dot is
        // hidden too (it goes on following its mark, and is back when the box has passed)
        const hit = mark ? document.elementFromPoint(s.x, s.y) : null
        const covered = Boolean(hit?.closest(`.${c("ch-card")}`))
        s.on = covered ? Math.max(0, s.on - (still ? 1 : 0.12)) : Math.min(1, s.on + (still ? 1 : 0.08))
        dot.style.opacity = s.on.toFixed(3)
        dot.style.transform = `translate(${(s.x - s.size / 2).toFixed(1)}px, ${(s.y - s.size / 2).toFixed(1)}px)`
        dot.style.width = dot.style.height = `${s.size.toFixed(1)}px`
      }
    }
    frame = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(frame)
      delete part.dataset.travelling
    }
  }, [reader, still])
  return (
    <div ref={root} className={c("ch-travellers")} aria-hidden="true">
      <i ref={dots.me} className={c("ch-traveller")} data-who="me" />
      {reader ? <i ref={dots.you} className={c("ch-traveller")} data-who="you" /> : null}
    </div>
  )
}
