"use client"

import * as React from "react"

// A scene led by the scroll does not sit on the scroll position itself: it
// follows it, closing a share of the distance in every frame, so a turn of a
// mouse wheel or an uneven swipe is drawn as one glide and not as the steps it
// arrives in.

// Has the reader asked for less motion?
export const useStill = () => {
  const [still, setStill] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setStill(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return still
}

// `goal()` says where the scroll is now, in screens; `paint(at)` draws the
// scene there. `paint` is called in every frame until the scene has caught up,
// and again when the scroll moves or `watch` (a ref to the scene's box) changes
// size. `follow` is the time, in milliseconds, in which about two thirds of
// the distance is closed. At first, with motion turned off, and after a jump
// down the page, the scene is simply there.
export const useFollow = (goal, paint, { still = false, follow = 150, watch } = {}) => {
  const now = React.useRef({ goal, paint })
  React.useLayoutEffect(() => {
    now.current = { goal, paint }
  })
  React.useEffect(() => {
    let frame = 0
    let shown = null
    let last = 0
    const tick = time => {
      frame = 0
      const to = now.current.goal()
      if (shown === null || still || Math.abs(to - shown) > 1.2) shown = to
      else {
        shown += (to - shown) * (1 - Math.exp(-Math.min(64, time - last) / follow))
        if (Math.abs(to - shown) < 0.0004) shown = to
      }
      last = time
      now.current.paint(shown)
      if (shown !== to) frame = window.requestAnimationFrame(tick)
    }
    const wake = () => {
      if (frame) return
      last = window.performance.now()
      frame = window.requestAnimationFrame(tick)
    }
    // a new size changes what a square is in pixels
    const resized = () => {
      if (shown !== null) now.current.paint(shown)
      wake()
    }
    wake()
    const observer = new ResizeObserver(resized)
    if (watch?.current) observer.observe(watch.current)
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", resized)
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", resized)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [still, follow, watch])
}
