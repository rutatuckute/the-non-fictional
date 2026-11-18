"use client"

import * as React from "react"

import { c, Text } from "./parts"
import SIZES from "./pieces.json"
import { Knots } from "./thread"

// The wooden set, held on screen while the reader scrolls: it comes in open,
// the pieces in their felt, turns over to the board, the pieces are set up,
// and a game begins. Nothing here waits for a text: what happens around the
// board is led by the scroll alone, forwards and back.
//
// Every move is carried by a hand. Yours comes from below; the hand that
// answers from above is a different person's each time (where one's picture
// is not made yet, that move's piece goes by itself).

// The board in wooden-board.webp, 1000 x 838: the edges of its squares, files
// a to h from the left and ranks 8 to 1 from the top.
const BOARD = {
  width: 1000,
  height: 838,
  x: [174, 256, 340, 421, 503, 583, 666, 748, 831],
  y: [86, 168, 250, 332, 413, 492, 570, 651, 731],
}
const SQUARE = 82
// All pieces at one scale: the king's base three fifths of a square wide.
// Sizes in pieces.json are in the sheet's pixels (scripts/stories/chess/make-pieces.cjs).
const SCALE = (0.6 * SQUARE) / SIZES.wk.w
// A piece stands on its base: the base's centre is about a quarter of the
// picture's width above its bottom edge.
const FOOT = 0.27
// Where a hand takes a piece: this far down it, at its head.
const HEAD = 0.17

const START = ["rnbqkbnr", "pppppppp", "", "", "", "", "PPPPPPPP", "RNBQKBNR"]
// The game: an open game, as on the device of the first memory.
const PLIES = [
  ["e2", "e4"],
  ["e7", "e5"],
  ["g1", "f3"],
  ["b8", "c6"],
  ["f1", "c4"],
  ["f8", "c5"],
]

// A hand: its picture, how wide it is against the board, how tall against its
// own width, and where in the picture its fingers close (shares of the picture).
const MINE = { name: "hand-me", small: 260, width: 440, height: 1463, wide: 0.27, grip: [0.317, 0.11] }
// The hands that answer, one for each of Black's moves, in order: a different
// person each time. A move whose hand is not made yet is played with no hand.
const THEIRS = [
  { name: "hand-opponent-1", small: 260, width: 440, height: 1473, wide: 0.27, grip: [0.74, 0.955] },
  { name: "hand-opponent-2", small: 260, width: 440, height: 1445, wide: 0.27, grip: [0.745, 0.955] },
  // its sleeve is the widest, so the picture is wider for the hand to be to the others' scale
  { name: "hand-opponent-3", small: 300, width: 500, height: 1472, wide: 0.306, grip: [0.735, 0.955] },
]

// The scroll, in screens, since the scene was pinned.
const TURN_AT = 0.3
const SETUP_AT = 0.55
const FIRST_AT = 0.85
const PLY = 0.36
export const SCREENS = FIRST_AT + PLIES.length * PLY + 0.19

const centre = square => {
  const file = "abcdefgh".indexOf(square[0])
  const row = 8 - Number(square[1])
  return [(BOARD.x[file] + BOARD.x[file + 1]) / 2, (BOARD.y[row] + BOARD.y[row + 1]) / 2]
}

const PIECES = START.flatMap((row, r) =>
  [...row].map((letter, f) => ({
    id: `${"abcdefgh"[f]}${8 - r}`,
    kind: (letter === letter.toUpperCase() ? "w" : "b") + letter.toLowerCase(),
  })),
)

const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

// How far the reader has scrolled since the scene was pinned, in screens.
const useScrolled = () => {
  const ref = React.useRef(null)
  const [scrolled, setScrolled] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const box = ref.current.getBoundingClientRect()
      const screen = window.innerHeight
      const now = Math.max(0, Math.min((box.height - screen) / screen, -box.top / screen))
      setScrolled(Math.round(now * 500) / 500)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])
  return [ref, scrolled]
}

