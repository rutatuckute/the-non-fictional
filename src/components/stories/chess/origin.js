"use client"

import * as React from "react"

import { c, Picture } from "./parts"

// The Pocket Micro of the first memory. Its place is in the memory, at the
// left under "This is mine", with the father's words to its right. On a wide
// screen, while the opening question is read, it only peeks in at the right
// edge, mostly hidden; as soon as the reader scrolls on, it glides to its
// place and the memory's words come in. On a phone it waits low, its top
// showing at the screen's foot, and rises into place as the question leaves.
// It folds shut on its outer cover while still in view, before "Life went
// on." has come half way up: childhood
// closes, and the thread goes grey.
//
// It always lies in the page and scrolls with it; only the glide, the rise
// and the fold are transitions, set off as the reader passes a point and
// undone on the way back, so nothing is moved frame by frame against the
// scroll. With motion turned off each change happens at once.
//
// Its tiny screen shows E2 E4, the first move: the same as the wooden set's
// and the first game online. Asked to (`run` counts the asks), it plays en
// passant on its own board: 2. f4 exf4 3. g4 fxg3, the pawn that passes by
// taken in passing. The pieces that move are cut from the picture itself.
//
// `opening` is a ref to the opening's box, beside which it peeks.

const ALT = {
  open: "A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display showing E2 E4.",
  closed: "The Pocket Micro folded shut, its dark outer cover facing us.",
}

// How much of it shows while it peeks, and how far the reader scrolls on
// from the opening (in screens) before it glides to its place.
const PEEK = 0.36
const GO = 0.1

// The picture (device.webp, 800 x 1231): the edges of the board's squares,
// files a to h from the left and ranks 8 to 1 from the top, and its screen.
const W = 800
const H = 1231
const FILES = [72, 154.5, 235.5, 317.5, 400, 481.5, 563.5, 644.5, 731]
const RANKS = [88, 170, 251, 330, 410, 490, 569, 649, 730]
const SCREEN = { left: 539, top: 883, width: 121, height: 67 }
const square = name => {
  const f = "abcdefgh".indexOf(name[0])
  const r = 8 - Number(name[1])
  return { x: FILES[f], y: RANKS[r], w: FILES[f + 1] - FILES[f], h: RANKS[r + 1] - RANKS[r] }
}
// Where the picture shows what: an empty dark square and an empty light one,
// and the three pawns that move, each on its own square's colour.
const FROM = { dark: "b6", light: "a6", white: "f2", white2: "g2", black: "e5" }
const MOVES = [
  { piece: "white", from: "f2", to: "f4", says: "F2 F4" },
  { piece: "black", from: "e5", to: "f4", takes: "white", says: "E5 F4" },
  { piece: "white2", from: "g2", to: "g4", says: "G2 G4" },
  { piece: "black", from: "f4", to: "g3", takes: "white2", says: "F4 G3", passant: true },
]
const COLOUR = { f2: "dark", e5: "dark", g2: "light" }
const SPOKEN = ["Pawn to f4.", "Pawn takes on f4.", "Pawn to g4, passing beside the black pawn.", "Pawn takes on g3, en passant: the white pawn on g4 is taken in passing."]
const EASE = "cubic-bezier(0.22, 0.8, 0.24, 1)"
const MOVE = 700
const PAUSE = 300

const pct = (value, of) => `${((value / of) * 100).toFixed(4)}%`
// A square of the picture, shown at a square of the board.
const tile = (source, at) => {
  const s = square(source)
  const t = square(at)
  return {
    left: pct(t.x, W),
    top: pct(t.y, H),
    width: pct(t.w, W),
    height: pct(t.h, H),
    backgroundSize: `${((W / s.w) * 100).toFixed(3)}% auto`,
    backgroundPosition: `${((s.x / (W - s.w)) * 100).toFixed(3)}% ${((s.y / (H - s.h)) * 100).toFixed(3)}%`,
  }
}
const shift = (from, to) => {
  const a = square(from)
  const b = square(to)
  return `translate(${(((b.x - a.x) / a.w) * 100).toFixed(2)}%, ${(((b.y - a.y) / a.h) * 100).toFixed(2)}%)`
}

const Pocket = React.forwardRef(function Pocket({ children }, ref) {
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
      {children}
    </div>
  )
})

