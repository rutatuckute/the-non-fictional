"use client"

import * as React from "react"

import { lookUp, MIN_GAMES } from "./chesscom"
import { curveOf, MIN_DIALS, readDials } from "./dials"
import { c, Text } from "./parts"
import { countQueens } from "./queens"
import { useReader, useTell } from "./reader"
import paths from "./wrong-paths.json"

// At the start of Part III, an optional box: a reader who plays on Chess.com
// gives their username and is drawn in the charts as a green dot beside hers
// (ratings.js), and in the recap (hub.js). Only on a press of the button is
// Chess.com asked (chesscom.js); what comes back stays in this reading.

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" })
const YEAR = 365 * 24 * 3600 * 1000
const old = f => (f.date && Date.now() - f.date > YEAR ? ` (last played ${MONTH.format(f.date)})` : "")

const say = state => {
  switch (state.kind) {
    case "asking":
      return "Asking Chess.com…"
    case "found":
      return `Found ${state.username}: rapid ${state.rapid.rating}${old(state.rapid)}, bullet ${state.bullet.rating}${old(state.bullet)}. You’re the green dot in the first chart.`
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

export const YouOnChessCom = () => {
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
  // the button says so only while the box still holds the name that was found
  const current = found && typed.trim() === state.username
  return (
    <section className={c("ch-you")} aria-labelledby={`${id}-label`} data-found={found ? "true" : "false"}>
      <Text name="you-chesscom" look="lead" className={c("ch-youWords")} />
      <form className={c("ch-youForm")} onSubmit={submit} noValidate>
        <label id={`${id}-label`} htmlFor={`${id}-name`} className={c("ch-youLabel")}>
          Your Chess.com username
        </label>
        <div className={c("ch-youRow")}>
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
        <p id={`${id}-note`} className={c("ch-youNote")}>
          Read from Chess.com’s public data, in your browser. Nothing is sent to this site or saved: it’s gone when you close the page. Any public username works.
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
const times = n => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`)
const sayQueens = (state, month) => {
  switch (state.kind) {
    case "asking":
      return month ? `Reading your games on Chess.com… ${MONTH.format(month)}` : "Asking Chess.com…"
    case "counted": {
      const gave = state.resigned + state.left
      const start = `In your last ${state.games.toLocaleString("en-GB")} rapid games you lost your queen like this ${times(state.cases)}.`
      if (!state.on) return `${start} Every time, you gave up at once.`
      return `${start} You ${gave ? `gave up at once ${times(gave)}, ` : "never gave up at once, "}stayed ${times(state.on)} and saved ${state.saved}. Players at your level who stayed would have saved about ${Math.round(state.expected)}.`
    }
    case "few":
      return state.cases
        ? `In your last ${state.games.toLocaleString("en-GB")} rapid games you lost your queen like this only ${times(state.cases)}: too few to compare yet.`
        : `In your last ${state.games.toLocaleString("en-GB")} rapid games you never lost your queen like this.`
    case "none":
      return "No rapid games on Chess.com in the last 12 months, so nothing to count."
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

export const YourQueens = () => {
  const said = useReader()
  const found = said.chesscom
  const [state, setState] = React.useState({ kind: "idle" })
  const [month, setMonth] = React.useState(null)
  const pending = React.useRef(null)
  const id = React.useId()
  // (a count belongs to the name it was made for: a new name or none clears it)
  const name = found?.username || null
  React.useEffect(() => {
    pending.current?.abort()
    setState({ kind: "idle" })
  }, [name])
  React.useEffect(() => () => pending.current?.abort(), [])
  useTell("queens", state.kind === "counted" ? state : null)
  if (!found) return null

  const count = async () => {
    pending.current?.abort()
    const asking = new AbortController()
    pending.current = asking
    setMonth(null)
    setState({ kind: "asking" })
    try {
      const result = await countQueens(found.username, paths.queen.byLevel, asking.signal, date => setMonth(date))
      if (!asking.signal.aborted) setState(result)
    } catch {
      // a newer count, or a new name, took over
    }
  }
  const counted = state.kind === "counted"
  return (
    <div className={c("ch-youQueens")} data-kind={state.kind}>
      <Text name="you-queens" look="lead" className={c("ch-youQueensWords")} />
      <button type="button" className={c("ch-ask")} onClick={count} aria-pressed={counted} disabled={state.kind === "asking" || counted} aria-describedby={`${id}-note`}>
        <i aria-hidden="true" />
        {counted ? "Counted" : state.kind === "asking" ? "Counting…" : "Count my lost queens"}
      </button>
      <p className={c("ch-youStatus")} role="status" data-kind={state.kind}>
        {sayQueens(state, month)}
      </p>
      <p id={`${id}-note`} className={c("ch-youNote")}>
        Reads your rapid games of the last 12 months (up to 1,000) from Chess.com’s public data, in your browser: a few megabytes. Only the counts are kept, until you close the page.
      </p>
    </div>
  )
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

  const ask = async () => {
    if (!found) return
    pending.current?.abort()
    const asking = new AbortController()
    pending.current = asking
    setMonth(null)
    setState({ kind: "asking" })
    try {
      const result = await readDials(found.username, asking.signal, date => setMonth(date))
      if (!asking.signal.aborted) setState(result)
    } catch {
      // a newer reading, or a new name, took over
    }
  }
  return { found, state, month, read, curve, ask }
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

export const YourDials = ({ found, state, month, ask }) => {
  const id = React.useId()
  if (!found) return null
  const read = state.kind === "read"
  return (
    <div className={c("ch-youQueens", "ch-youDials")} data-kind={state.kind}>
      <Text name="you-dials" look="lead" className={c("ch-youQueensWords")} />
      <button type="button" className={c("ch-ask")} onClick={ask} aria-pressed={read} disabled={state.kind === "asking" || read} aria-describedby={`${id}-note`}>
        <i aria-hidden="true" />
        {read ? "In the charts" : state.kind === "asking" ? "Reading…" : "Put my games in"}
      </button>
      <p className={c("ch-youStatus")} role="status" data-kind={state.kind}>
        {sayDials(state, month)}
      </p>
      <p id={`${id}-note`} className={c("ch-youNote")}>
        Uses your rated ten-minute games among your rapid games of the last 12 months (up to 1,000), read from Chess.com’s public data in your browser, as for the lost queens. Nothing is kept once you close the page.
      </p>
    </div>
  )
}
