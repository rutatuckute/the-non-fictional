// Composes an ordered sequence of photographs into editorial modules.
//
// Two kinds, and a page is a sequence of them. A row holds one, two or three
// frames side by side at a single height, their widths taken from their aspect
// ratios. A span module holds one tall frame beside two stacked ones, the tall
// frame running the full height of both.
//
// Every module resolves. A row's widths are derived so its frames end level; a
// span module's column split is solved so the two stacked frames, with the
// gutter between them, come to exactly the height of the frame beside them.
// Nothing is cropped to make that happen and nothing is left over — the next
// module begins only once the current one has closed, which is what keeps this
// a sequence of blocks rather than a drift of independent placements.
//
// selectedOrder is never touched. Where a module breaks, and which kind it is,
// are the only decisions.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const isUpright = (frame) => ratioOf(frame) < 1.15
// Tall enough to be worth running down two rows. A frame at 4:5 is upright but
// not tall; this wants 2:3 and narrower.
const isTall = (frame) => ratioOf(frame) <= 0.75

// Two frames stack beside a tall one only if they are wider than it — stacking
// two upright frames beside a third makes a module taller than the window,
// which the height ceiling then shrinks into something small and timid.
const stacksWell = (frame) => ratioOf(frame) >= 0.95

// Could a span module start here? Asked before a row is allowed to swallow the
// frame, so the composition seeks the shape out rather than meeting it by
// chance.
const spanStartsAt = (frames, at) => {
  const [tall, a, b] = [frames[at], frames[at + 1], frames[at + 2]]

  return Boolean(
    tall && a && b && isTall(tall) && stacksWell(a) && stacksWell(b) && solveSpan(tall, a, b)
  )
}
const isWide = (frame) => ratioOf(frame) >= 1.9

// The gutter as a fraction of the module's width, near enough at the widths
// this gallery runs at. It only has to be close: it shifts the solved split by
// well under a per cent.
const GUTTER = 0.011

// Solves the column split for a span module.
//
// The two stacked frames share a column of width x. Their heights are x/rA and
// x/rB, and with the gutter between them that has to equal the height of the
// tall frame, which is its own width over its ratio. One unknown, one equation:
//
//   (1 - x - g) / rT = x/rA + g + x/rB
//
// Returned as fractions of the module width, or null when the answer is not a
// composition — a split that leaves either column under a fifth or over half
// the field is a module that would look like an accident.
const solveSpan = (tall, a, b) => {
  const rT = ratioOf(tall)
  const rA = ratioOf(a)
  const rB = ratioOf(b)

  const x = (1 - GUTTER * (1 + rT)) / (1 + rT * (1 / rA + 1 / rB))

  // A split is a composition as long as neither column is squeezed to nothing
  // or left carrying the whole module. Two stacked landscapes legitimately come
  // out a little wider than the tall frame beside them — half is not the
  // boundary, and treating it as one rejected every module this sequence could
  // have made.
  if (!Number.isFinite(x) || x < 0.22 || x > 0.62) return null

  return { side: x, tall: 1 - x - GUTTER }
}

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const modules = []

  let index = 0
  let previous = null
  let spanTick = 0
  let sinceSpan = 2

  const pushRow = (members, variant = "row") => {
    modules.push({
      kind: "row",
      variant,
      frames: members,
      ratios: members.map(ratioOf),
      sum: members.reduce((total, frame) => total + ratioOf(frame), 0),
      intentional: Boolean(
        groupKey &&
          members.length > 1 &&
          members[0][groupKey] &&
          members.every((m) => m[groupKey] === members[0][groupKey])
      ),
    })
    previous = variant
    sinceSpan += 1
  }

  const pushSpan = (tall, a, b, split, side) => {
    modules.push({
      kind: "span",
      variant: side === "left" ? "spanLeft" : "spanRight",
      // Sequence order, always. The side only says which column the tall frame
      // occupies, never which frame comes first.
      frames: [tall, a, b],
      split,
      side,
      ratios: [ratioOf(tall), ratioOf(a), ratioOf(b)],
    })
    previous = side === "left" ? "spanLeft" : "spanRight"
    spanTick += 1
    sinceSpan = 0
  }

  while (index < frames.length) {
    const frame = frames[index]
    const next = frames[index + 1]
    const third = frames[index + 2]
    const override = layoutKey ? frame[layoutKey] : null

    if (override) {
      pushRow([frame], override === "wide" ? "solo" : "soloQuiet")
      index += 1
      continue
    }

    const group = groupKey ? frame[groupKey] : null

    if (group && next && next[groupKey] === group) {
      pushRow([frame, next])
      index += 2
      continue
    }

    // A frame wide enough to hold the field alone.
    if (isWide(frame)) {
      pushRow([frame], "solo")
      index += 1
      continue
    }

    // A span module: a tall frame running down two rows, with the two frames
    // after it stacked beside it. Taken only when the arithmetic gives a split
    // that is actually a composition, and never twice running — the shape is
    // the accent, and an accent repeated is a pattern.
    if (
      next &&
      third &&
      isTall(frame) &&
      stacksWell(next) &&
      stacksWell(third) &&
      sinceSpan >= 2 &&
      !String(previous).startsWith("span")
    ) {
      const split = solveSpan(frame, next, third)

      if (split) {
        pushSpan(frame, next, third, split, spanTick % 2 === 0 ? "left" : "right")
        index += 3
        continue
      }
    }

    // Otherwise a plain row. Frames are taken in order until their proportions
    // together fill the width at a height worth looking at.
    const members = []
    let sum = 0

    while (index < frames.length && members.length < 3) {
      const candidate = frames[index]

      if (members.length && isWide(candidate)) break

      // Stop short rather than swallow a frame that could open a span module.
      // A row of two here buys the shape that follows; taking the third would
      // spend it, and the opportunity does not come round again because the
      // order is fixed.
      if (members.length && spanStartsAt(frames, index)) break

      members.push(candidate)
      sum += ratioOf(candidate)
      index += 1

      if (sum >= 1.9) break
    }

    pushRow(members, members.length === 1 ? "soloQuiet" : "row")
  }

  return modules
}
