import {
  WORK_MARK_SCALE,
  createSeededRandom,
  markStyles,
} from "./archiveFieldData"

const COLLISION_GAP = 9
const EDGE_PADDING = 20
const SCATTER_MAX_ATTEMPTS = 30000
const FORMAT_ORDER = ["essay", "reflection", "data", "photography"]
const FORMAT_ZONE_WEIGHTS = {
  essay: 0.22,
  reflection: 0.18,
  data: 0.18,
  photography: 0.42,
}
const FORMAT_COLUMNS = {
  essay: 2,
  reflection: 2,
  data: 2,
  photography: 5,
}
const COMPACT_FORMAT_COLUMNS = {
  essay: 2,
  reflection: 2,
  data: 2,
  photography: 8,
}
const TIMELINE_PATH_SAMPLES = 80
const WRITING_RING_OFFSET = 24
const PHOTOGRAPHY_RING_OFFSET = 24
const CIRCULAR_BAND_GAP = 24
const DATED_ARC = Math.PI * 1.6
const UNDATED_ARC_START = -Math.PI / 2 + Math.PI * 1.65
const UNDATED_ARC_LENGTH = Math.PI * 0.21

const inquiryDefinitions = [
  { id: "systems", label: "SYSTEMS" },
  { id: "reality", label: "REALITY" },
  { id: "agency", label: "AGENCY" },
  { id: "power", label: "POWER" },
  { id: "connection", label: "CONNECTION" },
  { id: "memory", label: "MEMORY" },
]

const getVisualRadius = work =>
  markStyles[work.format].visualRadius * WORK_MARK_SCALE

const clearsPlacedWorks = (work, candidate, placed, gap = COLLISION_GAP) =>
  placed.every(existing => {
    const minimumDistance = getVisualRadius(work) + existing.radius + gap

    return (
      Math.hypot(candidate.x - existing.x, candidate.y - existing.y) >=
      minimumDistance
    )
  })

const addPlacedWork = (placed, work, position) => {
  placed.push({ ...position, radius: getVisualRadius(work) })
}

const createInquiryTerritories = (viewBoxWidth, viewBoxHeight) => {
  const centreX = viewBoxWidth / 2
  const centreY = viewBoxHeight * 0.385
  const territoryRadius = Math.min(viewBoxWidth, viewBoxHeight) * 0.137
  const ringRadius = Math.min(viewBoxWidth, viewBoxHeight) * 0.221

  return inquiryDefinitions.map((inquiry, index) => {
    const angle = ((-90 + index * 60) * Math.PI) / 180

    return {
      ...inquiry,
      radius: territoryRadius,
      anchor: {
        x: centreX + Math.cos(angle) * ringRadius,
        y: centreY + Math.sin(angle) * ringRadius,
      },
    }
  })
}

const createScatterPositions = (works, viewBoxWidth, viewBoxHeight) => {
  const random = createSeededRandom(5)
  const placed = []
  const positions = {}

  works.forEach(work => {
    const radius = getVisualRadius(work)
    const padding = EDGE_PADDING + radius
    let position = null

    for (let attempt = 0; attempt < SCATTER_MAX_ATTEMPTS; attempt += 1) {
      const candidate = {
        x: padding + random() * (viewBoxWidth - padding * 2),
        y: padding + random() * (viewBoxHeight - padding * 2),
      }

      if (clearsPlacedWorks(work, candidate, placed, 10)) {
        position = candidate
        break
      }
    }

    if (!position) {
      throw new Error(`Unable to place ${work.id} in visual scatter`)
    }

    positions[work.id] = position
    addPlacedWork(placed, work, position)
  })

  return positions
}

