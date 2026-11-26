"use client"

import * as React from "react"

import { CLUB_REST, ClubBoard } from "./club"
import { Dive } from "./dive"
import { c, Pinned, Show, Text, useNarrow } from "./parts"
import { RatingStory } from "./ratings"
import { NameAsks, NameScore } from "./say"
import { useReader, useTell } from "./reader"
import { YouOnChessCom } from "./you"
import { GROUPS, crowdStage } from "./crowd"

// The pinned scenes of the chess story: the club in London (Part II), and the
// three questions put to the data. Where a graphic is not made yet, a box says
// what will stand there; each is replaced as its part is built.

// What the scene shows at each step: the club's board, as the London System
// is set up and the professor leans in; his question, alone; "How did he
// know?", alone; the board again; the central question, alone; the board
// among the thousand games.
const VIEWS = ["club", "club", "quiet", "quiet", "club", "quiet", "many", "many", "many"]

// How a game ended, for the tiny board under the reader's pointer.
const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const noteOf = ([day, result, how, colour, kind, rating]) =>
  `${LONG.format(new Date(day))} · ${result === "drew" ? `drawn (${how})` : `${result} ${how === "on time" ? how : `by ${how}`}`} · ${colour === "w" ? "White" : "Black"} · ${kind} · opponent ${rating}`

// The thousand boards (boards.webp: 37 by 27, the middle place left for the
// club's board). Pointing at one, or tapping it, says what game it was.
const COLS = 37
const ROWS = 27
const MIDDLE = ((ROWS - 1) / 2) * COLS + (COLS - 1) / 2
// Where the reader's own place goes, once they have given their username: one
// board beside the club's, drawn over one of hers.
const YOUR_COL = (COLS - 1) / 2 + 3
const YOUR_ROW = (ROWS - 1) / 2 + 1
const YOURS = YOUR_ROW * COLS + YOUR_COL
const Boards = () => {
  const [note, setNote] = React.useState(null)
  const found = useReader().chesscom
  const notes = React.useRef(null)
  const look = event => {
    const box = event.currentTarget.getBoundingClientRect()
    const col = Math.floor(((event.clientX - box.left) / box.width) * COLS)
    const row = Math.floor(((event.clientY - box.top) / box.height) * ROWS)
    const place = row * COLS + col
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS || place === MIDDLE) return setNote(null)
    if (found && place === YOURS) {
      const games = found.rapid.games + found.bullet.games
      return setNote({ text: `You, on Chess.com · ${games.toLocaleString("en-GB")} rapid and bullet games`, x: event.clientX - box.left, y: event.clientY - box.top, w: box.width })
    }
    const index = place > MIDDLE ? place - 1 : place
    const show = list => setNote({ text: noteOf(list[index]), x: event.clientX - box.left, y: event.clientY - box.top, w: box.width })
    if (notes.current) show(notes.current)
    else
      fetch("/images/stories/chess/board-notes.json")
        .then(response => response.json())
        .then(data => show((notes.current = data.notes)))
        .catch(() => {})
  }
  return (
    <div className={c("ch-minisBox")} onPointerMove={look} onPointerDown={look} onPointerLeave={() => setNote(null)}>
      <img
        src="/images/stories/chess/boards.webp"
        alt="Hundreds of tiny chessboards in a grid: how the author’s last thousand games ended, her pieces in clay, her opponents’ in ivory. Point at one to see the game."
        width={1776}
        height={1296}
        decoding="async"
      />
      {found ? (
        <span
          className={c("ch-yourBoard")}
          aria-hidden="true"
          style={{ left: `${(YOUR_COL / COLS) * 100}%`, top: `${(YOUR_ROW / ROWS) * 100}%`, width: `${100 / COLS}%`, height: `${100 / ROWS}%` }}
        >
          <i />
        </span>
      ) : null}
      {note ? (
        <span className={c("ch-boardNote")} style={{ left: Math.min(note.x, note.w - 230), top: note.y }} role="status">
          {note.text}
        </span>
      ) : null}
    </div>
  )
}

