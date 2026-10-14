"use client"

import * as React from "react"

import prose from "../../../styles/blog-post.module.css"
import styles from "./take-me-home.module.css"
import { DAYS, DEPARTURE, PEAK, PRICES, STATES, euro } from "./data"

// Take me home's price, told as a scrolly story: across the page, the section
// on the left — its heading and paragraph pinned, the steps passing beneath
// them, the closing under the last — and the chart held on the right, drawing
// the 18 days one stretch at a time. The last step hands the chart to the
// reader, who picks the day they would have booked. On a phone the steps pass
// over the chart instead.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

const useSize = () => {
  const ref = React.useRef(null)
  const [size, setSize] = React.useState({ width: 640, height: 420 })
  React.useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.max(280, width), height: Math.max(260, height) })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

const PriceChart = ({ state, booked, onBook }) => {
  const [ref, { width, height }] = useSize()
  const [hover, setHover] = React.useState(null)
  const clipId = React.useId().replace(/:/g, "")
  const narrow = width < 480
  // On a phone the chart runs edge to edge, so its own margins carry the
  // axis labels.
  const m = { top: 28, right: narrow ? 14 : 28, bottom: 36, left: narrow ? 46 : 48 }
  const w = width - m.left - m.right
  const h = height - m.top - m.bottom

  // Days run to the flight, so the gap to departure is part of the picture.
  // Prices from zero: the climb is the story, and an axis from €200 would
  // triple it.
  const x = day => m.left + ((day - 1) / (DEPARTURE - 1)) * w
  const y = price => m.top + h - (price / 700) * h
  const dayTicks = narrow ? [1, 7, 14, 20] : [1, 4, 7, 10, 13, 16, 20]

  const line = DAYS.map(({ day, price }, i) => `${i ? "L" : "M"}${x(day)},${y(price)}`).join(" ")
  const area = `${line} L${x(18)},${y(0)} L${x(1)},${y(0)} Z`
  // The drawn part ends just past the last shown dot.
  const reveal = (x(state.upTo) - m.left + 12) / (w + 12)

  // The crosshair snaps to the nearest drawn day.
  const onMove = event => {
    const box = event.currentTarget.getBoundingClientRect()
    const day = Math.round(((event.clientX - box.left - m.left) / w) * (DEPARTURE - 1)) + 1
    setHover(day >= 1 && day <= state.upTo ? day : null)
  }
  const focus = hover ?? (state.explore ? booked : null)
  const focusPrice = focus ? PRICES[focus - 1] : null

  return (
    <div className={c("tm-chart")} ref={ref}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Minimum round-trip price, Paris–Vilnius–Paris, 1 to 18 December 2020: from €219 to a peak of €607, ending at €505."
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onClick={() => state.explore && hover && onBook(hover)}
        data-explore={state.explore ? "true" : "false"}
      >
        <defs>
          <clipPath id={clipId}>
            <rect className={c("tm-revealRect")} x={m.left - 6} y={0} width={w + 12} height={height} style={{ transform: `scaleX(${reveal})` }} />
          </clipPath>
        </defs>

        {[0, 200, 400, 600].map(t => (
          <g key={t} className={c("tm-grid")}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
            <text x={m.left - 10} y={y(t)} dy="0.32em" textAnchor="end">{euro(t)}</text>
          </g>
        ))}
        {dayTicks.map(d => (
          <text key={d} className={c("tm-axis")} x={x(d)} y={height - m.bottom + 22} textAnchor={d === DEPARTURE ? "end" : d === 1 ? "start" : "middle"}>
            {d === 1 ? "1 Dec" : d === DEPARTURE ? "20 Dec" : d}
          </text>
        ))}

        {/* The flight itself: 20 December, beyond the last quote. */}
        <g className={c("tm-departure")}>
          <line x1={x(DEPARTURE)} x2={x(DEPARTURE)} y1={m.top} y2={m.top + h} />
          <text x={x(DEPARTURE)} y={m.top - 10} textAnchor="end">Departure ↓</text>
        </g>

        {/* The original chart's annotation: the day the restrictions came,
            where the plateau ends. */}
        {state.note ? (
          <g className={c("tm-note")}>
            <line x1={x(16)} x2={x(16)} y1={y(PEAK) - 12} y2={m.top + h} />
            <text x={x(16) - 10} y={y(455)} textAnchor="end">
              <tspan x={x(16) - 10}>Lithuanian government</tspan>
              <tspan x={x(16) - 10} dy="1.35em">imposes tougher</tspan>
              <tspan x={x(16) - 10} dy="1.35em">Covid-19 restrictions</tspan>
            </text>
          </g>
        ) : null}

        {state.band ? (
          <rect className={c("tm-band")} x={x(state.band[0]) - 8} y={m.top} width={x(state.band[1]) - x(state.band[0]) + 16} height={h} />
        ) : null}

        <g clipPath={`url(#${clipId})`}>
          <path className={c("tm-area")} d={area} />
          <path className={c("tm-line")} d={line} />
          {DAYS.map(({ day, price }) => (
            <circle key={day} className={c("tm-dot")} cx={x(day)} cy={y(price)} r={day === focus ? 6 : 4} />
          ))}
        </g>

        {/* What the step points at: the value at the dot, in ink. After the
            annotation's line it sits to the right, so the two never cross. */}
        {state.mark.map(day => (
          <g key={day} className={c("tm-callout")}>
            <circle cx={x(day)} cy={y(PRICES[day - 1])} r="9" />
            <text
              x={day > 16 ? x(day) + 14 : x(day)}
              y={day > 16 ? y(PRICES[day - 1]) - 14 : y(PRICES[day - 1]) - 18}
              textAnchor={day > 16 ? "start" : day > 15 ? "end" : "middle"}
            >
              {euro(PRICES[day - 1])}
            </text>
          </g>
        ))}

        {/* The booked day: its price as a level across the chart. */}
        {state.explore && booked ? (
          <g className={c("tm-booked")}>
            <line x1={m.left} x2={width - m.right} y1={y(PRICES[booked - 1])} y2={y(PRICES[booked - 1])} />
          </g>
        ) : null}

        {focus ? (
          <g className={c("tm-cross")}>
            <line x1={x(focus)} x2={x(focus)} y1={m.top} y2={m.top + h} />
            <circle cx={x(focus)} cy={y(focusPrice)} r="6" />
          </g>
        ) : null}
      </svg>

      {focus ? (
        <div className={c("tm-tip")} style={{ left: Math.min(Math.max(x(focus), m.left + 76), width - 80), top: m.top + 6 }}>
          <span className={c("tm-tipDate")}>{focus} December 2020</span>
          <span className={c("tm-tipValue")}>{euro(focusPrice)}</span>
          <span className={c("tm-tipNote")}>{focusPrice === PEAK ? "The peak" : `${euro(PEAK - focusPrice)} below the peak`}</span>
        </div>
      ) : null}
    </div>
  )
}

