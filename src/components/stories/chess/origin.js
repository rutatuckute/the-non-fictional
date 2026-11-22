"use client"

import * as React from "react"

import { Mark } from "./chapters"
import { useFollow, useStill } from "./follow"
import { c, Picture, Text } from "./parts"
import { Knots } from "./thread"

// One object, first glimpsed, then remembered, then folded shut. The copy is
// ordinary page content; only the object follows the scroll.
export const Origin = ({ title, lines }) => {
  const root = React.useRef(null)
  const device = React.useRef(null)
  const still = useStill()
  const goal = () => -root.current.getBoundingClientRect().top / window.innerHeight
  const paint = t => {
    const narrow = window.matchMedia("(max-width: 60rem)").matches
    const within = (from, to) => Math.max(0, Math.min(1, (t - from) / (to - from)))
    const reveal = still ? 1 : within(0.05, 0.5)
    const close = narrow ? within(0.24, 0.55) : within(0.72, 1.03)
    device.current.style.setProperty("--peek", (1 - reveal).toFixed(4))
    device.current.style.setProperty("--fold", `${still ? (close >= 0.5 ? 180 : 0) : close * 180}deg`)
    device.current.dataset.closed = close >= 0.5 ? "true" : "false"
    device.current.dataset.folded = close >= 0.99 ? "true" : "false"
    device.current.setAttribute("aria-label", close >= 0.5 ? "The Pocket Micro folds shut, its dark outer cover facing us." : "A Chess King Pocket Micro: a pocket chess computer with flat round pieces, a keypad and a tiny display.")
    // No spatial travel with reduced motion; the two states replace each other.
    device.current.dataset.still = still ? "true" : "false"
    device.current.dataset.narrow = narrow ? "true" : "false"
  }
  useFollow(goal, paint, { still, watch: root })

  return (
    <section className={c("ch-origin")} ref={root} aria-label="The first memory">
      <Mark id="the-thread" />
      <div className={c("ch-pocketTrack")}><div className={c("ch-pocketStage")}>
        <div className={c("ch-pocket")} ref={device} role="img" aria-label="A Chess King Pocket Micro pocket chess computer.">
          <div className={c("ch-pocketRight")}><Picture name="device" alt="" width={800} height={1231} small={480} sizes="(max-width: 60rem) 72vw, 400px" /></div>
          <div className={c("ch-pocketFlap")}>
            <div className={c("ch-pocketFront")}><Picture name="device" alt="" width={800} height={1231} small={480} sizes="(max-width: 60rem) 72vw, 400px" /></div>
            <div className={c("ch-pocketBack")}>
              <Picture name="device-closed" alt="" width={900} height={1277} small={480} sizes="(max-width: 60rem) 72vw, 400px" />
            </div>
          </div>
        </div>
      </div></div>
      <header className={c("ch-open")}>
        <h1 className={c("ch-title")} itemProp="headline">{title}</h1>
        <Text name="opening" look="large" />
        <Knots of={lines.open} />
      </header>
      <div className={c("ch-memory")}>
        <div className={c("ch-mine")}>
          <Text name="mine" look="headline" />
          <Text name="mine-one" look="quiet" />
        </div>
        <div className={c("ch-told2")}>
          <Text name="memory" look="medium" />
          <Text name="memory-aside" look="quiet" />
        </div>
        <Knots of={lines.memory} />
      </div>
    </section>
  )
}
