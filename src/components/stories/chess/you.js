"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { lookUp, MIN_GAMES } from "./chesscom"
import { curveOf, MIN_DIALS, readDials } from "./dials"
import { useStill } from "./follow"
import { c, PinSteps, stepLine, Text } from "./parts"
import { countQueens, readRapid } from "./queens"
import { useReader, useTell } from "./reader"
import paths from "./wrong-paths.json"

// At the hinge between Parts II and III ("Chess.com keeps every game"), an optional box: a reader who plays on Chess.com
// gives their username and is drawn in the charts as a green dot beside hers
// (ratings.js), and in the recap (hub.js). Only on a press of the button is
// Chess.com asked (chesscom.js); what comes back stays in this reading.

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" })

const say = state => {
  switch (state.kind) {
    case "asking":
      return "Asking Chess.com…"
    case "found":
      return `Found ${state.username}! You’re the green dot in the charts now.`
    case "invalid":
      return "Chess.com usernames are 3 to 25 letters, digits, hyphens or underscores."
    case "missing":
      return `Chess.com has no player called “${state.username}”.`
    case "thin":
      return `Found ${state.username}, but with fewer than ${MIN_GAMES} rated ${state.short.join(" or ")} games there’s no dot to place yet.`
    case "busy":
      return "Chess.com is busy. Try again in a minute."
    case "unreachable":
      return "Couldn’t reach Chess.com just now. Try again in a moment."
    default:
      return ""
  }
}

// The reader's green dot at the hinge (28 Nov, owner): once found it waits
// beside the username box; when the reader scrolls on towards the dive into
// the boards, it hops into its own place among the thousand boards (scenes.js,
// data-you-board), and back to the box if they scroll up again. The two resting
// dots are shown or hidden by the pin's data-you-dot (home, flying, board); in
// between, one dot flies, drawn over the page.
const HOP = 720 // ms
// It leaves the box once the reader has scrolled on this far since the name was
// found; on a phone, where the box is held at the screen's foot over the boards,
// once the box has been pushed on and fades (its step's data-past, parts.js).
// At the latest, when the dive's step is LEAVE screens from its line.
const MOVED = 60 // px
const LEAVE = 0.3
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const centreOf = el => {
  const r = el?.getBoundingClientRect()
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width } : null
}
export const YouHop = ({ during }) => {
  const steps = React.useContext(PinSteps)
  const found = Boolean(useReader().chesscom)
  const still = useStill()
  const anchor = React.useRef(null)
  const flier = React.useRef(null)
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])
  React.useEffect(() => {
    const pin = anchor.current?.closest("section")
    if (!found || !pin || !flier.current) return
    let frame = 0
    let landed = null
    let hop = null
    const since = window.scrollY
    const dot = flier.current
    const show = where => {
      if (pin.dataset.youDot !== where) pin.dataset.youDot = where
    }
    const tick = time => {
      frame = 0
      const node = steps?.current?.[during]
      const homeDot = pin.querySelector("[data-you-home]")
      const home = centreOf(homeDot)
      const held = homeDot?.closest("[data-step]")
      const board = centreOf(pin.querySelector("[data-you-board]"))
      if (!node || !home || !board) return
      const on = held && held.dataset.past !== undefined ? held.dataset.past === "true" : window.scrollY > since + MOVED
      const go = on || (node.getBoundingClientRect().top - stepLine()) / window.innerHeight < LEAVE
      if (landed === null) landed = go
      else if (go !== landed) {
        landed = go
        const from = hop ? hop.at : landed ? home : board
        hop = still ? null : { from, start: time, at: from }
      }
      if (!hop) {
        show(landed ? "board" : "home")
        dot.style.opacity = "0"
        return
      }
      const to = landed ? board : home
      const t = Math.min(1, (time - hop.start) / HOP)
      const k = easeInOut(t)
      const far = Math.hypot(to.x - hop.from.x, to.y - hop.from.y)
      const at = {
        x: hop.from.x + (to.x - hop.from.x) * k,
        y: hop.from.y + (to.y - hop.from.y) * k - Math.min(140, far * 0.3) * 4 * t * (1 - t),
        size: hop.from.size + (to.size - hop.from.size) * k,
      }
      hop.at = at
      show("flying")
      dot.style.opacity = "1"
      dot.style.width = dot.style.height = `${at.size.toFixed(1)}px`
      dot.style.transform = `translate(${(at.x - at.size / 2).toFixed(1)}px, ${(at.y - at.size / 2).toFixed(1)}px)`
      if (t >= 1) hop = null
      frame = window.requestAnimationFrame(tick)
    }
    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(tick)
    }
    wake()
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    // (a phone's box is marked past in its own frame, after the scroll)
    const watch = new MutationObserver(wake)
    watch.observe(pin, { attributes: true, attributeFilter: ["data-past"], subtree: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      watch.disconnect()
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      delete pin.dataset.youDot
    }
  }, [found, still, steps, during])
  return (
    <>
      <span ref={anchor} hidden />
      {ready && found ? createPortal(<i ref={flier} className={c("ch-youFlier")} aria-hidden="true" />, document.body) : null}
    </>
  )
}

