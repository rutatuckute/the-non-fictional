// Photographs are ordinary files in the repo under /images/uploads/. Netlify's
// Image CDN resizes them on demand at the edge, so nothing is processed at
// build time and no third-party image service sits in the critical path.
const QUALITY = { lightest: 50, lighter: 58, normal: 70 }

// Measured against Netlify's own encoders rather than assumed. AVIF only wins
// in a middle band: its container overhead makes it larger than WebP for tiny
// marks, and past ~700px it loses badly on both counts — at 2200px it came out
// a third larger and took 28x longer to generate. Outside 300..700, WebP.
export const preferredFormat = (px) =>
  px >= 300 && px <= 700 ? "avif" : "webp"

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
        location: fm.location || null,
        city,
        country,
        year: fm.year || null,
        roll: Number.isFinite(fm.roll) ? fm.roll : null,
        type: fm.type || null,
        tags: fm.tags || [],
        series: fm.series || null,
      }
    })
    .sort(byYearRollTitle)

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
