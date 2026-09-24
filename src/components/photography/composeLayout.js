// Art-directs an ordered sequence of photographs across a twelve column field.
//
// Nothing here is justified. Neighbouring frames are not brought to a common
// height, rows are not filled to the margins, and a small photograph is small
// because it was placed small — it is never grown to take up the space beside
// it. Scale is the hierarchy: some frames take three quarters of the field,
// others a quarter, and what is left empty is as composed as what is not.
//
// This is the opposite of packing, and the difference between an unequal height
// that was placed and one that was left over is the whole thing. A justified row
// that fails leaves a hole under its shortest frame. Here the heights differ
// because each frame keeps its own proportions at the width it was given, and
// the frames are staggered down the field so those differences read as
// deliberate rather than as the row having run out.
//
// selectedOrder is never touched. Which pattern a group of frames is given, and
// where in the field each one sits, are the only decisions.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const isUpright = (frame) => ratioOf(frame) < 1.15
const isWide = (frame) => ratioOf(frame) >= 1.9

// Six compositions. Each places its frames on the twelve column field by start
// and span, and may drop one down the page — the stagger that keeps two frames
// beside each other from reading as a row.
//
// Spans are chosen so that a frame is either clearly dominant or clearly
// supporting. Nothing sits at half, because half reads as undecided.
const PATTERNS = {
  // One photograph carrying the page.
  anchor: [{ start: 1, span: 9 }],
  anchorInset: [{ start: 4, span: 9 }],

  // One photograph held small, with the field left open around it. The quiet
  // beat in the sequence.
  quiet: [{ start: 9, span: 4 }],
  quietLeft: [{ start: 1, span: 4 }],

  // A dominant frame and a supporting one, dropped so they do not align.
  leadTrail: [
    { start: 1, span: 7 },
    { start: 9, span: 4, drop: 1.6 },
  ],
  trailLead: [
    { start: 1, span: 4, drop: 1.2 },
    { start: 6, span: 7 },
  ],

  // Two upright frames. Neither is given a dominant span, because neither can
  // take one — an upright frame wide enough to dominate is taller than the
  // window, and the height ceiling pulls it back to roughly the width of the
  // frame beside it, so the pattern claims a hierarchy it cannot show. They are
  // set at two near widths instead and staggered, which is an asymmetry an
  // upright frame can actually hold.
  pairUneven: [
    { start: 1, span: 5 },
    { start: 7, span: 4, drop: 1.8 },
  ],

  // Three across, each at a different width and each on its own line of the
  // field.
  triStagger: [
    { start: 1, span: 4 },
    { start: 6, span: 3, drop: 2.2 },
    { start: 10, span: 3, drop: 0.8 },
  ],
}

const SIZE_OF = Object.fromEntries(
  Object.entries(PATTERNS).map(([name, slots]) => [name, slots.length])
)

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const rows = []

  let index = 0
  let previous = null
  let sinceQuiet = 0
  let sinceAnchor = 2
  let tick = 0

  const push = (members, pattern) => {
    rows.push({
      pattern,
      slots: PATTERNS[pattern],
      frames: members,
      ratios: members.map(ratioOf),
      intentional: Boolean(
        groupKey &&
          members.length > 1 &&
          members[0][groupKey] &&
          members.every((m) => m[groupKey] === members[0][groupKey])
      ),
    })

    previous = pattern
    sinceQuiet = pattern.startsWith("quiet") ? 0 : sinceQuiet + 1
    sinceAnchor = pattern.startsWith("anchor") ? 0 : sinceAnchor + 1
    tick += 1
  }

  // Alternates the side a single frame sits on, so the empty half of the field
  // moves down the page rather than banking up on one side.
  const swing = (a, b) => (tick % 2 === 0 ? a : b)

  while (index < frames.length) {
    const frame = frames[index]
    const next = frames[index + 1]
    const third = frames[index + 2]
    const override = layoutKey ? frame[layoutKey] : null

    if (override) {
      push([frame], override === "wide" ? swing("anchor", "anchorInset") : swing("quiet", "quietLeft"))
      index += 1
      continue
    }

    const group = groupKey ? frame[groupKey] : null

    if (group && next && next[groupKey] === group) {
      push([frame, next], ratioOf(frame) >= ratioOf(next) ? "leadTrail" : "trailLead")
      index += 2
      continue
    }

    // A frame wide enough to carry the field gets it. Upright frames are
    // excluded on purpose: at nine columns one is over sixteen hundred pixels
    // tall, so it would be pulled back by the height ceiling and the anchor
    // would not read as one. Dominance here is a landscape's to take.
    if (
      (isWide(frame) || (ratioOf(frame) >= 1.35 && sinceAnchor >= 2)) &&
      !previous?.startsWith("anchor")
    ) {
      push([frame], swing("anchor", "anchorInset"))
      index += 1
      continue
    }

    // The quiet beat. An upright frame, set small, with the field open beside
    // it — this is the negative space, and it is placed on purpose.
    if (sinceQuiet >= 4 && isUpright(frame) && !previous?.startsWith("quiet")) {
      push([frame], swing("quiet", "quietLeft"))
      index += 1
      continue
    }

    // Three upright frames stagger across the field at three widths.
    if (
      next &&
      third &&
      isUpright(frame) &&
      isUpright(next) &&
      isUpright(third) &&
      previous !== "triStagger"
    ) {
      push([frame, next, third], "triStagger")
      index += 3
      continue
    }

    if (next) {
      // Two frames, one dominant. Which one leads follows from their
      // proportions: a wide frame carries the larger span better than an
      // upright one, which at that width would tower.
      if (isUpright(frame) && isUpright(next)) {
        push([frame, next], "pairUneven")
        index += 2
        continue
      }

      const lead = ratioOf(frame) >= ratioOf(next)
      const pattern = lead ? "leadTrail" : "trailLead"

      push([frame, next], pattern === previous ? (lead ? "trailLead" : "leadTrail") : pattern)
      index += 2
      continue
    }

    // Last frame. An anchor if it can carry one, otherwise a quiet close.
    if (sinceAnchor >= 2 && !isUpright(frame)) {
      push([frame], swing("anchor", "anchorInset"))
    } else {
      push([frame], swing("quiet", "quietLeft"))
    }

    index += 1
  }

  return rows
}

export const patternSize = SIZE_OF
