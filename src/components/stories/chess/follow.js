"use client"

import * as React from "react"

// Mouse-wheel scenes ease between scroll events. Direct touch manipulation
// tracks the finger immediately, with no second smoothing loop after release.

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
    let dirty = true
    const touch = window.matchMedia("(pointer: coarse)")
    const tick = time => {
      frame = 0
      const before = shown
      const to = now.current.goal()
      if (shown === null || still || touch.matches || Math.abs(to - shown) > 1.2) shown = to
      else {
        shown += (to - shown) * (1 - Math.exp(-Math.min(64, time - last) / follow))
        if (Math.abs(to - shown) < 0.0004) shown = to
      }
      last = time
      if (dirty || shown !== before) now.current.paint(shown)
      dirty = false
      if (shown !== to) frame = window.requestAnimationFrame(tick)
    }
    const wake = () => {
      if (frame) return
      last = window.performance.now()
      frame = window.requestAnimationFrame(tick)
    }
    // a new size changes what a square is in pixels
    const resized = () => {
      dirty = true
      wake()
    }
    const inputChanged = () => { shown = null; wake() }
    touch.addEventListener("change", inputChanged)
    wake()
    const observer = new ResizeObserver(resized)
    if (watch?.current) observer.observe(watch.current)
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    return () => {
      observer.disconnect()
      touch.removeEventListener("change", inputChanged)
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [still, follow, watch])
}
