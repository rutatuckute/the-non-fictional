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

// A position: a number is percent of the box; a string is any length.
const at = value => (typeof value === "string" ? value : `${value}%`)

// A knot. `px` and `py` place it on a phone, where the page is one column.
// With `mark` it shows on the thread as a bead: a game, once in a while.
// `tint` says what colour the story's thread is at this knot: "clay" where
// chess is in the life, "grey" where it is not; between two such knots it
// turns from one to the other. ("from" and "to" are the old grey and clay.)
export const Knot = ({ run = "a", x, y, px = x, py = y, mark = false, tint }) => (
  <i
    className={c("ch-knot")}
    data-thread={run}
    data-mark={mark ? "" : undefined}
    data-tint={tint}
    style={{ "--x": at(x), "--y": at(y), "--px": at(px), "--py": at(py) }}
    aria-hidden="true"
  />
)

// A stretch drawn from data: the thread as a chart's line. `points` are [x, y]
// as shares (0 to 1) of the box the trace fills, left to right, top to bottom.
// The thread passes through every one of them as given: it does not wander
// here, and it is drawn left to right as the reader scrolls past. How far it
// has got across is written on the trace's box as --drawn (0 to 1), so
// anything else in the box can be drawn in step with it.
//
// With `then="questions"` the thread stops being a line where the data ends:
// from there on it goes as a trail of question marks, sparse at first, then
// closer, larger and wider, each appearing as the reader reaches it.
export const Trace = ({ run = "a", points, then }) => (
  <i className={c("ch-trace")} data-thread={run} data-trace={JSON.stringify(points)} data-then={then} aria-hidden="true" />
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
        tint={what === "from" ? "grey" : what === "to" ? "clay" : what === "grey" || what === "clay" ? what : undefined}
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

// The same curve as points a short step apart. A point is firm when the
// stretch it lies on runs between two points of data: those are not to be moved.
const STEP = 56
const along = (points, exact) => {
  const way = [points[0]]
  const firm = [Boolean(exact[0])]
  // Where each given point falls among the samples.
  const knotAt = [0]
  stretches(points).forEach(([p0, c1, c2, p1], index) => {
    const count = Math.max(1, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / STEP))
    for (let n = 1; n <= count; n++) {
      const t = n / count
      const u = 1 - t
      way.push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
      ])
      firm.push(Boolean(exact[index] && exact[index + 1]))
    }
    knotAt.push(way.length - 1)
  })
  return { way, firm, knotAt }
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
// slow waves of the thread's own, fading to nothing at its two ends and
// wherever the thread carries data.
const wander = (points, firm, name, amount) => {
  const random = seeded(name)
  const [slow, quick] = [78 + random() * 44, 26 + random() * 22]
  const [first, second] = [random() * 6.28, random() * 6.28]
  const lengths = [0]
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  const total = lengths[lengths.length - 1]
  // How far each point is, along the thread, from the nearest firm one.
  const free = points.map(() => Infinity)
  for (let i = 0, last = -Infinity; i < points.length; i++) {
    if (firm[i]) last = lengths[i]
    free[i] = lengths[i] - last
  }
  for (let i = points.length - 1, next = Infinity; i >= 0; i--) {
    if (firm[i]) next = lengths[i]
    free[i] = Math.min(free[i], next - lengths[i])
  }
  return points.map((p, i) => {
    const before = points[i - 1] || p
    const after = points[i + 1] || p
    const dx = after[0] - before[0]
    const dy = after[1] - before[1]
    const size = Math.hypot(dx, dy) || 1
    const s = lengths[i]
    const ease = Math.min(1, s / 90, (total - s) / 90, free[i] / 90)
    const off = amount * ease * (0.62 * Math.sin(s / slow + first) + 0.38 * Math.sin(s / quick + second))
    return [p[0] - (dy / size) * off, p[1] + (dx / size) * off]
  })
}

