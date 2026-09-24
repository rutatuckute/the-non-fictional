// Composes an ordered sequence of photographs into editorial rows.
//
// Two things are kept apart, because conflating them is what makes an automatic
// layout look automatic.
//
// Inside a row, widths are derived from the aspect ratios, so every frame in a
// row resolves to the same height. That is not a stylistic choice — it is the
// only way a row of different proportions closes without leaving space under
// the shorter frame.
//
// The row itself is then given a width and a place on the page, and those do
// vary: a row need not fill the page, and the width it is allowed is what makes
// one photograph an anchor and another a supporting frame beside it. Asymmetry
// and empty space are decided here, deliberately, rather than falling out of
// the packing.
//
// The sequence is never reordered. Where a row breaks and how wide it sits are
// the only decisions.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const isUpright = (frame) => ratioOf(frame) < 1.15
const isPanorama = (frame) => ratioOf(frame) >= 2.0

// The vocabulary. Each says how much of the gallery a row may take and where it
// sits; the frames inside it are always justified against each other.
const PATTERNS = {
  full: { width: 100, place: "centre" },
  anchor: { width: 82, place: "centre" },
  anchorLeft: { width: 78, place: "left" },
  anchorRight: { width: 78, place: "right" },
  insetLeft: { width: 58, place: "left" },
  insetRight: { width: 58, place: "right" },
  duo: { width: 100, place: "centre" },
  duoInset: { width: 84, place: "centre" },
  trio: { width: 100, place: "centre" },
}

// How many rows of ordinary width before the page is given a larger break. The
// sequence reads in chapters rather than as one continuous grid.
const CHAPTER_EVERY = 4

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const rows = []

  let index = 0
  let previous = null
  let sinceAnchor = 2
  let sinceInset = 0
  let sideTick = 0

  const push = (members, pattern) => {
    const spec = PATTERNS[pattern]
    const sum = members.reduce((total, frame) => total + ratioOf(frame), 0)

    rows.push({
      pattern,
      width: spec.width,
      place: spec.place,
      frames: members,
      sum,
      ratios: members.map(ratioOf),
      // Every few rows the vertical rhythm opens up, so the sequence has
      // resting points instead of running on at one pitch. Not before a lone
      // narrow frame, though: extra space above something already surrounded by
      // space stops reading as a rest and starts reading as a hole.
      chapter:
        rows.length > 0 &&
        rows.length % CHAPTER_EVERY === 0 &&
        !(members.length === 1 && isUpright(members[0])),
      intentional: Boolean(
        groupKey &&
          members.length > 1 &&
          members[0][groupKey] &&
          members.every((m) => m[groupKey] === members[0][groupKey])
      ),
    })

    previous = pattern
    sinceAnchor = pattern.startsWith("anchor") || pattern === "full" ? 0 : sinceAnchor + 1
    sinceInset = pattern.startsWith("inset") ? 0 : sinceInset + 1
  }

  // Alternates the side an offset row sits on, without ever repeating the last
  // one used.
  const nextSide = () => {
    sideTick += 1
    return sideTick % 2 === 1 ? "Left" : "Right"
  }

  while (index < frames.length) {
    const frame = frames[index]
    const override = layoutKey ? frame[layoutKey] : null

    if (override) {
      // "wide" cannot mean full width for an upright frame — at the width of
      // the page it would be over two thousand pixels tall, and the height
      // ceiling then shrinks it into the narrowest thing on the page, which is
      // the opposite of what was asked for. It is given prominence the way an
      // upright frame can take it: as much height as a frame is allowed, and
      // set to one side so the space beside it reads as composition.
      const wide = override === "wide"

      push([frame], wide && !isUpright(frame) ? "full" : `anchor${nextSide()}`)
      index += 1
      continue
    }

    const group = groupKey ? frame[groupKey] : null

    if (group && frames[index + 1] && frames[index + 1][groupKey] === group) {
      push([frame, frames[index + 1]], "duo")
      index += 2
      continue
    }

    // A frame wide enough to carry the page carries it.
    if (isPanorama(frame)) {
      push([frame], "full")
      index += 1
      continue
    }

    // An anchor: one photograph given most of the width and the weight of the
    // page. Landscapes make better anchors — an upright frame at this width is
    // taller than the window.
    if (sinceAnchor >= 3 && !isUpright(frame) && previous !== "full") {
      push([frame], "anchor")
      index += 1
      continue
    }

    // A supporting frame, set narrow and to one side, with the rest of the row
    // left empty. This is the page's breathing space, and it is the one place a
    // row deliberately does not close.
    if (sinceInset >= 5 && isUpright(frame)) {
      push([frame], `inset${nextSide()}`)
      index += 1
      continue
    }

    // Otherwise take the next frames in order until their proportions together
    // fill a row at a sensible height.
    const members = []
    let sum = 0

    while (index < frames.length && members.length < 3) {
      const candidate = frames[index]

      if (members.length && isPanorama(candidate)) break

      members.push(candidate)
      sum += ratioOf(candidate)
      index += 1

      if (sum >= 1.9) break
    }

    if (members.length === 1) {
      // Nothing to sit beside it. Given room rather than stretched across the
      // page, and offset so the gap reads as composition.
      push(members, isUpright(members[0]) ? `anchor${nextSide()}` : "anchor")
      continue
    }

    // Two frames that already fill a row generously are held in a little from
    // the edges now and then, so not every row meets the same margins.
    const pattern =
      members.length === 3 ? "trio" : previous === "duo" ? "duoInset" : "duo"

    push(members, pattern)
  }

  return rows
}
