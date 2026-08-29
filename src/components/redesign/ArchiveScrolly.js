import * as React from "react"

import * as styles from "../../pages/redesign-lab.module.css"
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

const SCROLLY_VIEWBOX_WIDTH = 720
const SCROLLY_VIEWBOX_HEIGHT = 620
const LAYOUT_TRANSITION_MS = 900
const FADE_TRANSITION_MS = 450
const CONNECTION_DELAY_MS = 500
const CONNECTION_FADE_MS = 500

const SCROLL_STEPS = [
  {
    number: "01",
    title: "Everything, unsorted",
    body: "Made in motion, across cities and years. Nothing planned. The pattern is hindsight.",
  },
  {
    number: "02",
    title: "Ways of being in it",
    body: "Arguing about it, living through it, seeing what's behind it, or merely documenting it.",
  },
  {
    number: "03",
    title: "What I keep asking",
    body: "Everything starts and ends with perception.",
  },
  {
    number: "04",
    title: "Not everything connects",
    body: "But I wish everything ultimately would.",
  },
  {
    number: "05",
    title: "I keep looping back",
    body: "And what if time is just a flat circle?",
  },
]

const ArchiveScrolly = ({ works = sampleWorks }) => {
  const [activeScrollStep, setActiveScrollStep] = React.useState(0)
  const [connectionsReady, setConnectionsReady] = React.useState(false)
  const [hoveredWorkId, setHoveredWorkId] = React.useState(null)
  const [focusedWorkId, setFocusedWorkId] = React.useState(null)
  const [selectedWorkId, setSelectedWorkId] = React.useState(null)
  const stepElements = React.useRef([])
  const prefersReducedMotion = usePrefersReducedMotion()
  const viewportWidth = useViewportWidth()
  const compact = viewportWidth < 980
  const photographyColumns = getPhotographyColumns(viewportWidth)
  const scrollLayouts = React.useMemo(
    () =>
      createVisualLayouts(
        works,
        SCROLLY_VIEWBOX_WIDTH,
        SCROLLY_VIEWBOX_HEIGHT,
        { compact, photographyColumns }
      ),
    [compact, photographyColumns, works]
  )

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return
          }

          setActiveScrollStep(Number(entry.target.dataset.step))
        })
      },
      {
        rootMargin: "-45% 0px -45% 0px",
      }
    )

    stepElements.current.forEach(element => {
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [])

  const scene = VISUAL_SCENES[activeScrollStep]
  const { timelineBendProgress, timelinePhase } = useTimelineBend({
    active: scene.layout === "timeline",
    prefersReducedMotion,
  })
  const positions = React.useMemo(
    () =>
      scene.layout === "timeline"
        ? interpolateTimelinePositions(
            scrollLayouts.timelineLinear,
            scrollLayouts.timelineCircular,
            timelineBendProgress
          )
        : scrollLayouts[scene.layout],
    [scene.layout, scrollLayouts, timelineBendProgress]
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
    }, CONNECTION_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion, scene.connectionsVisible])

  React.useEffect(() => {
    if (scene.layout !== "network") {
      setHoveredWorkId(null)
      setFocusedWorkId(null)
      setSelectedWorkId(null)
    }
  }, [scene.layout])

  const activeWorkId = hoveredWorkId || focusedWorkId || selectedWorkId

  return (
    <section className={styles.scrollySection} aria-label="Archive structure">
      <div className={styles.scrolly}>
        <div className={styles.steps}>
          {SCROLL_STEPS.map((step, index) => (
            <div
              className={styles.step}
              data-active={activeScrollStep === index ? "true" : "false"}
              data-step={index}
              key={step.number}
              ref={element => {
                stepElements.current[index] = element
              }}
            >
              <div className={styles.stepContent}>
                <span className={styles.stepKicker}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.stickyVisualization}>
          <AtlasField
            activeWorkId={activeWorkId}
            className={`${styles.archiveField} ${styles.scrollyArchiveField}`}
            connectedWorkIds={scrollLayouts.connectedWorkIds}
            connectionPositions={scrollLayouts.network}
            connectionsVisible={connectionsReady}
            description="The archive changes across five scroll scenes: unsorted works, four formats, recurring inquiries, a relationship network, and a chronology that bends into a circle."
            formatIndexVisible={scene.formatIndexVisible}
            formatLabels={scrollLayouts.formatLabels}
            formatZones={scrollLayouts.formatZones}
            idPrefix="scroll-archive-field"
            inquiryTerritories={scrollLayouts.inquiryTerritories}
            inquiryLabelsVisible={scene.inquiryLabelsVisible}
            layout={scene.layout}
            positions={positions}
            territoriesVisible={scene.territoriesVisible}
            timelineData={scrollLayouts.timelineData}
            timelineBendProgress={timelineBendProgress}
            timelinePhase={timelinePhase}
            timelineVisible={scene.timelineVisible}
            title="Five structures for the archive"
            transitionsEnabled={prefersReducedMotion === false}
            workTitlesVisible={scene.workTitlesVisible}
            works={works}
            onWorkBlur={workId => {
              setFocusedWorkId(current => (current === workId ? null : current))
            }}
            onWorkFocus={setFocusedWorkId}
            onWorkHover={setHoveredWorkId}
            onWorkLeave={workId => {
              setHoveredWorkId(current => (current === workId ? null : current))
            }}
            onWorkSelect={workId => {
              setSelectedWorkId(current => (current === workId ? null : workId))
            }}
          />
        </div>
      </div>
    </section>
  )
}

export {
  CONNECTION_DELAY_MS,
  CONNECTION_FADE_MS,
  FADE_TRANSITION_MS,
  LAYOUT_TRANSITION_MS,
  SCROLL_STEPS,
}
export default ArchiveScrolly