// The trail of questions along a stretch of thread. Spacing narrows from about
// 64px to 14px, the marks grow, and they stray further from the way as it
// goes, to either side in turn; late on, some come in pairs. Seeded, so the
// trail is the same on every visit. Returns [x, y, size, turn] for each mark.
const questions = (way, narrow, width) => {
  const random = seeded("questions")
  const lengths = [0]
  for (let i = 1; i < way.length; i++) lengths.push(lengths[i - 1] + Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]))
  const total = lengths[lengths.length - 1]
  const pointAt = s => {
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < s) i++
    const k = (s - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1)
    const [a, b] = [way[i - 1], way[i]]
    const size = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, nx: -(b[1] - a[1]) / size, ny: (b[0] - a[0]) / size }
  }
  const [small, large, stray] = narrow ? [12, 19, 16] : [13, 24, 26]
  const marks = []
  let side = 1
  for (let s = 26; s < total - 8; s += 14 + 50 * Math.pow(1 - s / total, 1.5)) {
    const t = s / total
    const p = pointAt(s)
    const size = small + (large - small) * t
    const place = (sign, scale) => {
      // A second mark keeps clear of the first.
      const off = sign * Math.max(stray * Math.pow(t, 1.8) * (0.45 + 0.55 * random()), scale < 1 ? size : 0)
      // Never past the screen's edge: the drawing is as wide as the screen.
      const half = size * scale * 0.35 + 3
      marks.push([
        Math.round(Math.max(half, Math.min(width - half, p.x + p.nx * off)) * 10) / 10,
        Math.round((p.y + p.ny * off) * 10) / 10,
        Math.round(size * scale * 10) / 10,
        Math.round((random() - 0.5) * 28 * t),
      ])
    }
    place(side, 1)
    if (t > 0.55 && random() < t - 0.3) place(-side, 0.82)
    side = -side
  }
  return marks
}

// How much of the screen's height the threads have reached: they are drawn
// down to this line, so their ends are always in view, ahead of the reading.
const REACH = 0.7
// How far below the cover the threads show from the start, in pixels.
const FLOOR = 34

// How much scrolling a trace takes to draw: short enough to finish while the
// whole of it is on screen, with a little air above.
const traceSpan = height => Math.max(80, Math.min(window.innerHeight * 0.32, window.innerHeight * (REACH - 0.08) - height))

