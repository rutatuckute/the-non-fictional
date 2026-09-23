// Groups a sequence of photographs into justified rows.
//
// A row is the unit. Its members are chosen from the sequence in order, and
// their widths are then derived from their aspect ratios so that every frame in
// the row comes out at the same height and the row resolves cleanly across the
// width. That derivation is what makes a row look decided: a tall frame beside
// a wide one is simply narrower than it, not shorter than it, so there is no
// space left under anything.
//
// This is the difference between a justified gallery and a masonry grid, and it
// is the whole point. Giving each frame a fixed share of the width instead —
// which is what was here — leaves frames of different proportions at different
// heights, and the gaps under the short ones are the voids.
//
// The sequence is never reordered. Where a row breaks is the only decision;
// which frame comes next is not one.
//
// Deterministic: the same frames in the same order produce the same rows.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

// A row is closed once its frames are wide enough, together, to fill the width
// at a sensible height. The figure is a sum of aspect ratios rather than a
// pixel width, so it holds at any screen size: row height is always the
// available width divided by this sum.
//
// 1.9 lands two landscapes, or three upright frames, or one of each, in a row —
// which is the rhythm the reference keeps. Lower would mean taller rows of
// fewer frames; higher, denser rows of more.
const CLOSE_AT = 1.9

const MAX_PER_ROW = 3

// A frame this wide already fills a row on its own.
const STANDS_ALONE = 2.2

// Every so often a landscape is given the row to itself. Not by counting
// frames — by counting rows since the last one, so it stays an interval in the
// reading rather than a position in the data.
const HERO_EVERY = 5

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const rows = []
  let index = 0
  let sinceHero = HERO_EVERY - 2

  const push = (members, kind) => {
    const sum = members.reduce((total, frame) => total + ratioOf(frame), 0)

    rows.push({
      kind,
      frames: members,
      // Handed on so the row can be held to a sensible height: the height is
      // the width divided by this, so the width it may occupy is this times the
      // height it is allowed.
      sum,
      ratios: members.map(ratioOf),
      intentional: Boolean(
        groupKey &&
          members.length > 1 &&
          members[0][groupKey] &&
          members.every((m) => m[groupKey] === members[0][groupKey])
      ),
    })

    sinceHero = kind === "hero" ? 0 : sinceHero + 1
  }

  while (index < frames.length) {
    const frame = frames[index]
    const override = layoutKey ? frame[layoutKey] : null

    if (override) {
      push([frame], override === "wide" ? "hero" : "solo")
      index += 1
      continue
    }

    // A pairing that was asked for stays a row of its own, whatever the
    // proportions would have made of it.
    const group = groupKey ? frame[groupKey] : null

    if (group && frames[index + 1] && frames[index + 1][groupKey] === group) {
      push([frame, frames[index + 1]], "row")
      index += 2
      continue
    }

    if (ratioOf(frame) >= STANDS_ALONE) {
      push([frame], "hero")
      index += 1
      continue
    }

    if (sinceHero >= HERO_EVERY && ratioOf(frame) >= 1.3) {
      push([frame], "hero")
      index += 1
      continue
    }

    // Take frames in order until the row is full enough to justify.
    const members = []
    let sum = 0

    while (index < frames.length && members.length < MAX_PER_ROW) {
      const candidate = frames[index]

      // A frame that would stand alone starts the next row rather than
      // overfilling this one.
      if (members.length && ratioOf(candidate) >= STANDS_ALONE) break

      members.push(candidate)
      sum += ratioOf(candidate)
      index += 1

      if (sum >= CLOSE_AT) break
    }

    push(members, members.length === 1 ? "solo" : "row")
  }

  return rows
}
