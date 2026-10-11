"use client"

import * as React from "react"

import AtlasField from "./AtlasField"
import { getPhotographyColumns } from "./archiveFieldData"
import {
  createVisualLayouts,
  interpolateTimelinePositions,
} from "./scrollFieldLayouts"
import {
  useFieldScale,
  usePrefersReducedMotion,
  useViewportWidth,
} from "./useFieldEnvironment"
import useTimelineBend, { TIMELINE_PHASES } from "./useTimelineBend"
import { VISUAL_SCENES } from "./visualScenes"

const VIEWBOX_WIDTH = 720
const VIEWBOX_HEIGHT = 600
const STATE_INTERVAL_MS = 4200
const CONNECTION_DELAY_MS = 500

// The homepage has one field. Beside the hero it cycles through the five
// scenes on a timer; once the steps begin it shows the scene of the current
// step. The two used to be separate fields, one above the other, so the
// picture disappeared and reappeared between the hero and the steps.
const HomeField = ({
  className,
  connections = [],
  cycling = false,
  replayClassName,
  scene = 0,
  selectedWorkId = null,
  works = [],
  onWorkSelect,
}) => {
  const [cycleScene, setCycleScene] = React.useState(0)
  const [connectionsReady, setConnectionsReady] = React.useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const viewportWidth = useViewportWidth()
  // Measured for the format headings, counts, inquiry and timeline labels,
  // which are counter-scaled against it in CSS.
  const [fieldRef, fieldScale] = useFieldScale(VIEWBOX_WIDTH, VIEWBOX_HEIGHT)
  const layouts = React.useMemo(
    () =>
      createVisualLayouts(works, VIEWBOX_WIDTH, VIEWBOX_HEIGHT, {
        compact: viewportWidth < 980,
        photographyColumns: getPhotographyColumns(viewportWidth),
        connections,
      }),
    [connections, viewportWidth, works],
  )

  // Reduced motion holds the hero on the last scene rather than cycling.
  React.useEffect(() => {
    if (prefersReducedMotion === null) {
      return
    }

    setCycleScene(prefersReducedMotion ? VISUAL_SCENES.length - 1 : 0)
  }, [prefersReducedMotion])

  React.useEffect(() => {
    if (!cycling || prefersReducedMotion !== false) {
      return undefined
    }

    // The timeline scene shows two states — the straight line, then the bend
    // into a circle — so it holds for two intervals and every state on screen
    // gets the same amount of time.
    const duration =
      VISUAL_SCENES[cycleScene].layout === "timeline"
        ? STATE_INTERVAL_MS * 2
        : STATE_INTERVAL_MS
    const timer = window.setTimeout(() => {
      setCycleScene(current => (current + 1) % VISUAL_SCENES.length)
    }, duration)

    return () => window.clearTimeout(timer)
  }, [cycleScene, cycling, prefersReducedMotion])

  const current = VISUAL_SCENES[cycling ? cycleScene : Math.max(0, scene)]
  const { replayTimeline, timelineBendProgress, timelinePhase } =
    useTimelineBend({
      active: current.layout === "timeline",
      prefersReducedMotion,
      // While cycling, bend exactly one interval in, so the straight line and
      // the circle each get a full slot.
      bendDelayMs: cycling ? STATE_INTERVAL_MS : undefined,
    })
  // Reduced motion skips the bend altogether, so there is nothing to replay.
  const canReplay =
    !cycling &&
    prefersReducedMotion === false &&
    current.layout === "timeline" &&
    timelinePhase === TIMELINE_PHASES.circular &&
    timelineBendProgress === 1
  const positions = React.useMemo(
    () =>
      current.layout === "timeline"
        ? interpolateTimelinePositions(
            layouts.timelineLinear,
            layouts.timelineCircular,
            timelineBendProgress,
          )
        : layouts[current.layout],
    [current.layout, layouts, timelineBendProgress],
  )

  React.useEffect(() => {
    setConnectionsReady(false)

    if (!current.connectionsVisible) {
      return undefined
    }

    if (prefersReducedMotion) {
      setConnectionsReady(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setConnectionsReady(true)
    }, CONNECTION_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [current.connectionsVisible, prefersReducedMotion])

  return (
    <>
      <AtlasField
        activeWorkId={selectedWorkId}
        className={className}
        connectedWorkIds={layouts.connectedWorkIds}
        connectionPositions={layouts.network}
        connections={connections}
        connectionsVisible={connectionsReady}
        description="The archive in five views: unsorted works, four formats, recurring inquiries, a relationship network, and a chronology that bends into a circle."
        fieldRef={fieldRef}
        fieldScale={fieldScale}
        formatIndexVisible={current.formatIndexVisible}
        formatZones={layouts.formatZones}
        idPrefix="archive-field"
        inquiryTerritories={layouts.inquiryTerritories}
        inquiryLabelsVisible={current.inquiryLabelsVisible}
        layout={current.layout}
        positions={positions}
        territoriesVisible={current.territoriesVisible}
        timelineData={layouts.timelineData}
        timelineBendProgress={timelineBendProgress}
        timelinePhase={timelinePhase}
        timelineVisible={current.timelineVisible}
        title="A field of published works"
        transitionsEnabled={prefersReducedMotion === false}
        works={works}
        onWorkSelect={onWorkSelect}
      />

      <button
        className={replayClassName}
        data-visible={canReplay ? "true" : "false"}
        type="button"
        tabIndex={canReplay ? 0 : -1}
        aria-hidden={canReplay ? undefined : "true"}
        onClick={replayTimeline}
      >
        ↺ Back to time
      </button>
    </>
  )
}

export default HomeField
