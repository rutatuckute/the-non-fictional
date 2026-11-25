"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { c, Text } from "./parts"
import SIZES from "./pieces.json"
import { Knots } from "./thread"
import { DROP, TimeChart } from "./time-chart"
import { crossing, PhoneScreen, Pictured, STRANGERS, STRANGERS_LABEL } from "./strangers"
import { ThreadBridge } from "./thread-bridge"

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
// Then the same game goes on elsewhere. The pieces are put away, and the
// board becomes the board on a phone's screen: the phone is laid over the set
// with its squares on the set's squares, and the two draw back together until
// the whole phone is in view. At once the phone goes small and comes to rest
// under the near corner of a chart, where its time axis begins; the chart
// stands still, its line of data coming up out of the phone, while the note
// at its peak appears (time-chart.js). The words beside it change as it does.
//
// From the moment the phone appears, the scene has a ground of the page's own
// colour under it: the thread, which came down the page into the board, is
// continued above that ground through the phone, then becomes the chart line.
//
// Then Part II begins on the same phone. It grows back from the chart's corner
// to the middle; its screen searches for an opponent; the part's title comes
// as one is found. Three strangers, one after another: each one's game on the
// screen, each pictured beside it as the author imagines them (the picture
// draws itself in), each one's life a grey thread that comes in from the
// screen's edge, through the phone, and away. Then the phone goes, and 1,938
// faint threads cross the screen: one for each person met.
//
// Beside it all, on a wide screen, the words scroll past in a column of their
// own (WORDS: each is in the middle of the screen at its moment); on a phone
// they stand at the top, one after another.
//
// The scene follows the scroll (follow.js), it does not sit on it.

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
// The game: an open game, as on the device of the first memory, and 1. e4 as
// the author mostly opened before the London System, and only since.
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

// The phone (phone.webp, 800 x 1704), in the board's picture's own units, laid
// so that the board on its screen (its left 78.1 to 716.3 and top 563.2 to
// 1202.2, from scripts/stories/chess/make-phone.cjs) lies on the set's squares.
const FIELD = { x: (BOARD.x[0] + BOARD.x[8]) / 2, y: (BOARD.y[0] + BOARD.y[8]) / 2, width: BOARD.x[8] - BOARD.x[0] }
const PHONE = (() => {
  const unit = FIELD.width / (716.3 - 78.1)
  return { left: FIELD.x - 397.2 * unit, top: FIELD.y - 882.7 * unit, width: 800 * unit, height: 1704 * unit }
})()
// How tall the phone is on the screen: held in the middle, then at rest under
// the chart's near corner. Shares of the screen's height; [wide screens, narrow ones].
const HELD = { tall: [0.78, 0.66], middle: [0.5, 0.57] }
const REST = { tall: [0.2, 0.19] }

