"use client"

import * as React from "react"

import PhotoImage from "../photo-image"
import { composeLayout } from "./composeLayout"
import styles from "../../styles/photography.module.css"

// A frame is asked for roughly twice the width it occupies: the field is at
// most 1700px, so a span is about 140px of it.
const budgetFor = (span) => {
  if (span >= 9) return 2048
  if (span >= 7) return 1600
  if (span >= 5) return 1200
  return 900
}

// Nothing is normalised to a common height, but a frame still has to fit a
// screen. An upright frame given nine columns would be over two thousand pixels
// tall, so the height is capped and the frame narrows rather than crops — its
// span becomes a ceiling rather than a measurement.
const MAX_FRAME_HEIGHT = 780

const Plate = ({ frame, slot, onOpen }) => {
  const ratio = frame.width && frame.height ? frame.width / frame.height : 1.5

  return (
    <figure
      className={styles.plate}
      style={{
        gridColumn: `${slot.start} / span ${slot.span}`,
        // The stagger. Measured in the gutter so it scales with the rest of the
        // composition rather than sitting at a fixed distance.
        marginTop: slot.drop ? `calc(var(--gutter) * ${slot.drop})` : undefined,
        maxWidth: `${Math.round(MAX_FRAME_HEIGHT * ratio)}px`,
      }}
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
          px={budgetFor(slot.span)}
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
}

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
          data-pattern={row.pattern}
          data-count={row.frames.length}
          data-intentional={row.intentional ? "true" : undefined}
        >
          {row.frames.map((frame, position) => (
            <Plate
              key={frame.slug}
              frame={frame}
              slot={row.slots[position]}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default EditorialSequence