const createPhotographyBand = (
  works,
  viewBoxWidth,
  viewBoxHeight,
  columns
) => {
  const photography = works.filter(work => work.kind === "photography")
  const rows = Math.ceil(photography.length / columns)
  const left = viewBoxWidth * 0.12
  const right = viewBoxWidth * 0.88
  const top = viewBoxHeight * 0.777
  const bottom = viewBoxHeight * 0.938
  const columnGap = columns > 1 ? (right - left) / (columns - 1) : 0
  const rowGap = rows > 1 ? (bottom - top) / (rows - 1) : 0

  return Object.fromEntries(
    photography.map((work, index) => {
      const row = Math.floor(index / columns)
      const column = index % columns
      const itemsInRow = Math.min(
        columns,
        photography.length - row * columns
      )
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

const getInquiryCentroid = (work, inquiryAnchors) =>
  work.inquiries.reduce(
    (position, inquiry) => ({
      x: position.x + inquiryAnchors[inquiry.id].x / work.inquiries.length,
      y: position.y + inquiryAnchors[inquiry.id].y / work.inquiries.length,
    }),
    { x: 0, y: 0 }
  )

const createInquiryPositions = (
  works,
  photographyPositions,
  inquiryTerritories
) => {
  const random = createSeededRandom(41)
  const placed = []
  const positions = {}
  const inquiryAnchors = Object.fromEntries(
    inquiryTerritories.map(territory => [territory.id, territory.anchor])
  )

  works
    .filter(work => work.kind === "writing")
    .forEach(work => {
      const centroid = getInquiryCentroid(work, inquiryAnchors)
      let position = centroid

      for (let attempt = 0; attempt < 4000; attempt += 1) {
        const distance = 5 + random() * 29
        const angle = random() * Math.PI * 2
        const candidate = {
          x: centroid.x + Math.cos(angle) * distance,
          y: centroid.y + Math.sin(angle) * distance,
        }

        if (clearsPlacedWorks(work, candidate, placed)) {
          position = candidate
          break
        }
      }

      positions[work.id] = position
      addPlacedWork(placed, work, position)
    })

  works
    .filter(work => work.kind === "photography")
    .forEach(work => {
      positions[work.id] = photographyPositions[work.id]
    })

  return positions
}

// Row spacing shared by every format zone, derived from whichever format
// needs the most rows. Zones then stack their marks top-down at a uniform
// rhythm rather than each spreading its own items over the full height.
const getSharedRowGap = (works, columnsByFormat, availableHeight) => {
  const maximumRows = Math.max(
    ...FORMAT_ORDER.map(format =>
      Math.ceil(
        works.filter(work => work.format === format).length /
          columnsByFormat[format]
      )
    )
  )

  return maximumRows > 1 ? availableHeight / (maximumRows - 1) : 0
}

const createFormatLayout = (
  works,
  viewBoxWidth,
  viewBoxHeight,
  compact
) => {
  const positions = {}
  const zones = []

  if (compact) {
    const gap = 14
    const zoneWidth = (viewBoxWidth - EDGE_PADDING * 2 - gap) / 2
    const zoneHeight = (viewBoxHeight - EDGE_PADDING * 2 - gap) / 2
    const availableHeight = zoneHeight - viewBoxHeight * 0.169
    // One shared row spacing, set by the fullest zone, so a sparse format
    // stacks from the top instead of stretching to fill its zone.
    const rowGap = getSharedRowGap(
      works,
      COMPACT_FORMAT_COLUMNS,
      availableHeight
    )

    FORMAT_ORDER.forEach((format, index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      const left = EDGE_PADDING + column * (zoneWidth + gap)
      const top = EDGE_PADDING + row * (zoneHeight + gap)
      const items = works.filter(work => work.format === format)
      const columns = COMPACT_FORMAT_COLUMNS[format]
      const startY = top + viewBoxHeight * 0.146
      const cellWidth = zoneWidth / columns

      zones.push({
        format,
        count: items.length,
        x: left + zoneWidth / 2,
        headerY: top + viewBoxHeight * 0.035,
        countY: top + viewBoxHeight * 0.073,
        ruleY: top + viewBoxHeight * 0.096,
        ruleStart: left + 8,
        ruleEnd: left + zoneWidth - 8,
      })

      items.forEach((work, itemIndex) => {
        positions[work.id] = {
          x: left + cellWidth * (itemIndex % columns) + cellWidth / 2,
          y: startY + Math.floor(itemIndex / columns) * rowGap,
        }
      })
    })

    return { positions, zones }
  }

  const zoneGap = 12
  const availableWidth = viewBoxWidth - EDGE_PADDING * 2 - zoneGap * 3
  const startY = viewBoxHeight * 0.215
  // One shared row spacing, set by the fullest zone, so a sparse format
  // stacks from the top instead of stretching to fill the column.
  const rowGap = getSharedRowGap(
    works,
    FORMAT_COLUMNS,
    viewBoxHeight - startY - 28
  )
  let cursor = EDGE_PADDING

  FORMAT_ORDER.forEach(format => {
    const width = availableWidth * FORMAT_ZONE_WEIGHTS[format]
    const items = works.filter(work => work.format === format)
    const columns = FORMAT_COLUMNS[format]
    const cellWidth = width / columns

    zones.push({
      format,
      count: items.length,
      x: cursor + width / 2,
      headerY: viewBoxHeight * 0.092,
      countY: viewBoxHeight * 0.131,
      ruleY: viewBoxHeight * 0.154,
      ruleStart: cursor + 6,
      ruleEnd: cursor + width - 6,
    })

    items.forEach((work, itemIndex) => {
      positions[work.id] = {
        x: cursor + cellWidth * (itemIndex % columns) + cellWidth / 2,
        y: startY + Math.floor(itemIndex / columns) * rowGap,
      }
    })

    cursor += width + zoneGap
  })

  return { positions, zones }
}

const createNetworkLayout = (works, viewBoxWidth, viewBoxHeight, connections) => {
  const random = createSeededRandom(73)
  const workById = Object.fromEntries(works.map(work => [work.id, work]))
  const connectedIds = new Set(
    connections.flatMap(connection => [connection.from, connection.to])
  )
  const placed = []
  const positions = {}
  const clusterGuides = [
    [0.395, 0.298],
    [0.589, 0.279],
    [0.331, 0.519],
    [0.516, 0.49],
    [0.694, 0.529],
    [0.508, 0.721],
  ]

  connections.forEach((connection, index) => {
    const fromWork = workById[connection.from]
    const toWork = workById[connection.to]
    const guide = clusterGuides[index % clusterGuides.length]
    let pair = null

    for (let attempt = 0; attempt < 4000; attempt += 1) {
      const angle = random() * Math.PI * 2
      const distance = 54 + random() * 26
      const centre = {
        x: guide[0] * viewBoxWidth + (random() - 0.5) * 30,
        y: guide[1] * viewBoxHeight + (random() - 0.5) * 30,
      }
      const from = {
        x: centre.x - (Math.cos(angle) * distance) / 2,
        y: centre.y - (Math.sin(angle) * distance) / 2,
      }
      const to = {
        x: centre.x + (Math.cos(angle) * distance) / 2,
        y: centre.y + (Math.sin(angle) * distance) / 2,
      }

      if (
        clearsPlacedWorks(fromWork, from, placed) &&
        clearsPlacedWorks(toWork, to, [
          ...placed,
          { ...from, radius: getVisualRadius(fromWork) },
        ])
      ) {
        pair = { from, to }
        break
      }
    }

    const centre = {
      x: guide[0] * viewBoxWidth,
      y: guide[1] * viewBoxHeight,
    }
    const fallback = pair || {
      from: { x: centre.x - 24, y: centre.y },
      to: { x: centre.x + 24, y: centre.y },
    }

    positions[fromWork.id] = fallback.from
    positions[toWork.id] = fallback.to
    addPlacedWork(placed, fromWork, fallback.from)
    addPlacedWork(placed, toWork, fallback.to)
  })

  works
    .filter(work => !connectedIds.has(work.id))
    .forEach(work => {
      let position = null

      for (let attempt = 0; attempt < SCATTER_MAX_ATTEMPTS; attempt += 1) {
        const candidate = {
          x: EDGE_PADDING + random() * (viewBoxWidth - EDGE_PADDING * 2),
          y: EDGE_PADDING + random() * (viewBoxHeight - EDGE_PADDING * 2),
        }
        const normalizedDistance =
          ((candidate.x - viewBoxWidth / 2) / (viewBoxWidth * 0.46)) ** 2 +
          ((candidate.y - viewBoxHeight / 2) / (viewBoxHeight * 0.43)) ** 2

        if (
          normalizedDistance >= 0.48 &&
          clearsPlacedWorks(work, candidate, placed)
        ) {
          position = candidate
          break
        }
      }

      if (!position) {
        throw new Error(`Unable to place ${work.id} in visual network`)
      }

      positions[work.id] = position
      addPlacedWork(placed, work, position)
    })

  return { connectedIds, positions }
}

const getExactTimelineValue = work => {
  if (!work.date) {
    return work.year
  }

  const date = new Date(work.date)
  const year = date.getUTCFullYear()
  const yearStart = Date.UTC(year, 0, 1)
  const yearEnd = Date.UTC(year + 1, 0, 1)

  return year + (date.getTime() - yearStart) / (yearEnd - yearStart)
}

const createTimelineValues = works => {
  const datedWorks = works.filter(work => Number.isFinite(work.year))
  const groupedByYear = datedWorks.reduce((groups, work) => {
    groups[work.year] = [...(groups[work.year] || []), work]
    return groups
  }, {})
  const values = {}

  Object.values(groupedByYear).forEach(group => {
    const yearOnlyWorks = group
      .filter(work => !work.date)
      .sort((left, right) => left.id.localeCompare(right.id))

    yearOnlyWorks.forEach((work, index) => {
      values[work.id] =
        work.year + ((index + 1) / (yearOnlyWorks.length + 1) - 0.5) * 0.72
    })

    group
      .filter(work => work.date)
      .forEach(work => {
        values[work.id] = getExactTimelineValue(work)
      })
  })

  return values
}

const createLinearTimelineLayout = (
  works,
  viewBoxWidth,
  viewBoxHeight,
  compact,
  timelineValues
) => {
  const datedWorks = works.filter(work => Number.isFinite(work.year))
  const undatedWorks = works.filter(work => !Number.isFinite(work.year))
  const years = datedWorks.map(work => work.year)
  const minimumYear = Math.min(...years)
  const maximumYear = Math.max(...years)
  const timelineLeft = viewBoxWidth * 0.08
  const timelineRight = viewBoxWidth * 0.94
  const timelineY = viewBoxHeight * 0.5
  const datedRight = undatedWorks.length ? viewBoxWidth * 0.86 : timelineRight
  const timelineMaximum = maximumYear + 1
  const getTimelineX = value =>
    minimumYear === maximumYear
      ? (timelineLeft + datedRight) / 2
      : timelineLeft +
        ((value - minimumYear) / (timelineMaximum - minimumYear)) *
          (datedRight - timelineLeft)
  const positions = {}
  const levelEnds = { writing: [], photography: [] }

  datedWorks
    .map(work => ({ work, x: getTimelineX(timelineValues[work.id]) }))
    .sort(
      (left, right) =>
        left.x - right.x || left.work.id.localeCompare(right.work.id)
    )
    .forEach(({ work, x }) => {
      const levels = levelEnds[work.kind]
      let level = levels.findIndex(lastX => x - lastX >= 22)

      if (level === -1) {
        level = levels.length
      }

      levels[level] = x
      positions[work.id] = {
        x,
        y:
          work.kind === "writing"
            ? timelineY - 44 - level * 22
            : timelineY + 48 + level * 22,
      }
    })

  const undatedByKind = {
    writing: undatedWorks.filter(work => work.kind === "writing"),
    photography: undatedWorks.filter(work => work.kind === "photography"),
  }

  Object.entries(undatedByKind).forEach(([kind, group]) => {
    group.forEach((work, index) => {
      const column = index % 3
      const row = Math.floor(index / 3)
      positions[work.id] = {
        x: viewBoxWidth * 0.88 + column * 28,
        y:
          kind === "writing"
            ? timelineY - 44 - row * 28
            : timelineY + 48 + row * 28,
      }
    })
  })

  return {
    positions,
    timeline: {
      axisLeft: timelineLeft,
      axisRight: timelineRight,
      axisY: timelineY,
      viewBoxWidth,
      viewBoxHeight,
      circleCenterX: viewBoxWidth * 0.52,
      circleCenterY: viewBoxHeight * 0.5,
      circleRadius: Math.min(viewBoxWidth, viewBoxHeight) * 0.31,
      labelEvery: compact ? 2 : 1,
      pathSamples: TIMELINE_PATH_SAMPLES,
      undated: undatedWorks.length > 0,
      undatedX: viewBoxWidth * 0.9,
      branchOffset: Math.min(190, viewBoxHeight * 0.365),
      years: Array.from(
        { length: maximumYear - minimumYear + 1 },
        (_, index) => {
          const year = minimumYear + index
          return { year, x: getTimelineX(year) }
        }
      ),
    },
  }
}

const createCircularTimelineLayout = (
  works,
  viewBoxWidth,
  viewBoxHeight,
  timelineValues,
  timelineData
) => {
  const datedWorks = works
    .filter(work => Number.isFinite(work.year))
    .sort(
      (left, right) =>
        timelineValues[left.id] - timelineValues[right.id] ||
        left.id.localeCompare(right.id)
    )
  const undatedWorks = works
    .filter(work => !Number.isFinite(work.year))
    .sort((left, right) => left.id.localeCompare(right.id))
  const minimumValue = Math.min(
    ...datedWorks.map(work => timelineValues[work.id])
  )
  const maximumValue = Math.max(
    ...datedWorks.map(work => timelineValues[work.id])
  )
  const valueSpan = Math.max(0.0001, maximumValue - minimumValue)
  const positions = {}
  const angles = {}
  const laneIndices = { writing: 0, photography: 0 }
  const laneLastAngles = {
    writing: Array(3).fill(-Infinity),
    photography: Array(5).fill(-Infinity),
  }

  datedWorks.forEach(work => {
    const normalizedTime =
      (timelineValues[work.id] - minimumValue) / valueSpan
    angles[work.id] = -Math.PI / 2 + normalizedTime * DATED_ARC
  })

  undatedWorks.forEach((work, index) => {
    angles[work.id] =
      UNDATED_ARC_START +
      ((index + 1) / (undatedWorks.length + 1)) * UNDATED_ARC_LENGTH
  })

  ;[...datedWorks, ...undatedWorks].forEach(work => {
    const baseAngle = angles[work.id]
    const inward = work.kind === "photography"
    const baseRadius = inward
      ? timelineData.circleRadius - PHOTOGRAPHY_RING_OFFSET
      : timelineData.circleRadius + WRITING_RING_OFFSET
    const maximumBands = inward ? 5 : 3
    const band = laneIndices[work.kind] % maximumBands
    const radius = inward
      ? baseRadius - band * CIRCULAR_BAND_GAP
      : baseRadius + band * CIRCULAR_BAND_GAP
    const minimumChord = getVisualRadius(work) * 2 + 5
    const minimumAngle = 2 * Math.asin(Math.min(1, minimumChord / (2 * radius)))
    const angle = Math.max(
      baseAngle,
      laneLastAngles[work.kind][band] + minimumAngle
    )

    positions[work.id] = {
      x: timelineData.circleCenterX + Math.cos(angle) * radius,
      y: timelineData.circleCenterY + Math.sin(angle) * radius,
    }
    laneLastAngles[work.kind][band] = angle
    laneIndices[work.kind] += 1
  })

  return positions
}

export const interpolateTimelinePositions = (
  linearPositions,
  circularPositions,
  progress
) =>
  Object.fromEntries(
    Object.keys(linearPositions).map(workId => {
      const linear = linearPositions[workId]
      const circular = circularPositions[workId]

      return [
        workId,
        {
          x: linear.x + (circular.x - linear.x) * progress,
          y: linear.y + (circular.y - linear.y) * progress,
        },
      ]
    })
  )

export const createVisualLayouts = (
  works,
  viewBoxWidth,
  viewBoxHeight,
  {
    compact = false,
    photographyColumns = 13,
    connections = [],
  } = {}
) => {
  const inquiryTerritories = createInquiryTerritories(
    viewBoxWidth,
    viewBoxHeight
  )
  const scatter = createScatterPositions(works, viewBoxWidth, viewBoxHeight)
  const photographyBand = createPhotographyBand(
    works,
    viewBoxWidth,
    viewBoxHeight,
    photographyColumns
  )
  const inquiries = createInquiryPositions(
    works,
    photographyBand,
    inquiryTerritories
  )
  const formats = createFormatLayout(
    works,
    viewBoxWidth,
    viewBoxHeight,
    compact
  )
  const network = createNetworkLayout(
    works,
    viewBoxWidth,
    viewBoxHeight,
    connections
  )
  const timelineValues = createTimelineValues(works)
  const timelineLinear = createLinearTimelineLayout(
    works,
    viewBoxWidth,
    viewBoxHeight,
    compact,
    timelineValues
  )
  const timelineCircular = createCircularTimelineLayout(
    works,
    viewBoxWidth,
    viewBoxHeight,
    timelineValues,
    timelineLinear.timeline
  )

  return {
    connectedWorkIds: network.connectedIds,
    formatZones: formats.zones,
    formats: formats.positions,
    inquiries,
    inquiryTerritories,
    network: network.positions,
    scatter,
    timelineCircular,
    timelineData: timelineLinear.timeline,
    timelineLinear: timelineLinear.positions,
  }
}

export {
  CIRCULAR_BAND_GAP,
  PHOTOGRAPHY_RING_OFFSET,
  TIMELINE_PATH_SAMPLES,
  WRITING_RING_OFFSET,
}
