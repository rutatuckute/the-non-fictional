"use client"

import * as React from "react"

import prose from "../../../styles/blog-post.module.css"
import styles from "./sarajevo.module.css"
import map from "./map.json"

// Sarajevo's sights, told as a walk. Across the page: the section's heading
// pinned on the left with the steps passing beneath it, and on the right a
// map of the city that follows them — it moves to each sight, draws the way
// there on foot, and marks it. The last step hands the whole map to the
// reader: every place, by kind, to filter and tap through to Google Maps.
// On a phone the steps pass over the map instead.
//
// The words are the body's: each step opens with its name in bold, which is
// set as the step's label. The map is OpenStreetMap data (© OpenStreetMap
// contributors), prepared by scripts/stories/sarajevo/build-map.py.
const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

const PLACE = Object.fromEntries(map.places.map(p => [p.key, p]))
// The sights in the order the body walks them; a sixth step explores.
const WALK = ["markale", "eternal-flame", "papagajka", "inat-kuca", "assassination"]

// Each place opens in Google Maps by name, so the reader lands on the place
// itself (its hours, photos, reviews), not a bare pin. The street corner has
// no listing of its own, so it goes by the coordinates the text gives.
const SEARCH = {
  assassination: "43.857917,18.42875",
  "sniper-alley": "Zmaja od Bosne, Sarajevo",
  bobsled: "Sarajevo Bobsleigh and Luge Track, Trebević",
  "city-hall": "Vijećnica, Sarajevo",
  "eternal-flame": "Vječna vatra, Sarajevo",
}
const mapsUrl = p =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SEARCH[p.key] || `${p.name}, Sarajevo`)}`
const MapsLink = ({ place }) => (
  <a className={c("sj-maps")} href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>
)

// The kinds of place, as the original map sorted them, each with a line icon.
const KINDS = [
  ["sight", "Sights", <><path d="M7 21V4" /><path d="M7 4h11l-2.5 4L18 12H7" /></>],
  ["food", "Food", <><path d="M7 3v8a2 2 0 0 0 4 0V3" /><path d="M9 11v10" /><path d="M16 3c-2 2-2 6 0 8v10" /></>],
  ["tea", "Tea", <><path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><path d="M16 11h2a2 2 0 0 1 0 4h-2" /><path d="M9 5c0-1 1-1 1-2M12 5c0-1 1-1 1-2" /></>],
  ["sweets", "Sweets", <><path d="M6 12h12l-2 8H8z" /><path d="M6 12a6 4 0 0 1 12 0" /><path d="M12 8V6" /></>],
  ["bar", "Bars", <><path d="M7 7h9v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M7 7c0-2 2-3 4.5-3S16 5 16 7" /></>],
  ["shopping", "Market & crafts", <><path d="M4 9h16l-2 11H6z" /><path d="M8 9l4-5 4 5" /></>],
]
const KIND = Object.fromEntries(KINDS.map(([id, label, icon]) => [id, { label, icon }]))
const Icon = ({ kind, className = "sj-icon" }) => (
  <svg className={c(className)} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{KIND[kind].icon}</svg>
)

// Where the map looks at each step. The old town is dense, so the walk is
// seen close; the last step opens on the old town, where all but two of the
// places are, with the whole city a tap away.
const OLD_TOWN = map.places.filter(p => !["sniper-alley", "bobsled"].includes(p.key)).map(p => p.key)
const VIEWS = [
  { at: ["markale", "eternal-flame"], zoom: 4.2 },
  { at: ["markale", "eternal-flame"], zoom: 4.2 },
  { at: ["eternal-flame", "papagajka"], zoom: 3.6 },
  { at: ["papagajka", "inat-kuca"], zoom: 3.4 },
  { at: ["inat-kuca", "assassination"], zoom: 3.8 },
  { at: OLD_TOWN, zoom: null },
]
const WHOLE = { at: map.places.map(p => p.key), zoom: null }

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

const SarajevoMap = ({ step, explore, kind, chosen, onChoose }) => {
  const [ref, { width, height }] = useSize()
  const [whole, setWhole] = React.useState(false)
  const walkStep = Math.min(step, WALK.length - 1)
  const view = explore ? (whole ? WHOLE : VIEWS[VIEWS.length - 1]) : VIEWS[walkStep]

  // The view centres the places in focus. The map is the view box scaled to
  // cover the panel; the explore views fit their places with a margin, and
  // may zoom out past the panel's edges so a narrow phone still shows them.
  const pts = view.at.map(key => PLACE[key])
  const xs = pts.map(p => p.x)
  const ys = pts.map(p => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  const cover = Math.max(width / map.w, height / map.h)
  const fit = Math.min(
    (width * 0.84) / ((Math.max(...xs) - Math.min(...xs)) * cover || 1),
    (height * 0.72) / ((Math.max(...ys) - Math.min(...ys)) * cover || 1),
  )
  const zoom = view.zoom ?? Math.max(0.6, Math.min(fit, 6))
  const tx = map.w / 2 - zoom * cx
  const ty = map.h / 2 - zoom * cy
  // Marks and words keep their size on screen at any zoom.
  const k = 1 / (zoom * cover)
  // A label near the panel's right edge goes to the left of its dot.
  const left = map.w / 2 - width / (2 * cover)
  const flip = p => (p.x * zoom + tx - left) * cover > width - 170

  const current = explore ? null : WALK[walkStep]
  const shown = explore
    ? map.places.filter(p => kind === "all" || p.kind === kind)
    : WALK.slice(0, walkStep + 1).map(key => PLACE[key])

  return (
    <div className={c("sj-map")} ref={ref}>
      <svg
        viewBox={`0 0 ${map.w} ${map.h}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Map of central Sarajevo with the five sights and the walk between them: Markale, the Eternal Flame, Papagajka, Inat Kuća and the corner by the Latin Bridge."
      >
        <g className={c("sj-world")} style={{ transform: `translate(${tx}px, ${ty}px) scale(${zoom})` }}>
          <path className={c("sj-river")} d={map.river} />
          <path className={c("sj-minor")} d={map.roads.minor} />
          <path className={c("sj-mid")} d={map.roads.mid} />
          <path className={c("sj-major")} d={map.roads.major} />

          {/* The walk so far, leg by leg, each drawn on as it is reached. */}
          {map.walk.map((leg, index) => (
            <path
              key={leg.to}
              className={c("sj-leg")}
              style={{ strokeWidth: 2.5 * k }}
              d={leg.d}
              pathLength="1"
              data-on={explore || index < walkStep ? "true" : "false"}
              data-faint={explore ? "true" : "false"}
            />
          ))}

          {shown.map(p => {
            const on = p.key === current || p.key === chosen
            const label = on || (!explore && WALK.includes(p.key))
            return (
              <g
                key={p.key}
                className={c("sj-place")}
                data-on={on ? "true" : "false"}
                data-walk={WALK.includes(p.key) ? "true" : "false"}
                data-tappable={explore ? "true" : "false"}
                transform={`translate(${p.x} ${p.y})`}
                onClick={explore ? () => onChoose(p.key === chosen ? null : p.key) : undefined}
              >
                {explore ? <circle className={c("sj-hit")} r={16 * k} /> : null}
                <circle className={c("sj-dot")} r={(on ? 6 : 4.5) * k} style={{ strokeWidth: 2 * k }} />
                {on ? <circle className={c("sj-ring")} r={14 * k} style={{ strokeWidth: k }} /> : null}
                {label ? (
                  <text
                    className={c("sj-label")}
                    data-on={on ? "true" : "false"}
                    x={(flip(p) ? -12 : 12) * k}
                    y={-10 * k}
                    textAnchor={flip(p) ? "end" : "start"}
                    style={{ fontSize: `${(on ? 15 : 12) * k}px`, strokeWidth: `${4 * k}px` }}
                  >
                    {p.key === "assassination" ? "Latin Bridge corner" : p.name}
                  </text>
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Under the map: the walk in numbers, or the place that was tapped. */}
      {!explore ? (
        <p className={c("sj-meta")}>
          <span>{String(walkStep + 1).padStart(2, "0")} / 05</span>
          {walkStep > 0 ? (
            <span>
              {map.walk[walkStep - 1].metres} m · {map.walk[walkStep - 1].minutes} min on foot from {PLACE[WALK[walkStep - 1]].name}
            </span>
          ) : (
            <span>Start</span>
          )}
          <MapsLink place={PLACE[current]} />
        </p>
      ) : chosen ? (
        <p className={c("sj-meta", "sj-chosen")}>
          <Icon kind={PLACE[chosen].kind} />
          <span className={c("sj-chosenName")}>{PLACE[chosen].name}</span>
          <span>{KIND[PLACE[chosen].kind].label}{PLACE[chosen].approx ? " · position approximate" : ""}</span>
          <MapsLink place={PLACE[chosen]} />
        </p>
      ) : (
        <p className={c("sj-meta")}>
          <span>{shown.length} places</span>
          <span>Tap one to open it in Google Maps</span>
        </p>
      )}
      {explore ? (
        <button type="button" className={c("sj-whole")} onClick={() => setWhole(!whole)}>
          {whole ? "Back to the old town" : "Show the whole city"}
        </button>
      ) : null}
      <p className={c("sj-credit")}>© OpenStreetMap contributors</p>
    </div>
  )
}

// The current step is the last one whose card has reached the line — half
// way down beside the map, three quarters down on a phone where the steps
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

// A step opens with its name in bold — "<p><strong>Markale:</strong> …" — which
// is lifted out as the step's label.
const splitLead = html => {
  const match = html.match(/^\s*<p>\s*<strong>([\s\S]*?):?\s*<\/strong>:?\s*/)
  return match ? { lead: match[1].replace(/:$/, ""), text: `<p>${html.slice(match[0].length)}` } : { lead: "", text: html }
}

const Filters = ({ kind, onKind }) => (
  <div className={c("sj-filters")} role="group" aria-label="Kinds of place">
    {[["all", "All"], ...KINDS.map(([id, label]) => [id, label])].map(([id, label]) => (
      <button key={id} type="button" aria-pressed={kind === id} onClick={() => onKind(id)}>
        {id !== "all" ? <Icon kind={id} /> : null}
        {label}
      </button>
    ))}
  </div>
)

const SarajevoWalk = ({ intro = "", steps = [] }) => {
  const [step, stepRef] = useStep(steps.length)
  const [kind, setKind] = React.useState("all")
  const [chosen, setChosen] = React.useState(null)
  const last = steps.length - 1
  // Any step past the five sights explores.
  const isWalk = index => index < WALK.length

  return (
    <section className={c("sj-story")} aria-label="The sights, on foot">
      <div className={c("sj-left")}>
        <div className={`${c("sj-pinned")} ${prose.prose}`} dangerouslySetInnerHTML={{ __html: intro }} />
        <div className={c("sj-steps")}>
          {steps.map((html, index) => {
            const { lead, text } = splitLead(html)
            return (
              <div
                key={index}
                className={c("sj-step")}
                data-step={index}
                data-last={index === last ? "true" : "false"}
                data-on={step === index ? "true" : "false"}
                ref={stepRef(index)}
              >
                <div className={c("sj-card")}>
                  <p className={c("sj-lead")}>
                    {isWalk(index) ? (
                      <>
                        <span className={c("sj-no")}>{String(index + 1).padStart(2, "0")}</span>
                        <Icon kind={PLACE[WALK[index]].kind} />
                      </>
                    ) : null}
                    <span>{lead}</span>
                  </p>
                  <div dangerouslySetInnerHTML={{ __html: text }} />
                  {!isWalk(index) ? <Filters kind={kind} onKind={value => { setKind(value); setChosen(null) }} /> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className={c("sj-sticky")}>
        <header className={c("sj-chartHead")}>
          <p className={c("sj-kicker")}>Sarajevo</p>
          <p className={c("sj-chartTitle")}>A walk through the crossroads</p>
        </header>
        <SarajevoMap step={step} explore={!isWalk(step)} kind={kind} chosen={chosen} onChoose={setChosen} />
      </div>
    </section>
  )
}

export default SarajevoWalk
