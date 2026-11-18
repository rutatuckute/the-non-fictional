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
// It lies as a set does between two players: the hinge across, a half for
// each. Every move is carried by a hand. Yours comes from below; the hand that
// answers from above is a different person's each time (where one's picture
// is not made yet, that move's piece goes by itself).
//
// The scene does not sit on the scroll position itself: it follows it, closing
// a share of the distance in every frame, so a turn of a mouse wheel or an
// uneven swipe is drawn as one glide and not as the steps it arrives in.

// The board in wooden-board.webp, 838 x 1000: the edges of its squares, files
// a to h from the left and ranks 8 to 1 from the top.
const BOARD = {
  width: 838,
  height: 1000,
  x: [86, 168, 250, 332, 413, 492, 570, 651, 731],
  y: [174, 256, 340, 421, 503, 583, 666, 748, 831],
}
const SQUARE = 80.6
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

// A hand: its picture, how wide it is against the board, and where in the
// picture its fingers close (shares of the picture).
const MINE = { name: "hand-me", small: 260, width: 440, height: 1463, wide: 0.32, grip: [0.317, 0.11] }
// The hands that answer, one for each of Black's moves, in order: a different
// person each time. A move whose hand is not made yet is played with no hand.
const THEIRS = [
  { name: "hand-opponent-1", small: 260, width: 440, height: 1473, wide: 0.32, grip: [0.74, 0.955] },
  { name: "hand-opponent-2", small: 260, width: 440, height: 1445, wide: 0.32, grip: [0.745, 0.955] },
  // its sleeve is the widest, so the picture is wider for the hand to be to the others' scale
  { name: "hand-opponent-3", small: 300, width: 500, height: 1472, wide: 0.363, grip: [0.735, 0.955] },
]
const HANDS = [MINE, ...THEIRS]

// The scroll, in screens, since the scene was pinned. A move takes LASTS of
// scrolling and the next begins EVERY after it, so one hand is still leaving
// as the other comes in: something is always on its way.
const TURN_AT = 0.3
const SETUP_AT = 0.55
const FIRST_AT = 0.85
const EVERY = 0.4
const LASTS = 0.6
export const SCREENS = FIRST_AT + (PLIES.length - 1) * EVERY + LASTS + 0.15
// Of a move: the hand comes to the piece, carries it, and leaves.
const TAKES = 0.32
const LEAVES = 0.72
// How closely the scene follows the scroll: the time, in milliseconds, in
// which it closes about two thirds of the distance.
const FOLLOW = 150

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
// Which piece each move moves: the one standing on its square when it comes.
const MOVED = (() => {
  const on = Object.fromEntries(PIECES.map(piece => [piece.id, piece]))
  return PLIES.map(([from, to]) => {
    const piece = on[from]
    delete on[from]
    on[to] = piece
    return piece
  })
})()

