"use client"

import * as React from "react"

import Masthead from "../../../../../components/masthead"
import PhotoImage from "../../../../../components/photo-image"
import SiteFooter from "../../../../../components/site-footer"
import Lightbox from "../../../../../components/photography/Lightbox"
import PhotographyHeader from "../../../../../components/photography/PhotographyHeader"
import { useLightbox } from "../../../../../components/photography/useLightbox"
import styles from "../../../../../styles/photography.module.css"

const orientation = (frame) => {
  if (!frame.width || !frame.height) return "landscape"

  return frame.width / frame.height >= 1.15 ? "landscape" : "portrait"
}

const PLATE_PX = 2048

// A series reads in its own order, so the lightbox steps through seriesOrder
// rather than the archive's chronology — the sequence is part of the work.
const SeriesView = ({ title, frames }) => {
  const lightbox = useLightbox(frames)

  return (
    <div className={styles.page}>
      <Masthead activeSection="photography" />

      <main className={styles.main}>
        <PhotographyHeader active="series" />

        <div className={styles.stage}>
          <h2 className={styles.seriesTitle}>{title}</h2>

          <div className={styles.selected}>
            {frames.map((frame) => (
              <figure
                className={styles.plate}
                key={frame.slug}
                data-orient={orientation(frame)}
              >
                <button
                  type="button"
                  className={styles.plateButton}
                  onClick={() => lightbox.open(frame)}
                  aria-label={`Open ${frame.title}`}
                >
                  <PhotoImage
                    className={styles.plateImage}
                    source={frame.photo}
                    px={PLATE_PX}
                    quality="normal"
                    alt={frame.title}
                    style={
                      frame.width && frame.height
                        ? { aspectRatio: `${frame.width} / ${frame.height}` }
                        : undefined
                    }
                  />
                </button>
                <figcaption className={styles.plateCaption}>
                  <b>{frame.title}</b>
                  <span>{[frame.city, frame.year].filter(Boolean).join(", ")}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />

      <Lightbox
        frames={frames}
        index={lightbox.index}
        onClose={lightbox.close}
        onStep={lightbox.step}
      />
    </div>
  )
}

export default SeriesView
