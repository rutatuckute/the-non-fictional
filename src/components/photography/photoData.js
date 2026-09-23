// Shapes the photography archive: how a frame is ordered, grouped into a
// series, and filtered. Image URLs are built in src/lib/images.ts.

// "Holbox, Quintana Roo, Mexico" -> city "Holbox", country "Mexico".
// Every location in the archive is comma-separated with the city first and the
// country last, so first/last segments are enough; no extra frontmatter needed.
export const splitLocation = (location) => {
  if (!location) {
    return { city: null, country: null }
  }

  const parts = location.split(",").map((part) => part.trim()).filter(Boolean)

  return {
    city: parts[0] || null,
    country: parts.length > 1 ? parts[parts.length - 1] : null,
  }
}

// A series takes the shortest of its members' titles, so "AVENTURINE" wins
// over "AVENTURINE III" — the same rule the homepage archive field uses.
// "ciao-amore" -> "Ciao amore". The slug is the series' identity, so its
// display name is derived from it rather than from the shortest member title,
// which shifted whenever a frame was added or renamed.
export const seriesLabel = (slug) => {
  const words = (slug || "").split("-").filter(Boolean).join(" ")

  return words ? words[0].toUpperCase() + words.slice(1) : ""
}

const ROMAN = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }

const parseRoman = (numeral) => {
  let total = 0

  for (let i = 0; i < numeral.length; i += 1) {
    const value = ROMAN[numeral[i]]
    const next = ROMAN[numeral[i + 1]]

    if (!value) {
      return null
    }

    total += next && next > value ? -value : value
  }

  return total
}

// "AVENTURINE III" -> { base: "AVENTURINE", index: 3 }. Frames within one
// series share a title and differ only by a trailing numeral, which cannot be
// compared as text: "IX" precedes "V" alphabetically but is the larger of the
// two. An unnumbered title is the first of its series, so it counts as 1 and
// "AVENTURINE" still comes before "AVENTURINE II".
export const splitTitleIndex = (title) => {
  const match = (title || "").match(/^(.*\S)\s+([IVXLCDM]+|\d+)$/)

  if (!match) {
    return { base: title || "", index: 1 }
  }

  const [, base, numeral] = match
  const index = /^\d+$/.test(numeral) ? Number(numeral) : parseRoman(numeral)

  return index ? { base, index } : { base: title, index: 1 }
}

// Newest first: by year, then by roll within that year, then by title so a
// series reads forwards. A frame with no roll still appears, but after the
// numbered ones for its year, so an unfilled field cannot jump a frame to the
// front.
const byYearRollTitle = (a, b) => {
  const yearA = Number(a.year) || 0
  const yearB = Number(b.year) || 0

  if (yearA !== yearB) {
    return yearB - yearA
  }

  if (a.roll !== b.roll) {
    if (a.roll === null) return 1
    if (b.roll === null) return -1

    return b.roll - a.roll
  }

  // Same year and roll — which is every frame until the rolls are filled in.
  // A series reads forwards, so the numeral ascends even though year and roll
  // descend.
  const base = a.titleBase.localeCompare(b.titleBase)

  return base !== 0 ? base : a.titleIndex - b.titleIndex
}

export const buildFrames = (nodes) => {
  const frames = nodes
    .filter((node) => node.fields?.slug)
    .map((node) => {
      const fm = node.frontmatter || {}
      const { city, country } = splitLocation(fm.location)
      const title = fm.title || node.fields.slug
      const { base, index } = splitTitleIndex(title)

      return {
        slug: node.fields.slug,
        // The query-string form used to deep-link the lightbox.
        ref: node.fields.slug.replace(/^\/|\/$/g, ""),
        title,
        titleBase: base,
        titleIndex: index,
        photo: fm.photo || null,
        width: fm.photoWidth || null,
        height: fm.photoHeight || null,
        location: fm.location || null,
        city,
        country,
        year: fm.year || null,
        roll: Number.isFinite(fm.roll) ? fm.roll : null,
        type: fm.type || null,
        tags: fm.tags || [],
        series: fm.series || null,
        // The series document's own title where there is one; the slug is only
        // a fallback for a frame not yet linked to a series.
        seriesName: fm.seriesTitle || (fm.series ? seriesLabel(fm.series) : null),
        seriesOrder: Number.isFinite(fm.seriesOrder) ? fm.seriesOrder : null,
        selected: Boolean(fm.selected),
        selectedOrder: Number.isFinite(fm.selectedOrder) ? fm.selectedOrder : null,
      }
    })
    .sort(byYearRollTitle)

  return frames
}

