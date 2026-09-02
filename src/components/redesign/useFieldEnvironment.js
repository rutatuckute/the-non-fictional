import * as React from "react"

import { getPhotographyColumns } from "./archiveFieldData"

export const usePrefersReducedMotion = () => {
  const [preference, setPreference] = React.useState(null)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setPreference(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener("change", updatePreference)

    return () => mediaQuery.removeEventListener("change", updatePreference)
  }, [])

  return preference
}

export const usePhotographyColumns = () => {
  const [columns, setColumns] = React.useState(13)

  React.useEffect(() => {
    const updateColumns = () => {
      setColumns(getPhotographyColumns(window.innerWidth))
    }

    updateColumns()
    window.addEventListener("resize", updateColumns)

    return () => window.removeEventListener("resize", updateColumns)
  }, [])

  return columns
}

export const useViewportWidth = () => {
  const [width, setWidth] = React.useState(1440)

  React.useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth)

    updateWidth()
    window.addEventListener("resize", updateWidth)

    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  return width
}

// SVG text is measured in user units, so a label declared at 11px renders at
// 11 × (drawn size ÷ viewBox size) — around 5px once the field is in a narrow
// column, while `vector-effect: non-scaling-stroke` holds every line steady at
// the same widths. Reporting the drawn scale lets the stylesheet divide it back
// out, so the labels obey the rule the strokes already follow.
export const useFieldScale = (viewBoxWidth, viewBoxHeight) => {
  const ref = React.useRef(null)
  const [scale, setScale] = React.useState(1)

  React.useEffect(() => {
    const element = ref.current

    if (!element || typeof ResizeObserver === "undefined") {
      return undefined
    }

    const measure = () => {
      const { width, height } = element.getBoundingClientRect()

      if (!width || !height) {
        return
      }

      // preserveAspectRatio="xMidYMid meet" fits the viewBox inside the box,
      // so the smaller of the two ratios is the one actually drawn.
      const drawn = Math.min(width / viewBoxWidth, height / viewBoxHeight)

      setScale(current => (Math.abs(current - drawn) < 0.001 ? current : drawn))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [viewBoxHeight, viewBoxWidth])

  return [ref, scale]
}
