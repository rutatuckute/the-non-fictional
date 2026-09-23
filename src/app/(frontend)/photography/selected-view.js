"use client"

import * as React from "react"

import Masthead from "../../../components/masthead"
import SiteFooter from "../../../components/site-footer"
import EditorialSequence from "../../../components/photography/EditorialSequence"
import Lightbox from "../../../components/photography/Lightbox"
import PhotographyHeader from "../../../components/photography/PhotographyHeader"
import { useLightbox } from "../../../components/photography/useLightbox"
import { buildFrames, selectedFrames } from "../../../components/photography/photoData"
import styles from "../../../styles/photography.module.css"

const SelectedView = ({ nodes }) => {
  const frames = React.useMemo(() => buildFrames(nodes), [nodes])
  const edit = React.useMemo(() => selectedFrames(frames), [frames])

  // The old per-photograph URLs redirect to /photography/?frame=<slug>, and
  // those frames are not all in the edit. So the sequence the lightbox steps
  // through is the edit, but a frame arriving by link that is not in it still
  // opens — appended rather than dropped, which is what keeps a decade of
  // indexed links working now that this page is a selection.
  const [linked, setLinked] = React.useState(null)

  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("frame")
    setLinked(ref && !edit.some((frame) => frame.ref === ref) ? ref : null)
  }, [edit])

  const sequence = React.useMemo(() => {
    if (!linked) return edit
    const frame = frames.find((entry) => entry.ref === linked)
    return frame ? [...edit, frame] : edit
  }, [edit, frames, linked])

  const lightbox = useLightbox(sequence)

  return (
    <div className={styles.page}>
      <Masthead activeSection="photography" />

      <main className={styles.main}>
        <PhotographyHeader active="selected" />

        <div className={styles.stage}>
          {edit.length ? (
            <EditorialSequence
              frames={edit}
              layoutKey="selectedLayout"
              groupKey="selectedGroup"
              onOpen={lightbox.open}
            />
          ) : null}
        </div>
      </main>

      <SiteFooter />

      <Lightbox
        frames={sequence}
        index={lightbox.index}
        onClose={lightbox.close}
        onStep={lightbox.step}
      />
    </div>
  )
}

export default SelectedView
