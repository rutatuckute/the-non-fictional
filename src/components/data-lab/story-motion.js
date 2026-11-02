import * as React from "react"
import { flushSync } from "react-dom"

// Motion for the Data Lab story, kept apart from what the story says.
//
// Between beats, shared elements, run only when the reader acts (a click, a
// key, a swipe). An element that exists on both sides of a step carries the same
// name (shared("topic-cost")); the browser's View Transitions snapshot the old
// and new states and move each named element from its old box to its new one,
// while the rest of the stage cross-fades. One survey answer becomes its name
// in the field of concerns; that name becomes the heading of its debates; the
// followed debate opens into the chamber; the claim's questions become the
// chart's headers. Browsers without the API, and readers who ask for reduced
// motion, get the new state at once.

export const still = () =>
  typeof window === "undefined" ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

// The name a shared element carries on both sides of a transition. Names
// are page-wide, so each is prefixed; a falsy key gives no name.
export const shared = (key, group) =>
  key
    ? {
        viewTransitionName: `dl-${String(key).replace(/[^\w-]/g, "-")}`,
        ...(group ? { viewTransitionClass: `dl-${group}` } : {}),
      }
    : undefined

// Run a state change as a shared-element transition.
export const transition = update => {
  if (
    still() ||
    typeof document === "undefined" ||
    !document.startViewTransition
  ) {
    update()
    return
  }
  try {
    document.startViewTransition(() => flushSync(update))
  } catch {
    update()
  }
}

// The transition's timing: what is shared glides, everything else follows a
// little later or leaves a little sooner, so the eye stays on what remains.
// The concerns gather only once the followed one has started to move; the phone
// comes and goes on its own.
export const TRANSITION_CSS = `
::view-transition-group(*) {
  animation-duration: 620ms;
  animation-timing-function: cubic-bezier(0.22, 0.72, 0.2, 1);
}
::view-transition-old(root) {
  animation-duration: 240ms;
}
::view-transition-new(root) {
  animation-duration: 420ms;
  animation-delay: 160ms;
}
::view-transition-group(.dl-concern) {
  animation-delay: 110ms;
}
::view-transition-old(dl-phone):only-child {
  animation: 460ms cubic-bezier(0.4, 0, 0.6, 1) both dl-recede;
}
::view-transition-new(dl-phone):only-child {
  animation: 560ms cubic-bezier(0.22, 0.72, 0.2, 1) both dl-approach;
}
@keyframes dl-recede {
  to {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
}
@keyframes dl-approach {
  from {
    opacity: 0;
    transform: scale(0.86) translateY(18px);
  }
}
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
`

// A state that turns on after a delay once a beat is entered: the second
// half of a beat's own sequence (the answers, then their measure). At once
// with reduced motion. It never loops and never moves anything by itself:
// it only lets what the reader asked for finish arriving.
export const useArrived = (ms, key) => {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    if (still()) {
      setOn(true)
      return undefined
    }
    setOn(false)
    const t = setTimeout(() => setOn(true), ms)
    return () => clearTimeout(t)
  }, [ms, key])
  return on
}

// A number that counts up once, when it first appears
export const useCount = (to, delay = 0, ms = 700) => {
  const [v, setV] = React.useState(() => (still() ? to : 0))
  React.useEffect(() => {
    if (still()) {
      setV(to)
      return undefined
    }
    let raf = 0
    const t0 = performance.now() + delay
    const tick = now => {
      const t = Math.min(1, Math.max(0, (now - t0) / ms))
      setV(to * (1 - (1 - t) ** 3))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, delay, ms])
  return v
}

// The width of an element, kept current (for layouts computed in JS)
export const useWidth = ref => {
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) =>
      setW(Math.round(e.contentRect.width)),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}