const useStill = () => {
  const [still, setStill] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setStill(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return still
}

// Where everything is after this much scrolling: each piece's square or its
// place on the way, and the hand that carries the piece now moving.
const sceneAt = (scrolled, still) => {
  const at = Object.fromEntries(PIECES.map(piece => [piece.id, centre(piece.id)]))
  let carried = null
  let hand = null
  PLIES.forEach(([from, to], index) => {
    let u = (scrolled - FIRST_AT - index * PLY) / PLY
    if (u <= 0) return
    // With motion turned off a move is made in one step, and no hand passes.
    if (still) u = u < 0.5 ? 0 : 1
    const piece = PIECES.find(each => at[each.id][0] === centre(from)[0] && at[each.id][1] === centre(from)[1])
    if (u >= 1) {
      at[piece.id] = centre(to)
      return
    }
    if (u === 0) return
    // A move in three: the hand comes to the piece, carries it, and leaves.
    const carry = ease(within(u, 0.28, 0.72))
    at[piece.id] = mix(centre(from), centre(to), carry)
    if (carry > 0 && carry < 1) carried = piece.id
    const white = index % 2 === 0
    const picture = white ? MINE : THEIRS[(index - 1) / 2]
    if (!picture) return
    const size = SIZES[piece.kind]
    const w = size.w * SCALE
    const h = size.h * SCALE
    const head = ([x, y]) => [x, y + FOOT * w - h + HEAD * h]
    // It waits beyond its own edge of the board.
    const away = ([x]) => [x, white ? BOARD.height + 60 : -60]
    const place =
      u < 0.28
        ? mix(away(centre(from)), head(centre(from)), ease(within(u, 0, 0.28)))
        : u < 0.72
          ? head(at[piece.id])
          : mix(head(centre(to)), away(centre(to)), ease(within(u, 0.72, 1)))
    hand = { picture, white, place, shown: Math.min(within(u, 0, 0.1), 1 - within(u, 0.88, 1)) }
  })
  return { at, carried, hand }
}

const SIDES = [
  {
    name: "wooden-set",
    alt: "A wooden travel chess set lying open: the pieces rest in hollows of green felt, the light ones in the left half and the dark ones in the right.",
  },
  {
    name: "wooden-board",
    alt: "The same set turned over: its outside is the chessboard, sixty-four squares of light and dark wood across its two halves.",
  },
]

export const Wooden = ({ lines }) => {
  const [pin, scrolled] = useScrolled()
  const still = useStill()
  const turned = scrolled >= TURN_AT
  const set = scrolled >= SETUP_AT
  const played = Math.max(0, Math.min(PLIES.length, Math.floor((scrolled - FIRST_AT) / PLY + 0.5)))
  const { at, carried, hand } = sceneAt(scrolled, still)
  const percent = (value, of) => `${((value / of) * 100).toFixed(3)}%`
  const label = !turned
    ? SIDES[0].alt
    : !set
      ? SIDES[1].alt
      : `${SIDES[1].alt} The pieces are set up${
          played ? `, and a game is being played, one hand after another moving a piece: ${played} of ${PLIES.length} moves so far` : ""
        }.`

  return (
    <div className={c("ch-woodenPin")} ref={pin} style={{ "--screens": SCREENS }}>
      <div className={c("ch-woodenStage")}>
        <div className={c("ch-woodenScene")} role="img" aria-label={label}>
          <span className={c("ch-sides")} data-turned={turned ? "true" : "false"}>
            {SIDES.map((side, index) => (
              <img
                key={side.name}
                className={c("ch-side", index ? "ch-sideBack" : "ch-sideFront")}
                src={`/images/stories/chess/${side.name}.webp`}
                srcSet={`/images/stories/chess/${side.name}-600.webp 600w, /images/stories/chess/${side.name}.webp 1000w`}
                sizes="(max-width: 60rem) 92vw, 600px"
                alt=""
                width={BOARD.width}
                height={BOARD.height}
                decoding="async"
              />
            ))}
          </span>
          <div className={c("ch-woodenPieces")} data-on={set ? "true" : "false"}>
            {PIECES.map(piece => {
              const size = SIZES[piece.kind]
              const w = size.w * SCALE
              const h = size.h * SCALE
              const [x, y] = at[piece.id]
              return (
                <img
                  key={piece.id}
                  src={`/images/stories/chess/piece-${piece.kind}.webp`}
                  alt=""
                  width={size.w}
                  height={size.h}
                  decoding="async"
                  style={{
                    left: percent(x - w / 2, BOARD.width),
                    top: percent(y + FOOT * w - h, BOARD.height),
                    width: percent(w, BOARD.width),
                    // nearer pieces stand in front; the one in a hand, in front of all
                    zIndex: carried === piece.id ? 900 : Math.round(y),
                  }}
                />
              )
            })}
            {[MINE, ...THEIRS].map(picture => {
            const on = hand && hand.picture === picture
            const w = picture.wide * BOARD.width
            const h = (w * picture.height) / picture.width
            const [x, y] = on ? hand.place : [0, 0]
            return (
              <img
                key={picture.name}
                className={c("ch-woodenHand")}
                data-from={picture === MINE ? "below" : "above"}
                src={`/images/stories/chess/${picture.name}.webp`}
                srcSet={`/images/stories/chess/${picture.name}-${picture.small}.webp ${picture.small}w, /images/stories/chess/${picture.name}.webp ${picture.width}w`}
                sizes="(max-width: 60rem) 26vw, 170px"
                alt=""
                width={picture.width}
                height={picture.height}
                decoding="async"
                style={{
                  left: percent(x - picture.grip[0] * w, BOARD.width),
                  top: percent(y - picture.grip[1] * h, BOARD.height),
                  width: percent(w, BOARD.width),
                  opacity: on ? hand.shown : 0,
                }}
              />
            )
          })}
          </div>
        </div>
        {/* On a phone the words give way to the game: the hands need the room. */}
        <div className={c("ch-woodenText")} data-quiet={scrolled >= FIRST_AT - 0.15 ? "true" : "false"}>
          <Text name="board" />
        </div>
      </div>
      <Knots of={lines} />
    </div>
  )
}
