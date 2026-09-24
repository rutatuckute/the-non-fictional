"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// How tall a row is allowed to get. A row's natural height is the width it has
// divided by the sum of its aspect ratios, so a row of upright frames comes out
// far taller than one of wide ones. Rather than crop anything or leave a frame
// towering over the page, a row that would exceed this is given less width and
// centred: every frame keeps its proportions and its share, and the row simply
// sits smaller.
const MAX_ROW_HEIGHT = 620
const MAX_ANCHOR_HEIGHT = 760

// What a frame is asked to fetch, from the share of the row it takes, at
// roughly twice the width it occupies.
const budgetFor = (share) => {
  if (share >= 0.8) return 2048
  if (share >= 0.5) return 1440
  if (share >= 0.3) return 1080
  return 760
}

const Plate = ({ frame, ratio, share, onOpen }) => (
  <figure
    className={styles.plate}
    // Widths in proportion to the aspect ratios is what justifies the row: the
    // height each frame resolves to is the same for all of them.
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
        style={
          frame.width && frame.height
            ? { aspectRatio: `${frame.width} / ${frame.height}` }
            : undefined
        }
      />
      {/* In the frame, invisible at rest, for pointer and keyboard. A touch
          screen gets this from the lightbox instead. */}
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
      {rows.map((row, index) => {
        const cap =
          row.pattern === "full" || row.pattern.startsWith("anchor")
            ? MAX_ANCHOR_HEIGHT
            : MAX_ROW_HEIGHT

        return (
          <div
            className={styles.row}
            key={`${row.frames[0].slug}-${index}`}
            data-pattern={row.pattern}
            data-place={row.place}
            data-count={row.frames.length}
            data-chapter={row.chapter ? "true" : undefined}
            data-intentional={row.intentional ? "true" : undefined}
            style={{
              // The share of the gallery this row is allowed, and then a
              // ceiling on how tall it may become — a row of upright frames
              // would otherwise resolve taller than the window. It narrows
              // rather than crops.
              maxWidth: `min(${row.width}%, ${Math.round(cap * row.sum)}px)`,
            }}
          >
            {row.frames.map((frame, position) => (
              <Plate
                key={frame.slug}
                frame={frame}
                ratio={row.ratios[position]}
                share={row.ratios[position] / row.sum}
                onOpen={onOpen}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default EditorialSequence
