// Composes an ordered sequence of photographs into justified modules.
//
// Every module — a plain row or a two-row block with a tall frame running down
// it — occupies the full gallery width. Same left edge, same right edge, no
// ragged ends and no black left over. What varies is the height, which falls
// out of the proportions of whatever is in the row, and the number of frames,
// which is chosen to keep that height near a target.
//
// The arithmetic is the ordinary justified one. Frames in a row share a height
// h; a frame of ratio r is then h·r wide; the widths plus the gutters have to
// come to the gallery width W, so h = (W - gutters) / Σr. Choosing how many
// frames go in a row is therefore choosing Σr, and a target height is a target
// Σr — which is what this packs against.
//
// selectedOrder is never touched. Only where a module breaks, and whether it is
// a row or a block, are decided here.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const isTall = (frame) => ratioOf(frame) <= 0.75

// Σr for an ordinary row. The gallery runs to about 1500px, so a row of frames
// whose ratios sum to near four lands around 370px tall — dense enough that
// several photographs are in view at once, which is the thing that was missing.
// Upright frames sum slowly, so a row of them runs to five or six; a row of
// landscapes closes at three.
const TARGET_SUM = 3.9
const MIN_SUM = 2.9
const MAX_PER_ROW = 6

// The gutter as a fraction of the gallery width. Close enough at these widths:
// it moves a solved split by well under a per cent.
const GUTTER = 0.009

// Solves the column split for a two-row block.
//
// The tall frame takes the left or right column and runs the height of the
// block. The other column holds two justified sub-rows, and those two, with the
// gutter between them, have to come to exactly the tall frame's height.
//
//   ((1 - x) - g)/rT = x/Σtop + g + x/Σbottom
//
// One unknown. Returned as fractions of the gallery width, or null when the
// answer is not a composition.
const solveBlock = (tall, top, bottom) => {
  const rT = ratioOf(tall)
  const sumTop = top.reduce((total, f) => total + ratioOf(f), 0)
  const sumBottom = bottom.reduce((total, f) => total + ratioOf(f), 0)

  if (!sumTop || !sumBottom) return null

  // Each sub-row spends its own gutters before its frames get any width, so a
  // sub-row of three is shorter than one of two at the same column width. Left
  // out of the solve, that shortfall lands at the bottom of the block as a step
  // against the tall frame beside it.
  const S = 1 / sumTop + 1 / sumBottom
  const inner =
    ((top.length - 1) * GUTTER) / sumTop + ((bottom.length - 1) * GUTTER) / sumBottom

  const x = (1 - GUTTER + rT * inner - rT * GUTTER) / (1 + rT * S)

  if (!Number.isFinite(x) || x < 0.35 || x > 0.78) return null

  const tallWidth = 1 - x - GUTTER

  // The block's height, as a fraction of the gallery width. Two ordinary rows
  // and a gutter is what it should come to; much more and it is a wall.
  const height = tallWidth / rT

  if (height > 0.62) return null

  return { side: x, tall: tallWidth, sumTop, sumBottom, height }
}

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const modules = []

  let index = 0
  let sinceBlock = 2
  let blockTick = 0

  const pushRow = (members) => {
    modules.push({
      kind: "row",
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
    sinceBlock += 1
  }

  // Tries to build a block here: a tall frame, then two sub-rows taken in order
  // from the frames after it. Larger splits are tried first, because a block
  // carrying five photographs is the point — a block of three is barely denser
  // than the rows around it.
  const blockAt = (at) => {
    const tall = frames[at]

    if (!tall || !isTall(tall)) return null

    for (const [topCount, bottomCount] of [
      [2, 2],
      [2, 1],
      [1, 2],
      [3, 2],
      [2, 3],
      [1, 1],
    ]) {
      const top = frames.slice(at + 1, at + 1 + topCount)
      const bottom = frames.slice(at + 1 + topCount, at + 1 + topCount + bottomCount)

      if (top.length < topCount || bottom.length < bottomCount) continue

      const split = solveBlock(tall, top, bottom)

      if (split) return { tall, top, bottom, split, size: 1 + topCount + bottomCount }
    }

    return null
  }

  while (index < frames.length) {
    const frame = frames[index]
    const override = layoutKey ? frame[layoutKey] : null

    if (override === "wide") {
      pushRow([frame])
      index += 1
      continue
    }

    const group = groupKey ? frame[groupKey] : null

    if (group && frames[index + 1] && frames[index + 1][groupKey] === group) {
      pushRow([frame, frames[index + 1]])
      index += 2
      continue
    }

    if (sinceBlock >= 2) {
      const block = blockAt(index)

      if (block) {
        modules.push({
          kind: "block",
          side: blockTick % 2 === 0 ? "left" : "right",
          tall: block.tall,
          top: block.top,
          bottom: block.bottom,
          split: block.split,
          frames: [block.tall, ...block.top, ...block.bottom],
        })
        blockTick += 1
        sinceBlock = 0
        index += block.size
        continue
      }
    }

    // An ordinary justified row. Frames are taken in order until their ratios
    // sum to about the target, and the row is then stretched to the gallery
    // width — which is what puts every row on the same two edges.
    const members = []
    let sum = 0

    while (index < frames.length && members.length < MAX_PER_ROW) {
      // Do not swallow a frame that could open a block; the order is fixed and
      // the chance does not come round again.
      if (members.length >= 2 && sum >= MIN_SUM && blockAt(index)) break

      members.push(frames[index])
      sum += ratioOf(frames[index])
      index += 1

      if (sum >= TARGET_SUM) break
    }

    pushRow(members)
  }

  // The last row is the one place a justified gallery goes wrong: whatever is
  // left over is stretched to the full width however few frames it is, and two
  // upright frames across a gallery this wide come out over a thousand pixels
  // tall. The usual answer is to leave that row short, which would break the
  // one rule that matters here — every row on the same two edges. So the
  // remainder is folded back into the row before it instead, which keeps the
  // edges and brings the height back down.
  const last = modules[modules.length - 1]
  const before = modules[modules.length - 2]

  if (
    modules.length > 1 &&
    last.kind === "row" &&
    before.kind === "row" &&
    last.sum < MIN_SUM &&
    last.frames.length + before.frames.length <= MAX_PER_ROW + 2
  ) {
    const merged = [...before.frames, ...last.frames]

    modules.splice(modules.length - 2, 2, {
      kind: "row",
      frames: merged,
      ratios: merged.map(ratioOf),
      sum: merged.reduce((total, frame) => total + ratioOf(frame), 0),
      intentional: false,
    })
  }

  return modules
}
