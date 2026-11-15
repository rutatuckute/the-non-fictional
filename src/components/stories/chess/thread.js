"use client"

import * as React from "react"

import { c } from "./parts"

// The thread: one thin line through the whole story, drawn as far as the
// reader has scrolled. It passes through knots — points placed in the layout,
// each in percent of the box it sits in — so it follows the page as the page
// reflows. A run is one unbroken stretch; the story has two, with the
// investigation between them, where the thread rests.

// A knot. `px` and `py` place it on a phone, where the page is one column.
export const Knot = ({ run = "a", x, y, px = x, py = y }) => (
  <i
    className={c("ch-knot")}
    data-thread={run}
    style={{ "--x": `${x}%`, "--y": `${y}%`, "--px": `${px}%`, "--py": `${py}%` }}
    aria-hidden="true"
  />
)

// A smooth curve through the points. No handle is longer than two fifths of
// its own stretch, so a long stretch beside a short one doesn't loop.
const curve = points =>
  points
    .map((p, i) => {
      if (!i) return `M${p[0]},${p[1]}`
      const a = points[i - 2] || points[i - 1]
      const b = points[i - 1]
      const d = points[i + 1] || p
      const reach = Math.hypot(p[0] - b[0], p[1] - b[1]) * 0.4
      const handle = (x, y) => {
        const k = Math.min(1, reach / (Math.hypot(x, y) || 1))
        return [x * k, y * k]
      }
      const h1 = handle((p[0] - a[0]) / 6, (p[1] - a[1]) / 6)
      const h2 = handle((d[0] - b[0]) / 6, (d[1] - b[1]) / 6)
      return `C${b[0] + h1[0]},${b[1] + h1[1]} ${p[0] - h2[0]},${p[1] - h2[1]} ${p[0]},${p[1]}`
    })
    .join(" ")

// How much of the screen's height the thread has reached: it is drawn down to
// this line, so its end is always in view, ahead of the reading.
const REACH = 0.7
// Before any scrolling the first run already shows this much, as the cue to scroll.
const STUB = 64

// It is drawn over the element it is placed in, which has to be positioned.
export const Thread = () => {
  const svg = React.useRef(null)
  const [runs, setRuns] = React.useState([])
  const drawn = React.useRef([])

  const draw = React.useCallback(() => {
    const node = svg.current?.parentElement
    if (!node) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const line = window.innerHeight * REACH - node.getBoundingClientRect().top
    drawn.current.forEach(run => {
      let length = run.length
      if (!still) {
        // The furthest point whose whole way there lies above the line. A
        // stretch that climbs — the thread as a chart's line — has no part
        // below what came before it, so it is drawn in one go when reached.
        let a = 0
        let b = run.deepest.length - 1
        while (a < b) {
          const middle = (a + b + 1) >> 1
          if (run.deepest[middle] <= line) a = middle
          else b = middle - 1
        }
        length = run.deepest[0] > line ? 0 : run.at[a]
        if (run.first) length = Math.max(length, STUB)
      }
      run.path.style.strokeDashoffset = run.length - length
    })
  }, [])

  // Where the knots are now: the curves, in the page's own pixels.
  React.useLayoutEffect(() => {
    const node = svg.current?.parentElement
    if (!node) return
    const measure = () => {
      const box = node.getBoundingClientRect()
      const width = document.documentElement.clientWidth
      const groups = new Map()
      node.querySelectorAll("[data-thread]").forEach(knot => {
        const at = knot.getBoundingClientRect()
        const list = groups.get(knot.dataset.thread) || []
        list.push([Math.round(at.left), Math.round(at.top - box.top)])
        groups.set(knot.dataset.thread, list)
      })
      // The drawing spans the screen, not the column, so the thread can leave
      // by the screen's edge.
      svg.current.style.left = `${-box.left}px`
      svg.current.style.width = `${width}px`
      svg.current.style.height = `${box.height}px`
      svg.current.setAttribute("viewBox", `0 0 ${width} ${box.height}`)
      const next = [...groups.values()].map(curve)
      setRuns(before => (before.join("|") === next.join("|") ? before : next))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  // Each run, sampled once: how far along it is, and how far down the page it
  // has been by then.
  React.useLayoutEffect(() => {
    drawn.current = [...svg.current.querySelectorAll("path")].map((path, index) => {
      const length = path.getTotalLength()
      const at = []
      const deepest = []
      let low = -Infinity
      for (let l = 0; l <= length; l += 6) {
        low = Math.max(low, path.getPointAtLength(l).y)
        at.push(l)
        deepest.push(low)
      }
      at.push(length)
      deepest.push(low)
      path.style.strokeDasharray = length
      return { path, length, at, deepest, first: index === 0 }
    })
    draw()
  }, [runs, draw])

  React.useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (!frame)
        frame = window.requestAnimationFrame(() => {
          frame = 0
          draw()
        })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [draw])

  return (
    <svg className={c("ch-thread")} ref={svg} aria-hidden="true">
      {runs.map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  )
}
