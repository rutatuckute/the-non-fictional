"use client"

import * as React from "react"

import Masthead from "../../../components/masthead"
import PhotoImage from "../../../components/photo-image"
import SiteFooter from "../../../components/site-footer"
import Lightbox from "../../../components/photography/Lightbox"
import PhotographyHeader from "../../../components/photography/PhotographyHeader"
import { useLightbox } from "../../../components/photography/useLightbox"
import { buildFrames, selectedFrames } from "../../../components/photography/photoData"
import styles from "../../../styles/photography.module.css"

// A frame is given room according to its own proportions rather than a shape
// the grid imposes: a standing frame narrower than a lying one, so neither
// towers over the page nor gets lost in it. Anything near square is treated as
// standing, since it is the height that decides how much of the screen a frame
// takes.
const orientation = (frame) => {
  if (!frame.width || !frame.height) return "landscape"

  return frame.width / frame.height >= 1.15 ? "landscape" : "portrait"
}

// The edit is shown large, so the pixel budget is generous: roughly twice the
// width a plate occupies at the widest the column goes.
const PLATE_PX = 2048

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
            <div className={styles.selected}>
              {edit.map((frame) => (
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
                    <span>
                      {[frame.city, frame.year].filter(Boolean).join(", ")}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
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
