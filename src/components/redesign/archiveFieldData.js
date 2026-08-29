const writingWorks = [
  {
    id: "w-01",
    kind: "writing",
    format: "essay",
    inquiries: [{ id: "systems", weight: 1 }],
  },
  {
    id: "w-02",
    kind: "writing",
    format: "reflection",
    inquiries: [
      { id: "reality", weight: 0.55 },
      { id: "agency", weight: 0.45 },
    ],
  },
  {
    id: "w-03",
    kind: "writing",
    format: "data",
    inquiries: [{ id: "agency", weight: 1 }],
  },
  {
    id: "w-04",
    kind: "writing",
    format: "essay",
    inquiries: [
      { id: "power", weight: 0.6 },
      { id: "connection", weight: 0.4 },
    ],
  },
  {
    id: "w-05",
    kind: "writing",
    format: "reflection",
    inquiries: [{ id: "connection", weight: 1 }],
  },
  {
    id: "w-06",
    kind: "writing",
    format: "data",
    inquiries: [{ id: "memory", weight: 1 }],
  },
  {
    id: "w-07",
    kind: "writing",
    format: "essay",
    inquiries: [
      { id: "systems", weight: 0.65 },
      { id: "power", weight: 0.35 },
    ],
  },
  {
    id: "w-08",
    kind: "writing",
    format: "reflection",
    inquiries: [{ id: "reality", weight: 1 }],
  },
  {
    id: "w-09",
    kind: "writing",
    format: "data",
    inquiries: [{ id: "power", weight: 1 }],
  },
  {
    id: "w-10",
    kind: "writing",
    format: "essay",
    inquiries: [
      { id: "agency", weight: 0.6 },
      { id: "connection", weight: 0.4 },
    ],
  },
  {
    id: "w-11",
    kind: "writing",
    format: "reflection",
    inquiries: [
      { id: "connection", weight: 0.55 },
      { id: "memory", weight: 0.45 },
    ],
  },
  {
    id: "w-12",
    kind: "writing",
    format: "data",
    inquiries: [
      { id: "reality", weight: 0.45 },
      { id: "memory", weight: 0.55 },
    ],
  },
]

const photographyWorks = Array.from({ length: 50 }, (_, index) => ({
  id: `photo-${String(index + 1).padStart(2, "0")}`,
  kind: "photography",
  format: "photography",
}))

export const sampleWorks = [...writingWorks, ...photographyWorks]

const compareSourceWorks = (left, right) => {
  const leftDate = left.frontmatter?.date || ""
  const rightDate = right.frontmatter?.date || ""

  return leftDate.localeCompare(rightDate)
}

export const enrichSampleWorks = sourceNodes => {
  const sourceWritings = sourceNodes
    .filter(node => node.frontmatter?.layout === "blog")
    .sort(compareSourceWorks)
  const sourcePhotography = sourceNodes
    .filter(node => node.frontmatter?.layout === "photography")
    .sort(compareSourceWorks)
  let writingIndex = 0
  let photographyIndex = 0

  return sampleWorks.map(work => {
    const source =
      work.kind === "writing"
        ? sourceWritings[writingIndex++]
        : sourcePhotography[photographyIndex++]
    const title = source?.frontmatter?.title || work.id.toUpperCase()

    if (!source) {
      return { ...work, title, year: null, date: null }
    }

    if (work.kind === "writing") {
      const date = source.frontmatter?.date || null
      const parsedYear = date ? new Date(date).getUTCFullYear() : null

      return {
        ...work,
        title,
        date,
        year: Number.isFinite(parsedYear) ? parsedYear : null,
      }
    }

    const parsedYear = Number.parseInt(source.frontmatter?.year, 10)

    return {
      ...work,
      title,
      date: null,
      year: Number.isFinite(parsedYear) ? parsedYear : null,
    }
  })
}

export const FIELD_WIDTH = 620
export const FIELD_HEIGHT = 520
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

const TERRITORY_RADIUS = FIELD_WIDTH * 0.115
const FIELD_CENTRE_X = FIELD_WIDTH / 2
const INQUIRY_CENTRE_Y = 200
const INQUIRY_RING_RADIUS = 115

const inquiryDefinitions = [
  { id: "systems", label: "SYSTEMS" },
  { id: "reality", label: "REALITY" },
  { id: "agency", label: "AGENCY" },
  { id: "power", label: "POWER" },
  { id: "connection", label: "CONNECTION" },
  { id: "memory", label: "MEMORY" },
]

