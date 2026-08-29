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
