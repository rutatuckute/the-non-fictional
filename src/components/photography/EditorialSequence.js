"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// What a frame is asked to fetch, from the share of the row it was given —
// roughly twice the width it occupies at the widest the column goes, so a frame
// set at a quarter of the row is a quarter of the download rather than a full
// one scaled down.
const budgetFor = (share) => {
  if (share >= 90) return 2048
  if (share >= 55) return 1440
  if (share >= 40) return 1080
  return 760
}

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

// A row's height follows from the width of the page and the share each frame
// takes of it, so a row of upright frames can come out taller than the window.
// Rather than crop anything or break the composition, the whole row is allowed
// to narrow until it fits — every frame in it keeps its proportions and its
// share, and the row simply sits smaller on the page.
const rowMaxWidth = (row) => {
  const tallest = Math.max(
    ...row.frames.map((frame, i) => row.widths[i] / 100 / ratioOf(frame))
  )

  return `min(100%, calc(88vh / ${tallest.toFixed(4)}))`
}

const Plate = ({ frame, share, onOpen }) => (
  <figure className={styles.plate} style={{ width: `${share}%` }}>
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
        style={
          frame.width && frame.height
            ? { aspectRatio: `${frame.width} / ${frame.height}` }
            : undefined
        }
      />
      {/* In the frame, invisible at rest, for pointer and keyboard. A touch
          screen has nothing to hover with and gets this from the lightbox. */}
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
          key={`${row.frames[0].slug}-${index}`}
          data-template={row.template}
          data-align={row.align}
          data-place={row.place || undefined}
          data-intentional={row.intentional ? "true" : undefined}
          style={{ maxWidth: rowMaxWidth(row) }}
        >
          {row.frames.map((frame, position) => (
            <Plate
              key={frame.slug}
              frame={frame}
              share={row.widths[position]}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default EditorialSequence