export const inquiryTerritories = inquiryDefinitions.map((inquiry, index) => {
  const angle = ((-90 + index * 60) * Math.PI) / 180

  return {
    ...inquiry,
    radius: TERRITORY_RADIUS,
    anchor: {
      x: FIELD_CENTRE_X + Math.cos(angle) * INQUIRY_RING_RADIUS,
      y: INQUIRY_CENTRE_Y + Math.sin(angle) * INQUIRY_RING_RADIUS,
    },
  }
})

const inquiryAnchors = Object.fromEntries(
  inquiryTerritories.map(territory => [territory.id, territory.anchor])
)

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

const SCATTER_GAP = 10
const SCATTER_EDGE_PADDING = 24
const SCATTER_MAX_ATTEMPTS = 25000

const createScatter = () => {
  const random = createSeededRandom(5)
  const placed = []

  return Object.fromEntries(
    sampleWorks.map(work => {
      const visualRadius = markStyles[work.format].visualRadius
      let position = null

      for (let attempt = 0; attempt < SCATTER_MAX_ATTEMPTS; attempt += 1) {
        const candidate = {
          x:
            SCATTER_EDGE_PADDING +
            random() * (FIELD_WIDTH - SCATTER_EDGE_PADDING * 2),
          y:
            SCATTER_EDGE_PADDING +
            random() * (FIELD_HEIGHT - SCATTER_EDGE_PADDING * 2),
        }

        const clearsExistingMarks = placed.every(existing => {
          const minimumDistance =
            visualRadius + existing.visualRadius + SCATTER_GAP

          return (
            Math.hypot(candidate.x - existing.x, candidate.y - existing.y) >=
            minimumDistance
          )
        })

        if (clearsExistingMarks) {
          position = candidate
          break
        }
      }

      if (!position) {
        throw new Error(`Unable to place ${work.id} in ArchiveField scatter`)
      }

      placed.push({ ...position, visualRadius })
      return [work.id, position]
    })
  )
}

const scatter = createScatter()

const inquiryPosition = (work, random) => {
  const centroid = work.inquiries.reduce(
    (position, inquiry) => ({
      x: position.x + inquiryAnchors[inquiry.id].x / work.inquiries.length,
      y: position.y + inquiryAnchors[inquiry.id].y / work.inquiries.length,
    }),
    { x: 0, y: 0 }
  )

  return {
    x: centroid.x + (random() - 0.5) * FIELD_WIDTH * 0.09,
    y: centroid.y + (random() - 0.5) * FIELD_HEIGHT * 0.09,
  }
}

const photographyBand = columns => {
  const rows = Math.ceil(photographyWorks.length / columns)
  const left = FIELD_WIDTH * 0.12
  const right = FIELD_WIDTH * 0.88
  const top = 404
  const bottom = 488
  const columnGap = (right - left) / (columns - 1)
  const rowGap = rows > 1 ? (bottom - top) / (rows - 1) : 0

  return Object.fromEntries(
    photographyWorks.map((work, index) => {
      const row = Math.floor(index / columns)
      const column = index % columns
      const remaining = photographyWorks.length - row * columns
      const itemsInRow = Math.min(columns, remaining)
      const rowInset = ((columns - itemsInRow) * columnGap) / 2

      return [
        work.id,
        {
          x: left + rowInset + column * columnGap,
          y: top + row * rowGap,
        },
      ]
    })
  )
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

export const createLayouts = photographyColumns => {
  const inquiryRandom = createSeededRandom(17)
  const writingInquiryPositions = Object.fromEntries(
    writingWorks.map(work => [work.id, inquiryPosition(work, inquiryRandom)])
  )
  const writingsStructured = {
    ...writingInquiryPositions,
    ...Object.fromEntries(
      photographyWorks.map(work => [work.id, { ...scatter[work.id] }])
    ),
  }
  const fullyStructured = {
    ...writingInquiryPositions,
    ...photographyBand(photographyColumns),
  }

  return {
    scatter,
    writingsStructured,
    fullyStructured,
  }
}

export const connections = [
  {
    id: "essay-observation",
    from: "w-01",
    to: "photo-01",
  },
  { id: "essay-place", from: "w-04", to: "photo-14" },
  { id: "reflection-frame", from: "w-02", to: "photo-16" },
  { id: "reflection-return", from: "w-05", to: "photo-19" },
  { id: "data-pattern", from: "w-03", to: "photo-05" },
  { id: "data-evidence", from: "w-06", to: "photo-18" },
]
