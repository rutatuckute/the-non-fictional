import * as React from "react"
import { graphql } from "gatsby"

import Masthead from "../components/masthead"
import SiteFooter from "../components/site-footer"
import Lightbox from "../components/photography/Lightbox"
import {
  ELSEWHERE,
  applyFilters,
  buildFilterGroups,
  buildFrames,
  groupSeries,
  photoUrl,
} from "../components/photography/photoData"
import * as styles from "./photography.module.css"

const GRID_PX = 420
const LEAD_PX = 840

const FILTER_LABELS = { type: "Type", place: "Place", year: "Year" }

const Frame = ({ frame, onOpen, ratio }) => (
  <figure className={styles.frame} data-ratio={ratio}>
    <button
      type="button"
      className={styles.frameButton}
      onClick={() => onOpen(frame)}
      aria-label={`Open ${frame.title}`}
    >
      <img
        className={styles.frameImage}
        src={photoUrl(frame.photo, ratio === "lead" ? LEAD_PX : GRID_PX)}
        alt={frame.title}
        loading="lazy"
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
  const [filters, setFilters] = React.useState({
    type: null,
    place: null,
    year: null,
  })
  const [openRef, setOpenRef] = React.useState(null)

  const filtering = Boolean(filters.type || filters.place || filters.year)
  const visible = React.useMemo(
    () => (filtering ? applyFilters(frames, filters, groups) : frames),
    [frames, filters, filtering, groups]
  )
  const { series, standalone } = React.useMemo(
    () => groupSeries(frames),
    [frames]
  )

  // The lightbox steps through whatever the page is currently showing, so
  // arrow keys stay inside the filtered set rather than the whole archive.
  const sequence = filtering
    ? visible
    : [...series.flatMap((s) => s.frames), ...standalone]
  const openIndex = openRef
    ? sequence.findIndex((frame) => frame.ref === openRef)
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

  const openFrame = (frame) => {
    setOpenRef(frame.ref)
    window.history.pushState({}, "", `?frame=${frame.ref}`)
  }

  const closeFrame = React.useCallback(() => {
    setOpenRef(null)
    window.history.pushState({}, "", window.location.pathname)
  }, [])

  const stepFrame = React.useCallback(
    (delta) => {
      if (openIndex < 0 || sequence.length === 0) return
      const next =
        sequence[(openIndex + delta + sequence.length) % sequence.length]
      setOpenRef(next.ref)
      window.history.replaceState({}, "", `?frame=${next.ref}`)
    },
    [openIndex, sequence]
  )

  const toggle = (group, value) =>
    setFilters((current) => ({
      ...current,
      [group]: current[group] === value ? null : value,
    }))

  const clear = () => setFilters({ type: null, place: null, year: null })

  return (
    <div className={styles.page}>
      <Masthead location={location} activeSection="photography" />

      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Photography</p>
          <h1 className={styles.title}>On film, mostly.</h1>
          <p className={styles.intro}>
            {frames.length} frames, made in {groups.place.length > 1 ? "several" : "one"}{" "}
            places between {groups.year[groups.year.length - 1]?.label} and{" "}
            {groups.year[0]?.label}. Some belong to a series; most were simply
            there when the light was doing something worth keeping.
          </p>
        </header>

        <div className={styles.bar}>
          {["type", "place", "year"].map((group) => (
            <div className={styles.group} key={group}>
              <span className={styles.groupLabel}>{FILTER_LABELS[group]}</span>
              {groups[group].map((option) => (
                <button
                  className={styles.chip}
                  key={option.value}
                  type="button"
                  data-on={filters[group] === option.value ? "true" : "false"}
                  aria-pressed={filters[group] === option.value}
                  onClick={() => toggle(group, option.value)}
                >
                  {option.label}
                  <span className={styles.chipCount}>{option.count}</span>
                </button>
              ))}
            </div>
          ))}

          <span className={styles.count}>
            {filtering
              ? `${visible.length} of ${frames.length} frames`
              : `${frames.length} frames`}
            {filtering ? (
              <button className={styles.clear} type="button" onClick={clear}>
                Clear
              </button>
            ) : null}
          </span>
        </div>

        <div className={styles.stage}>
          {filtering ? (
            visible.length ? (
              <div className={styles.contact}>
                {visible.map((frame) => (
                  <Frame key={frame.slug} frame={frame} onOpen={openFrame} />
                ))}
              </div>
            ) : (
              <p className={styles.empty}>No frames match those filters.</p>
            )
          ) : (
            <>
              {series.map((entry) => (
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
                        onOpen={openFrame}
                        ratio="lead"
                      />
                    </div>
                    <div className={styles.seriesRest}>
                      {entry.frames.slice(1).map((frame) => (
                        <Frame
                          key={frame.slug}
                          frame={frame}
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
                  <div className={styles.contact}>
                    {standalone.map((frame) => (
                      <Frame
                        key={frame.slug}
                        frame={frame}
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
          tags
          photo
          type
          series
        }
      }
    }
  }
`
