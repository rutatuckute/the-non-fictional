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

const ratioOf = (frame) =>
  frame.width && frame.height ? frame.width / frame.height : 1.5

// Two things size a frame, and the smaller wins.
//
// The slot gives it a share of the column. The height cap gives it a share of
// the screen — because a standing frame given 46% of a wide column comes out
// taller than the window, and you meet it a third at a time. A photograph that
// cannot be seen whole is not being shown at full size, it is being shown
// badly, so the cap is what decides for anything tall and the slot only ever
// narrows it further.
const HEIGHT_CAP = "74vh"

const SLOT_WIDTH = {
  wide: "92%",
  large: "68%",
  "medium-left": "46%",
  "medium-right": "46%",
  "portrait-left": "30%",
  "portrait-right": "30%",
  "portrait-center": "34%",
}

const plateWidth = (frame, slot) =>
  `min(${SLOT_WIDTH[slot] || "68%"}, calc(${HEIGHT_CAP} * ${ratioOf(frame).toFixed(4)}))`

const Plate = ({ frame, px, onOpen, style }) => (
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
          data-variant={row.variant}
        >
          {row.frames.map((frame) => (
            <Plate
              key={frame.slug}
              frame={frame}
              px={row.kind === "pair" ? BUDGET.pair : BUDGET[row.slot] || 1920}
              onOpen={onOpen}
              style={
                row.kind === "pair"
                  ? // Widths in proportion to the two aspect ratios, which is
                    // what gives a pair one height and one baseline. Equal
                    // widths leave the shorter frame hanging, and the row reads
                    // as two photographs that happened to land on the same line.
                    { flexGrow: ratioOf(frame), flexBasis: 0 }
                  : { width: plateWidth(frame, row.slot) }
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default EditorialSequence