// The scroll, in screens, since the scene was pinned. A move takes LASTS of
// scrolling and the next begins EVERY after it, so one hand is still leaving
// as the other comes in: something is always on its way.
// The set comes in open with its first words; it turns over, the pieces are
// at once in place, and only then do the hands begin, with "Different
// people…"; half way through the game, the last two lines.
const TURN_AT = 0.3
const SETUP_AT = 0.62
const FIRST_AT = 0.82
const EVERY = 0.3
const LASTS = 0.5
const GAME_OVER = FIRST_AT + (PLIES.length - 1) * EVERY + LASTS
// The pieces are put away and the board becomes the phone's; at once the
// phone goes to its place under the chart, which comes in as it does.
const AWAY_AT = GAME_OVER + 0.08
const PHONE_AT = GAME_OVER + 0.2
const CHANGE = 0.5
const REST_AT = PHONE_AT + CHANGE + 0.1
// Beside the chart, first the claim, "I'm not THE chess player, though", as
// the chart and the note at its peak (about 100 minutes a day) come in: the
// data answers it without a word. Then the words that follow.
const CLAIM_AT = REST_AT + CHANGE - 0.12
const DRAW_AT = CLAIM_AT + 0.55
const ASK_AT = DRAW_AT + 0.5
// Part II: the phone grows back to the middle and searches; the title and
// the first stranger; the other two; then the many.
const HANDOFF_AT = ASK_AT + 0.55
const SEARCH_AT = HANDOFF_AT + 0.25
export const TITLE_AT = HANDOFF_AT + 0.7
const MET = [TITLE_AT, TITLE_AT + 1.45, TITLE_AT + 2.0]
const PICTURE_AT = [TITLE_AT + 0.85, MET[1] + 0.1, MET[2] + 0.1]
const MANY_AT = MET[2] + 0.55
// Read all three statistics before this same thread field begins to weave.
const WEAVE_AT = MANY_AT + 1.9
export const SCREENS = WEAVE_AT + 1.4
// The words, each at its moment (screens into the scene) and in its look.
const WORDS = [
  ["board", 0.05],
  ["same-game", FIRST_AT + 0.1],
  ["possibilities", FIRST_AT + 3 * EVERY + 0.1],
  ["chess-com", PHONE_AT + 0.35],
  ["not-a-player", CLAIM_AT + 0.05],
  ["obsession", DRAW_AT + 0.05],
  ["obsession-questions", ASK_AT + 0.05],
  ["people-bridge", HANDOFF_AT + 0.25],
  ["people-intro", TITLE_AT + 0.1],
  ["strangers", TITLE_AT + 1.15, "question"],
  ["strangers-where", MET[1] + 0.12, "question"],
  ["strangers-moment", MET[2] + 0.12, "question"],
]
// Of a move: the hand comes to the piece, carries it, and leaves.
const TAKES = 0.32
const LEAVES = 0.72
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

const PHONE_ALT =
  "A phone in a black case showing the author’s first game on Chess.com, already over after one move each, pawn to e4 and knight to f6: a resignation flag on the black king, a winner’s crown on the white one. The opponent, rated 635, has 29:28 left on the clock; the author, rated 921, has 29:36. Both players’ names and profile pictures are blurred."

