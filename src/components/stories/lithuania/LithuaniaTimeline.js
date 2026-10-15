"use client"

import * as React from "react"

import prose from "../../../styles/blog-post.module.css"
import styles from "./lithuania.module.css"

// Lithuania's brief history, told as a scroll through time. Across the page:
// the section's heading and first line pinned on the left, the steps passing
// beneath them; on the right a timeline from 1009 to 1990 that follows them,
// zooming to the stretch each one tells. The eras run under the axis in two
// kinds — a Lithuanian state, or rule by others — so the shape of the
// history reads before any label does. Events carry the author's engravings.
// A last step hands the timeline to the reader, to choose a date.
//
// The words are the body's; what each step looks at is set here, in the
// order the body's steps come (STEP_VIEWS). Any step past those explores.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

// The events, and the engravings that mark them. One picture per cluster:
// the occupations share the soldier, shown once where their cards stack.
const EVENTS = [
  { y: 1009, label: "First written mention", photo: "/images/stories/lithuania/tome.webp", cutout: "small", note: "Lithuania is named for the first time, in the Annals of Quedlinburg." },
  { y: 1253, label: "Mindaugas crowned king", photo: "/images/stories/lithuania/mindaugas.webp", cutout: true, note: "Mindaugas, who had brought the Lithuanian lands together, is crowned King of Lithuania." },
  { y: 1410, label: "Battle of Grunwald", photo: "/images/stories/lithuania/grunwald.webp", cutout: "small", note: "The Battle of Grunwald (Žalgiris). The Grand Duchy becomes the largest state in medieval Europe." },
  { y: 1569, label: "Union of Lublin", photo: "/images/stories/lithuania/lublin.webp", cutout: true, note: "The Union of Lublin joins Lithuania and Poland in the Polish–Lithuanian Commonwealth." },
  { y: 1791, label: "Constitution of 3 May", note: "The Commonwealth adopts the Constitution of 3 May, Europe's first written constitution." },
  { y: 1795, label: "Third partition", photo: "/images/stories/lithuania/scissors.webp", cutout: "small", note: "The third partition of the Commonwealth: Lithuania falls under the Russian Empire." },
  { y: 1864, end: 1904, label: "Press ban", note: "Lithuanian in the Latin alphabet is banned from print; book smugglers carry books across the border." },
  { y: 1918, label: "Act of Independence", photo: "/images/stories/lithuania/council-1918.webp", cutout: "wide", ratio: 220 / 480, note: "16 February 1918: the Act of Independence re-establishes the Lithuanian state." },
  { y: 1940, label: "Soviet occupation", photo: "/images/stories/lithuania/soldier.webp", cutout: true, note: "Under the Molotov–Ribbentrop Pact, the Soviet Union occupies and annexes Lithuania." },
  { y: 1941, label: "Nazi occupation", photo: "/images/stories/lithuania/soldier.webp", cutout: true, note: "Nazi Germany occupies Lithuania." },
  { y: 1944, label: "Soviet occupation, again", photo: "/images/stories/lithuania/soldier.webp", cutout: true, note: "The Soviet Union occupies Lithuania again — for 46 years." },
  { y: 1989, label: "Baltic Way", photo: "/images/stories/lithuania/baltic-way.webp", cutout: "wide", ratio: 412 / 480, note: "23 August 1989: some two million people join hands across Lithuania, Latvia and Estonia." },
  { y: 1990, label: "Independence restored", note: "11 March 1990: Lithuania is the first Soviet republic to declare independence; it is recognised internationally in 1991." },
]

// The eras, in two kinds: a Lithuanian state, or rule by others.
const END = 2000
const ERAS = [
  { from: 1253, to: 1569, label: "Grand Duchy of Lithuania", state: true },
  { from: 1569, to: 1795, label: "Polish–Lithuanian Commonwealth", state: true },
  { from: 1795, to: 1918, label: "Russian Empire", state: false },
  { from: 1918, to: 1940, label: "Independence", state: true },
  { from: 1940, to: 1941, label: "Soviet", state: false },
  { from: 1941, to: 1944, label: "Nazi", state: false },
  { from: 1944, to: 1990, label: "Soviet Union", state: false },
  { from: 1990, to: END, label: "Republic", state: true },
]

// What each step looks at, in the order the body's steps come.
const STEP_VIEWS = [
  { years: "1009 – 1253", view: [990, 1300] },
  { years: "14th century", view: [1240, 1460] },
  { years: "15th century", view: [1330, 1600] },
  { years: "1569", view: [1480, 1720] },
  { years: "1791 – 1795", view: [1730, 1850] },
  { years: "1795 – 1918", view: [1780, 1930] },
  { years: "1918 – 1940", view: [1905, 1946] },
  { years: "1940", view: [1928, 1956] },
  { years: "1940 – 1990", view: [1935, 1995] },
  { years: "1990", view: [1975, END] },
]

