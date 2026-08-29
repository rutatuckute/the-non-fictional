import * as React from "react"

import AtlasField from "./AtlasField"
import { getPhotographyColumns, sampleWorks } from "./archiveFieldData"
import {
  createVisualLayouts,
  interpolateTimelinePositions,
} from "./scrollFieldLayouts"
import {
  usePrefersReducedMotion,
  useViewportWidth,
} from "./useFieldEnvironment"
import useTimelineBend from "./useTimelineBend"
import { VISUAL_SCENES } from "./visualScenes"

const HERO_VIEWBOX_WIDTH = 620
const HERO_VIEWBOX_HEIGHT = 520
const HERO_STATE_INTERVAL_MS = 4200
const HERO_LAYOUT_TRANSITION_MS = 900
const HERO_FADE_MS = 450
const HERO_CONNECTION_DELAY_MS = 500
const HERO_CONNECTION_FADE_MS = 500

const ArchiveField = ({ className, works = sampleWorks }) => {
  const [heroScene, setHeroScene] = React.useState(0)
  const [connectionsReady, setConnectionsReady] = React.useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const viewportWidth = useViewportWidth()
  const compact = viewportWidth < 980
  const photographyColumns = getPhotographyColumns(viewportWidth)
  const heroLayouts = React.useMemo(
    () =>
      createVisualLayouts(works, HERO_VIEWBOX_WIDTH, HERO_VIEWBOX_HEIGHT, {
        compact,
        photographyColumns,
      }),
    [compact, photographyColumns, works]
  )

  React.useEffect(() => {
    if (prefersReducedMotion === null) {
      return undefined
    }

    if (prefersReducedMotion) {
      setHeroScene(VISUAL_SCENES.length - 1)
      return undefined
    }

    setHeroScene(0)
    const timer = window.setInterval(() => {
      setHeroScene(currentScene => (currentScene + 1) % VISUAL_SCENES.length)
    }, HERO_STATE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [prefersReducedMotion])

  const scene = VISUAL_SCENES[heroScene]
  const { timelineBendProgress, timelinePhase } = useTimelineBend({
    active: scene.layout === "timeline",
    prefersReducedMotion,
  })
  const positions = React.useMemo(
    () =>
      scene.layout === "timeline"
        ? interpolateTimelinePositions(
            heroLayouts.timelineLinear,
            heroLayouts.timelineCircular,
            timelineBendProgress
          )
        : heroLayouts[scene.layout],
    [heroLayouts, scene.layout, timelineBendProgress]
  )

  React.useEffect(() => {
    setConnectionsReady(false)

    if (!scene.connectionsVisible) {
      return undefined
    }

    if (prefersReducedMotion) {
      setConnectionsReady(true)
      return undefined
    }

    const timer = window.setTimeout(() => {
      setConnectionsReady(true)
    }, HERO_CONNECTION_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion, scene.connectionsVisible])

  return (
    <AtlasField
      className={className}
      connectedWorkIds={heroLayouts.connectedWorkIds}
      connectionPositions={heroLayouts.network}
      connectionsVisible={connectionsReady}
      description="The archive cycles through five views: unsorted works, four formats, recurring inquiries, a relationship network, and a chronology that bends into a circle."
      formatIndexVisible={scene.formatIndexVisible}
      formatLabels={heroLayouts.formatLabels}
      formatZones={heroLayouts.formatZones}
      idPrefix="hero-archive-field"
      inquiryTerritories={heroLayouts.inquiryTerritories}
      inquiryLabelsVisible={scene.inquiryLabelsVisible}
      layout={scene.layout}
      positions={positions}
      territoriesVisible={scene.territoriesVisible}
      timelineData={heroLayouts.timelineData}
      timelineBendProgress={timelineBendProgress}
      timelinePhase={timelinePhase}
      timelineVisible={scene.timelineVisible}
      title="A field of published works"
      transitionsEnabled={prefersReducedMotion === false}
      workTitlesVisible={scene.workTitlesVisible}
      works={works}
    />
  )
}

export {
  HERO_CONNECTION_DELAY_MS,
  HERO_CONNECTION_FADE_MS,
  HERO_FADE_MS,
  HERO_LAYOUT_TRANSITION_MS,
  HERO_STATE_INTERVAL_MS,
}
export default ArchiveField
