"use client"

import * as React from "react"

import { c } from "./parts"

// The threads. A life has many; the story follows one. Several thin grey lines
// come down the opening, one of them takes its colour as the first memory is
// told, and that one is followed through the story while the others go on
// beyond the frame, each leaving in its own time. At the end they are back.
//
// Every line is drawn as far as the reader has scrolled. It passes through
// knots — points placed in the layout, each in percent of the box it sits in —
// so it follows the page as the page reflows, and between them it wanders a
// little, as a thread laid down by hand does. A run is one unbroken stretch:
// "a" and "b" are the story's own thread, before and after the investigation,
// where it rests; runs named "other-…" are the rest.
//
// Anything in the story marked `data-reveal` appears when the threads' end
// reaches it and goes when they are drawn back. Without scripts, or with
// motion turned off, all of it shows.

// A knot. `px` and `py` place it on a phone, where the page is one column.
// With `mark` it shows on the thread as a bead: a game, once in a while.
// `tint` names the two knots between which the story's thread takes its colour.
export const Knot = ({ run = "a", x, y, px = x, py = y, mark = false, tint }) => (
  <i
    className={c("ch-knot")}
    data-thread={run}
    data-mark={mark ? "" : undefined}
    data-tint={tint}
    style={{ "--x": `${x}%`, "--y": `${y}%`, "--px": `${px}%`, "--py": `${py}%` }}
    aria-hidden="true"
  />
)

// The knots of one stretch of the page, written as a table: for each run, its
// points as [x, y, phone x, phone y, "mark" | "from" | "to"].
export const Knots = ({ of }) =>
  Object.entries(of).map(([run, points]) =>
    points.map(([x, y, px, py, what], index) => (
      <Knot
        key={`${run}-${index}`}
        run={run}
        x={x}
        y={y}
        px={px}
        py={py}
        mark={what === "mark"}
        tint={what === "from" || what === "to" ? what : undefined}
      />
    )),
  )

// A smooth curve through the points, as cubic stretches. No handle is longer
// than two fifths of its own stretch, so a long one beside a short one doesn't loop.
const stretches = points =>
  points.slice(1).map((p, index) => {
    const i = index + 1
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
    return [b, [b[0] + h1[0], b[1] + h1[1]], [p[0] - h2[0], p[1] - h2[1]], p]
  })

const pathOf = points =>
  points.length < 2
    ? ""
    : `M${points[0][0]},${points[0][1]} ` +
      stretches(points)
        .map(([, c1, c2, p]) => `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p[0].toFixed(1)},${p[1].toFixed(1)}`)
        .join(" ")

// The same curve as points a short step apart.
const STEP = 56
const along = points => {
  const out = [points[0]]
  for (const [p0, c1, c2, p1] of stretches(points)) {
    const count = Math.max(1, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / STEP))
    for (let n = 1; n <= count; n++) {
      const t = n / count
      const u = 1 - t
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
      ])
    }
  }
  return out
}

