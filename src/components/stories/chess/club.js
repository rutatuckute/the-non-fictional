"use client"

import * as React from "react"

import SIZES from "./club-pieces.json"
import { useFollow, useStill } from "./follow"
import { c, PinSteps, stepLine } from "./parts"

// The board at the London chess club, and the game on it: from the starting
// position the London System is set up, move by move, as the reader scrolls
// on from the card that names it. White is the author, seated in front of the
// board with her back to us, so her pieces come out from behind her; Black's
// are carried by the opponent's arm, reaching in from the far side.
//
// The scene follows the scroll (follow.js), as the wooden set's does.

// The board in club-board-empty.webp, 1000 x 829, seen from White's side and
// from above: the ranks lie level, 8 at the top to 1, and the files converge
// towards the far side, so each rank has its own files' edges, measured half
// way down it (scripts/stories/chess/make-club-board.cjs prints both).
const BOARD = {
  width: 1000,
  height: 829,
  y: [114, 182, 245, 316, 388, 468, 549, 637, 756],
  x: [
    [141, 233, 323, 411, 501, 590, 680, 768, 862],
    [130, 229, 318, 410, 500, 594, 684, 776, 867],
    [125, 221, 315, 408, 501, 595, 690, 782, 879],
    [113, 216, 310, 406, 501, 598, 693, 790, 885],
    [107, 208, 307, 403, 502, 600, 699, 797, 898],
    [94, 202, 302, 402, 501, 604, 703, 806, 905],
    [87, 194, 298, 400, 502, 606, 709, 812, 920],
    [72, 188, 291, 399, 501, 610, 715, 823, 930],
  ],
}
// The picture's own perspective: the far pieces are seen almost from the
// side, the near ones from well above. So the two colours are two drawings
// (scripts/stories/chess/make-pieces.cjs), each fitted to its own side: how
// wide its king's base is against a square, how far above its picture's bottom
// edge a base's centre is (in widths), and how far down a piece its head is.
const FIT = {
  w: { base: 0.72, foot: 0.25, head: 0.2 },
  b: { base: 0.76, foot: 0.12, head: 0.1 },
}
// A piece's picture is laid out for a square 100 wide and scaled to its rank.
const PER_100 = colour => (FIT[colour].base * 100) / SIZES[`${colour}k`].w

const START = ["rnbqkbnr", "pppppppp", "", "", "", "", "PPPPPPPP", "RNBQKBNR"]
// 1.d4 d5 2.Bf4 Nf6 3.e3 e6 4.Nf3 c5 5.c3: the London System, set up.
const PLIES = [
  ["d2", "d4"],
  ["d7", "d5"],
  ["c1", "f4"],
  ["g8", "f6"],
  ["e2", "e3"],
  ["e7", "e6"],
  ["g1", "f3"],
  ["c7", "c5"],
  ["c2", "c3"],
]

// The opponent's arm: how wide its picture is against the board, where in it
// the fingers close, and how it is turned about that point.
const ARM = { name: "opponent-arm", small: 360, width: 640, height: 423, wide: 0.88, grip: [0.15, 0.93], turn: -22 }

// The scroll, in screens, since the card that names the London System reached
// its line. A move takes LASTS and the next begins EVERY after it.
const FIRST_AT = 0.2
const EVERY = 0.28
const LASTS = 0.42
// How much longer than a card's own stretch this takes: the scene's step is
// given this much more scrolling (see `rest` in Pinned).
export const CLUB_REST = FIRST_AT + (PLIES.length - 1) * EVERY + LASTS + 0.1 - 0.88
const TAKES = 0.32
const LEAVES = 0.72

// A square: its centre, and how wide a square is at its rank.
const square = name => {
  const file = "abcdefgh".indexOf(name[0])
  const row = 8 - Number(name[1])
  const edges = BOARD.x[row]
  return [(edges[file] + edges[file + 1]) / 2, (BOARD.y[row] + BOARD.y[row + 1]) / 2, (edges[8] - edges[0]) / 8]
}

const PIECES = START.flatMap((row, r) =>
  [...row].map((letter, f) => ({
    id: `${"abcdefgh"[f]}${8 - r}`,
    colour: letter === letter.toUpperCase() ? "w" : "b",
    kind: (letter === letter.toUpperCase() ? "w" : "b") + letter.toLowerCase(),
  })),
)
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
const mix = (a, b, t) => a.map((value, index) => value + (b[index] - value) * t)
const gently = t => t * t * (3 - 2 * t)

// A piece's picture on the board: its top left corner and its scale.
const boxOf = (piece, [x, y, size]) => {
  const scale = size / 100
  const w = SIZES[piece.kind].w * PER_100(piece.colour) * scale
  const h = SIZES[piece.kind].h * PER_100(piece.colour) * scale
  return { left: x - w / 2, top: y + FIT[piece.colour].foot * w - h, w, h, scale }
}

