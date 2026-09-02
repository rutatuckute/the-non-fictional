import * as React from "react"

import { WORK_MARK_SCALE, markStyles } from "./archiveFieldData"
import { photoUrl, preferredFormat } from "../photography/photoData"
import {
  TIMELINE_BEND_MS,
  TIMELINE_PHASES,
  TIMELINE_YEAR_FADE_MS,
} from "./useTimelineBend"

const UNRELATED_NODE_OPACITY = 0.18
const UNCONNECTED_NODE_OPACITY = 0.35
const FORMAT_LABELS = {
  essay: "ESSAYS",
  reflection: "REFLECTIONS",
  data: "DATA",
  photography: "PHOTOGRAPHY",
}

const writingRules = [
  { y: -0.62, width: 2.4 },
  { y: 0, width: 1.7 },
  { y: 0.62, width: 2.1 },
]

const WritingMark = ({ format, style }) => (
  <>
    {writingRules.slice(0, style.ruleCount).map((rule, index) => (
      <line
        key={`${format}-${index}`}
        data-element="mark-stroke"
        data-kind="writing"
        x1={(-style.size * rule.width * WORK_MARK_SCALE) / 2}
        y1={style.size * rule.y * WORK_MARK_SCALE}
        x2={(style.size * rule.width * WORK_MARK_SCALE) / 2}
        y2={style.size * rule.y * WORK_MARK_SCALE}
        strokeWidth={style.strokeWidth * WORK_MARK_SCALE}
        opacity={style.opacity}
      />
    ))}
    {format === "data" ? (
      <circle
        data-element="data-dot"
        data-kind="writing"
        cx="0"
        cy={-style.size * 0.62 * WORK_MARK_SCALE}
        r={style.dotRadius * WORK_MARK_SCALE}
        opacity={style.opacity}
      />
    ) : null}
  </>
)

const PhotographyMark = ({ style, photo }) => {
  const extent = style.extent * WORK_MARK_SCALE
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => setFailed(false), [photo])

  // These marks are a few dozen pixels across at most. An <image> in SVG has no
  // <picture> to negotiate through, so the format is named outright: left to
  // negotiate, the CDN answers with JPEG, which is bigger than the WebP that
  // wins at this size. Naming it also means nothing falls back on its own, so
  // a failed transform drops to the file in the repo the same way PhotoImage
  // does — without which these marks are the one thing on the page that stays
  // blank under `gatsby develop`.
  const markPhoto = failed
    ? photo
    : photoUrl(photo, 200, "lightest", preferredFormat(200))
  const armLength = style.armLength * WORK_MARK_SCALE
  const corners = [
    [-extent, -extent, 1, 1],
    [extent, -extent, -1, 1],
    [-extent, extent, 1, -1],
    [extent, extent, -1, -1],
  ]

  return (
    <>
      {photo ? (
        <image
          data-element="mark-photo"
          href={markPhoto}
          xlinkHref={markPhoto}
          onError={() => setFailed(true)}
          x={-extent}
          y={-extent}
          width={extent * 2}
          height={extent * 2}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}
      {corners.map(([x, y, directionX, directionY], index) => (
        <path
          key={`photography-${index}`}
          data-element="mark-stroke"
          data-kind="photography"
          d={`M ${x + directionX * armLength} ${y} L ${x} ${y} L ${x} ${
            y + directionY * armLength
          }`}
          strokeWidth={style.strokeWidth * WORK_MARK_SCALE}
          opacity={style.opacity}
        />
      ))}
    </>
  )
}

const WorkMark = ({ work }) => {
  const markStyle = markStyles[work.format]

  return work.kind === "writing" ? (
    <WritingMark format={work.format} style={markStyle} />
  ) : (
    <PhotographyMark style={markStyle} photo={work.photo} />
  )
}

const createTimelinePath = (timelineData, bendProgress) => {
  const points = Array.from(
    { length: timelineData.pathSamples + 1 },
    (_, index) => {
      const t = index / timelineData.pathSamples
      const linearX =
        timelineData.axisLeft +
        t * (timelineData.axisRight - timelineData.axisLeft)
      const linearY = timelineData.axisY
      const angle = -Math.PI / 2 + t * Math.PI * 2
      const circularX =
        timelineData.circleCenterX +
        Math.cos(angle) * timelineData.circleRadius
      const circularY =
        timelineData.circleCenterY +
        Math.sin(angle) * timelineData.circleRadius

      return {
        x: linearX + (circularX - linearX) * bendProgress,
        y: linearY + (circularY - linearY) * bendProgress,
      }
    }
  )

  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ")
}

