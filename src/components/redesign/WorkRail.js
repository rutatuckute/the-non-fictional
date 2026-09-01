import * as React from "react"
import { Link } from "gatsby"

import * as styles from "../../pages/redesign-lab.module.css"
import PhotoImage from "../photo-image"

const FORMAT_LABELS = {
  essay: "Essay",
  reflection: "Reflection",
  data: "Data",
  photography: "Photograph",
}

const formatDate = value =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
      })
    : null

// Writings and photographs carry different frontmatter, so each contributes
// the rows it actually has; anything missing is dropped rather than left blank.
const getMetadataRows = work => {
  const rows =
    work.kind === "writing"
      ? [
          { label: "Inquiry", value: work.inquiry },
          { label: "Category", value: work.category },
          { label: "Topic", value: work.topic },
          { label: "Published", value: formatDate(work.date) },
          { label: "Reading", value: work.readingTime },
        ]
      : [
          {
            label: "Made",
            value:
              work.yearRange && work.yearRange[0] !== work.yearRange[1]
                ? `${work.yearRange[0]}–${work.yearRange[1]}`
                : work.year,
          },
          { label: "Place", value: work.location },
        ]

  return rows.filter(row => row.value)
}

// "Essay" for writings; for photographs either a frame count or "Standalone".
const getKindLabel = work => {
  if (work.kind === "writing") {
    return FORMAT_LABELS[work.format] || work.format
  }

  return work.frameCount > 1
    ? `Series · ${work.frameCount} frames`
    : "Standalone"
}

const WorkRail = ({ onClose, work }) => {
  React.useEffect(() => {
    if (!work) {
      return undefined
    }

    const onKeyDown = event => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose, work])

  return (
    <aside
      className={styles.rail}
      data-open={work ? "true" : "false"}
      aria-hidden={work ? undefined : "true"}
      aria-label="Selected work"
    >
      {work ? (
        <>
          <button
            className={styles.railClose}
            type="button"
            onClick={onClose}
          >
            Close ✕
          </button>

          <p className={styles.railEyebrow}>
            <i data-format={work.format} aria-hidden="true" />
            {work.kind === "writing" ? "Writing" : "Photography"}
            {" · "}
            {getKindLabel(work)}
          </p>

          {work.frames?.length > 1 ? (
            <ul className={styles.railFrames}>
              {work.frames.map(frame => (
                <li key={frame.id}>
                  <PhotoImage source={frame.photo} px={420} alt={frame.title} />
                </li>
              ))}
            </ul>
          ) : work.image ? (
            <PhotoImage
              className={styles.railImage}
              source={work.image}
              px={860}
              alt={work.title}
            />
          ) : null}

          <h2 className={styles.railTitle}>{work.title}</h2>

          <dl className={styles.railMeta}>
            {getMetadataRows(work).map(row => (
              <React.Fragment key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </React.Fragment>
            ))}
          </dl>

          {work.excerpt ? (
            <p className={styles.railBlurb}>{work.excerpt}</p>
          ) : null}

          {work.tags?.length ? (
            <ul className={styles.railTags}>
              {work.tags.slice(0, 8).map(tag => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          {/* Photographs have no page of their own, so they open in the
              photography page's lightbox at the right frame. */}
          <Link
            className={styles.railGo}
            to={
              work.kind === "writing"
                ? work.slug
                : `/photography/?frame=${work.slug.replace(/^\/|\/$/g, "")}`
            }
          >
            {work.kind === "writing"
              ? "Read it ↗"
              : work.frameCount > 1
                ? "See the frames ↗"
                : "See the frame ↗"}
          </Link>
        </>
      ) : null}
    </aside>
  )
}

export default WorkRail
