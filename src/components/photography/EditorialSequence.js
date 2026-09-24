"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// Roughly twice the width a frame occupies, at a field of at most 1700px.
const budgetFor = (share) => {
  if (share >= 0.7) return 2048
  if (share >= 0.45) return 1600
  if (share >= 0.28) return 1200
  return 900
}

// A module is held to this, whatever its arithmetic says. A row of upright
// frames, or a tall frame running two rows, would otherwise resolve taller than
// the window; the module narrows and centres rather than cropping anything.
const MAX_MODULE_HEIGHT = 760

const Plate = ({ frame, share, style, onOpen }) => (
  <figure className={styles.plate} style={style}>
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

// One tall frame beside two stacked ones. The split was solved so the stack,
// gutter included, comes to exactly the tall frame's height — so the module
// closes on both columns and neither is left short.
const SpanModule = ({ module: mod, onOpen }) => {
  const [tall, a, b] = mod.frames
  const { split, side } = mod
  const tallFirst = side === "left"

  return (
    <div
      className={styles.module}
      data-variant={mod.variant}
      style={{
        gridTemplateColumns: tallFirst
          ? `${split.tall}fr ${split.side}fr`
          : `${split.side}fr ${split.tall}fr`,
        // The tall frame's own height decides the module's, and that is what
        // the ceiling applies to.
        maxWidth: `${Math.round((MAX_MODULE_HEIGHT * mod.ratios[0]) / split.tall)}px`,
      }}
    >
      <Plate
        frame={tall}
        share={split.tall}
        onOpen={onOpen}
        style={{
          gridColumn: tallFirst ? 1 : 2,
          gridRow: "1 / span 2",
        }}
      />
      <Plate
        frame={a}
        share={split.side}
        onOpen={onOpen}
        style={{ gridColumn: tallFirst ? 2 : 1, gridRow: 1 }}
      />
      <Plate
        frame={b}
        share={split.side}
        onOpen={onOpen}
        style={{ gridColumn: tallFirst ? 2 : 1, gridRow: 2 }}
      />
    </div>
  )
}

// One, two or three frames level with each other. Widths come from the aspect
// ratios, so they end on the same line.
const RowModule = ({ module: mod, onOpen }) => (
  <div
    className={styles.row}
    data-variant={mod.variant}
    data-count={mod.frames.length}
    data-intentional={mod.intentional ? "true" : undefined}
    style={{ maxWidth: `${Math.round(MAX_MODULE_HEIGHT * mod.sum)}px` }}
  >
    {mod.frames.map((frame, position) => (
      <Plate
        key={frame.slug}
        frame={frame}
        share={mod.ratios[position] / mod.sum}
        onOpen={onOpen}
        style={{ flexGrow: mod.ratios[position], flexBasis: 0 }}
      />
    ))}
  </div>
)

const EditorialSequence = ({ frames, layoutKey, groupKey = null, onOpen }) => {
  const modules = React.useMemo(
    () => composeLayout(frames, { layoutKey, groupKey }),
    [frames, layoutKey, groupKey]
  )

  return (
    <div className={styles.sequence}>
      {modules.map((mod, index) =>
        mod.kind === "span" ? (
          <SpanModule key={`${mod.frames[0].slug}-${index}`} module={mod} onOpen={onOpen} />
        ) : (
          <RowModule key={`${mod.frames[0].slug}-${index}`} module={mod} onOpen={onOpen} />
        )
      )}
    </div>
  )
}

export default EditorialSequence