const useSize = () => {
  const ref = React.useRef(null)
  const [size, setSize] = React.useState({ width: 800, height: 600 })
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

// The domain glides between views rather than jumping.
const useTween = (target, ms = 900) => {
  const [value, setValue] = React.useState(target)
  const from = React.useRef(target)
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setValue(target); from.current = target; return }
    const start = performance.now()
    const a = from.current
    let frame
    const tick = now => {
      const t = Math.min(1, (now - start) / ms)
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const v = [a[0] + (target[0] - a[0]) * e, a[1] + (target[1] - a[1]) * e]
      from.current = v
      setValue(v)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target[0], target[1]])
  return value
}

const TICK_STEPS = [100, 50, 25, 10, 5]

const Timeline = ({ state, chosen }) => {
  const [ref, { width, height }] = useSize()
  const explore = Boolean(state.explore)
  // In the reader's turn, a chosen date brings the timeline to it.
  const focus = explore && chosen ? EVENTS.find(e => e.y === chosen) : null
  const half = focus ? (focus.y >= 1900 ? 45 : 90) : 0
  const view = focus ? [Math.max(990, focus.y - half), Math.min(END, focus.y + half)] : state.view
  const [d0, d1] = useTween(view)
  const narrow = width < 520
  const m = { left: narrow ? 20 : 28, right: narrow ? 20 : 28 }
  const x = year => m.left + ((year - d0) / (d1 - d0)) * (width - m.left - m.right)
  const axis = Math.round(height * (narrow ? 0.66 : 0.62))
  const visible = e => (e.end ?? e.y) >= d0 - 1 && e.y <= d1 + 1

  // Ticks: the roundest step that leaves room between labels.
  const span = d1 - d0
  const tickStep = [...TICK_STEPS].reverse().find(s => (span / s) * (narrow ? 52 : 64) < width) || 100
  const ticks = []
  for (let t = Math.ceil(d0 / tickStep) * tickStep; t <= d1; t += tickStep) ticks.push(t)

  // Event cards stand on stems of three heights, so neighbours never collide.
  const cardWidth = narrow ? 112 : 150
  // A wide cut-out (the Council of 1918) gets a wider card.
  const widthOf = e => (e.cutout === "wide" ? (narrow ? 150 : 220) : cardWidth)
  // A card's height, estimated from what it holds: its picture, its year and
  // its label's lines.
  const heightOf = e => {
    const w = widthOf(e)
    const picture = e.photo
      ? e.cutout === "wide" ? Math.round((w - 14) * e.ratio) + 4 : e.cutout === "small" ? (narrow ? 40 : 52) : e.cutout ? (narrow ? 80 : 112) : (narrow ? 40 : 52)
      : 0
    const perLine = Math.floor((w - 14) / (narrow ? 6.6 : 7.4))
    const lines = Math.ceil(e.label.length / perLine)
    return picture + 22 + lines * (narrow ? 17 : 19) + 12
  }
  // Each card stands just above any card already placed beneath it, so cards
  // stack by their real heights. One that would rise past the top of the
  // panel is shown as its dot, and is still there in the reader's turn.
  const base = narrow ? 46 : 58
  const room = axis - 8
  const stacked = []
  const placed = EVENTS.filter(visible).map(event => {
    const cx = x(event.y)
    const w = widthOf(event)
    const left = Math.min(Math.max(cx, 0), width - w)
    const near = stacked.filter(o => left < o.left + o.w + 10 && o.left < left + w + 10)
    // One picture per cluster: a card stacked over another with the same
    // picture (the occupations' soldier) shows its words only.
    const e = event.photo && near.some(o => o.photo === event.photo) ? { ...event, photo: null, cutout: null } : event
    const h = heightOf(e)
    const below = near
    const stem = Math.max(base, ...below.map(o => o.stem + o.h + 10))
    const card = stem + h <= room
    if (card) stacked.push({ left, w, h, stem, photo: event.photo })
    return { ...e, cx, left, stem, card }
  })
  const showCards = !explore || Boolean(focus)

  return (
    <div className={c("lt-time")} ref={ref}>
      <svg width={width} height={height} aria-hidden="true">
        {/* The eras: a Lithuanian state, or rule by others. */}
        {ERAS.map(era => {
          const a = Math.max(x(era.from), 0), b = Math.min(x(era.to), width)
          if (b <= 0 || a >= width) return null
          return (
            <g key={era.label} className={c("lt-era")} data-state={era.state ? "true" : "false"}>
              <rect x={a} y={axis + 18} width={Math.max(0, b - a - 2)} height={34} />
              {b - a > era.label.length * 6.4 + 16 ? <text x={a + 8} y={axis + 39}>{era.label}</text> : null}
            </g>
          )
        })}
        <line className={c("lt-axis")} x1={0} x2={width} y1={axis} y2={axis} />
        {ticks.map(t => (
          <g key={t} className={c("lt-tick")}>
            <line x1={x(t)} x2={x(t)} y1={axis} y2={axis + 6} />
            <text x={x(t)} y={axis + 72} textAnchor="middle">{t}</text>
          </g>
        ))}
        {placed.map(e => (
          <g key={e.y} className={c("lt-event")} data-on={chosen === e.y ? "true" : "false"}>
            {e.end ? <rect className={c("lt-span")} x={e.cx} y={axis - 3} width={Math.max(2, x(e.end) - e.cx)} height={6} /> : null}
            {showCards && e.card ? <line className={c("lt-stem")} x1={e.cx} x2={e.cx} y1={axis - e.stem} y2={axis} /> : null}
            <circle cx={e.cx} cy={axis} r={chosen === e.y ? 6 : 4.5} />
          </g>
        ))}
      </svg>

      {/* The cards, in HTML so their words wrap. */}
      {showCards ? placed.filter(e => e.card).map(e => (
        <div
          key={e.y}
          className={c("lt-card")}
          data-photo={e.photo ? "true" : "false"}
          data-on={chosen === e.y ? "true" : "false"}
          style={{ left: e.left, bottom: height - axis + e.stem, width: widthOf(e) }}
        >
          {e.photo ? <img src={e.photo} alt="" loading="lazy" decoding="async" data-cutout={e.cutout ? String(e.cutout) : undefined} /> : null}
          <span className={c("lt-year")}>{e.end ? `${e.y}–${e.end}` : e.y}</span>
          <span className={c("lt-label")}>{e.label}</span>
        </div>
      )) : null}

      {/* The reader's turn: what the chosen date was. */}
      {focus ? (
        <div className={c("lt-told")}>
          {focus.photo ? <img src={focus.photo} alt="" decoding="async" data-cutout={focus.cutout ? String(focus.cutout) : undefined} /> : null}
          <div>
            <span className={c("lt-year")}>{focus.end ? `${focus.y}–${focus.end}` : focus.y}</span>
            <p className={c("lt-toldLabel")}>{focus.label}</p>
            <p className={c("lt-note")}>{focus.note}</p>
          </div>
        </div>
      ) : null}

      <p className={c("lt-legend")}>
        <span data-state="true">A Lithuanian state</span>
        <span data-state="false">Ruled by others</span>
      </p>
    </div>
  )
}

