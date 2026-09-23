"use client"

import * as React from "react"

// Opening, stepping and deep-linking a frame, over whatever sequence the view
// hands it.
//
// The sequence is the point. Previous and next mean something different in each
// view — the edit's order in Selected, the archive's chronology in Archive, the
// body of work's own order inside a series — and the only way to keep that
// straight is for the view to own the order and this to step through it
// blindly.
//
// ?frame=<slug> stays the deep link it has always been: the old per-photograph
// URLs still redirect to it, and browser history drives it so Back closes the
// frame rather than leaving the page.
export const useLightbox = (sequence) => {
  const [openRef, setOpenRef] = React.useState(null)

  const index = openRef
    ? sequence.findIndex((frame) => frame.ref === openRef)
    : -1

  React.useEffect(() => {
    const readFromUrl = () =>
      setOpenRef(new URLSearchParams(window.location.search).get("frame"))

    readFromUrl()
    window.addEventListener("popstate", readFromUrl)
    return () => window.removeEventListener("popstate", readFromUrl)
  }, [])

  const open = React.useCallback((frame) => {
    setOpenRef(frame.ref)
    window.history.pushState({}, "", `?frame=${encodeURIComponent(frame.ref)}`)
  }, [])

  const close = React.useCallback(() => {
    setOpenRef(null)
    window.history.pushState({}, "", window.location.pathname)
  }, [])

  const step = React.useCallback(
    (delta) => {
      if (index < 0 || sequence.length === 0) return

      const next = sequence[(index + delta + sequence.length) % sequence.length]
      setOpenRef(next.ref)
      window.history.replaceState({}, "", `?frame=${encodeURIComponent(next.ref)}`)
    },
    [index, sequence]
  )

  return { index: index >= 0 ? index : null, open, close, step }
}
