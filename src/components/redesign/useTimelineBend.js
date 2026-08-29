import * as React from "react"

const TIMELINE_PHASES = {
  linear: "linear",
  circular: "circular",
}

const TIMELINE_LINEAR_TRANSITION_MS = 900
const TIMELINE_LINEAR_HOLD_MS = 250
const TIMELINE_BEND_MS = 1100
const TIMELINE_YEAR_FADE_MS = 300

const useTimelineBend = ({ active, prefersReducedMotion }) => {
  const [timelinePhase, setTimelinePhase] = React.useState(
    TIMELINE_PHASES.linear
  )
  const [timelineBendProgress, setTimelineBendProgress] = React.useState(0)

  React.useEffect(() => {
    let bendTimer
    let animationFrame
    let cancelled = false

    if (!active) {
      setTimelinePhase(TIMELINE_PHASES.linear)
      setTimelineBendProgress(0)
      return undefined
    }

    if (prefersReducedMotion === null) {
      return undefined
    }

    if (prefersReducedMotion) {
      setTimelinePhase(TIMELINE_PHASES.circular)
      setTimelineBendProgress(1)
      return undefined
    }

    setTimelinePhase(TIMELINE_PHASES.linear)
    setTimelineBendProgress(0)

    bendTimer = window.setTimeout(() => {
      const startedAt = window.performance.now()
      setTimelinePhase(TIMELINE_PHASES.circular)

      const updateBend = now => {
        if (cancelled) {
          return
        }

        const progress = Math.min(1, (now - startedAt) / TIMELINE_BEND_MS)
        setTimelineBendProgress(progress)

        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(updateBend)
        }
      }

      animationFrame = window.requestAnimationFrame(updateBend)
    }, TIMELINE_LINEAR_TRANSITION_MS + TIMELINE_LINEAR_HOLD_MS)

    return () => {
      cancelled = true
      window.clearTimeout(bendTimer)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [active, prefersReducedMotion])

  return { timelineBendProgress, timelinePhase }
}

export {
  TIMELINE_BEND_MS,
  TIMELINE_LINEAR_HOLD_MS,
  TIMELINE_LINEAR_TRANSITION_MS,
  TIMELINE_PHASES,
  TIMELINE_YEAR_FADE_MS,
}
export default useTimelineBend