// They are drawn over the element they are placed in, which has to be positioned.
export const Thread = () => {
  const svg = React.useRef(null)
  const tintId = React.useId().replace(/:/g, "")
  const [drawing, setDrawing] = React.useState({ runs: [], tint: null })
  const drawn = React.useRef([])
  const beads = React.useRef([])
  const asks = React.useRef([])
  const reveals = React.useRef([])

  const draw = React.useCallback(() => {
    const node = svg.current?.parentElement
    if (!node) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let line = window.innerHeight * REACH - node.getBoundingClientRect().top
    // On the first screen the threads' tips already show a little under the
    // cover, so the eye follows them down.
    const floor = node.querySelector("[data-thread-floor]")
    if (floor) line = Math.max(line, floor.getBoundingClientRect().bottom - node.getBoundingClientRect().top + FLOOR)
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
    asks.current.forEach(mark => {
      mark.node.style.opacity = still || mark.y <= line ? 1 : 0
    })
    beads.current.forEach(bead => {
      bead.node.style.opacity = still || bead.y <= line ? 1 : 0
    })
    reveals.current.forEach(({ node: item, y }) => {
      item.dataset.reached = still || y <= line ? "true" : "false"
    })
    node.querySelectorAll("[data-trace]").forEach(trace => {
      const box = trace.getBoundingClientRect()
      trace.firstY ??= JSON.parse(trace.dataset.trace)[0][1]
      const from = box.top - node.getBoundingClientRect().top + trace.firstY * box.height
      const drawn = still ? 1 : Math.max(0, Math.min(1, (line - from) / traceSpan(box.height)))
      trace.parentElement.style.setProperty("--drawn", drawn.toFixed(4))
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
      const tint = []
      node.querySelectorAll("[data-thread]").forEach(knot => {
        const at = knot.getBoundingClientRect()
        const group = groups.get(knot.dataset.thread) || { points: [], exact: [], marks: [], traces: [], breakAt: null }
        groups.set(knot.dataset.thread, group)
        if (knot.dataset.trace) {
          // Data: every point of it, placed in the box the trace fills.
          const top = at.top - box.top
          const first = group.points.length
          for (const [x, y] of JSON.parse(knot.dataset.trace)) {
            group.points.push([Math.round((at.left + x * at.width) * 10) / 10, Math.round((top + y * at.height) * 10) / 10])
            group.exact.push(true)
          }
          group.traces.push({ left: at.left, right: at.right, top, bottom: top + at.height, from: group.points[first][1] })
          if (knot.dataset.then === "questions") group.breakAt = group.points.length - 1
          return
        }
        const point = [Math.round(at.left), Math.round(at.top - box.top)]
        group.points.push(point)
        group.exact.push(false)
        if (knot.dataset.mark !== undefined) group.marks.push(point)
        if (knot.dataset.tint && knot.dataset.thread === "a") tint.push([point[1], knot.dataset.tint])
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

      const narrow = window.matchMedia("(max-width: 60rem)").matches
      const runs = [...groups].map(([name, { points, exact, marks, traces, breakAt }]) => {
        // the reader's own thread is one of the others until it is chosen
        const other = name.startsWith("other") || name.startsWith("you")
        const sampled = along(points, exact)
        const whole = wander(sampled.way, sampled.firm, name, other ? 4.5 : 2.5)
        // Past the break the thread is drawn as questions, not as a line.
        const cut = breakAt === null ? whole.length - 1 : sampled.knotAt[breakAt]
        const way = whole.slice(0, cut + 1)
        const asked = breakAt === null ? [] : questions(whole.slice(cut), narrow, width)
        // A bead sits on the thread as drawn, at the point nearest its knot.
        const nearest = mark =>
          way.reduce((best, p) => (Math.hypot(p[0] - mark[0], p[1] - mark[1]) < Math.hypot(best[0] - mark[0], best[1] - mark[1]) ? p : best))
        return { name, other, traces, d: pathOf(way), asked, beads: marks.map(nearest).map(p => [Math.round(p[0]), Math.round(p[1])]) }
      })
      tint.sort((p, q) => p[0] - q[0])
      const next = { runs, tint: tint.length > 1 ? tint : null }
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
  // has been by then. Inside a trace the thread is taken to go down as it goes
  // across, so the line is drawn left to right over a stretch of scrolling
  // short enough to finish while the whole of it is still on screen.
  React.useLayoutEffect(() => {
    drawn.current = [...svg.current.querySelectorAll("path")].map((path, index) => {
      const traces = drawing.runs[index]?.traces || []
      const depthOf = p => {
        for (const t of traces) {
          if (p.x < t.left || p.x > t.right || p.y < t.top - 1 || p.y > t.bottom + 1) continue
          // It begins when the trace's start comes up to the line.
          return t.from + ((p.x - t.left) / (t.right - t.left)) * traceSpan(t.bottom - t.top)
        }
        return p.y
      }
      const length = path.getTotalLength()
      const at = []
      const deepest = []
      let low = -Infinity
      for (let l = 0; l <= length; l += 6) {
        low = Math.max(low, depthOf(path.getPointAtLength(l)))
        at.push(l)
        deepest.push(low)
      }
      at.push(length)
      deepest.push(low)
      path.style.strokeDasharray = length
      return { path, length, at, deepest }
    })
    beads.current = [...svg.current.querySelectorAll("circle")].map(bead => ({ node: bead, y: Number(bead.getAttribute("cy")) }))
    // A trail of questions follows a trace, so none appears before the line of
    // data is drawn to its end: the trail's marks wait as long as the trace
    // takes, beyond its last point, to finish.
    const wait = {}
    drawing.runs.forEach((run, index) => {
      const trace = run.traces[run.traces.length - 1]
      const path = drawn.current[index]
      if (!run.asked.length || !trace || !path) return
      const end = path.path.getPointAtLength(path.length).y
      // (and a little more: the trail first rises, so its first marks sit above the end)
      wait[run.name] = Math.max(0, trace.from + traceSpan(trace.bottom - trace.top) - end) + 24
    })
    asks.current = [...svg.current.querySelectorAll("text")].map(mark => ({ node: mark, y: Number(mark.getAttribute("y")) + (wait[mark.dataset.run] || 0) }))
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
      {/* The story's thread is clay where chess is in the life, grey where it is not. */}
      {tint ? (
        <defs>
          <linearGradient id={tintId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={tint[0][0]} y2={tint[tint.length - 1][0]}>
            {tint.map(([y, colour], index) => (
              <stop
                key={index}
                offset={((y - tint[0][0]) / (tint[tint.length - 1][0] - tint[0][0] || 1)).toFixed(5)}
                className={c(colour === "clay" ? "ch-tintTo" : "ch-tintFrom")}
              />
            ))}
          </linearGradient>
        </defs>
      ) : null}
      {runs.map(run => (
        <g key={run.name}>
          <path
            d={run.d}
            data-run={run.name}
            data-other={run.other ? "true" : undefined}
            style={run.name === "a" && tint ? { stroke: `url(#${tintId})` } : undefined}
          />
          {run.beads.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" />
          ))}
          {run.asked.map(([x, y, size, turn], index) => (
            <text key={index} x={x} y={y} fontSize={size} data-run={run.name} transform={turn ? `rotate(${turn} ${x} ${y})` : undefined}>
              ?
            </text>
          ))}
        </g>
      ))}
    </svg>
  )
}
