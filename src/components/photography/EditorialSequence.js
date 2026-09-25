"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// Roughly twice the width a frame occupies, at a gallery of at most 1700px.
const budgetFor = (share) => {
  if (share >= 0.55) return 1800
  if (share >= 0.34) return 1280
  if (share >= 0.2) return 900
  return 640
}

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

const Plate = ({ frame, ratio, share, onOpen }) => (
  <figure
    className={styles.plate}
    // Width in proportion to the aspect ratio. Every frame in a row is then the
    // same height, and the row stretches to the gallery width — which is what
    // puts every row on the same two edges.
    style={{ flexGrow: ratio, flexBasis: 0 }}
  >
    <button
      type="button"
      className={styles.plateButton}
      onClick={() => onOpen(frame)}
      aria-label={`Open ${frame.title}`}
    >
      <PhotoImage
        className={styles.plateImage}
        source={frame.photo}
        px={budgetFor(share)}
        quality="normal"
        alt={frame.title}
        style={{ aspectRatio: `${frame.width || 3} / ${frame.height || 2}` }}
      />
      <figcaption className={styles.plateMeta}>
        <span className={styles.plateTitle}>{frame.title}</span>
        <span className={styles.plateWhere}>
          {[frame.city, frame.year].filter(Boolean).join(", ")}
        </span>
      </figcaption>
    </button>
  </figure>
)

const Justified = ({ frames, sum, onOpen, className }) => (
  <div className={className}>
    {frames.map((frame) => (
      <Plate
        key={frame.slug}
        frame={frame}
        ratio={ratioOf(frame)}
        share={ratioOf(frame) / sum}
        onOpen={onOpen}
      />
    ))}
  </div>
)

// A tall frame down one column, two justified sub-rows down the other. The
// split was solved so the two sub-rows and the gutter between them come to
// exactly the tall frame's height, so the block closes as one rectangle on the
// same edges as every row.
const Block = ({ module: mod, onOpen }) => {
  const { split, side } = mod
  const tallFirst = side === "left"
  const columns = tallFirst
    ? `${split.tall}fr ${split.side}fr`
    : `${split.side}fr ${split.tall}fr`

  return (
    <div className={styles.block} style={{ gridTemplateColumns: columns }}>
      <div
        className={styles.blockTall}
        style={{ gridColumn: tallFirst ? 1 : 2, gridRow: "1 / span 2" }}
      >
        <Plate frame={mod.tall} ratio={1} share={split.tall} onOpen={onOpen} />
      </div>

      <Justified
        className={styles.row}
        frames={mod.top}
        sum={split.sumTop}
        onOpen={onOpen}
      />
      <Justified
        className={styles.row}
        frames={mod.bottom}
        sum={split.sumBottom}
        onOpen={onOpen}
      />
    </div>
  )
}

const EditorialSequence = ({ frames, layoutKey, groupKey = null, onOpen }) => {
  const modules = React.useMemo(
    () => composeLayout(frames, { layoutKey, groupKey }),
    [frames, layoutKey, groupKey]
  )

  return (
    <div className={styles.sequence}>
      {modules.map((mod, index) =>
        mod.kind === "block" ? (
          <Block key={`${mod.frames[0].slug}-${index}`} module={mod} onOpen={onOpen} />
        ) : (
          <Justified
            key={`${mod.frames[0].slug}-${index}`}
            className={styles.row}
            frames={mod.frames}
            sum={mod.sum}
            onOpen={onOpen}
          />
        )
      )}
    </div>
  )
}

export default EditorialSequence