// Series keep the order they first appear in.
export const groupSeries = (frames) => {
  const order = []
  const bySeries = new Map()

  frames.forEach((frame) => {
    if (!frame.series) return
    if (!bySeries.has(frame.series)) {
      bySeries.set(frame.series, [])
      order.push(frame.series)
    }
    bySeries.get(frame.series).push(frame)
  })

  const series = order.map((id) => {
    const members = bySeries.get(id)
    const name = members[0].seriesName || seriesLabel(id)
    const years = members.map((member) => member.year).filter(Boolean)

    return {
      id,
      name,
      frames: members,
      location: members[0].location,
      years: years.length
        ? [
            years.reduce((a, b) => (a < b ? a : b)),
            years.reduce((a, b) => (a > b ? a : b)),
          ]
        : null,
    }
  })

  return { series, standalone: frames.filter((frame) => !frame.series) }
}

const countBy = (frames, pick) => {
  const counts = new Map()
  frames.forEach((frame) => {
    const value = pick(frame)
    if (!value) return
    counts.set(value, (counts.get(value) || 0) + 1)
  })
  return counts
}

// The cities lived in rather than passed through. Editorial, not derivable
// from the frames, so it is listed here; a city only reaches the filter once it
// actually has frames, which is why London can sit in this list unseen.
export const LIVED_IN = ["Vilnius", "Paris", "London"]

// Type stays a short chip row. Lived, place and year are dropdowns, which have
// no wrapping cost. Place lists countries: cities made the list long and mostly
// one frame deep, and the places worth singling out are the lived-in ones.
export const buildFilterGroups = (frames) => {
  const byCount = (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
  const types = [...countBy(frames, (f) => f.type).entries()].sort(byCount)
  const lived = [
    ...countBy(frames, (f) => (LIVED_IN.includes(f.city) ? f.city : null)).entries(),
  ].sort(byCount)
  const countries = [...countBy(frames, (f) => f.country).entries()].sort(byCount)
  const years = [...countBy(frames, (f) => f.year).entries()].sort(
    (a, b) => Number(b[0]) - Number(a[0])
  )
  const asOptions = (entries) =>
    entries.map(([value, count]) => ({ value, label: value, count }))

  return {
    type: asOptions(types),
    lived: asOptions(lived),
    place: asOptions(countries),
    year: asOptions(years),
  }
}

// Each facet holds a list of chosen values. Values inside one facet are OR'd
// (Paris or Vilnius), and the facets are AND'd (Paris frames from 2019).
const matches = (chosen, value) => chosen.length === 0 || chosen.includes(value)

export const applyFilters = (frames, filters) =>
  frames.filter(
    (frame) =>
      matches(filters.type, frame.type) &&
      matches(filters.lived, frame.city) &&
      matches(filters.place, frame.country) &&
      matches(filters.year, frame.year)
  )

export const EMPTY_FILTERS = { type: [], lived: [], place: [], year: [] }

export const isFiltering = (filters) =>
  Object.values(filters).some((chosen) => chosen.length > 0)

// Manual order first, unset last, then the archive's own order so an
// unsequenced frame still lands somewhere stable rather than moving between
// renders. Used for both Selected and the inside of a series, which are
// sequenced the same way and for the same reason: the order is the work.
const byManualOrder = (key) => (a, b) => {
  const left = a[key]
  const right = b[key]

  if (left !== right) {
    if (left === null) return 1
    if (right === null) return -1
    return left - right
  }

  return 0
}

// The edit. Explicitly marked frames only, in the order they were given —
// never by date, rating, recency or anything else inferred.
export const selectedFrames = (frames) =>
  frames.filter((frame) => frame.selected).sort(byManualOrder("selectedOrder"))

// Everything. Selected frames and series frames are in here too; the archive is
// the whole record, not the remainder.
//
// buildFrames already returns newest first — by year, then roll, then title —
// so the archive is that order untouched. Sorting on the stored date instead
// would order the collection by when each frame was added to the site rather
// than when it was taken.
export const archiveFrames = (frames) => frames

// One body of work, in its own sequence.
export const framesInSeries = (frames, slug) =>
  frames.filter((frame) => frame.series === slug).sort(byManualOrder("seriesOrder"))

// Pairs each series with its frames and its cover, dropping any series that has
// no frames yet so the index cannot show an empty one.
export const buildSeriesIndex = (frames, series) =>
  series
    .map((entry) => {
      const members = framesInSeries(frames, entry.slug)
      const cover =
        members.find((frame) => frame.ref === entry.coverSlug) || members[0] || null

      return { ...entry, frames: members, cover }
    })
    .filter((entry) => entry.frames.length > 0)