// Part II after the strangers (who are on the phone in wooden.js): the club in
// London, where the London System is set up and the professor leans in; his
// question, the story's turn, alone and quiet; what it might have meant; the
// question the rest of the story asks; and the thousand games the data holds.
export const People = () => {
  // (on a phone the last step stands taller, so it needs less rest after the zoom)
  const narrow = useNarrow()
  return (
  <Pinned
    open
    reading
    className={c("ch-club")}
    overlay={<Dive during={8} />}
    label="The professor at the London chess club"
    steps={[
      // the London System is set up on the board while this step's stretch passes
      { text: <Text name="club" look="lead" />, rest: CLUB_REST },
      { text: <Text name="professor" look="lead" /> },
      // his question, then "How did he know?", then the central question: each alone, in the scene
      {},
      {},
      { text: <Text name="professor-maybe" look="lead" /> },
      {},
      { text: <Text name="boards" look="lead" /> },
      // the hinge: Chess.com keeps every game, so the reader's are in there too
      { text: <YouOnChessCom where="hinge" />, rest: 0.4 },
      { mark: "the-investigation", rest: narrow ? 1.7 : 2.6 },
    ]}
  >
    {step => (
      <>
        <div className={c("ch-games")}>
          {/* How the author's last 998 games ended, each a tiny board
              (scripts/stories/chess/make-boards.cjs); the middle place is the
              club's. */}
          <Show on={step >= 6} className={c("ch-minis")}>
            <Boards />
          </Show>
          <div className={c("ch-boardwrap")} data-view={VIEWS[step]}>
            {/* The club: its own board, pink and white. The two players are
                hands (club.js); the professor, who leans in once the opening is
                played, is the scene's one figure. */}
            <Show on={step >= 1 && step <= 5} className={c("ch-professor")}>
              <img
                src="/images/stories/chess/professor.webp"
                srcSet="/images/stories/chess/professor-300.webp 300w, /images/stories/chess/professor.webp 520w"
                sizes="(max-width: 60rem) 45vw, 380px"
                alt="An older man in a dark jacket, seen from behind, bows over the board, his hands clasped behind his back."
                width={520}
                height={778}
                decoding="async"
              />
            </Show>
            <Show on className={c("ch-clubBoard")}>
              <ClubBoard during={0} />
            </Show>
            <Show on={step === 0} className={c("ch-place")}>
              <svg viewBox="0 0 10 14" aria-hidden="true">
                <path d="M5 0.6a4.2 4.2 0 0 0-4.2 4.2C0.8 8 5 13.4 5 13.4S9.2 8 9.2 4.8A4.2 4.2 0 0 0 5 0.6Zm0 5.9a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
              </svg>
              London
              <span>early 2026</span>
            </Show>
          </div>
        </div>
        {/* The turn of the story, each alone and quiet: everything else dims. */}
        <Show on={step === 2} className={c("ch-big")}>
          <Text name="professor-quote" look="statement" />
        </Show>
        <Show on={step === 3} className={c("ch-big")}>
          <Text name="professor-how" look="large" />
        </Show>
        <Show on={step === 5} className={c("ch-big")}>
          <Text name="central" look="statement" />
        </Show>
      </>
    )}
  </Pinned>
  )
}

// Part III, first question: what we say about ourselves. Her own prediction
// against her games, then what usernames say against the ratings of the
// opponents you meet (say.js, from real games). Its words scroll beside the
// graphic, as everywhere since Part I.
// Reserve the tallest passage above the chart on phones. Measuring all passages
// keeps the graphic in one place as the words change, including at larger text sizes.
const SayGraphics = ({ step, revealed }) => {
  const box = React.useRef(null)
  const narrow = useNarrow()
  React.useLayoutEffect(() => {
    const pin = box.current.closest("section")
    const copies = pin.querySelectorAll(`.${c("ch-told")} > div`)
    const measure = () => pin.style.setProperty("--say-copy", `${Math.max(0, ...Array.from(copies, el => el.getBoundingClientRect().height))}px`)
    const observer = new ResizeObserver(measure)
    copies.forEach(el => observer.observe(el))
    measure()
    return () => observer.disconnect()
  }, [narrow])
  return (
    <div ref={box} className={c("ch-stack", "ch-sayGraphics")}>
      <RatingStory step={step} revealed={revealed} />
    </div>
  )
}

export const Say = () => {
  // What the reader guessed for each kind of username (this reading only).
  const [guesses, setGuesses] = React.useState({})
  useTell("names", guesses)
  const guess = (key, value) => setGuesses(all => ({ ...all, [key]: value }))
  return (
    <section className={c("ch-saySection")} aria-label="Claims and evidence">
      <Pinned
        reading
        className={c("ch-sayPin")}
        label="What we say about ourselves"
        steps={[
          { text: <Text name="say-message" look="lead" className={c("ch-messageCopy")} /> },
          { text: <Text name="say-claim" look="lead" />, rest: 0.25 },
          { text: <Text name="say-isolation" look="lead" /> },
          { text: <Text name="say-prediction" look="lead" /> },
          { rest: 0.1 },
          { text: <Text name="say-crowd" look="lead" /> },
          { text: <Text name="say-perspective" look="lead" /> },
          { text: <Text name="say-pace" look="lead" /> },
          { text: <Text name="say-hurry" look="lead" />, rest: 0.25 },
          { text: <Text name="say-others" look="lead" className={c("ch-messageCopy")} />, rest: 0.3, anchor: "what-names-say" },
          { text: <><Text name="say-guess" look="lead" /><NameAsks guesses={guesses} onChange={guess} /></>, rest: 0.2 },
          { text: <><NameScore guesses={guesses} /><Text name="say-surprise" look="lead" /></>, rest: 0.1 },
          { text: <Text name="say-road" look="lead" /> },
          { text: <Text name="say-me" look="lead" />, rest: 0.15 },
          { text: <Text name="say-giveup" look="lead" />, rest: 0.35 },
        ]}
      >
        {step => {
          // A row opens when its guess is made, and every row once the result is read.
          const all = ["all", "me", "giveup"].includes(crowdStage(step))
          const revealed = Object.fromEntries(GROUPS.map(g => [g.key, all || Boolean(guesses[g.key])]))
          return <SayGraphics step={step} revealed={revealed} />
        }}
      </Pinned>
    </section>
  )
}

