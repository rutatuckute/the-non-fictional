import * as React from "react"

import PhotoImage from "../photo-image"
import * as styles from "../../pages/photography.module.css"

const Lightbox = ({ frames, index, onClose, onStep }) => {
  const frame = index == null ? null : frames[index]

  React.useEffect(() => {
    if (!frame) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowRight") onStep(1)
      if (event.key === "ArrowLeft") onStep(-1)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [frame, onClose, onStep])

  if (!frame) {
    return null
  }

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={frame.title}>
      <button
        className={styles.lightboxScrim}
        type="button"
        aria-label="Close"
        onClick={onClose}
      />

      <button
        className={styles.lightboxClose}
        type="button"
        aria-label="Close"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>

      {frames.length > 1 ? (
        <>
          <button
            className={`${styles.lightboxStep} ${styles.lightboxPrev}`}
            type="button"
            aria-label="Previous frame"
            onClick={() => onStep(-1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <polyline points="15 4 7 12 15 20" />
            </svg>
          </button>
          <button
            className={`${styles.lightboxStep} ${styles.lightboxNext}`}
            type="button"
            aria-label="Next frame"
            onClick={() => onStep(1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <polyline points="9 4 17 12 9 20" />
            </svg>
          </button>
        </>
      ) : null}

      <figure className={styles.lightboxFigure}>
        {/* The frame fills up to 80vh, so budget for a large 2x screen and ease
            off the compression — this is the one place the photograph is
            actually meant to be looked at. */}
        <PhotoImage
          className={styles.lightboxImage}
          source={frame.photo}
          px={2200}
          quality="normal"
          alt={frame.title}
          loading="eager"
        />
        <figcaption className={styles.lightboxCaption}>
          <span className={styles.lightboxTitle}>{frame.title}</span>
          <span className={styles.lightboxMeta}>
            {[frame.location, frame.year].filter(Boolean).join(" · ")}
            {frame.series ? ` · ${frame.seriesName}` : ""}
          </span>
          {frames.length > 1 ? (
            <span className={styles.lightboxActions}>
              <span className={styles.lightboxCount}>
                {index + 1} / {frames.length}
              </span>
            </span>
          ) : null}
        </figcaption>
      </figure>
    </div>
  )
}

export default Lightbox
