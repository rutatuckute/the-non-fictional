"use client"

import * as React from "react"

import Masthead from "../../../../components/masthead"
import PhotoImage from "../../../../components/photo-image"
import SiteFooter from "../../../../components/site-footer"
import Lightbox from "../../../../components/photography/Lightbox"
import FilterSelect from "../../../../components/photography/FilterSelect"
import PhotographyHeader from "../../../../components/photography/PhotographyHeader"
import { useLightbox } from "../../../../components/photography/useLightbox"
import { buildFrames, LIVED_IN } from "../../../../components/photography/photoData"
import styles from "../../../../styles/photography.module.css"

// Frame size drives both the grid track and the pixels actually fetched, so a
// smaller frame is a smaller download rather than a scaled-down large one.
const SIZES = {
  sm: { label: "Small", grid: 104, px: 300 },
  md: { label: "Medium", grid: 170, px: 420 },
  lg: { label: "Large", grid: 260, px: 640 },
}

const EMPTY = { type: [], lived: [], year: [], place: [], series: [] }

const LABELS = { lived: "Lived", year: "Year", place: "Place", series: "Series" }

const countBy = (frames, pick) => {
  const counts = new Map()
  frames.forEach((frame) => {
    const value = pick(frame)
    if (!value) return
    counts.set(value, (counts.get(value) || 0) + 1)
  })
  return counts
}

// Lived, year, place and series. Lived reads from the same constant the LIVED
// IN line in the header is built from, so the cities named above the archive
// and the cities you can filter it by cannot drift apart — a city only reaches
// the filter once it actually has frames, which is why London can sit in that
// line unseen here.
const buildGroups = (frames) => {
  const byCount = (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
  const asOptions = (entries) =>
    entries.map(([value, count]) => ({ value, label: value, count }))

  return {
    type: asOptions([...countBy(frames, (f) => f.type).entries()].sort(byCount)),
    lived: asOptions(
      [
        ...countBy(frames, (f) => (LIVED_IN.includes(f.city) ? f.city : null)).entries(),
      ].sort(byCount)
    ),
    year: asOptions(
      [...countBy(frames, (f) => f.year).entries()].sort(
        (a, b) => Number(b[0]) - Number(a[0])
      )
    ),
    place: asOptions([...countBy(frames, (f) => f.country).entries()].sort(byCount)),
    series: asOptions(
      [...countBy(frames, (f) => f.seriesName).entries()].sort(byCount)
    ),
  }
}

const matches = (chosen, value) => chosen.length === 0 || chosen.includes(value)

const ArchiveView = ({ nodes }) => {
  const frames = React.useMemo(() => buildFrames(nodes), [nodes])
  const groups = React.useMemo(() => buildGroups(frames), [frames])
  const [filters, setFilters] = React.useState(EMPTY)
  const [size, setSize] = React.useState("lg")

  const filtering = Object.values(filters).some((chosen) => chosen.length > 0)

  const visible = React.useMemo(
    () =>
      filtering
        ? frames.filter(
            (frame) =>
              matches(filters.type, frame.type) &&
            matches(filters.lived, frame.city) &&
            matches(filters.year, frame.year) &&
              matches(filters.place, frame.country) &&
              matches(filters.series, frame.seriesName)
          )
        : frames,
    [frames, filters, filtering]
  )

  // Stepping stays inside what the page is showing, so arrow keys follow the
  // filtered set rather than the whole archive.
  const lightbox = useLightbox(visible)
  const { px } = SIZES[size]

  const toggle = (group, value) =>
    setFilters((current) => ({
      ...current,
      [group]: current[group].includes(value)
        ? current[group].filter((chosen) => chosen !== value)
        : [...current[group], value],
    }))

  const clearGroup = (group) =>
    setFilters((current) => ({ ...current, [group]: [] }))

  const gridStyle = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${SIZES[size].grid}px, 1fr))`,
  }

  return (
    <div className={styles.page}>
      <Masthead activeSection="photography" />

      <main className={styles.main}>
        <PhotographyHeader active="archive">
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
              {groups.type.map((option) => (
                <button
                  className={styles.chip}
                  key={option.value}
                  type="button"
                  data-on={filters.type.includes(option.value) ? "true" : "false"}
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
              {["lived", "year", "place", "series"].map((group) => (
                <FilterSelect
                  key={group}
                  label={LABELS[group]}
                  options={groups[group]}
                  selected={filters[group]}
                  onToggle={(value) => toggle(group, value)}
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
              <button className={styles.clear} type="button" onClick={() => setFilters(EMPTY)}>
                Clear
              </button>
            ) : null}
          </p>
        </PhotographyHeader>

        <div className={styles.stage}>
          {visible.length ? (
            <div className={styles.contact} style={gridStyle}>
              {visible.map((frame) => (
                <figure className={styles.frame} key={frame.slug}>
                  <button
                    type="button"
                    className={styles.frameButton}
                    onClick={() => lightbox.open(frame)}
                    aria-label={`Open ${frame.title}`}
                  >
                    <PhotoImage
                      className={styles.frameImage}
                      source={frame.photo}
                      px={px}
                      alt={frame.title}
                    />
                    <figcaption className={styles.frameCaption}>
                      <b>{frame.title}</b>
                      {[frame.city || "Unplaced", frame.year]
                        .filter(Boolean)
                        .join(" · ")}
                    </figcaption>
                  </button>
                </figure>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No frames match those filters.</p>
          )}
        </div>
      </main>

      <SiteFooter />

      <Lightbox
        frames={visible}
        index={lightbox.index}
        onClose={lightbox.close}
        onStep={lightbox.step}
      />
    </div>
  )
}

export default ArchiveView
