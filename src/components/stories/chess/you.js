"use client"

import * as React from "react"

import { lookUp, MIN_GAMES } from "./chesscom"
import { c, Text } from "./parts"
import { useTell } from "./reader"

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
