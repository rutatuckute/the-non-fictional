import * as React from "react"
import Link from "next/link"

import { LIVED_IN } from "./photoData"
import styles from "../../styles/photography.module.css"

// The information block, lifted out of the archive page unchanged so that all
// three views share one copy of it rather than three that drift apart. Its
// icons, wording, casing and order are exactly as they were.
const icon = children => (
  <svg
    className={styles.kitIcon}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
)

const KIT = [
  {
    label: "Shooting",
    value: "Nikon FM",
    now: "true",
    icon: icon(
      <>
        <path d="M3 7h4l1.4-2h7.2L17 7h4v12H3z" />
        <circle cx="12" cy="13" r="3.6" />
      </>
    ),
  },
  {
    label: "Film",
    value: "Kodak Portra · Gold",
    now: "true",
    icon: icon(
      <>
        <rect x="3" y="6" width="18" height="12" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="8" y1="9" x2="8" y2="15" />
        <line x1="13" y1="9" x2="13" y2="15" />
      </>
    ),
  },
  {
    label: "Before",
    value: "Pentax K1000 · Minolta X-700",
    now: "false",
    // Two stacked bodies — geometric like the camera and film marks, and
    // reads as "the earlier ones" without resorting to a clock.
    icon: icon(
      <>
        <path d="M7 9V5h12v10h-4" />
        <rect x="3" y="9" width="12" height="10" />
      </>
    ),
  },
  {
    label: "Lived in",
    // Same constant the Lived filter is built from, so the line under the title
    // and the dropdown cannot drift apart.
    value: LIVED_IN.join(" · "),
    now: "true",
    // A folded map. A pin was the other candidate, but it is a circle and a
    // teardrop against three hard-cornered marks, and reads as one point rather
    // than the several places this line names.
    icon: icon(
      <>
        <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
        <path d="M9 4v14" />
        <path d="M15 6v14" />
      </>
    ),
  },
]

// The three ways into the same collection. Not filters of one view — each is
// its own route, so a view can be linked to and returned to.
const VIEWS = [
  { key: "selected", label: "Selected", href: "/photography/" },
  { key: "archive", label: "Archive", href: "/photography/archive/" },
  { key: "series", label: "Series", href: "/photography/series/" },
]

const PhotographyHeader = ({ active, children = null }) => (
  <header className={styles.header}>
    <div className={styles.headerMain}>
      <p className={styles.kicker}>Photography</p>
      <h1 className={styles.title}>On film, for a reason.</h1>
      <ul className={styles.kit}>
        {KIT.map(item => (
          <li className={styles.kitItem} key={item.label} data-now={item.now}>
            {item.icon}
            <span className={styles.kitText}>
              <span className={styles.kitLabel}>{item.label}</span>
              <span className={styles.kitValue}>{item.value}</span>
            </span>
          </li>
        ))}
      </ul>

      <nav className={styles.views} aria-label="Photography views">
        {VIEWS.map(view => (
          <Link
            className={styles.view}
            key={view.key}
            href={view.href}
            data-on={active === view.key ? "true" : "false"}
            aria-current={active === view.key ? "page" : undefined}
          >
            {view.label}
          </Link>
        ))}
      </nav>
    </div>

    {/* Archive hangs its filters here. Selected and the series pages pass
        nothing, and the header closes up around the gap. */}
    {children ? <div className={styles.controls}>{children}</div> : null}
  </header>
)

export default PhotographyHeader