export const YouOnChessCom = ({ where }) => {
  const [typed, setTyped] = React.useState("")
  const [state, setState] = React.useState({ kind: "idle" })
  const pending = React.useRef(null)
  const id = React.useId()
  useTell("chesscom", state.kind === "found" ? state : null)
  React.useEffect(() => () => pending.current?.abort(), [])

  const submit = async event => {
    event.preventDefault()
    pending.current?.abort()
    const asking = new AbortController()
    pending.current = asking
    setState({ kind: "asking" })
    try {
      const result = await lookUp(typed, asking.signal)
      if (!asking.signal.aborted) setState(result)
    } catch {
      // a newer search took over
    }
  }
  const forget = () => {
    pending.current?.abort()
    setTyped("")
    setState({ kind: "idle" })
  }

  const found = state.kind === "found"
  // Once a name is found, their last year of rapid games is read, once, for the lost
  // queens and the four dials later on (queens.js keeps it for this reading); the
  // later steps then need no button. Progress is told here.
  const [reading, setReading] = React.useState({ kind: "idle" })
  const name = found ? state.username : null
  React.useEffect(() => {
    if (!name) {
      setReading({ kind: "idle" })
      return
    }
    const working = new AbortController()
    setReading({ kind: "reading", month: null })
    readRapid(name, working.signal, month => !working.signal.aborted && setReading({ kind: "reading", month }))
      .then(result => !working.signal.aborted && setReading({ kind: "done", games: result.kind === "ok" ? result.games.length : null }))
      .catch(() => {})
    return () => working.abort()
  }, [name])
  // (the later steps start once the read has been tried, whatever it came to)
  useTell("rapidRead", reading.kind === "done" ? name : null)
  // the button says so only while the box still holds the name that was found
  const current = found && typed.trim() === state.username
  return (
    <section className={c("ch-you")} aria-labelledby={`${id}-label`} data-found={found ? "true" : "false"} data-where={where}>
      <Text name="you-chesscom" look="lead" className={c("ch-youWords")} />
      <form className={c("ch-youForm")} onSubmit={submit} noValidate>
        <label id={`${id}-label`} htmlFor={`${id}-name`} className={c("ch-youLabel")}>
          Your Chess.com username
        </label>
        <div className={c("ch-youRow")}>
          {/* the reader's green dot waits here once they are found, and hops into
              the thousand boards as they scroll on (YouHop) */}
          <span className={c("ch-youField")}>
          {found && where === "hinge" ? <i className={c("ch-youHome")} data-you-home="" aria-hidden="true" /> : null}
          <input
            id={`${id}-name`}
            className={c("ch-youInput")}
            type="text"
            value={typed}
            onChange={event => setTyped(event.target.value)}
            maxLength={25}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-describedby={`${id}-status ${id}-note`}
            aria-invalid={state.kind === "invalid" ? "true" : undefined}
          />
          </span>
          <button type="submit" className={c("ch-ask")} aria-pressed={current} disabled={state.kind === "asking" || !typed.trim()}>
            <i aria-hidden="true" />
            {current ? "Found you" : "Show me"}
          </button>
          {found ? (
            <button type="button" className={c("ch-youForget")} onClick={forget}>
              Remove
            </button>
          ) : null}
        </div>
        <p id={`${id}-status`} className={c("ch-youStatus")} role="status" data-kind={state.kind}>
          {say(state)}
        </p>
        {found ? (
          <p className={c("ch-youStatus")} role="status" data-kind={reading.kind === "done" ? "counted" : "asking"}>
            {reading.kind === "done"
              ? reading.games == null
                ? "Couldn’t read your games just now: the later steps will say so."
                : `Read ${reading.games.toLocaleString("en-GB")} of your rapid games.`
              : reading.month
                ? `Reading your rapid games… ${MONTH.format(reading.month)}`
                : "Reading your rapid games…"}
          </p>
        ) : null}
        <p id={`${id}-note`} className={c("ch-youNote")}>
          Read from Chess.com’s public data, in your browser. Nothing is sent to this site or saved: it’s gone when you close the page. Any public username works. It reads your rapid games of the last 12 months (up to 1,000: a few megabytes) to count your lost queens and your dials later. No account? Keep scrolling: the story works without one.
        </p>
      </form>
    </section>
  )
}

