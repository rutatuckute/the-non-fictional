"use client"

import * as React from "react"

import { useStill } from "./follow"
import { c, Picture } from "./parts"

// The Pocket Micro of the first memory. Its place is in the memory, at the
// left under "This is mine", with the father's words to its right. On a wide
// screen it is first glimpsed beside the opening question: it slides in from
// the right edge, stays there while the question goes up, and as its place in
// the memory arrives it crosses to the left, quickly, and the memory's words
// come in. Once read, its left half folds shut on the outer cover.
//
// Nothing here is moved frame by frame against the scroll, which shakes: the
// browser holds the device on screen itself (position: sticky, in a track
// that runs from the opening down to its place, so it comes to rest exactly
// there), and each move is a short transition, set off as the reader passes
// a point and undone on the way back.
//
// On a phone it simply stands in its place; it only folds. With motion
// turned off, each change happens at once.
//
// `opening` is a ref to the opening's box: the track starts at its top.

const ALT = {
  open: "A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display.",
  closed: "The Pocket Micro folded shut, its dark outer cover facing us.",
}

// Where the device is held, as a share of the screen's height from its top
// (the same as `top` of .ch-pocketHeld).
const HELD = 0.17

const Pocket = React.forwardRef(function Pocket(_, ref) {
  const picture = { width: 800, height: 1231, small: 480, sizes: "(max-width: 60rem) 72vw, 400px" }
  return (
    <div className={c("ch-pocket")} ref={ref} role="img" aria-label={ALT.open}>
      <div className={c("ch-pocketRight")}><Picture name="device" alt="" {...picture} /></div>
      <div className={c("ch-pocketFlap")}>
        <div className={c("ch-pocketFront")}><Picture name="device" alt="" {...picture} /></div>
        <div className={c("ch-pocketBack")}>
          <Picture name="device-closed" alt="" width={900} height={1277} small={480} sizes="(max-width: 60rem) 72vw, 400px" />
        </div>
      </div>
    </div>
  )
})

export const Device = ({ opening }) => {
  const slot = React.useRef(null)
  const track = React.useRef(null)
  const held = React.useRef(null)
  const wide = React.useRef(null)
  const narrow = React.useRef(null)
  const still = useStill()

  React.useEffect(() => {
    const row = slot.current.parentElement
    let frame = 0
    // Which state each part is in, for where the reader is.
    const look = () => {
      frame = 0
      const screen = window.innerHeight
      const open = opening.current.getBoundingClientRect()
      const home = slot.current.getBoundingClientRect()
      const small = window.matchMedia("(max-width: 60rem)").matches
      // across once its place has nearly come up to where it is held
      const across = home.top < screen * (HELD + 0.05)
      const closed = home.top < screen * (small ? -0.12 : -0.18)
      held.current.dataset.in = open.top < screen * 0.6 ? "true" : "false"
      held.current.dataset.side = across ? "left" : "right"
      row.dataset.arrived = small || across ? "true" : "false"
      for (const node of [wide.current, narrow.current]) {
        node.dataset.closed = closed ? "true" : "false"
        node.setAttribute("aria-label", closed ? ALT.closed : ALT.open)
      }
    }
    // The track's length and the two places across it, whenever sizes change.
    const measure = () => {
      const open = opening.current.getBoundingClientRect()
      const home = slot.current.getBoundingClientRect()
      const lane = track.current.getBoundingClientRect()
      track.current.style.top = `${(open.top - row.getBoundingClientRect().top).toFixed(1)}px`
      track.current.style.height = `${(home.bottom - open.top).toFixed(1)}px`
      held.current.style.width = `${home.width.toFixed(1)}px`
      held.current.style.setProperty("--right", `${(lane.width * 0.62).toFixed(1)}px`)
      held.current.style.setProperty("--left", `${(home.left - lane.left).toFixed(1)}px`)
      look()
    }
    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(look)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(opening.current)
    observer.observe(row)
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", measure)
    document.fonts?.ready.then(measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", measure)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [opening])

  return (
    <>
      {/* wide screens: held in a track from the opening down to its place */}
      <div className={c("ch-pocketTrack")} ref={track} data-still={still ? "true" : "false"}>
        <div className={c("ch-pocketHeld")} ref={held} data-in="false" data-side="right">
          <Pocket ref={wide} />
        </div>
      </div>
      {/* its place in the memory; on a phone, the device itself */}
      <div className={c("ch-device")} ref={slot}>
        <Pocket ref={narrow} />
      </div>
    </>
  )
}
