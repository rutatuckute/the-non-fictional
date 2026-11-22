"use client"

import * as React from "react"

import { c, Picture } from "./parts"

// The Pocket Micro of the first memory. Its place is in the memory, at the
// left under "This is mine", with the father's words to its right. On a wide
// screen, while the opening question is read, it only peeks in at the right
// edge, mostly hidden; as soon as the reader scrolls on, it glides to its
// place and the memory's words come in. Once read, its left half folds shut
// on the outer cover.
//
// It always lies in the page and scrolls with it; only the glide and the fold
// are transitions, set off as the reader passes a point and undone on the
// way back, so nothing is moved frame by frame against the scroll.
//
// On a phone it simply stands in its place; it only folds. With motion
// turned off, each change happens at once.
//
// `opening` is a ref to the opening's box, beside which it peeks.

const ALT = {
  open: "A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display.",
  closed: "The Pocket Micro folded shut, its dark outer cover facing us.",
}

// How much of it shows while it peeks, and how far the reader scrolls on
// from the opening (in screens) before it glides to its place.
const PEEK = 0.36
const GO = 0.1

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
  const pocket = React.useRef(null)

  React.useEffect(() => {
    const row = slot.current.parentElement
    let frame = 0
    // Which state it is in, for where the reader is.
    const look = () => {
      frame = 0
      const screen = window.innerHeight
      const open = opening.current.getBoundingClientRect()
      const home = slot.current.getBoundingClientRect()
      const small = window.matchMedia("(max-width: 60rem)").matches
      const placed = small || open.top < -screen * GO
      const closed = home.top < screen * (small ? -0.12 : -0.18)
      pocket.current.dataset.side = placed ? "home" : "peek"
      row.dataset.arrived = placed ? "true" : "false"
      pocket.current.dataset.closed = closed ? "true" : "false"
      pocket.current.setAttribute("aria-label", closed ? ALT.closed : ALT.open)
    }
    // Where it peeks from, against its place: at the right edge of the column,
    // its top level with the question's. Both scroll together, so this holds.
    const measure = () => {
      const open = opening.current.getBoundingClientRect()
      const words = opening.current.firstElementChild.getBoundingClientRect()
      const home = slot.current.getBoundingClientRect()
      const dx = open.right - home.width * PEEK - home.left
      const dy = words.top - home.top
      pocket.current.style.setProperty("--dx", `${dx.toFixed(1)}px`)
      pocket.current.style.setProperty("--dy", `${dy.toFixed(1)}px`)
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
    <div className={c("ch-device")} ref={slot}>
      <Pocket ref={pocket} />
    </div>
  )
}
