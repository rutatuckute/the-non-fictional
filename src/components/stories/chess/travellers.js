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

// The marks a dot may go to, for both dots in one pass: for each, the last one
// shown, in the order of the page (so in the dials, the one just turned on).
// Only query marks/cards inside scenes currently on screen. The investigation
// contains thousands of SVG nodes across three questions.
const visibleScenes = root => [...root.querySelectorAll('section[aria-label]')].filter(scene => {
  const r = scene.getBoundingClientRect()
  return r.bottom >= 0 && r.top <= window.innerHeight
})
const marksOf = scenes => {
  const best = { me: null, you: null }
  for (const el of scenes.flatMap(scene => [...scene.querySelectorAll("[data-dot]")])) {
    const who = el.dataset.dot
    if (!(who in best)) continue
    const rect = el.getBoundingClientRect()
    if (shown(el, rect) >= SEEN) best[who] = { el, rect }
  }
  return best
}

// On a phone the words scroll over the picture in boxes (cards): is a point under
// one? Read from the cards' boxes, not by hit-testing the page in every frame,
// which made the browser lay out the page again each time. A card holding the
// mark itself does not count.
const cardsOf = scenes => {
  const out = []
  for (const card of scenes.flatMap(scene => [...scene.querySelectorAll(`.${c("ch-step")}:not([data-bare="true"]) > .${c("ch-card")}`)])) {
    const rect = card.getBoundingClientRect()
    if (rect.height && rect.bottom > 0 && rect.top < window.innerHeight) out.push({ card, rect })
  }
  return out
}
const coveredAt = (cards, x, y, el) =>
  cards.some(({ card, rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom && !card.contains(el))

// Where they wait, side by side under a board. They always go forward: while a
// question opens, under its board as it comes out, glides and flies up (opening.js
// marks data-fly<i> on the header, and the board's box data-opening=<i>); as a
// recap goes (hub.js: data-next<i>), under the next question's place; otherwise
// under the lit board at the top left.
const QUESTIONS = [0, 1, 2]
const under = (el, who, two) => {
  const rect = el?.getBoundingClientRect()
  if (!rect || !rect.width) return null
  const gap = two ? 7 : 0
  return { x: rect.left + rect.width / 2 + (who === "me" ? -gap : gap), y: rect.bottom + 9, size: 8, el }
}
const waiting = (header, who, two) => {
  if (!header || header.dataset.on !== "true") return null
  const out = QUESTIONS.find(i => header.dataset[`fly${i}`] === "true")
  if (out !== undefined) {
    const board = document.querySelector(`[data-opening="${out}"] svg`)
    if (board) return under(board, who, two)
  }
  if (header.dataset.docked !== "true") return null
  const tabs = header.querySelectorAll("a")
  const next = QUESTIONS.find(i => header.dataset[`next${i}`] === "true")
  return under(next !== undefined ? tabs[next] : header.querySelector('a[aria-current="step"]') || tabs[0], who, two)
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
    for (const who of ["me", "you"]) state[who] = { x: null, y: null, size: 8, drawn: null, on: 0, el: undefined, hop: null }
    let frame = 0
    // The dots are drawn in every frame only while something moves: the page, a
    // hop, a fade, or a chart's marks. Once all has been still for a while the
    // loop rests, and the next scroll, tap or change in Part III wakes it.
    let quiet = 0
    const REST = 40
    const tick = time => {
      frame = 0
      const box = part.getBoundingClientRect()
      // only while Part III is on the screen
      if (box.bottom < 0 || box.top > window.innerHeight) {
        for (const who of ["me", "you"]) if (dots[who].current) dots[who].current.style.opacity = "0"
        return
      }
      const header = part.querySelector("[data-investigation-header]")
      const scenes = visibleScenes(part)
      const marks = marksOf(scenes)
      const cards = marks.me || marks.you ? cardsOf(scenes) : []
      let moving = false
      for (const who of ["me", "you"]) {
        const dot = dots[who].current
        if (!dot) continue
        const s = state[who]
        const mark = marks[who]
        const goal = mark
          ? { x: mark.rect.left + mark.rect.width / 2, y: mark.rect.top + mark.rect.height / 2, size: Math.max(8, Math.min(14, mark.rect.width)), el: mark.el }
          : waiting(header, who, reader)
        if (!goal) {
          // nowhere to be: it fades where it is
          if (s.on > 0) moving = true
          s.on = Math.max(0, s.on - 0.08)
          dot.style.opacity = s.on.toFixed(3)
          s.el = undefined
          continue
        }
        const [x0, y0] = [s.x, s.y]
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
        // under a word box the dot is hidden too (it goes on following its mark,
        // and is back when the box has passed)
        const covered = mark ? coveredAt(cards, s.x, s.y, mark.el) : false
        const on = covered ? Math.max(0, s.on - (still ? 1 : 0.12)) : Math.min(1, s.on + (still ? 1 : 0.08))
        if (s.hop || on !== s.on || x0 === null || Math.abs(s.x - x0) > 0.2 || Math.abs(s.y - y0) > 0.2) moving = true
        s.on = on
        dot.style.opacity = s.on.toFixed(3)
        dot.style.transform = `translate(${(s.x - s.size / 2).toFixed(1)}px, ${(s.y - s.size / 2).toFixed(1)}px)`
        // its size only when it changes: writing it in every frame laid out the page
        const size = Math.round(s.size * 2) / 2
        if (size !== s.drawn) {
          s.drawn = size
          dot.style.width = dot.style.height = `${size}px`
        }
      }
      quiet = moving ? 0 : quiet + 1
      if (quiet < REST) frame = window.requestAnimationFrame(tick)
    }
    const wake = () => {
      quiet = 0
      if (!frame) frame = window.requestAnimationFrame(tick)
    }
    wake()
    // what can move a mark without a scroll: a tap, a key, a chart's transition or
    // animation, React changing the scene
    // (not the dots' own drawing, which would keep it awake for ever)
    const watch = new MutationObserver(records => {
      if (records.some(record => !root.current?.contains(record.target))) wake()
    })
    watch.observe(part, {
      attributes: true, childList: true, subtree: true,
      // Animation style writes are output, not new work; observing all of them
      // kept restarting the loop after the scroll had stopped.
      attributeFilter: ["data-dot", "data-on", "data-mode", "data-rating-step", "data-focus", "data-past", "aria-current"],
    })
    const events = ["scroll", "resize", "pointerup", "keydown"]
    for (const name of events) window.addEventListener(name, wake, { passive: true })
    part.addEventListener("transitionrun", wake)
    part.addEventListener("animationstart", wake)
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      watch.disconnect()
      for (const name of events) window.removeEventListener(name, wake)
      part.removeEventListener("transitionrun", wake)
      part.removeEventListener("animationstart", wake)
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
