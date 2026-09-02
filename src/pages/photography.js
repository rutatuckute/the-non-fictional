import * as React from "react"
import { graphql } from "gatsby"

import Masthead from "../components/masthead"
import PhotoImage from "../components/photo-image"
import SiteFooter from "../components/site-footer"
import Lightbox from "../components/photography/Lightbox"
import FilterSelect from "../components/photography/FilterSelect"
import {
  EMPTY_FILTERS,
  applyFilters,
  buildFilterGroups,
  buildFrames,
  groupSeries,
  isFiltering,
} from "../components/photography/photoData"
import * as styles from "./photography.module.css"

// Frame size drives both the grid track and the pixels actually fetched, so a
// smaller frame is a smaller download rather than a scaled-down large one.
const SIZES = {
  sm: { label: "Small", grid: 104, px: 300 },
  md: { label: "Medium", grid: 170, px: 420 },
  lg: { label: "Large", grid: 260, px: 640 },
}

const VIEWS = { contact: "Contact sheet", series: "Series" }

// The series layout is fixed proportions (1.6fr lead beside a 2-column rest),
// so its frames do not resize with the Size control and need their own budget:
// roughly twice the width they actually occupy at the 1420px max content width.
const SERIES_LEAD = { px: 1680, quality: "normal" }
const SERIES_REST = { px: 560, quality: "lighter" }

const FILTER_LABELS = { type: "Type", place: "Place", year: "Year" }

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
]

const Frame = ({ frame, onOpen, px, quality, ratio }) => (
  <figure className={styles.frame} data-ratio={ratio}>
    <button
      type="button"
      className={styles.frameButton}
      onClick={() => onOpen(frame)}
      aria-label={`Open ${frame.title}`}
    >
      <PhotoImage
        className={styles.frameImage}
        source={frame.photo}
        px={px}
        quality={quality}
        alt={frame.title}
      />
      <figcaption className={styles.frameCaption}>
        <b>{frame.title}</b>
        {[frame.city || "Unplaced", frame.year].filter(Boolean).join(" · ")}
      </figcaption>
    </button>
  </figure>
)