// `lines` are the threads' ways down the scene's stretch.
export const Wooden = ({ lines }) => {
  const pin = React.useRef(null)
  const stand = React.useRef(null)
  const scene = React.useRef(null)
  const lid = React.useRef(null)
  const phone = React.useRef(null)
  const veil = React.useRef(null)
  const chart = React.useRef(null)
  const link = React.useRef(null)
  const incoming = React.useRef(null)
  const plot = React.useRef(null)
  const title = React.useRef(null)
  const pictured = React.useRef(null)
  const crossings = React.useRef([])
  const many = React.useRef(null)
  const manyCopy = React.useRef(null)
  const pieces = React.useRef({})
  const hands = React.useRef({})
  const still = useStill()
  // What changes in steps, for the page to say and to style: the rest is
  // written straight onto the pieces and the hands, frame by frame.
  const [stage, setStage] = React.useState({ turned: false, set: false, social: false, played: 0, phone: false, first: false, words: WORDS[0][0], who: -1, online: false, narrow: false })

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
    // The board becomes the phone's, and the phone goes to its corner. One
    // change of size and place is applied to the set and to the phone alike,
    // so the squares of the two stay on each other while one gives way.
    const box = scene.current.getBoundingClientRect()
    const screen = stand.current.getBoundingClientRect()
    const narrow = window.matchMedia("(max-width: 60rem)").matches ? 1 : 0
    const own = [PHONE.left * k, PHONE.top * k]
    const tall = PHONE.height * k
    const heldSize = (screen.height * HELD.tall[narrow]) / tall
    const held = [box.width / 2 - (PHONE.width * k * heldSize) / 2, screen.top + screen.height * HELD.middle[narrow] - box.top - (tall * heldSize) / 2]
    // at rest its top is DROP under the axis, its middle on the axis's beginning
    const restSize = (screen.height * REST.tall[narrow]) / tall
    const origin = (plot.current ||= chart.current.querySelector("[data-plot]")).getBoundingClientRect()
    const rest = [Math.max(screen.left + 4, origin.left - (PHONE.width * k * restSize) / 2) - box.left, origin.bottom + DROP - box.top]
    const arrives = within(scrolled, PHONE_AT, PHONE_AT + CHANGE)
    const leaves = gently(within(scrolled, REST_AT, REST_AT + CHANGE))
    // Part II: back from the chart's corner to the middle (on a phone, smaller
    // and to the left, with room beside it for the stranger)
    const back = gently(within(scrolled, HANDOFF_AT, HANDOFF_AT + CHANGE))
    const metSize = narrow ? (screen.height * 0.44) / tall : heldSize
    const met = narrow
      ? [screen.left + screen.width * 0.27 - box.left - (PHONE.width * k * metSize) / 2, screen.top + screen.height * 0.63 - box.top - (tall * metSize) / 2]
      : held
    const size = back > 0 ? restSize + (metSize - restSize) * back : leaves > 0 ? heldSize + (restSize - heldSize) * leaves : 1 + (heldSize - 1) * gently(arrives)
    const place = back > 0 ? mix(rest, met, back) : leaves > 0 ? mix(held, rest, leaves) : mix(own, held, gently(arrives))
    const gone = within(scrolled, MANY_AT, MANY_AT + 0.3)
    phone.current.style.transform = `translate3d(${(place[0] - own[0]).toFixed(2)}px, ${(place[1] - own[1]).toFixed(2)}px, 0) scale(${size.toFixed(4)})`
    phone.current.style.opacity = (gently(within(arrives, 0.1, 0.7)) * (1 - gone)).toFixed(3)
    // its screen: the first game, then the search, then the strangers' games
    phone.current.style.setProperty("--online", within(scrolled, SEARCH_AT - 0.15, SEARCH_AT).toFixed(3))
    // the strangers, pictured beside the phone, each drawing itself in
    const centre = [box.left + place[0] + (PHONE.width * k * size) / 2 - screen.left, box.top + place[1] + (tall * size) / 2 - screen.top]
    if (pictured.current) {
      pictured.current.style.opacity = (1 - gone).toFixed(3)
      pictured.current.querySelectorAll("[data-who]").forEach(node => {
        const index = Number(node.dataset.who)
        node.style.setProperty("--drawn", (still ? 1 : gently(within(scrolled, PICTURE_AT[index], PICTURE_AT[index] + 0.4))).toFixed(3))
      })
    }
    // each one's life, a grey thread through the game
    crossings.current.forEach((path, index) => {
      if (!path) return
      const d = crossing(index, narrow, screen.width, screen.height, centre)
      if (path.getAttribute("d") !== d) path.setAttribute("d", d)
      const length = path.getTotalLength()
      // The last opponent stays: their white strand joins the author's clay
      // strand in the field, instead of being drawn out with the phone.
      const end = MET[index + 1] ?? Infinity
      const u = still ? (scrolled >= MET[index] && scrolled < end ? 1 : 0) : within(scrolled, MET[index] - 0.1, MET[index] + 0.6) + (Number.isFinite(end) ? within(scrolled, end - 0.15, end + 0.45) : 0)
      path.style.strokeDasharray = `${length} ${length}`
      path.style.strokeDashoffset = (length * (1 - u)).toFixed(1)
      path.style.opacity = u > 0 && u < 2 ? "1" : "0"
    })
    const club = pin.current.nextElementSibling
    club.dataset.arrived = club.getBoundingClientRect().top <= 0 ? "true" : "false"
    // On phones these words are pinned above the drawing. Fade them only
    // after their reading pause, as the weave itself begins.
    manyCopy.current.style.opacity = String(still
      ? Number(scrolled >= MANY_AT + 0.3 && scrolled < WEAVE_AT)
      : within(scrolled, MANY_AT + 0.05, MANY_AT + 0.3) * (1 - within(scrolled, WEAVE_AT, WEAVE_AT + 0.3)))
    // the part's name stays at the top from the moment the first is found
    const people = pin.current.closest("[data-people]")
    if (people) people.dataset.titled = scrolled >= TITLE_AT - 0.1 ? "true" : "false"
    // the ground comes under the scene as the phone appears, and takes the thread in
    veil.current.style.opacity = within(arrives, 0.04, 0.3).toFixed(3)
    // Take over the visible thread exactly where the previous scroll crosses
    // the stage's top. The stage's ground can then cover the old page-space
    // line without losing it. As the chart arrives, route the continuation
    // through the left gutter and under the phone, clear of axes and words.
    const source = (incoming.current?.isConnected ? incoming.current : null) ||
      (incoming.current = pin.current.closest('[class*="__ch-story"]').querySelector('path[data-run="a"]'))
    if (source) {
      const sourceBox = source.ownerSVGElement.getBoundingClientRect()
      const targetY = screen.top - sourceBox.top
      let lo = 0, hi = source.getTotalLength()
      for (let i = 0; i < 25; i++) {
        const middle = (lo + hi) / 2
        if (source.getPointAtLength(middle).y < targetY) lo = middle
        else hi = middle
      }
      const point = source.getPointAtLength((lo + hi) / 2)
      const startX = point.x + sourceBox.left - screen.left
      const intoGutter = gently(within(scrolled, REST_AT, REST_AT + 0.18))
      const lane = startX + ((narrow ? 4 : 1) - startX) * intoGutter * (1 - back)
      const endX = box.left + place[0] + PHONE.width * k * size / 2 - screen.left
      const endY = box.top + place[1] + tall * size * 0.58 - screen.top
      const head = (title.current ||= chart.current.querySelector("h3")).getBoundingClientRect()
      const bendY = narrow ? 32 : Math.max(24, Math.min(endY * 0.45, head.top - screen.top - 18)) * (1 - back) + Math.max(24, endY * 0.4) * back
      const turnY = Math.max(bendY, endY - 45)
      link.current.setAttribute("d", `M${startX.toFixed(2)},0 C${startX.toFixed(2)},${(bendY * 0.45).toFixed(2)} ${lane.toFixed(2)},${(bendY * 0.55).toFixed(2)} ${lane.toFixed(2)},${bendY.toFixed(2)} L${lane.toFixed(2)},${turnY.toFixed(2)} Q${lane.toFixed(2)},${endY.toFixed(2)} ${endX.toFixed(2)},${endY.toFixed(2)}`)
      link.current.parentElement.style.opacity = within(arrives, 0.04, 0.3).toFixed(3)
    }
    // the chart comes in as the phone goes to it
    chart.current.style.opacity = (within(scrolled, REST_AT + 0.2, REST_AT + CHANGE) * (1 - within(scrolled, HANDOFF_AT - 0.05, HANDOFF_AT + 0.3))).toFixed(3)
    // the whole line is there as the chart arrives, the note at its peak with it
    chart.current.style.setProperty("--peak", within(scrolled, CLAIM_AT, CLAIM_AT + 0.3).toFixed(3))
    lid.current.style.transform =
      arrives > 0 ? `translate3d(${(place[0] - size * own[0]).toFixed(2)}px, ${(place[1] - size * own[1]).toFixed(2)}px, 0) scale(${size.toFixed(4)})` : "none"
    lid.current.style.opacity = (1 - within(arrives, 0.7, 1)).toFixed(3)

    // Continue the two paths just painted into the crowd, then into board
    // squares. Run last so the phone cannot overwrite their shared geometry.
    many.current?.paint({
      share: still ? Number(scrolled >= MANY_AT + 0.3) : gently(within(scrolled, MANY_AT + 0.2, MANY_AT + 0.95)),
      joined: still ? Number(scrolled >= MANY_AT + 0.3) : gently(within(scrolled, MANY_AT, MANY_AT + 0.85)),
      scrolled: scrolled - WEAVE_AT,
      still,
      narrow: Boolean(narrow),
      threads: [link.current, crossings.current[STRANGERS.length - 1]],
    })

    const next = {
      turned: scrolled >= TURN_AT,
      set: scrolled >= SETUP_AT && scrolled < AWAY_AT,
      // (on a phone the words stand above the board, where the first hand to answer comes in)
      // the social media estimate joins the chart with "A winning trade-off?"
      social: scrolled >= DRAW_AT,
      played: now.played,
      // (on a phone, one at a time: each from a little before its moment;
      // none for a moment as the board becomes the phone)
      words: scrolled >= MANY_AT || (scrolled >= PHONE_AT + 0.05 && scrolled < PHONE_AT + 0.25) ? "none" : (WORDS.filter(([, at]) => scrolled >= at - 0.3).pop() || WORDS[0])[0],
      who: scrolled < TITLE_AT ? -1 : MET.filter(at => scrolled >= at).length - 1,
      online: scrolled >= HANDOFF_AT,
      narrow: Boolean(narrow),
      phone: scrolled >= PHONE_AT + CHANGE / 2,
      // 1. e4: as it is played on the set, and again on the phone's first game
      first: (now.played >= 1 && scrolled < AWAY_AT) || (scrolled >= PHONE_AT + 0.3 && scrolled < CLAIM_AT),
    }
    setStage(before => (Object.keys(next).every(key => before[key] === next[key]) ? before : next))
  }
  useFollow(goal, paint, { still, watch: scene })

  const share = (value, of) => `${((value / of) * 100).toFixed(3)}%`
  const label = stage.online
    ? STRANGERS_LABEL
    : stage.phone
    ? PHONE_ALT
    : !stage.turned
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
      <div className={c("ch-woodenStage")} ref={stand}>
        <i className={c("ch-woodenVeil")} ref={veil} style={{ opacity: 0 }} />
        <svg className={c("ch-woodenLink")} aria-hidden="true" style={{ opacity: 0 }}>
          <path ref={link} />
        </svg>
        {/* the strangers' lives, crossing the game; then all of them */}
        <ThreadBridge ref={many} narrow={stage.narrow} />
        <svg className={c("ch-crossings")} aria-hidden="true">
          {STRANGERS.map((each, index) => (
            <path key={each.name} ref={node => (crossings.current[index] = node)} style={{ opacity: 0 }} />
          ))}
        </svg>
        <div className={c("ch-woodenChart")} ref={chart} style={{ opacity: 0 }}>
          <TimeChart social={stage.social} />
        </div>
        <div className={c("ch-woodenScene")} ref={scene} role="img" aria-label={label}>
          <div className={c("ch-woodenLid")} ref={lid}>
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
          {/* Chess.com arrives: the third object, after the device and the set. */}
          <div
            ref={phone}
            className={c("ch-woodenPhone")}
            style={{ left: share(PHONE.left, BOARD.width), top: share(PHONE.top, BOARD.height), width: share(PHONE.width, BOARD.width), opacity: 0 }}
          >
            <img
              className={c("ch-firstGame")}
              src="/images/stories/chess/phone.webp"
              srcSet="/images/stories/chess/phone-480.webp 480w, /images/stories/chess/phone.webp 800w"
              sizes="(max-width: 60rem) 72vw, 330px"
              alt=""
              width={800}
              height={1704}
              decoding="async"
            />
            {/* Part II: the same phone, searching, then each stranger's game */}
            <div className={c("ch-onlineScreen")}>
              <PhoneScreen who={stage.who} />
            </div>
          </div>
        </div>
        {/* The first move, the same on every board of Part I: the device's
            screen shows it, the set plays it, the first game online opened with it. */}
        <span className={c("ch-firstMove")} data-on={stage.first ? "true" : "false"} aria-hidden="true">
          1. e4
        </span>
        <Pictured who={stage.who} ref={pictured} />
        {/* On a phone the words stand at the top, one after another. */}
        {stage.narrow ? (
          <div className={c("ch-woodenTold")}>
            {WORDS.map(([name, , look]) => (
              <div key={name} data-on={stage.words === name ? "true" : "false"}>
                <Text name={name} look={look || "lead"} />
              </div>
            ))}
          </div>
        ) : null}
        <div className={c("ch-manyCopy")} ref={manyCopy} style={{ opacity: 0 }}>
          <Text name="people-many" look="question" />
        </div>
      </div>
      {/* On a wide screen they scroll past beside it, each in the middle of
          the screen at its moment. */}
      {!stage.narrow ? (
        <div className={c("ch-woodenWords")}>
          {WORDS.map(([name, at, look]) => (
            <div key={name} style={{ top: `calc(${(at + 0.5).toFixed(3)} * 100svh)` }}>
              <Text name={name} look={look || "lead"} />
            </div>
          ))}
        </div>
      ) : null}
      {/* where the chapters' navigation opens Part II */}
      <span id="the-people" className={c("ch-mark")} style={{ top: `calc(${(TITLE_AT + 0.08).toFixed(3)} * 100svh)` }} />
      <Knots of={lines} />
    </div>
  )
}
