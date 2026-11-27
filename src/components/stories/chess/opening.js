"use client"

import * as React from "react"

import { c, Text } from "./parts"
import { InvestigationName } from "./investigation-parts"

// How each question of Part III opens, the same way three times: after the choice
// screen (dive.js) and after each recap (hub.js). The question's board glides from
// its place among the three to the middle, a little larger, and its name comes up
// under it, large, over the question's own scene, dimmed (as in the prototype). On
// the reader's next scroll the board flies up into its place among the three small
// boards at the top left (investigation-header.js) and the question's first line
// comes under its name; then the name scrolls away and the scene comes up fully.

export const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
export const gently = t => t * t * (3 - 2 * t)

// The opening's timeline, in screens scrolled since the glide began (o). The holder
// stops being pinned at o = 1.55: the name is complete well before, and the scene
// comes up only once the name and its line have gone up past it.
export const UNPINS = 1.55
export const timeline = (o, still) => {
  const into = still ? (o > 0.6 ? 1 : 0) : gently(within(o, 0, 0.7))
  const named = still ? into : gently(within(o, 0.45, 0.85))
  const dock = still ? (o > 1.2 ? 1 : 0) : gently(within(o, 1.1, 1.47))
  const said = still ? dock : gently(within(o, 1.15, 1.5))
  const under = still ? (o > 2.05 ? 1 : named * 0.16) : named * 0.16 + gently(within(o, 1.95, 2.3)) * 0.84
  return { into, named, dock, said, under }
}

// The way from a board's own place (its list item, whose svg is the board) to a
// box: x, y to its middle, s how much it grows.
export const toward = (item, box) => {
  const svg = item?.querySelector("svg")
  if (!svg || !box) return { x: 0, y: 0, s: 1 }
  const from = item.getBoundingClientRect()
  const to = box.getBoundingClientRect()
  const width = svg.clientWidth || from.width
  const height = svg.clientHeight || (width * 84) / 80
  return {
    x: to.left + to.width / 2 - (from.left + width / 2),
    y: to.top + to.height / 2 - (from.top + height / 2),
    s: to.width / width,
  }
}

export const header = () => document.querySelector("[data-investigation-header]")
const slot = index => header()?.querySelectorAll("a svg")[index]

// Paint one opening: the board's way (--tx, --ty, --ts on scope), the name and the
// line (--named, --said), the scene underneath (--under on the question's pin), and
// the small board at the top left: hidden while its big one is out (data-fly<i>),
// lit once it has landed (data-land<i>).
export const paintOpening = ({ scope, item, spot, index, pin, holder, t }) => {
  const g = toward(item, spot)
  const k = toward(item, slot(index))
  scope.style.setProperty("--tx", `${(g.x * t.into + (k.x - g.x) * t.dock).toFixed(1)}px`)
  scope.style.setProperty("--ty", `${(g.y * t.into + (k.y - g.y) * t.dock).toFixed(1)}px`)
  scope.style.setProperty("--ts", (1 + (g.s - 1) * t.into + (k.s - g.s) * t.dock).toFixed(4))
  scope.style.setProperty("--into", t.into.toFixed(4))
  scope.style.setProperty("--named", t.named.toFixed(4))
  scope.style.setProperty("--said", t.said.toFixed(4))
  const landed = t.dock > 0.999
  scope.dataset.docked = landed ? "true" : "false"
  scope.dataset.into = t.into > 0.5 ? "true" : "false"
  // the holder is see-through once the question is named, so its scene shows underneath
  if (holder) holder.dataset.under = t.under > 0.001 ? "true" : "false"
  pin?.style.setProperty("--under", t.under.toFixed(4))
  const top = header()
  if (top) {
    const fly = t.into > 0.001 && !landed ? "true" : "false"
    const land = landed ? "true" : "false"
    if (top.dataset[`fly${index}`] !== fly) top.dataset[`fly${index}`] = fly
    if (top.dataset[`land${index}`] !== land) top.dataset[`land${index}`] = land
  }
}

// The question's pin (for its scene, dimmed underneath), by the question's id.
export const pinOf = id => document.querySelector(`[data-investigation-part="${id}"] .${c("ch-pin")}`)

// The opening's words and the box its board glides to.
export const Opening = React.forwardRef(({ id, said, first = false }, spot) => (
  <div className={c("ch-diveNext")}>
    <span className={c("ch-diveSpot")} ref={spot} />
    <span className={c("ch-diveName")} aria-hidden="true"><InvestigationName id={id} /></span>
    {/* (the question's first line; if its step says more, the rest stays in the step) */}
    <Text name={said} look="lead" className={c("ch-diveSaid", first && "ch-firstOnly")} />
  </div>
))
Opening.displayName = "Opening"