// The current step is the last one whose card has reached the line — half
// way down beside the timeline, three quarters down on a phone where the
// steps pass over it — read from the scroll position, so a jump past the
// story still lands on the right picture.
const useStep = count => {
  const refs = React.useRef([])
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * (window.matchMedia("(max-width: 60rem)").matches ? 0.75 : 0.5)
      const passed = refs.current.slice(0, count).filter(n => n && (n.firstElementChild || n).getBoundingClientRect().top < line)
      setStep(passed.length ? Number(passed[passed.length - 1].dataset.step) : 0)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame) cancelAnimationFrame(frame) }
  }, [count])
  return [step, i => node => (refs.current[i] = node)]
}

const LithuaniaTimeline = ({ intro = "", steps = [], closing = "" }) => {
  const [step, stepRef] = useStep(steps.length)
  const [chosen, setChosen] = React.useState(null)
  const last = steps.length - 1
  const stateOf = index =>
    STEP_VIEWS[index] ? { ...STEP_VIEWS[index] } : { explore: true, view: [990, END] }

  return (
    <section className={c("lt-story")} aria-label="Lithuania, 1009 to 1990">
      <div className={c("lt-left")}>
        <div className={`${c("lt-pinned")} ${prose.prose}`} dangerouslySetInnerHTML={{ __html: intro }} />
        <div className={c("lt-steps")}>
          {steps.map((text, index) => {
            const state = stateOf(index)
            return (
              <div
                key={index}
                className={c("lt-step")}
                data-step={index}
                data-last={index === last ? "true" : "false"}
                data-on={step === index ? "true" : "false"}
                ref={stepRef(index)}
              >
                <div className={c("lt-card-step")}>
                  {state.years ? (
                    <p className={c("lt-stepLead")}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {state.years}
                    </p>
                  ) : null}
                  <div dangerouslySetInnerHTML={{ __html: text }} />
                  {state.explore ? (
                    <div className={c("lt-dates")} role="group" aria-label="Dates">
                      {EVENTS.map(e => (
                        <button
                          key={e.y}
                          type="button"
                          aria-pressed={chosen === e.y}
                          onClick={() => setChosen(chosen === e.y ? null : e.y)}
                        >
                          {e.y}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {index === last && closing ? (
                  <div
                    className={`${c("lt-closing")} ${prose.prose}`}
                    data-on={step === last ? "true" : "false"}
                    dangerouslySetInnerHTML={{ __html: closing }}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <div className={c("lt-sticky")}>
        <header className={c("lt-chartHead")}>
          <p className={c("lt-kicker")}>Lithuania · 1009 – 1990</p>
          <p className={c("lt-chartTitle")}>Through centuries, in and out of statehood</p>
        </header>
        <Timeline state={stateOf(Math.min(step, last))} chosen={chosen} />
      </div>
    </section>
  )
}

export default LithuaniaTimeline
