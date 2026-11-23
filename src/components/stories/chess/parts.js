"use client"

import * as React from "react"

import prose from "../../../styles/blog-post.module.css"
import styles from "./chess.module.css"

// What every part of the chess story is built from: the words the body gives
// by name, the boxes that stand in for pictures and charts not made yet, and
// the pinned scene, a graphic held on screen while short texts pass it.
export const c = (...names) => names.map(name => styles[name]).filter(Boolean).join(" ")

// The story's words, by the name of the step that carries them in the body.
export const Words = React.createContext({})

// A named text. One that the body doesn't have yet says so while the story is
// being built, and is simply absent on the published page.
export const Text = ({ name, look = "", className = "", style }) => {
  const html = React.useContext(Words)[name]
  const classes = `${c("ch-text", look && `ch-${look}`)} ${className}`
  if (html) return <div className={`${classes} ${prose.prose}`} style={style} dangerouslySetInnerHTML={{ __html: html }} />
  if (process.env.NODE_ENV === "production") return null
  return (
    <div className={classes} style={style}>
      <p className={c("ch-missing")}>No text named “{name}” in the body yet</p>
    </div>
  )
}

// A box where a picture or a chart will go. "open" boxes are outlines only,
// so the thread can run inside them; the others cover it, as a print would.
export const Holder = ({ label, ratio, open = false, className = "", children }) => (
  <div
    className={`${c("ch-holder")} ${className}`}
    data-kind={open ? "open" : "picture"}
    style={ratio ? { aspectRatio: ratio } : undefined}
    role="img"
    aria-label={`To come: ${label}`}
  >
    <span className={c("ch-holderLabel")}>{label}</span>
    {children}
  </div>
)

// A picture made for the story: a cut-out on the page's own ground, in the
// sizes scripts/stories/chess/make-images.cjs wrote. `sizes` says how wide it
// is shown, so a phone takes the smaller file.
export const Picture = ({ name, alt, width, height, small, sizes, lazy = false, className = "" }) => (
  <img
    className={`${c("ch-picture")} ${className}`}
    src={`/images/stories/chess/${name}.webp`}
    srcSet={`/images/stories/chess/${name}-${small}.webp ${small}w, /images/stories/chess/${name}.webp ${width}w`}
    sizes={sizes}
    alt={alt}
    width={width}
    height={height}
    loading={lazy ? "lazy" : undefined}
    decoding="async"
  />
)

// One thing on a pinned scene, there for some steps and gone for the rest.
// In the flow it leaves its place when gone; otherwise it fades where it is.
export const Show = ({ on, flow = false, className = "", children, style }) => (
  <div className={`${c(flow ? "ch-panel" : "ch-layer")} ${className}`} data-on={on ? "true" : "false"} style={style}>
    {children}
  </div>
)

// The line a card has to reach to count: half way down beside the graphic,
// and near the bottom on a phone, where a card comes up under the graphic and
// counts once it is fully in view.
export const stepLine = () => window.innerHeight * (window.matchMedia("(max-width: 60rem)").matches ? 0.88 : 0.5)

// The steps of the pinned scene a graphic stands in, by number: for a graphic
// that follows the scroll within a step (club.js) to find that step's card.
export const PinSteps = React.createContext(null)

// The current step is the last one whose card has reached the line, read from
// the scroll position, so a jump lands on the right picture.
const useStep = count => {
  const refs = React.useRef([])
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = stepLine()
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
  return [step, index => node => (refs.current[index] = node), refs]
}

// How far the reader has scrolled since a step's card reached its line, in
// whole parts of `every` screens, up to `most`: for a graphic that changes a
// few times within one step.
export const useSince = (step, every, most) => {
  const steps = React.useContext(PinSteps)
  const [part, setPart] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const node = steps?.current?.[step]
      if (!node) return
      const top = (node.firstElementChild || node).getBoundingClientRect().top
      setPart(Math.max(0, Math.min(most, Math.floor((stepLine() - top) / window.innerHeight / every))))
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
  }, [steps, step, every, most])
  return part
}

// A pinned scene: the graphic stays, and the reader's scrolling takes it from
// step to step. `children` draws the graphic for the step it is given.
//
// With cards (Part III), each step is a card that scrolls past the graphic:
// a card, or `{ card, rest }` for one whose graphic needs more scrolling than
// a card's passing gives (`rest` screens of it follow the card, with nothing
// in them), or `{ bare: true }` for a stretch with no card at all.
//
// `reading` (Part II): no cards either. On a wide screen each step's text
// scrolls past beside the graphic, as words in the page do; a step with no
// text (`{ rest }` or `{}`) leaves the graphic alone. On a phone the texts
// stand at the top, one after another, as in `plain`.
//
// `plain`: no cards. Each step is `{ text, rest }`, and its text
// stands in one place beside the graphic, giving way to the next step's as the
// reader scrolls, as the sentences beside the wooden set do; a step with no
// text leaves the graphic to speak alone. `open` leaves out the rule above.
// `mark` names the scene for the chapters' navigation (chapters.js).
export const useNarrow = () => {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 60rem)")
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  return narrow
}

export const Pinned = ({ label, steps, open = false, plain: plainOnly = false, reading = false, mark, className = "", overlay, children }) => {
  const [step, stepRef, refs] = useStep(steps.length)
  const narrow = useNarrow()
  const plain = plainOnly || (reading && narrow)
  const scrolling = reading && !narrow
  return (
    <section
      className={`${c("ch-pin")} ${className}`}
      data-open={open ? "true" : undefined}
      data-plain={plain ? "true" : undefined}
      data-reading={scrolling ? "true" : undefined}
      aria-label={label}
    >
      {/* where the chapters' navigation opens this scene: at its top, as it is pinned */}
      {mark ? <span id={mark} className={c("ch-mark")} /> : null}
      <div className={c("ch-stage")}>
        <PinSteps.Provider value={refs}>
          {plain ? (
            <div className={c("ch-told")}>
              {steps.map((item, index) =>
                item.text ? (
                  <div key={index} data-on={step === index ? "true" : "false"}>
                    {item.text}
                  </div>
                ) : null,
              )}
            </div>
          ) : null}
          <div className={c("ch-scene")}>
            {children(step)}
          </div>
          {overlay}
        </PinSteps.Provider>
      </div>
      <div className={c("ch-steps")}>
        {steps.map((item, index) => {
          const made = plain || scrolling || (item !== null && typeof item === "object" && ("card" in item || "bare" in item))
          const bare = plain || (scrolling ? !item.text : made && item.bare)
          return (
            <React.Fragment key={index}>
              <div
                className={c("ch-step")}
                data-step={index}
                data-bare={bare ? "true" : undefined}
                data-on={step === index ? "true" : "false"}
                ref={stepRef(index)}
              >
                {item?.mark ? (
                  <span className={c("ch-stepMark")}><span id={item.mark} className={c("ch-mark")} /></span>
                ) : null}
                <div className={c("ch-card")}>{plain ? null : scrolling ? item.text : made ? item.card : item}</div>
              </div>
              {made && item.rest ? <div style={{ height: `${item.rest * 100}vh` }} aria-hidden="true" /> : null}
            </React.Fragment>
          )
        })}
      </div>
    </section>
  )
}

// The reader's turn. An answer is kept and shown again with the result, but
// the story never waits for one: scrolling on is always allowed.
export const Guess = ({ label, options, value, onChange }) => (
  <div className={c("ch-guess")} role="group" aria-label={label}>
    {options.map(option => (
      <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>
        {option}
      </button>
    ))}
  </div>
)
