// Works out how a sequence of photographs is set on the page.
//
// The sequence itself is never touched: the order comes from selectedOrder or
// seriesOrder and this only decides how much room each frame is given and where
// it sits. What it is trying to avoid is the two failure modes of doing this
// automatically — every frame the same width down the middle, which is a feed,
// and strict alternation, which is a zigzag. Both read as the absence of a
// decision.
//
// It is a pure function of the frames. The same photographs in the same order
// produce the same page every time: nothing is random, nothing depends on when
// it ran, and a layout that looks right today looks the same tomorrow.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const shapeOf = (frame) => {
  const ratio = ratioOf(frame)

  if (ratio >= 1.9) return "panorama"
  if (ratio >= 1.15) return "landscape"
  if (ratio <= 0.85) return "portrait"

  return "square"
}

// Two rhythms rather than one, because a standing frame and a lying one want
// different treatments. Neither alternates: each runs long enough, and repeats
// its own values in a different order, that the eye does not find the loop.
// Their lengths are coprime, so the combined sequence does not fall into step
// either.
const LANDSCAPE_RHYTHM = [
  "large",
  "medium-left",
  "wide",
  "medium-right",
  "large",
  "medium-right",
  "wide",
  "medium-left",
]

const PORTRAIT_RHYTHM = [
  "portrait-right",
  "portrait-center",
  "portrait-left",
  "portrait-right",
  "portrait-left",
  "portrait-center",
]

// Pairs need a rhythm of their own. A series of mostly upright frames pairs at
// every opportunity, and if every pair is the same width the page is as
// monotonous as the single column it replaced — the repetition has just moved.
//
// Scale and side are decided separately, and in that order. Choosing them
// together meant the side rule could veto a scale: with singles leaning left,
// every pair was pushed to the only centred option and the small ones never
// appeared, which cost more variety than the side rule bought.
const PAIR_SCALE = ["wide", "tight", "tight", "wide"]

// Which way a row leans. Tracked across singles and pairs together, because a
// pair held to the left followed by a frame set to the left is the page leaning
// twice running — and it is the lean the eye follows, not whether the row
// happened to hold one photograph or two.
const SIDE = {
  wide: "center",
  large: "center",
  "medium-left": "left",
  "medium-right": "right",
  "portrait-left": "left",
  "portrait-right": "right",
  "portrait-center": "center",
  "wide-center": "center",
  "tight-left": "left",
  "tight-right": "right",
}

// Walks the rhythm from where it left off and takes the first entry that is
// neither the treatment just used nor a lean in the same direction. Falls back
// to the rhythm's own next entry if everything in it leans that way, so this can
// slow the rhythm down but never stall it.
const pick = (rhythm, tick, previousSlot, previousSide) => {
  for (let step = 0; step < rhythm.length; step += 1) {
    const slot = rhythm[(tick + step) % rhythm.length]

    if (slot !== previousSlot && SIDE[slot] !== previousSide) return slot
  }

  return rhythm[tick % rhythm.length]
}

// A pair has to look deliberate. Two standing frames of roughly the same
// proportions sit beside each other as a pair; a standing frame beside a lying
// one just looks like a row that ran out.
const pairable = (a, b) => {
  const upright = (frame) => ["portrait", "square"].includes(shapeOf(frame))

  if (!upright(a) || !upright(b)) return false

  const ratios = [ratioOf(a), ratioOf(b)]

  return Math.min(...ratios) / Math.max(...ratios) >= 0.75
}

// Scale comes from the rhythm and is never overruled — it is what keeps a run
// of pairs from being one shape repeated. Only a tight pair has a side to
// choose, and it takes whichever does not lean the way the row above did.
const pairVariant = (tick, previousSide) => {
  const scale = PAIR_SCALE[tick % PAIR_SCALE.length]

  if (scale === "wide") return "wide-center"

  return previousSide === "left" ? "tight-right" : "tight-left"
}

/**
 * @param frames   in sequence
 * @param layoutKey  which override field applies here — selectedLayout inside
 *                   the edit, seriesLayout inside a series, so one frame can be
 *                   set differently in each
 * @param groupKey   the field that marks an intentional pairing, if any
 */
export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const rows = []

  let index = 0
  let landscapeTick = 0
  let portraitTick = 0
  let previousSlot = null
  let previousSide = null
  let previousWasPair = false
  let pairTick = 0

  while (index < frames.length) {
    const frame = frames[index]
    const next = frames[index + 1]
    const override = layoutKey ? frame[layoutKey] : null

    // A pairing the photographer asked for. It wins over everything, including
    // whether the two frames would have looked well together.
    const group = groupKey ? frame[groupKey] : null

    if (group && next && groupKey && next[groupKey] === group) {
      const variant = pairVariant(pairTick, previousSide)

      rows.push({ kind: "pair", intentional: true, variant, frames: [frame, next] })
      pairTick += 1
      index += 2
      previousWasPair = true
      previousSlot = null
      previousSide = SIDE[variant]
      continue
    }

    // One the layout proposes. Never twice running — a column of pairs is its
    // own kind of monotony — and never over a frame that was given a treatment.
    if (
      !override &&
      next &&
      !(layoutKey && next[layoutKey]) &&
      !previousWasPair &&
      pairable(frame, next)
    ) {
      const variant = pairVariant(pairTick, previousSide)

      rows.push({ kind: "pair", intentional: false, variant, frames: [frame, next] })
      pairTick += 1
      index += 2
      previousWasPair = true
      previousSlot = null
      previousSide = SIDE[variant]
      continue
    }

    let slot = override

    if (!slot) {
      const shape = shapeOf(frame)

      if (index === 0) {
        // The first frame opens the sequence, so it is given the room to.
        slot = shape === "portrait" || shape === "square" ? "portrait-center" : "wide"
      } else if (shape === "panorama") {
        // Nothing is gained by insetting a frame this wide.
        slot = "wide"
      } else if (shape === "landscape") {
        slot = pick(LANDSCAPE_RHYTHM, landscapeTick, previousSlot, previousSide)
        landscapeTick += 1
      } else {
        slot = pick(PORTRAIT_RHYTHM, portraitTick, previousSlot, previousSide)
        portraitTick += 1
      }
    }

    rows.push({ kind: "single", slot, frames: [frame] })
    previousSlot = slot
    previousSide = SIDE[slot]
    previousWasPair = false
    index += 1
  }

  return rows
}
