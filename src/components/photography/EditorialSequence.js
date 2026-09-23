"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// What each treatment is actually asked to fetch. A frame set at 44% of the
// column does not need the pixels of one set at 100%, and asking for them is
// the difference between a page that loads and one that crawls — these are
// roughly twice the width the frame occupies at the widest the column goes.
const BUDGET = {
  wide: 2048,
  large: 1920,
  "medium-left": 1200,
  "medium-right": 1200,
  "portrait-left": 1080,
  "portrait-right": 1080,
  "portrait-center": 1080,
  pair: 1080,
}

const Plate = ({ frame, px, onOpen }) => (
  <figure className={styles.plate}>
    <button
      type="button"
      className={styles.plateButton}
      onClick={() => onOpen(frame)}
      aria-label={`Open ${frame.title}`}
    >
      <PhotoImage
        className={styles.plateImage}
        source={frame.photo}
        px={px}
        quality="normal"
        alt={frame.title}
        style={
          frame.width && frame.height
            ? { aspectRatio: `${frame.width} / ${frame.height}` }
            : undefined
        }
      />
      {/* Sits inside the frame, at rest invisible. It is here for the pointer
          and the keyboard; a touch screen gets it from the lightbox instead,
          where there is room for it and nothing to hover. */}
      <figcaption className={styles.plateMeta}>
        <span className={styles.plateTitle}>{frame.title}</span>
        <span className={styles.plateWhere}>
          {[frame.city, frame.year].filter(Boolean).join(", ")}
        </span>
      </figcaption>
    </button>
  </figure>
)

const EditorialSequence = ({ frames, layoutKey, groupKey = null, onOpen }) => {
  const rows = React.useMemo(
    () => composeLayout(frames, { layoutKey, groupKey }),
    [frames, layoutKey, groupKey]
  )

  return (
    <div className={styles.sequence}>
      {rows.map((row, index) => (
        <div
          className={styles.row}
          // The sequence is fixed and the rows are derived from it, so the
          // position is a stable identity.
          key={`${row.frames[0].slug}-${index}`}
          data-kind={row.kind}
          data-slot={row.kind === "single" ? row.slot : undefined}
          data-intentional={row.kind === "pair" ? String(row.intentional) : undefined}
        >
          {row.frames.map((frame) => (
            <Plate
              key={frame.slug}
              frame={frame}
              px={row.kind === "pair" ? BUDGET.pair : BUDGET[row.slot] || 1920}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default EditorialSequence