const Photography = ({ data, location }) => {
  const frames = React.useMemo(
    () => buildFrames(data?.allMarkdownRemark?.nodes ?? []),
    [data]
  )
  const groups = React.useMemo(() => buildFilterGroups(frames), [frames])
  const [filters, setFilters] = React.useState(EMPTY_FILTERS)
  const [openRef, setOpenRef] = React.useState(null)
  const [view, setView] = React.useState("contact")
  const [size, setSize] = React.useState("md")

  const filtering = isFiltering(filters)
  const visible = React.useMemo(
    () => (filtering ? applyFilters(frames, filters) : frames),
    [frames, filters, filtering]
  )
  const { series, standalone } = React.useMemo(
    () => groupSeries(frames),
    [frames]
  )

  // Filtering a series view would leave partial series that misrepresent the
  // work, so a filtered page always falls back to the contact sheet. The
  // chosen view is remembered and returns when the filters are cleared.
  const activeView = filtering ? "contact" : view
  const { px } = SIZES[size]

  // The lightbox steps through whatever the page is currently showing, so
  // arrow keys stay inside the filtered set rather than the whole archive.
  const sequence =
    activeView === "contact"
      ? visible
      : [...series.flatMap(s => s.frames), ...standalone]
  const openIndex = openRef
    ? sequence.findIndex(frame => frame.ref === openRef)
    : -1

  // Deep links: ?frame=<slug> opens that frame, and browser history drives it
  // so Back closes the lightbox and a shared link lands on the same frame.
  React.useEffect(() => {
    const readFromUrl = () =>
      setOpenRef(new URLSearchParams(window.location.search).get("frame"))

    readFromUrl()
    window.addEventListener("popstate", readFromUrl)
    return () => window.removeEventListener("popstate", readFromUrl)
  }, [])

  const openFrame = frame => {
    setOpenRef(frame.ref)
    window.history.pushState({}, "", `?frame=${frame.ref}`)
  }

  const closeFrame = React.useCallback(() => {
    setOpenRef(null)
    window.history.pushState({}, "", window.location.pathname)
  }, [])

  const stepFrame = React.useCallback(
    delta => {
      if (openIndex < 0 || sequence.length === 0) return
      const next =
        sequence[(openIndex + delta + sequence.length) % sequence.length]
      setOpenRef(next.ref)
      window.history.replaceState({}, "", `?frame=${next.ref}`)
    },
    [openIndex, sequence]
  )

  const toggle = (group, value) =>
    setFilters(current => ({
      ...current,
      [group]: current[group].includes(value)
        ? current[group].filter(chosen => chosen !== value)
        : [...current[group], value],
    }))

  const clearGroup = group =>
    setFilters(current => ({ ...current, [group]: [] }))

  const clear = () => setFilters(EMPTY_FILTERS)

  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${SIZES[size].grid}px, 1fr))`,
  }

  return (
    <div className={styles.page}>
      <Masthead location={location} activeSection="photography" />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <p className={styles.kicker}>Photography</p>
            <h1 className={styles.title}>On film, mostly.</h1>
            <ul className={styles.kit}>
              {KIT.map(item => (
                <li
                  className={styles.kitItem}
                  key={item.label}
                  data-now={item.now}
                >
                  {item.icon}
                  <span className={styles.kitText}>
                    <span className={styles.kitLabel}>{item.label}</span>
                    <span className={styles.kitValue}>{item.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.controls}>
            <div className={styles.group}>
              <span className={styles.groupLabel}>View</span>
              <div className={styles.groupChips}>
                {Object.entries(VIEWS).map(([key, label]) => (
                  <button
                    className={styles.chip}
                    key={key}
                    type="button"
                    data-on={activeView === key ? "true" : "false"}
                    aria-pressed={activeView === key}
                    disabled={filtering && key === "series"}
                    title={
                      filtering && key === "series"
                        ? "Clear the filters to group by series"
                        : undefined
                    }
                    onClick={() => setView(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Size</span>
              <div className={styles.groupChips}>
                {Object.entries(SIZES).map(([key, option]) => (
                  <button
                    className={styles.chip}
                    key={key}
                    type="button"
                    data-on={size === key ? "true" : "false"}
                    aria-pressed={size === key}
                    onClick={() => setSize(key)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Type</span>
              <div className={styles.groupChips}>
                {groups.type.map(option => (
                  <button
                    className={styles.chip}
                    key={option.value}
                    type="button"
                    data-on={
                      filters.type.includes(option.value) ? "true" : "false"
                    }
                    aria-pressed={filters.type.includes(option.value)}
                    onClick={() => toggle("type", option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.groupLabel}>Space/Time</span>
              <div className={styles.groupChips}>
                {["place", "year"].map(group => (
                  <FilterSelect
                    key={group}
                    label={FILTER_LABELS[group]}
                    options={groups[group]}
                    selected={filters[group]}
                    onToggle={value => toggle(group, value)}
                    onClear={() => clearGroup(group)}
                  />
                ))}
              </div>
            </div>

            <p className={styles.count}>
              {filtering
                ? `${visible.length} of ${frames.length} frames`
                : `${frames.length} frames`}
              {filtering ? (
                <button className={styles.clear} type="button" onClick={clear}>
                  Clear
                </button>
              ) : null}
            </p>
          </div>
        </header>

        <div className={styles.stage}>
          {activeView === "contact" ? (
            visible.length ? (
              <div className={styles.contact} style={gridStyle}>
                {visible.map(frame => (
                  <Frame
                    key={frame.slug}
                    frame={frame}
                    px={px}
                    onOpen={openFrame}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No frames match those filters.</p>
            )
          ) : (
            <>
              {series.map(entry => (
                <section className={styles.series} key={entry.id}>
                  <div className={styles.sectionHead}>
                    <h2>{entry.name}</h2>
                    <span className={styles.sectionMeta}>
                      {entry.location}
                      {entry.years
                        ? ` · ${entry.years[0]}${
                            entry.years[0] !== entry.years[1]
                              ? `–${entry.years[1]}`
                              : ""
                          }`
                        : ""}
                    </span>
                    <span className={styles.sectionCount}>
                      {entry.frames.length} frames
                    </span>
                  </div>

                  <div className={styles.seriesLayout}>
                    <div className={styles.seriesLead}>
                      <Frame
                        frame={entry.frames[0]}
                        px={SERIES_LEAD.px}
                        quality={SERIES_LEAD.quality}
                        ratio="lead"
                        onOpen={openFrame}
                      />
                    </div>
                    <div className={styles.seriesRest}>
                      {entry.frames.slice(1).map(frame => (
                        <Frame
                          key={frame.slug}
                          frame={frame}
                          px={SERIES_REST.px}
                          quality={SERIES_REST.quality}
                          onOpen={openFrame}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ))}

              {standalone.length ? (
                <section className={styles.series}>
                  <div className={styles.sectionHead}>
                    <h2>Standalone frames</h2>
                    <span className={styles.sectionMeta}>
                      not part of any series
                    </span>
                    <span className={styles.sectionCount}>
                      {standalone.length} frames
                    </span>
                  </div>
                  <div className={styles.contact} style={gridStyle}>
                    {standalone.map(frame => (
                      <Frame
                        key={frame.slug}
                        frame={frame}
                        px={px}
                        onOpen={openFrame}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <SiteFooter />

      <Lightbox
        frames={sequence}
        index={openIndex >= 0 ? openIndex : null}
        onClose={closeFrame}
        onStep={stepFrame}
      />
    </div>
  )
}

export default Photography

export const Head = ({ data }) => {
  const siteTitle = data?.site?.siteMetadata?.title || "The Non Fictional"
  return (
    <>
      <title>Photography | {siteTitle}</title>
      <meta name="description" content="Photography on The Non Fictional." />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400&display=swap"
      />
    </>
  )
}

export const pageQuery = graphql`
  query PhotographyPage {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { layout: { eq: "photography" } } }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          location
          year
          roll
          tags
          photo
          type
          series
        }
      }
    }
  }
`