// The en passant on the device's board, and its screen.
const Board = ({ run, onState }) => {
  const parts = React.useRef({})
  const [said, setSaid] = React.useState("E2 E4")
  const [spoken, setSpoken] = React.useState("")
  const playing = React.useRef(null)

  React.useEffect(() => {
    if (!run) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const ref = parts.current
    let stopped = false
    playing.current?.()
    playing.current = () => (stopped = true)
    const wait = ms => new Promise(done => setTimeout(done, still ? 0 : ms))
    // back to the picture's own position
    for (const key of Object.keys(ref)) {
      ref[key].getAnimations().forEach(animation => animation.cancel())
      ref[key].style.opacity = "0"
      ref[key].style.transform = ""
    }
    const show = key => (ref[key].style.opacity = "1")
    const go = async () => {
      onState("playing")
      for (const [index, move] of MOVES.entries()) {
        if (stopped) return
        setSaid(move.says)
        setSpoken(SPOKEN[index])
        // the square it leaves is empty; the piece is lifted from it
        if (move.piece !== "black" || index === 1) show(`gone-${move.from}`)
        show(move.piece)
        const node = ref[move.piece]
        const before = node.style.transform
        const after = move.piece === "black" ? shift("e5", move.to) : shift(move.from, move.to)
        if (!still) await node.animate([{ transform: before || "none" }, { transform: after }], { duration: MOVE, easing: EASE }).finished.catch(() => {})
        if (stopped) return
        node.style.transform = after
        if (move.takes) {
          const taken = ref[move.takes]
          if (!still) await taken.animate([{ opacity: 1, transform: taken.style.transform || "none" }, { opacity: 0, transform: `${taken.style.transform || ""} scale(0.6)` }], { duration: 380, easing: EASE }).finished.catch(() => {})
          taken.style.opacity = "0"
        }
        if (move.passant) {
          await wait(PAUSE)
          setSaid("E.P.")
        }
        await wait(PAUSE)
      }
      if (!stopped) onState("done")
    }
    go()
    return () => {
      stopped = true
    }
  }, [run, onState])

  const keep = key => node => {
    if (node) parts.current[key] = node
  }
  return (
    <div className={c("ch-ep")} aria-hidden={run ? undefined : "true"}>
      {/* squares the pawns leave, painted over with an empty one of their colour */}
      {["f2", "e5", "g2"].map(at => (
        <i key={at} ref={keep(`gone-${at}`)} className={c("ch-epTile")} style={{ ...tile(FROM[COLOUR[at]], at), opacity: 0 }} />
      ))}
      <i ref={keep("white")} className={c("ch-epTile", "ch-epPiece")} style={{ ...tile(FROM.white, "f2"), opacity: 0 }} />
      <i ref={keep("white2")} className={c("ch-epTile", "ch-epPiece")} style={{ ...tile(FROM.white2, "g2"), opacity: 0 }} />
      <i ref={keep("black")} className={c("ch-epTile", "ch-epPiece")} style={{ ...tile(FROM.black, "e5"), opacity: 0 }} />
      <span
        className={c("ch-epScreen")}
        style={{ left: pct(SCREEN.left, W), top: pct(SCREEN.top, H), width: pct(SCREEN.width, W), height: pct(SCREEN.height, H) }}
      >
        {said}
      </span>
      <span className={c("ch-navHidden")} aria-live="polite">{spoken}</span>
    </div>
  )
}

export const Device = ({ opening, run = 0, onState = () => {} }) => {
  const slot = React.useRef(null)
  const pocket = React.useRef(null)

  React.useEffect(() => {
    const row = slot.current.parentElement
    // "Years went by.": the device folds as it comes to the middle of the screen
    const years = row.nextElementSibling?.querySelector('[class*="__ch-yearsText"]')
    let frame = 0
    // Which state it is in, for where the reader is.
    const look = () => {
      frame = 0
      const screen = window.innerHeight
      const open = opening.current.getBoundingClientRect()
      const words = opening.current.firstElementChild.getBoundingClientRect()
      const small = window.matchMedia("(max-width: 60rem)").matches
      // a phone: once the question has gone up past the upper third
      const placed = small ? words.bottom < screen * 0.34 : open.top < -screen * GO
      // It folds while still in view (27 Nov, owner: sooner): once its middle
      // has gone up past the upper third, or "Life went on." is half way up.
      const device = slot.current.getBoundingClientRect()
      const closed = placed && ((device.top + device.bottom) / 2 < screen * 0.3 || (years ? years.getBoundingClientRect().top < screen * 0.55 : false))
      pocket.current.dataset.side = placed ? "home" : small ? "low" : "peek"
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
      pocket.current.style.setProperty("--dx", `${(open.right - home.width * PEEK - home.left).toFixed(1)}px`)
      pocket.current.style.setProperty("--dy", `${(words.top - home.top).toFixed(1)}px`)
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
      <Pocket ref={pocket}>
        <Board run={run} onState={onState} />
      </Pocket>
    </div>
  )
}