const within = (t, from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
// Every stretch of a move starts and ends at rest, and is never faster than
// half as fast again as an even pace.
const gently = t => t * t * (3 - 2 * t)

// Where everything is after this much scrolling: each piece's square or its
// place on the way, and where each hand is and how much of it shows.
const sceneAt = (scrolled, still) => {
  const at = Object.fromEntries(PIECES.map(piece => [piece.id, centre(piece.id)]))
  const hands = {}
  let carried = null
  let played = 0
  PLIES.forEach(([from, to], index) => {
    let u = (scrolled - FIRST_AT - index * EVERY) / LASTS
    if (u <= 0) return
    // With motion turned off a move is made in one step, and no hand passes.
    if (still) u = u < 0.5 ? 0 : 1
    if (u === 0) return
    const piece = MOVED[index]
    const carry = gently(within(u, TAKES, LEAVES))
    at[piece.id] = mix(centre(from), centre(to), carry)
    if (carry >= 1) played = index + 1
    if (u >= 1) return
    if (carry > 0 && carry < 1) carried = piece.id
    const white = index % 2 === 0
    const picture = white ? MINE : THEIRS[(index - 1) / 2]
    if (!picture) return
    const w = SIZES[piece.kind].w * SCALE
    const h = SIZES[piece.kind].h * SCALE
    const head = ([x, y]) => [x, y + FOOT * w - h + HEAD * h]
    // It waits just beyond its own edge of the board.
    const away = ([x]) => [x, white ? BOARD.height + 130 : -130]
    const place =
      u < TAKES
        ? mix(away(centre(from)), head(centre(from)), gently(within(u, 0, TAKES)))
        : u < LEAVES
          ? head(at[piece.id])
          : mix(head(centre(to)), away(centre(to)), gently(within(u, LEAVES, 1)))
    // It is whole while any of it is over the board, and fades only beyond the edge.
    const beyond = white ? place[1] - BOARD.height : -place[1]
    hands[picture.name] = { place, shown: 1 - within(beyond, 20, 125) }
  })
  return { at, hands, carried, played }
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

const SIDES = [
  {
    name: "wooden-set",
    alt: "A wooden travel chess set lying open: the pieces rest in hollows of green felt, the dark ones in the far half and the light ones in the near half.",
  },
  {
    name: "wooden-board",
    alt: "The same set turned over: its outside is the chessboard, sixty-four squares of light and dark wood across its two halves.",
  },
]

export const Wooden = ({ lines }) => {
  const pin = React.useRef(null)
  const scene = React.useRef(null)
  const pieces = React.useRef({})
  const hands = React.useRef({})
  const still = useStill()
  // What changes in steps, for the page to say and to style: the rest is
  // written straight onto the pieces and the hands, frame by frame.
  const [stage, setStage] = React.useState({ turned: false, set: false, quiet: false, played: 0 })

  React.useEffect(() => {
    let frame = 0
    let shown = null
    let last = 0
    const goal = () => {
      const box = pin.current.getBoundingClientRect()
      const screen = window.innerHeight
      return Math.max(0, Math.min((box.height - screen) / screen, -box.top / screen))
    }
    const paint = scrolled => {
      // one unit of the board's picture, in the screen's pixels
      const k = scene.current.clientWidth / BOARD.width
      const now = sceneAt(scrolled, still)
      for (const piece of PIECES) {
        const node = pieces.current[piece.id]
        if (!node) continue
        const w = SIZES[piece.kind].w * SCALE
        const h = SIZES[piece.kind].h * SCALE
        const [x, y] = now.at[piece.id]
        node.style.transform = `translate3d(${((x - w / 2) * k).toFixed(2)}px, ${((y + FOOT * w - h) * k).toFixed(2)}px, 0)`
        // nearer pieces stand in front; the one in a hand, in front of all
        node.style.zIndex = now.carried === piece.id ? 900 : Math.round(y)
      }
      for (const picture of HANDS) {
        const node = hands.current[picture.name]
        if (!node) continue
        const hand = now.hands[picture.name]
        if (!hand) {
          node.style.opacity = 0
          continue
        }
        const w = picture.wide * BOARD.width
        const h = (w * picture.height) / picture.width
        node.style.transform = `translate3d(${((hand.place[0] - picture.grip[0] * w) * k).toFixed(2)}px, ${((hand.place[1] - picture.grip[1] * h) * k).toFixed(2)}px, 0)`
        node.style.opacity = hand.shown.toFixed(3)
      }
      const next = { turned: scrolled >= TURN_AT, set: scrolled >= SETUP_AT, quiet: scrolled >= FIRST_AT - 0.15, played: now.played }
      setStage(before => (Object.keys(next).every(key => before[key] === next[key]) ? before : next))
    }
    const tick = time => {
      frame = 0
      const to = goal()
      // At first, with motion turned off, and after a jump down the page, it is simply there.
      if (shown === null || still || Math.abs(to - shown) > 1.2) shown = to
      else {
        shown += (to - shown) * (1 - Math.exp(-Math.min(64, time - last) / FOLLOW))
        if (Math.abs(to - shown) < 0.0004) shown = to
      }
      last = time
      paint(shown)
      if (shown !== to) frame = window.requestAnimationFrame(tick)
    }
    const wake = () => {
      if (frame) return
      last = window.performance.now()
      frame = window.requestAnimationFrame(tick)
    }
    // the board's size changes what a square is in pixels
    const resized = () => {
      if (shown !== null) paint(shown)
      wake()
    }
    wake()
    const observer = new ResizeObserver(resized)
    observer.observe(scene.current)
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", resized)
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", resized)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [still])

  const share = (value, of) => `${((value / of) * 100).toFixed(3)}%`
  const label = !stage.turned
    ? SIDES[0].alt
    : !stage.set
      ? SIDES[1].alt
      : `${SIDES[1].alt} The pieces are set up${
          stage.played
            ? `, and a game is being played, one hand after another moving a piece: ${stage.played} of ${PLIES.length} moves so far`
            : ""
        }.`

  return (
    <div className={c("ch-woodenPin")} ref={pin} style={{ "--screens": SCREENS }}>
      <div className={c("ch-woodenStage")}>
        <div className={c("ch-woodenScene")} ref={scene} role="img" aria-label={label}>
          <span className={c("ch-sides")} data-turned={stage.turned ? "true" : "false"}>
            {SIDES.map((side, index) => (
              <img
                key={side.name}
                className={c("ch-side", index ? "ch-sideBack" : "ch-sideFront")}
                src={`/images/stories/chess/${side.name}.webp`}
                srcSet={`/images/stories/chess/${side.name}-500.webp 500w, /images/stories/chess/${side.name}.webp 838w`}
                sizes="(max-width: 60rem) 92vw, 500px"
                alt=""
                width={BOARD.width}
                height={BOARD.height}
                decoding="async"
              />
            ))}
          </span>
          <div className={c("ch-woodenPieces")} data-on={stage.set ? "true" : "false"}>
            {PIECES.map(piece => (
              <img
                key={piece.id}
                ref={node => (pieces.current[piece.id] = node)}
                src={`/images/stories/chess/piece-${piece.kind}.webp`}
                alt=""
                width={SIZES[piece.kind].w}
                height={SIZES[piece.kind].h}
                decoding="async"
                style={{ width: share(SIZES[piece.kind].w * SCALE, BOARD.width) }}
              />
            ))}
            {HANDS.map(picture => (
              <img
                key={picture.name}
                ref={node => (hands.current[picture.name] = node)}
                className={c("ch-woodenHand")}
                data-from={picture === MINE ? "below" : "above"}
                src={`/images/stories/chess/${picture.name}.webp`}
                srcSet={`/images/stories/chess/${picture.name}-${picture.small}.webp ${picture.small}w, /images/stories/chess/${picture.name}.webp ${picture.width}w`}
                sizes="(max-width: 60rem) 30vw, 170px"
                alt=""
                width={picture.width}
                height={picture.height}
                decoding="async"
                style={{ width: share(picture.wide, 1), opacity: 0 }}
              />
            ))}
          </div>
        </div>
        {/* On a phone the words give way to the game: the hands need the room. */}
        <div className={c("ch-woodenText")} data-quiet={stage.quiet ? "true" : "false"}>
          <Text name="board" />
        </div>
      </div>
      <Knots of={lines} />
    </div>
  )
}