const sceneAt = (scrolled, still) => {
  const at = Object.fromEntries(PIECES.map(piece => [piece.id, square(piece.id)]))
  let carried = null
  let arm = null
  let played = 0
  PLIES.forEach(([from, to], index) => {
    let u = (scrolled - FIRST_AT - index * EVERY) / LASTS
    if (u <= 0) return
    if (still) u = u < 0.5 ? 0 : 1
    if (u === 0) return
    const piece = MOVED[index]
    const carry = gently(within(u, TAKES, LEAVES))
    at[piece.id] = mix(square(from), square(to), carry)
    if (carry >= 1) played = index + 1
    if (u >= 1) return
    if (carry > 0 && carry < 1) carried = piece.id
    // Black's moves are carried by the arm; White's pieces are moved from
    // where we cannot see, by the figure seated in front of them.
    if (piece.colour !== "b") return
    const head = where => {
      const box = boxOf(piece, where)
      return [where[0], box.top + FIT.b.head * box.h]
    }
    // It waits beyond the board's far edge, up its own line.
    const away = ([x, y]) => [x + 190, y - 230]
    const place =
      u < TAKES
        ? mix(away(head(square(from))), head(square(from)), gently(within(u, 0, TAKES)))
        : u < LEAVES
          ? head(at[piece.id])
          : mix(head(square(to)), away(head(square(to))), gently(within(u, LEAVES, 1)))
    // It is whole while its fingers are over the board, and fades beyond the far edge.
    arm = { place, shown: 1 - within(BOARD.y[0] - 40 - place[1], 0, 110) }
  })
  return { at, carried, arm, played }
}

// `during` is the number of the pinned scene's step that names the London System.
export const ClubBoard = ({ during }) => {
  const steps = React.useContext(PinSteps)
  const table = React.useRef(null)
  const pieces = React.useRef({})
  const armNode = React.useRef(null)
  const still = useStill()
  const [played, setPlayed] = React.useState(0)

  const goal = () => {
    const node = steps?.current?.[during]
    if (!node) return 0
    const top = (node.firstElementChild || node).getBoundingClientRect().top
    return Math.max(0, Math.min(CLUB_REST + 1.2, (stepLine() - top) / window.innerHeight))
  }
  const paint = scrolled => {
    const k = table.current.clientWidth / BOARD.width
    const now = sceneAt(scrolled, still)
    for (const piece of PIECES) {
      const node = pieces.current[piece.id]
      if (!node) continue
      const box = boxOf(piece, now.at[piece.id])
      node.style.transform = `translate3d(${(box.left * k).toFixed(2)}px, ${(box.top * k).toFixed(2)}px, 0) scale(${box.scale.toFixed(4)})`
      node.style.zIndex = now.carried === piece.id ? 900 : Math.round(now.at[piece.id][1])
    }
    if (armNode.current) {
      if (now.arm) {
        const w = ARM.wide * BOARD.width
        const h = (w * ARM.height) / ARM.width
        armNode.current.style.transform = `translate3d(${((now.arm.place[0] - ARM.grip[0] * w) * k).toFixed(2)}px, ${((now.arm.place[1] - ARM.grip[1] * h) * k).toFixed(2)}px, 0) rotate(${ARM.turn}deg)`
        armNode.current.style.opacity = now.arm.shown.toFixed(3)
      } else armNode.current.style.opacity = 0
    }
    setPlayed(before => (before === now.played ? before : now.played))
  }
  useFollow(goal, paint, { still, watch: table })

  const share = value => `${(value * 100).toFixed(3)}%`
  return (
    <div
      className={c("ch-clubTable")}
      ref={table}
      role="img"
      aria-label={`The club's board: pink and white squares with letters and numbers along its edges, and black and white plastic pieces. ${
        played
          ? `A game is being played: White sets up the London System, pawn to d4, bishop to f4, and Black answers, a hand reaching in from the far side. ${played} of ${PLIES.length} moves so far.`
          : "The pieces are set up for a game."
      }`}
    >
      <img
        className={c("ch-clubGround")}
        src="/images/stories/chess/club-board-empty.webp"
        srcSet="/images/stories/chess/club-board-empty-600.webp 600w, /images/stories/chess/club-board-empty.webp 1000w"
        sizes="(max-width: 60rem) 60vw, 400px"
        alt=""
        width={BOARD.width}
        height={BOARD.height}
        decoding="async"
      />
      {PIECES.map(piece => (
        <img
          key={piece.id}
          ref={node => (pieces.current[piece.id] = node)}
          className={c("ch-clubPiece")}
          src={`/images/stories/chess/club-${piece.kind}.webp`}
          alt=""
          width={SIZES[piece.kind].w}
          height={SIZES[piece.kind].h}
          decoding="async"
          style={{ width: share((SIZES[piece.kind].w * PER_100(piece.colour)) / BOARD.width) }}
        />
      ))}
      <img
        ref={armNode}
        className={c("ch-clubArm")}
        src={`/images/stories/chess/${ARM.name}.webp`}
        srcSet={`/images/stories/chess/${ARM.name}-${ARM.small}.webp ${ARM.small}w, /images/stories/chess/${ARM.name}.webp ${ARM.width}w`}
        sizes="(max-width: 60rem) 40vw, 300px"
        alt=""
        width={ARM.width}
        height={ARM.height}
        decoding="async"
        style={{ width: share(ARM.wide), transformOrigin: `${ARM.grip[0] * 100}% ${ARM.grip[1] * 100}%`, opacity: 0 }}
      />
    </div>
  )
}
