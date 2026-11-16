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

// A thing with two sides, turned over as the reader comes to it: one side on
// the way in, the other once it has reached the middle of the screen, and
// back again on the way up. A tap or a click turns it by hand. The frame is
// the size of the larger side, so nothing around it moves when it turns.
// With motion turned off the sides change without the turn.
export const Turn = ({ front, back, sizes, className = "" }) => {
  const frame = React.useRef(null)
  const [turned, setTurned] = React.useState(false)
  React.useEffect(() => {
    let tick = 0
    let past = false
    const update = () => {
      tick = 0
      const box = frame.current.getBoundingClientRect()
      const now = box.top + box.height / 2 < window.innerHeight * 0.52
      // Only a change of side on the way past turns it, so a turn by hand stays.
      if (now !== past) {
        past = now
        setTurned(now)
      }
    }
    const onScroll = () => {
      if (!tick) tick = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (tick) window.cancelAnimationFrame(tick)
    }
  }, [])
  const side = turned ? back : front
  return (
    <button
      type="button"
      ref={frame}
      className={`${c("ch-twoSided")} ${className}`}
      style={{ aspectRatio: `${back.width} / ${back.height}` }}
      aria-label={`${side.alt} ${turned ? "Turn it back." : "Turn it over."}`}
      aria-pressed={turned}
      onClick={() => setTurned(now => !now)}
    >
      <span className={c("ch-sides")} data-turned={turned ? "true" : "false"}>
        {[front, back].map((each, index) => (
          <img
            key={each.name}
            className={c("ch-side", index ? "ch-sideBack" : "ch-sideFront")}
            src={`/images/stories/chess/${each.name}.webp`}
            srcSet={`/images/stories/chess/${each.name}-${each.small}.webp ${each.small}w, /images/stories/chess/${each.name}.webp ${each.width}w`}
            sizes={sizes}
            alt=""
            width={each.width}
            height={each.height}
            loading="lazy"
            decoding="async"
          />
        ))}
      </span>
    </button>
  )
}

// One thing on a pinned scene, there for some steps and gone for the rest.
// In the flow it leaves its place when gone; otherwise it fades where it is.
export const Show = ({ on, flow = false, className = "", children, style }) => (
  <div className={`${c(flow ? "ch-panel" : "ch-layer")} ${className}`} data-on={on ? "true" : "false"} style={style}>
    {children}
  </div>
)

// The current step is the last one whose card has reached the line — half way
// down beside the graphic, and near the bottom on a phone, where a card comes
// up under the graphic and counts once it is fully in view — read from the
// scroll position, so a jump lands on the right picture.
const useStep = count => {
  const refs = React.useRef([])
  const [step, setStep] = React.useState(0)
  React.useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * (window.matchMedia("(max-width: 60rem)").matches ? 0.88 : 0.5)
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

// A pinned scene: the graphic stays, and each card that passes sets its state.
// `children` draws the graphic for the step it is given.
export const Pinned = ({ label, steps, children }) => {
  const [step, stepRef] = useStep(steps.length)
  return (
    <section className={c("ch-pin")} aria-label={label}>
      <div className={c("ch-stage")}>
        <div className={c("ch-scene")}>{children(step)}</div>
      </div>
      <div className={c("ch-steps")}>
        {steps.map((content, index) => (
          <div
            key={index}
            className={c("ch-step")}
            data-step={index}
            data-on={step === index ? "true" : "false"}
            ref={stepRef(index)}
          >
            <div className={c("ch-card")}>{content}</div>
          </div>
        ))}
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