// In "When things go wrong", beside her own lost queens: once the reader has
// been found above, a second, bigger look at Chess.com, again only on a press
// of the button: their rapid games of the last 12 months, counted with the
// sample's rules (queens.js). Only the counts are kept, for this reading;
// wrong.js draws them in green beside hers, hub.js says them in the recap.
export const YourQueens = () => {
  const said = useReader()
  const found = said.chesscom
  const [state, setState] = React.useState({ kind: "idle" })
  const pending = React.useRef(null)
  // (a count belongs to the name it was made for: a new name or none clears it)
  const name = found?.username || null
  React.useEffect(() => {
    pending.current?.abort()
    setState({ kind: "idle" })
  }, [name])
  React.useEffect(() => () => pending.current?.abort(), [])
  useTell("queens", state.kind === "counted" ? state : null)
  // counted on its own once the games have been read at the hinge (no button)
  const ready = Boolean(name) && said.rapidRead === name
  React.useEffect(() => {
    if (!ready || state.kind !== "idle") return
    const asking = new AbortController()
    pending.current = asking
    setState({ kind: "asking" })
    countQueens(name, paths.queen.byLevel, asking.signal, () => {})
      .then(result => !asking.signal.aborted && setState(result))
      .catch(() => {
        // a new name took over
      })
  }, [ready, state.kind, name])
  // (no words here any more, owner 27 Nov: the reader's count shows on the chart, in
  // green, and in the recap)
  return null
}

// In "What our choices reveal", at its first step: once the reader has been
// found above, their four dials and their own recognition game, from their
// ten-minute games (dials.js), again only on a press of the button. The games
// are the lost-queen count's: read once for both, so after that count this is
// at once. reveal.js draws the reader in green on the strips, in "find you"
// and on the curve; hub.js says it in the recap. The curve is worked out in
// the browser after the dials, a little at a time.
export const useYourDials = () => {
  const said = useReader()
  const found = said.chesscom
  const name = found?.username || null
  const [state, setState] = React.useState({ kind: "idle" })
  const [month, setMonth] = React.useState(null)
  const [curve, setCurve] = React.useState(null)
  const pending = React.useRef(null)
  React.useEffect(() => {
    pending.current?.abort()
    setState({ kind: "idle" })
    setCurve(null)
  }, [name])
  React.useEffect(() => () => pending.current?.abort(), [])
  const read = state.kind === "read" ? state : null
  // the curve, once the dials are in
  React.useEffect(() => {
    if (!read) return
    const working = new AbortController()
    setCurve(read.P.ns.map(() => null))
    curveOf(read.rows, read.rating, read.P, read.seed + 2, {
      signal: working.signal,
      onPoint: (i, v) => !working.signal.aborted && setCurve(all => all.map((x, j) => (j === i ? v : x))),
    })
    return () => working.abort()
  }, [read])
  const told = React.useMemo(
    () => (read ? { username: read.username, games: read.games, above: read.above, outside: read.outside, distAbove: read.distAbove, curve } : null),
    [read, curve],
  )
  useTell("dials", told)

  // read on its own once the games have been read at the hinge (no button)
  const ready = Boolean(name) && said.rapidRead === name
  React.useEffect(() => {
    if (!ready || state.kind !== "idle") return
    const asking = new AbortController()
    pending.current = asking
    setMonth(null)
    setState({ kind: "asking" })
    readDials(name, asking.signal, date => setMonth(date))
      .then(result => !asking.signal.aborted && setState(result))
      .catch(() => {
        // a new name took over
      })
  }, [ready, state.kind, name])
  return { found, state, month, read, curve }
}

const sayDials = (state, month) => {
  switch (state.kind) {
    case "asking":
      return month ? `Reading your games on Chess.com… ${MONTH.format(month)}` : "Asking Chess.com…"
    case "read":
      return `Read ${state.games.toLocaleString("en-GB")} of your ten-minute games. You’re the green dot on every line.`
    case "few":
      return state.games
        ? `Only ${state.games} rated ten-minute games in your last 12 months on Chess.com: the dials need ${MIN_DIALS}.`
        : "No rated ten-minute games in your last 12 months on Chess.com, so no dials to draw."
    case "missing":
      return `Chess.com has no games for “${state.username}”.`
    case "busy":
      return "Chess.com is busy. Try again in a minute."
    case "unreachable":
    case "invalid":
      return "Couldn’t read your games just now. Try again in a moment."
    default:
      return ""
  }
}

export const YourDials = ({ found, state, month }) => {
  if (!found) return null
  return (
    <div className={c("ch-youQueens", "ch-youDials")} data-kind={state.kind}>
      <Text name="you-dials" look="lead" className={c("ch-youQueensWords")} />
      <p className={c("ch-youStatus")} role="status" data-kind={state.kind}>
        {sayDials(state, month)}
      </p>
    </div>
  )
}