const AtlasField = ({
  activeWorkId = null,
  className,
  connectedWorkIds = new Set(),
  connectionPositions,
  connections = [],
  connectionsVisible,
  description,
  fieldRef,
  fieldScale = 1,
  formatIndexVisible = false,
  formatLabels = {},
  formatZones = [],
  idPrefix,
  inquiryTerritories = [],
  inquiryLabelsVisible,
  layout,
  onWorkSelect,
  positions,
  territoriesVisible,
  timelineData = null,
  timelineBendProgress = 0,
  timelinePhase = TIMELINE_PHASES.linear,
  timelineVisible = false,
  title,
  transitionsEnabled,
  workTitlesVisible = formatIndexVisible,
  works = [],
}) => {
  const networkMode = layout === "network"
  const interactive = Boolean(onWorkSelect)
  const timelineAnnotationOpacity = Math.max(
    0,
    1 -
      timelineBendProgress /
        (TIMELINE_YEAR_FADE_MS / TIMELINE_BEND_MS)
  )
  const relatedWorkIds = React.useMemo(() => {
    if (!activeWorkId) {
      return null
    }

    const related = new Set([activeWorkId])
    connections.forEach(connection => {
      if (connection.from === activeWorkId) {
        related.add(connection.to)
      }
      if (connection.to === activeWorkId) {
        related.add(connection.from)
      }
    })
    return related
  }, [activeWorkId, connections])

  const getWorkOpacity = work => {
    if (!networkMode) {
      return 1
    }
    if (relatedWorkIds) {
      return relatedWorkIds.has(work.id) ? 1 : UNRELATED_NODE_OPACITY
    }
    return connectedWorkIds.has(work.id) ? 1 : UNCONNECTED_NODE_OPACITY
  }

  // The scale goes onto the element the labels live in, so the stylesheet can
  // divide it back out and hold them at one rendered size; see useFieldScale.
  return (
    <svg
      ref={fieldRef}
      className={className}
      viewBox={`0 0 ${timelineData?.viewBoxWidth || 620} ${
        timelineData?.viewBoxHeight || 520
      }`}
      preserveAspectRatio="xMidYMid meet"
      style={{ "--field-scale": fieldScale }}
      role="img"
      aria-labelledby={`${idPrefix}-title ${idPrefix}-description`}
    >
      <title id={`${idPrefix}-title`}>{title}</title>
      <desc id={`${idPrefix}-description`}>{description}</desc>

      <g
        aria-hidden="true"
        data-layer="inquiry-territories"
        data-visible={territoriesVisible ? "true" : "false"}
      >
        {inquiryTerritories.map(territory => (
          <circle
            key={territory.id}
            data-element="inquiry-territory"
            data-inquiry={territory.id}
            cx={territory.anchor.x}
            cy={territory.anchor.y}
            r={territory.radius}
          />
        ))}
      </g>

      <g
        aria-hidden="true"
        data-layer="timeline"
        data-visible={timelineVisible ? "true" : "false"}
      >
        {timelineData ? (
          <>
            <path
              data-element="timeline-axis"
              data-phase={timelinePhase}
              d={createTimelinePath(timelineData, timelineBendProgress)}
            />
            <g
              data-layer="timeline-annotations"
              style={{ opacity: timelineAnnotationOpacity }}
            >
              {timelineData.years.map((year, index) => (
                <g key={year.year} data-element="timeline-year">
                  <line
                    data-element="timeline-tick"
                    x1={year.x}
                    y1={timelineData.axisY - 6}
                    x2={year.x}
                    y2={timelineData.axisY + 6}
                  />
                  <text
                    data-element="timeline-year-label"
                    data-visible={
                      index % timelineData.labelEvery === 0 ? "true" : "false"
                    }
                    x={year.x}
                    y={timelineData.axisY + 23}
                    textAnchor="middle"
                  >
                    {year.year}
                  </text>
                </g>
              ))}
              <text
                data-element="timeline-branch-label"
                x={timelineData.axisLeft}
                y={timelineData.axisY - timelineData.branchOffset}
              >
                ASKING ↑
              </text>
              <text
                data-element="timeline-branch-label"
                x={timelineData.axisLeft}
                y={timelineData.axisY + timelineData.branchOffset}
              >
                DOCUMENTING ↓
              </text>
              {timelineData.undated ? (
                <text
                  data-element="timeline-undated-label"
                  x={timelineData.undatedX}
                  y={timelineData.axisY - 12}
                  textAnchor="middle"
                >
                  UNDATED
                </text>
              ) : null}
            </g>
          </>
        ) : null}
      </g>

      <g
        aria-hidden="true"
        data-layer="connections"
        data-visible={connectionsVisible ? "true" : "false"}
      >
        {connections.map(connection => {
          const from = connectionPositions[connection.from]
          const to = connectionPositions[connection.to]
          const emphasized =
            activeWorkId === connection.from || activeWorkId === connection.to
          const dimmed = Boolean(activeWorkId) && !emphasized

          return (
            <line
              key={connection.id}
              data-element="connection"
              data-meeting={connection.id}
              data-dimmed={dimmed ? "true" : "false"}
              data-emphasized={emphasized ? "true" : "false"}
              data-selected={connection.selected ? "true" : "false"}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          )
        })}
      </g>

      <g
        aria-hidden="true"
        data-layer="format-rules"
        data-visible={formatIndexVisible ? "true" : "false"}
      >
        {formatZones.map(zone => (
          <line
            key={zone.format}
            data-element="format-rule"
            x1={zone.ruleStart}
            y1={zone.ruleY}
            x2={zone.ruleEnd}
            y2={zone.ruleY}
          />
        ))}
      </g>

      <g
        data-layer="sample-works"
        data-motion={transitionsEnabled ? "true" : "false"}
        data-layout={layout}
        data-timeline-phase={timelinePhase}
      >
        {works.map(work => {
          const { x, y } = positions[work.id]

          return (
            <g
              key={work.id}
              aria-label={work.title || work.id}
              data-element="work"
              data-work-id={work.id}
              data-kind={work.kind}
              data-format={work.format}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : -1}
              transform={`translate(${x} ${y})`}
              style={{ opacity: getWorkOpacity(work) }}
              onClick={() => onWorkSelect?.(work.id)}
              onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onWorkSelect?.(work.id)
                }
              }}
            >
              <WorkMark work={work} />
            </g>
          )
        })}
      </g>

      <g aria-hidden="true" data-layer="selection-rings">
        {works.map(work => {
          const { x, y } = positions[work.id]
          return (
            <circle
              key={work.id}
              data-element="selection-ring"
              data-visible={activeWorkId === work.id ? "true" : "false"}
              cx={x}
              cy={y}
              r="12"
            />
          )
        })}
      </g>

      <g
        aria-hidden="true"
        data-layer="inquiry-labels"
        data-visible={inquiryLabelsVisible ? "true" : "false"}
      >
        {inquiryTerritories.map(territory => (
          <text
            key={territory.id}
            data-element="inquiry-label"
            data-inquiry={territory.id}
            x={territory.anchor.x}
            y={territory.anchor.y - territory.radius - 8}
            textAnchor="middle"
          >
            {territory.label}
          </text>
        ))}
      </g>

      <g
        aria-hidden="true"
        data-layer="format-index"
        data-visible={formatIndexVisible ? "true" : "false"}
      >
        {formatZones.map(zone => (
          <g key={zone.format} data-format={zone.format}>
            <text
              data-element="format-heading"
              x={zone.x}
              y={zone.headerY}
              textAnchor="middle"
            >
              {FORMAT_LABELS[zone.format]}
            </text>
            <text
              data-element="format-count"
              x={zone.x}
              y={zone.countY}
              textAnchor="middle"
            >
              {zone.count}
            </text>
          </g>
        ))}
      </g>

      <g
        aria-hidden="true"
        data-layer="work-titles"
        data-visible={workTitlesVisible ? "true" : "false"}
      >
        {works.map(work => {
          const label = formatLabels[work.id]

          // A cell too narrow to hold a readable title gets no label at all —
          // the mark and the format heading carry it, and the full title is a
          // click away in the rail. See MINIMUM_TITLE_CHARACTERS.
          if (!label) {
            return null
          }

          const { x, y } = positions[work.id]

          return (
            <text
              key={work.id}
              data-element="work-title"
              x={x}
              y={y - 11}
              textAnchor="middle"
            >
              <title>{work.title || work.id}</title>
              {label}
            </text>
          )
        })}
      </g>
    </svg>
  )
}

export default AtlasField
