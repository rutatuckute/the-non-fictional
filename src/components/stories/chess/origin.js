"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, Picture } from "./parts"

// The Pocket Micro of the first memory. Its place is in the memory, at the
// left under "This is mine", with the father's words to its right. But it is
// first glimpsed beside the opening question: it slides in from the right edge
// as the question comes up, waits there while the reader scrolls, then crosses
// to the left and settles into its place; the memory's words come in as it
// lands. Once read, its left half folds shut on the outer cover as it scrolls
// away.
//
// On a phone it simply stands in its place in the memory; it only folds.
// With motion turned off it never travels, and folds in one step.
//
// `opening` is a ref to the opening's box, which the glimpse is set against.

const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
const gently = t => t * t * (3 - 2 * t)

// Where the glimpse is: this far across the opening and down the screen, and
// how wide (a share of the column, at most a share of the screen's height).
const AT = { x: 0.62, y: 0.17, wide: 0.38, tall: 0.42 }
// Before it slides in, this much of it is beyond the right edge.
const OUT = 0.65
// The memory is reached when the device's place is this far down the screen.
const SETTLED = 0.16

const ALT = {
  open: "A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display.",
  closed: "The Pocket Micro folded shut, its dark outer cover facing us.",
}

export const Device = ({ opening }) => {
  const slot = React.useRef(null)
  const device = React.useRef(null)
  const still = useStill()

  const goal = () => -opening.current.getBoundingClientRect().top / window.innerHeight
  const paint = at => {
    const screen = window.innerHeight
    const narrow = window.matchMedia("(max-width: 60rem)").matches
    const home = slot.current.getBoundingClientRect()
    const open = opening.current.getBoundingClientRect()
    const t = at

    let move = "none"
    let arrived = true
    if (!narrow && !still) {
      // The glimpse: at the opening's right, kept on screen once the opening
      // reaches the top, coming in from beyond the edge as the question does.
      const wide = Math.min(open.width * AT.wide, screen * AT.tall)
      const shown = gently(within(t, -0.35, 0.2))
      const glimpse = [open.left + open.width * AT.x + (1 - shown) * OUT * wide, Math.max(open.top, 0) + screen * AT.y]
      // The crossing: once the question has gone up past it, from the glimpse
      // to its own place, ending as that place comes to SETTLED down the screen.
      // The memory's words wait for it (any way in would pass over them).
      const settled = (home.top - open.top) / screen - SETTLED
      const across = gently(within(t, Math.min(settled - 0.05, Math.max(0.5, settled - 0.45)), settled))
      arrived = across > 0.97
      const scale = wide / home.width + (1 - wide / home.width) * across
      const x = (glimpse[0] - home.left) * (1 - across)
      const y = (glimpse[1] - home.top) * (1 - across)
      if (across < 1) move = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
    }
    device.current.style.transform = move
    slot.current.parentElement.dataset.arrived = arrived ? "true" : "false"

    // Folded as its place leaves the top of the screen.
    const fold = narrow ? within(home.top / screen, 0.05, -0.25) : within(home.top / screen, 0, -0.3)
    const turned = still ? (fold >= 0.5 ? 180 : 0) : fold * 180
    device.current.style.setProperty("--fold", `${turned}deg`)
    device.current.dataset.closed = fold >= 0.5 ? "true" : "false"
    device.current.dataset.folded = fold >= 0.99 ? "true" : "false"
    device.current.dataset.still = still ? "true" : "false"
    device.current.setAttribute("aria-label", fold >= 0.5 ? ALT.closed : ALT.open)
  }
  useFollow(goal, paint, { still, watch: slot })

  const picture = { width: 800, height: 1231, small: 480, sizes: "(max-width: 60rem) 72vw, 400px" }
  return (
    <div className={c("ch-device")} ref={slot}>
      <div className={c("ch-pocket")} ref={device} role="img" aria-label={ALT.open}>
        <div className={c("ch-pocketRight")}><Picture name="device" alt="" {...picture} /></div>
        <div className={c("ch-pocketFlap")}>
          <div className={c("ch-pocketFront")}><Picture name="device" alt="" {...picture} /></div>
          <div className={c("ch-pocketBack")}>
            <Picture name="device-closed" alt="" width={900} height={1277} small={480} sizes="(max-width: 60rem) 72vw, 400px" />
          </div>
        </div>
      </div>
    </div>
  )
}