// A number from a name, the same every time, so a thread keeps its own gait.
const seeded = name => {
  let h = 2166136261
  for (const letter of name) h = Math.imul(h ^ letter.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

// The hand in it: each point moved a little to the side of its way, by two
// slow waves of the thread's own, fading to nothing at its two ends.
const wander = (points, name, amount) => {
  const random = seeded(name)
  const [slow, quick] = [78 + random() * 44, 26 + random() * 22]
  const [first, second] = [random() * 6.28, random() * 6.28]
  const lengths = [0]
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  const total = lengths[lengths.length - 1]
  return points.map((p, i) => {
    const before = points[i - 1] || p
    const after = points[i + 1] || p
    const dx = after[0] - before[0]
    const dy = after[1] - before[1]
    const size = Math.hypot(dx, dy) || 1
    const s = lengths[i]
    const ease = Math.min(1, s / 90, (total - s) / 90)
    const off = amount * ease * (0.62 * Math.sin(s / slow + first) + 0.38 * Math.sin(s / quick + second))
    return [p[0] - (dy / size) * off, p[1] + (dx / size) * off]
  })
}

// How much of the screen's height the threads have reached: they are drawn
// down to this line, so their ends are always in view, ahead of the reading.
const REACH = 0.7

// They are drawn over the element they are placed in, which has to be positioned.
export const Thread = () => {
  const svg = React.useRef(null)
  const tintId = React.useId().replace(/:/g, "")
  const [drawing, setDrawing] = React.useState({ runs: [], tint: null })
  const drawn = React.useRef([])
  const beads = React.useRef([])
  const reveals = React.useRef([])

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
      }
      run.path.style.strokeDashoffset = run.length - length
    })
    beads.current.forEach(bead => {
      bead.node.style.opacity = still || bead.y <= line ? 1 : 0
    })
    reveals.current.forEach(({ node: item, y }) => {
      item.dataset.reached = still || y <= line ? "true" : "false"
    })
  }, [])

  // Where the knots are now: the lines, in the page's own pixels.
  React.useLayoutEffect(() => {
    const node = svg.current?.parentElement
    if (!node) return
    const measure = () => {
      const box = node.getBoundingClientRect()
      const width = document.documentElement.clientWidth
      const groups = new Map()
      const tint = {}
      node.querySelectorAll("[data-thread]").forEach(knot => {
        const at = knot.getBoundingClientRect()
        const point = [Math.round(at.left), Math.round(at.top - box.top)]
        const group = groups.get(knot.dataset.thread) || { points: [], marks: [] }
        group.points.push(point)
        if (knot.dataset.mark !== undefined) group.marks.push(point)
        if (knot.dataset.tint) tint[knot.dataset.tint] = point[1]
        groups.set(knot.dataset.thread, group)
      })
      reveals.current = [...node.querySelectorAll("[data-reveal]")].map(item => ({
        node: item,
        y: item.getBoundingClientRect().top - box.top,
      }))
      // The drawing spans the screen, not the column, so a thread can come in
      // and leave by the screen's edge.
      svg.current.style.left = `${-box.left}px`
      svg.current.style.width = `${width}px`
      svg.current.style.height = `${box.height}px`
      svg.current.setAttribute("viewBox", `0 0 ${width} ${box.height}`)

      const runs = [...groups].map(([name, { points, marks }]) => {
        const other = name.startsWith("other")
        const way = wander(along(points), name, other ? 7 : 4)
        // A bead sits on the thread as drawn, at the point nearest its knot.
        const nearest = mark =>
          way.reduce((best, p) => (Math.hypot(p[0] - mark[0], p[1] - mark[1]) < Math.hypot(best[0] - mark[0], best[1] - mark[1]) ? p : best))
        return { name, other, d: pathOf(way), beads: marks.map(nearest).map(p => [Math.round(p[0]), Math.round(p[1])]) }
      })
      const next = { runs, tint: tint.from !== undefined && tint.to !== undefined ? [tint.from, tint.to] : null }
      setDrawing(before => (JSON.stringify(before) === JSON.stringify(next) ? before : next))
      draw()
    }
    // From here on what is revealed waits for the threads.
    node.dataset.live = "true"
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [draw])

  // Each run, sampled once: how far along it is, and how far down the page it
  // has been by then.
  React.useLayoutEffect(() => {
    drawn.current = [...svg.current.querySelectorAll("path")].map(path => {
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
      return { path, length, at, deepest }
    })
    beads.current = [...svg.current.querySelectorAll("circle")].map(bead => ({ node: bead, y: Number(bead.getAttribute("cy")) }))
    draw()
  }, [drawing, draw])

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

  const { runs, tint } = drawing
  return (
    <svg className={c("ch-thread")} ref={svg} aria-hidden="true">
      {/* The story's thread is one of the grey ones until the memory begins. */}
      {tint ? (
        <defs>
          <linearGradient id={tintId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={tint[0]} y2={tint[1]}>
            <stop offset="0" className={c("ch-tintFrom")} />
            <stop offset="1" className={c("ch-tintTo")} />
          </linearGradient>
        </defs>
      ) : null}
      {runs.map(run => (
        <g key={run.name}>
          <path
            d={run.d}
            data-other={run.other ? "true" : undefined}
            style={run.name === "a" && tint ? { stroke: `url(#${tintId})` } : undefined}
          />
          {run.beads.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />
          ))}
        </g>
      ))}
    </svg>
  )
}
