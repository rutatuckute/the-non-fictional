// Photographs are ordinary files in the repo under /images/uploads/. Netlify's
// Image CDN resizes them on demand at the edge, so nothing is processed at
// build time and no third-party image service sits in the critical path.
const QUALITY = { lightest: 50, lighter: 60, normal: 78 }

// `px` is the pixel budget, not the CSS size — pass roughly twice the displayed
// width so the frame stays sharp on a 2x screen. Quality is aggressive for small
// thumbnails but eased off for anything shown large, where compression
// artefacts are visible. `format` is left unset for the <img> fallback so the
// CDN can negotiate; PhotoImage asks for avif explicitly in a <source>.
export const photoUrl = (source, px, quality = "lightest", format) => {
  if (!source || source.endsWith(".svg")) {
    return source
  }

  const q = QUALITY[quality] ?? 70
  const fm = format ? `&fm=${format}` : ""

  return `/.netlify/images?url=${encodeURIComponent(source)}&w=${px}${fm}&q=${q}`
}

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
const shortestTitle = (members) =>
  members
    .map((member) => member.title)
    .reduce((shortest, candidate) =>
      candidate.length < shortest.length ? candidate : shortest
    )

const seriesNames = (frames) => {
  const bySeries = new Map()

  frames.forEach((frame) => {
    if (!frame.series) return
    if (!bySeries.has(frame.series)) bySeries.set(frame.series, [])
    bySeries.get(frame.series).push(frame)
  })

  return new Map(
    [...bySeries.entries()].map(([id, members]) => [id, shortestTitle(members)])
  )
}

export const buildFrames = (nodes) => {
  const frames = nodes
    .filter((node) => node.fields?.slug)
    .map((node) => {
      const fm = node.frontmatter || {}
      const { city, country } = splitLocation(fm.location)

      return {
        slug: node.fields.slug,
        // The query-string form used to deep-link the lightbox.
        ref: node.fields.slug.replace(/^\/|\/$/g, ""),
        title: fm.title || node.fields.slug,
        photo: fm.photo || null,
        location: fm.location || null,
        city,
        country,
        year: fm.year || null,
        type: fm.type || null,
        tags: fm.tags || [],
        series: fm.series || null,
      }
    })

  // Stamp the series display name onto every member here, so no consumer has
  // to resolve the slug ("ciao-amore") back to a title on its own.
  const names = seriesNames(frames)

  return frames.map((frame) =>
    frame.series ? { ...frame, seriesName: names.get(frame.series) } : frame
  )
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
    const name = members[0].seriesName || shortestTitle(members)
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

// Type stays a short chip row. Place and year are dropdowns, which have no
// wrapping cost — so every city is listed individually rather than folding the
// single-frame ones into an "Elsewhere" bucket.
export const buildFilterGroups = (frames) => {
  const byCount = (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))
  const types = [...countBy(frames, (f) => f.type).entries()].sort(byCount)
  const cities = [...countBy(frames, (f) => f.city).entries()].sort(byCount)
  const years = [...countBy(frames, (f) => f.year).entries()].sort(
    (a, b) => Number(b[0]) - Number(a[0])
  )
  const asOptions = (entries) =>
    entries.map(([value, count]) => ({ value, label: value, count }))

  return {
    type: asOptions(types),
    place: asOptions(cities),
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
      matches(filters.place, frame.city) &&
      matches(filters.year, frame.year)
  )

export const EMPTY_FILTERS = { type: [], place: [], year: [] }

export const isFiltering = (filters) =>
  Object.values(filters).some((chosen) => chosen.length > 0)
