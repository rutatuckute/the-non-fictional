// Frontmatter carries whatever transform the photo was uploaded with —
// bare, "/-/preview/-/quality/smart/", or with "/-/format/auto/" appended.
// Rebuilding from the UUID gives one predictable, correctly sized URL instead
// of shipping the full-resolution original.
const UUID = /ucarecdn\.com\/([0-9a-f-]{36})/i

export const photoUrl = (source, px) => {
  const match = source ? source.match(UUID) : null

  if (!match) {
    return source
  }

  return `https://ucarecdn.com/${match[1]}/-/preview/${px}x${px}/-/quality/lightest/-/format/auto/`
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

export const buildFrames = (nodes) =>
  nodes
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

// Series keep the order they first appear in, and take their shortest member
// title so "AVENTURINE" wins over "AVENTURINE III" — same rule the homepage
// archive field uses.
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
    const name = members
      .map((member) => member.title)
      .reduce((shortest, candidate) =>
        candidate.length < shortest.length ? candidate : shortest
      )
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

export const ELSEWHERE = "__elsewhere__"

// Places with a single frame would be fourteen chips, half of them showing one
// photograph each. The singletons collapse into one "Elsewhere" chip instead.
export const buildFilterGroups = (frames) => {
  const types = [...countBy(frames, (f) => f.type).entries()].sort(
    (a, b) => b[1] - a[1]
  )
  const cities = [...countBy(frames, (f) => f.city).entries()]
  const named = cities.filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1])
  const singletonCount = cities
    .filter(([, count]) => count === 1)
    .reduce((total, [, count]) => total + count, 0)
  const years = [...countBy(frames, (f) => f.year).entries()].sort(
    (a, b) => Number(b[0]) - Number(a[0])
  )

  return {
    type: types.map(([value, count]) => ({ value, label: value, count })),
    place: [
      ...named.map(([value, count]) => ({ value, label: value, count })),
      ...(singletonCount
        ? [{ value: ELSEWHERE, label: "Elsewhere", count: singletonCount }]
        : []),
    ],
    year: years.map(([value, count]) => ({ value, label: value, count })),
  }
}

export const applyFilters = (frames, filters, groups) => {
  const multiCityNames = new Set(
    groups.place.filter((o) => o.value !== ELSEWHERE).map((o) => o.value)
  )

  return frames.filter((frame) => {
    if (filters.type && frame.type !== filters.type) return false
    if (filters.year && frame.year !== filters.year) return false
    if (filters.place) {
      if (filters.place === ELSEWHERE) {
        if (frame.city && multiCityNames.has(frame.city)) return false
      } else if (frame.city !== filters.place) {
        return false
      }
    }
    return true
  })
}
