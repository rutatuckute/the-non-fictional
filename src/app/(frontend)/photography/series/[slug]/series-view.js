"use client"

import * as React from "react"

import Masthead from "../../../../../components/masthead"
import SiteFooter from "../../../../../components/site-footer"
import EditorialSequence from "../../../../../components/photography/EditorialSequence"
import Lightbox from "../../../../../components/photography/Lightbox"
import PhotographyHeader from "../../../../../components/photography/PhotographyHeader"
import { useLightbox } from "../../../../../components/photography/useLightbox"
import styles from "../../../../../styles/photography.module.css"

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

          <EditorialSequence
            frames={frames}
            layoutKey="seriesLayout"
            onOpen={lightbox.open}
          />
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