// The current step is the last one whose card has reached the line — half
// way down beside the chart, three quarters down on a phone where the steps
// pass over it — read from the scroll position, so a jump past the story
// still lands on the right picture.
const useStep = count => {
  const refs = React.useRef([])
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * (window.matchMedia("(max-width: 60rem)").matches ? 0.75 : 0.5)
      const top = node => (node.firstElementChild || node).getBoundingClientRect().top
      const passed = refs.current.slice(0, count).filter(node => node && top(node) < line)
      setStep(passed.length ? Number(passed[passed.length - 1].dataset.step) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [count])
  return [step, index => node => (refs.current[index] = node)]
}

const Booking = ({ booked, onBook }) => {
  const id = React.useId()
  const price = PRICES[booked - 1]
  return (
    <div className={c("tm-booking")}>
      <label className={c("tm-bookLabel")} htmlFor={id}>I would have booked on</label>
      <select id={id} value={booked} onChange={event => onBook(Number(event.target.value))}>
        {DAYS.map(({ day }) => <option key={day} value={day}>{day} December</option>)}
      </select>
      <p className={c("tm-bookResult")} aria-live="polite">
        <span className={c("tm-bookPrice")}>{euro(price)}</span>
        {price === PEAK
          ? " — the most it ever cost."
          : <> — {euro(PEAK - price)} less than at the peak{booked > 1 ? <>, {euro(price - PRICES[0])} more than on 1 December</> : null}.</>}
      </p>
    </div>
  )
}

const PriceStory = ({ intro = "", steps = [], closing = "" }) => {
  const [step, stepRef] = useStep(steps.length)
  const [booked, setBooked] = React.useState(1)
  const last = steps.length - 1
  // A step beyond the states the chart knows keeps its last picture.
  const stateOf = index => STATES[Math.min(index, STATES.length - 1)]

  return (
    <section className={c("tm-story")} aria-label="The price, day by day">
      <div className={c("tm-left")}>
        <div className={`${c("tm-pinned")} ${prose.prose}`} dangerouslySetInnerHTML={{ __html: intro }} />
        <div className={c("tm-steps")}>
          {steps.map((text, index) => (
            <div
              key={index}
              className={c("tm-step")}
              data-step={index}
              data-last={index === last ? "true" : "false"}
              data-on={step === index ? "true" : "false"}
              ref={stepRef(index)}
            >
              <div className={c("tm-card")}>
                <div dangerouslySetInnerHTML={{ __html: text }} />
                {stateOf(index).explore ? <Booking booked={booked} onBook={setBooked} /> : null}
              </div>
              {index === last && closing ? (
                <div
                  className={`${c("tm-closing")} ${prose.prose}`}
                  data-on={step === last ? "true" : "false"}
                  dangerouslySetInnerHTML={{ __html: closing }}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className={c("tm-sticky")}>
        <header className={c("tm-chartHead")}>
          <p className={c("tm-kicker")}>Paris – Vilnius – Paris · 20–27 Dec 2020</p>
          <p className={c("tm-chartTitle")}>The cheapest round trip, quoted daily</p>
        </header>
        <PriceChart state={stateOf(step)} booked={booked} onBook={setBooked} />
      </div>
    </section>
  )
}

export default PriceStory
