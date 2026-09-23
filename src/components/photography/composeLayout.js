// Groups a sequence of photographs into composed rows.
//
// Measured against the reference, the thing that makes a page read as composed
// rather than as a column is not that every row is the same height — it is that
// a row holds two or three frames at deliberately unequal widths, and that runs
// of those are broken by a single small frame sitting alone with the width
// around it. Equal widths give a contact sheet; equal heights give a justified
// gallery; neither looks edited.
//
// Two rules hold throughout. The sequence is never reordered — a row takes the
// next frames in order, and the reader meets them in the order they were given.
// And nothing is random: the same photographs in the same order produce the same
// page every time.

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const isUpright = (frame) => ratioOf(frame) < 1.15
const isWide = (frame) => ratioOf(frame) >= 1.9

// Shares of the row, before the gutter is taken out. They are deliberately
// uneven: a row of three at 33/33/33 is a grid, and a row of two at 50/50 reads
// as a comparison rather than a composition.
const TEMPLATES = {
  soloWide: { widths: [100], align: "start" },
  // Alone and small, with the rest of the row left empty. This is the one that
  // stops a page of full-width rows becoming relentless.
  soloSmall: { widths: [26], align: "start" },
  duoLead: { widths: [62, 36] },
  duoTrail: { widths: [36, 62] },
  duoEven: { widths: [49, 49] },
  trioCentre: { widths: [26, 46, 26], align: "centre" },
  trioEdges: { widths: [37, 25, 36], align: "end" },
}

// Where a small solo sits. Cycled rather than fixed, and never twice the same
// way running, so the eye does not start expecting it.
const SOLO_PLACES = ["left", "right", "centre", "left", "centre", "right"]

export const composeLayout = (frames, { layoutKey, groupKey = null } = {}) => {
  const rows = []

  let index = 0
  let soloTick = 0
  let sinceSolo = 0
  let lastTemplate = null

  const push = (name, members, place) => {
    rows.push({
      template: name,
      widths: TEMPLATES[name].widths,
      align: TEMPLATES[name].align || "start",
      place: place || null,
      frames: members,
      // A pairing that was asked for rather than proposed, kept so the markup
      // can say so.
      intentional: Boolean(
        groupKey && members.length > 1 && members[0][groupKey] &&
          members.every((m) => m[groupKey] === members[0][groupKey])
      ),
    })
    lastTemplate = name
    sinceSolo = name.startsWith("solo") ? 0 : sinceSolo + 1
  }

  while (index < frames.length) {
    const frame = frames[index]
    const next = frames[index + 1]
    const third = frames[index + 2]

    // An override puts a frame on its own row at the width it names, and is
    // expected to stay empty.
    const override = layoutKey ? frame[layoutKey] : null

    if (override) {
      push(override === "wide" ? "soloWide" : "soloSmall", [frame], "centre")
      index += 1
      continue
    }

    // Frames the photographer grouped travel together, ahead of anything the
    // proportions would have suggested.
    const group = groupKey ? frame[groupKey] : null

    if (group && next && next[groupKey] === group) {
      push(ratioOf(frame) >= ratioOf(next) ? "duoLead" : "duoTrail", [frame, next])
      index += 2
      continue
    }

    // A frame wide enough to carry the row carries it.
    if (isWide(frame)) {
      push("soloWide", [frame])
      index += 1
      continue
    }

    // Periodically, an upright frame is given a row to itself and most of the
    // width is left empty. Ratio decides whether a frame is suitable; the
    // interval decides when the page is ready for one.
    if (isUpright(frame) && sinceSolo >= 3 && !String(lastTemplate).startsWith("solo")) {
      push("soloSmall", [frame], SOLO_PLACES[soloTick % SOLO_PLACES.length])
      soloTick += 1
      index += 1
      continue
    }

    // Three upright frames make a row of three. Which template depends on where
    // the tallest of them falls, because the dominant slot has to land on a
    // frame that can hold it — and the sequence cannot be rearranged to suit.
    if (next && third && isUpright(frame) && isUpright(next) && isUpright(third)) {
      const tallest = [frame, next, third]
        .map((f, i) => [ratioOf(f), i])
        .sort((a, b) => a[0] - b[0])[0][1]

      push(tallest === 1 ? "trioCentre" : "trioEdges", [frame, next, third])
      index += 3
      continue
    }

    if (next) {
      // Two frames share the row, and the wider one takes the larger share —
      // which keeps both at a sensible height rather than forcing one to match
      // the other's proportions.
      const a = ratioOf(frame)
      const b = ratioOf(next)
      const similar = Math.min(a, b) / Math.max(a, b) >= 0.82

      push(similar ? "duoEven" : a > b ? "duoLead" : "duoTrail", [frame, next])
      index += 2
      continue
    }

    // Last frame over. Alone, and not stretched across the page to fill it.
    push(isWide(frame) ? "soloWide" : "soloSmall", [frame], "centre")
    index += 1
  }

  return rows
}
