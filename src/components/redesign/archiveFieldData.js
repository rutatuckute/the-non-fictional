const CATEGORY_TO_FORMAT = {
  essays: "essay",
  reflections: "reflection",
  data: "data",
}

const DEFAULT_INQUIRY = "systems"

const buildWritingWork = node => {
  const fm = node.frontmatter || {}
  const format = CATEGORY_TO_FORMAT[fm.category_id] || "essay"
  const date = fm.date || null
  const parsedYear = date ? new Date(date).getUTCFullYear() : null
  const id = node.fields?.slug

  return {
    id,
    kind: "writing",
    format,
    inquiries: [{ id: fm.inquiry || DEFAULT_INQUIRY, weight: 1 }],
    title: fm.title || id,
    excerpt: fm.excerpt || null,
    tags: fm.tags || [],
    date,
    year: Number.isFinite(parsedYear) ? parsedYear : null,
    slug: id,
    image: fm.cover_image || null,
    category: fm.category || null,
    topic: fm.topic || null,
    inquiry: fm.inquiry || DEFAULT_INQUIRY,
    link: fm.link || null,
    readingTime: node.fields?.readingTime?.text || null,
  }
}

const buildPhotographyWork = node => {
  const fm = node.frontmatter || {}
  const parsedYear = Number.parseInt(fm.year, 10)
  const id = node.fields?.slug

  return {
    id,
    kind: "photography",
    format: "photography",
    title: fm.title || id,
    date: null,
    year: Number.isFinite(parsedYear) ? parsedYear : null,
    photo: fm.photo || null,
    location: fm.location || null,
    slug: id,
    image: fm.photo || null,
    type: fm.type || null,
    tags: fm.tags || [],
    series: fm.series || null,
  }
}

// Frames sharing a `series` frontmatter value collapse into a single mark. The
// series takes the shortest member title, so "AVENTURINE" wins over
// "AVENTURINE III", and carries every frame for the rail to show.
const groupPhotographySeries = photographs => {
  const standalone = photographs.filter(work => !work.series)
  const seriesOrder = []
  const bySeries = new Map()

  photographs
    .filter(work => work.series)
    .forEach(work => {
      if (!bySeries.has(work.series)) {
        bySeries.set(work.series, [])
        seriesOrder.push(work.series)
      }
      bySeries.get(work.series).push(work)
    })

  const grouped = seriesOrder.map(seriesId => {
    const frames = bySeries.get(seriesId)
    const cover = frames[0]
    const title = frames
      .map(frame => frame.title)
      .reduce((shortest, candidate) =>
        candidate.length < shortest.length ? candidate : shortest
      )
    const years = frames.map(frame => frame.year).filter(Number.isFinite)

    return {
      ...cover,
      id: `series:${seriesId}`,
      title,
      frames,
      frameCount: frames.length,
      // Chronology sorts on a single value; the series starts at its earliest.
      year: years.length ? Math.min(...years) : null,
      yearRange: years.length
        ? [Math.min(...years), Math.max(...years)]
        : null,
      tags: [...new Set(frames.flatMap(frame => frame.tags || []))],
      slug: cover.slug,
    }
  })

  return [...standalone, ...grouped]
}

// Builds the works shown in the archive field directly from real blog and
// photography content nodes (Gatsby's allMarkdownRemark), keyed by slug.
export const buildWorks = sourceNodes => {
  const writings = sourceNodes
    .filter(node => node.frontmatter?.layout === "blog" && node.fields?.slug)
    .map(buildWritingWork)
  const photography = groupPhotographySeries(
    sourceNodes
      .filter(
        node => node.frontmatter?.layout === "photography" && node.fields?.slug
      )
      .map(buildPhotographyWork)
  )

  return [...writings, ...photography]
}

const MAX_CONNECTIONS_PER_WRITING = 3

// A writing connects to a photograph when one of the writing's tags shows up
// in the photograph's location (e.g. the "lithuania" tag matches a photo
// located in "Vilnius, Lithuania"). Capped per writing so the network view
// stays legible instead of one popular location swamping it with lines.
export const deriveConnections = works => {
  const writings = works.filter(work => work.kind === "writing")
  const photography = works.filter(work => work.kind === "photography")

  return writings.flatMap(writing => {
    const tags = (writing.tags || []).map(tag => tag.toLowerCase())

    if (tags.length === 0) {
      return []
    }

    const matches = photography
      .map(photo => {
        const location = (photo.location || "").toLowerCase()
        const matchedTag = location
          ? tags.find(tag => location.includes(tag))
          : null

        return matchedTag ? { photo, matchedTag } : null
      })
      .filter(Boolean)
      .sort(
        (left, right) =>
          (right.photo.year || 0) - (left.photo.year || 0) ||
          left.photo.id.localeCompare(right.photo.id)
      )
      .slice(0, MAX_CONNECTIONS_PER_WRITING)

    return matches.map(({ photo, matchedTag }) => ({
      id: `${writing.id}--${photo.id}`,
      from: writing.id,
      to: photo.id,
      // The place both works point at, shown in the rail's meetings line.
      place: photo.location || matchedTag,
    }))
  })
}

export const WORK_MARK_SCALE = 0.58
const MARK_SIZE = 9
const WRITING_VISUAL_RADIUS = Math.hypot(MARK_SIZE * 1.2, MARK_SIZE * 0.62)
const PHOTOGRAPHY_EXTENT = MARK_SIZE * 1.25

export const markStyles = {
  essay: {
    size: MARK_SIZE,
    visualRadius: WRITING_VISUAL_RADIUS,
    strokeWidth: Math.max(1, MARK_SIZE * 0.3),
    opacity: 1,
    ruleCount: 3,
  },
  reflection: {
    size: MARK_SIZE,
    visualRadius: WRITING_VISUAL_RADIUS,
    strokeWidth: Math.max(1, MARK_SIZE * 0.3),
    opacity: 1,
    ruleCount: 2,
  },
  data: {
    size: MARK_SIZE,
    visualRadius: WRITING_VISUAL_RADIUS,
    strokeWidth: Math.max(1, MARK_SIZE * 0.3),
    opacity: 1,
    ruleCount: 3,
    dotRadius: Math.max(1.2, MARK_SIZE * 0.22),
  },
  photography: {
    size: MARK_SIZE,
    visualRadius: Math.SQRT2 * PHOTOGRAPHY_EXTENT,
    strokeWidth: Math.max(1, MARK_SIZE * 0.22),
    opacity: 1,
    extent: PHOTOGRAPHY_EXTENT,
    armLength: MARK_SIZE * 0.62,
  },
}

export const createSeededRandom = initialSeed => {
  let seed = initialSeed

  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

export const getPhotographyColumns = viewportWidth => {
  if (viewportWidth < 480) {
    return 8
  }

  if (viewportWidth < 1024) {
    return 10
  }

  return 13
}
