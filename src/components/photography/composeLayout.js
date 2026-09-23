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

// Never the same treatment twice running, even where the rhythm would.
const pick = (rhythm, tick, previous) => {
  const slot = rhythm[tick % rhythm.length]

  return slot === previous ? rhythm[(tick + 1) % rhythm.length] : slot
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
  let previousWasPair = false

  while (index < frames.length) {
    const frame = frames[index]
    const next = frames[index + 1]
    const override = layoutKey ? frame[layoutKey] : null

    // A pairing the photographer asked for. It wins over everything, including
    // whether the two frames would have looked well together.
    const group = groupKey ? frame[groupKey] : null

    if (group && next && groupKey && next[groupKey] === group) {
      rows.push({ kind: "pair", intentional: true, frames: [frame, next] })
      index += 2
      previousWasPair = true
      previousSlot = null
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
      rows.push({ kind: "pair", intentional: false, frames: [frame, next] })
      index += 2
      previousWasPair = true
      previousSlot = null
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
        slot = pick(LANDSCAPE_RHYTHM, landscapeTick, previousSlot)
        landscapeTick += 1
      } else {
        slot = pick(PORTRAIT_RHYTHM, portraitTick, previousSlot)
        portraitTick += 1
      }
    }

    rows.push({ kind: "single", slot, frames: [frame] })
    previousSlot = slot
    previousWasPair = false
    index += 1
  }

  return rows
}
