"use client"

import * as React from "react"

import { CLUB_REST, ClubBoard } from "./club"
import { c, Guess, Holder, Pinned, Show, Text } from "./parts"
import { Message } from "./phone-scenes"
import { RatingStory } from "./ratings"
import { Usernames } from "./say"

// The pinned scenes of the chess story: the club in London (Part II), and the
// three questions put to the data. Where a graphic is not made yet, a box says
// what will stand there; each is replaced as its part is built.

// What the scene shows at each step: the club's board, as the London System
// is set up and the professor leans in; his question, alone; "How did he
// know?", alone; the board again; the central question, alone; the board
// among the thousand games.
const VIEWS = ["club", "club", "quiet", "quiet", "club", "quiet", "many", "many"]

// How a game ended, for the tiny board under the reader's pointer.
const LONG = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
const noteOf = ([day, result, how, colour, kind, rating]) =>
  `${LONG.format(new Date(day))} · ${result === "drew" ? `drawn (${how})` : `${result} ${how === "on time" ? how : `by ${how}`}`} · ${colour === "w" ? "White" : "Black"} · ${kind} · opponent ${rating}`

// The thousand boards (boards.webp: 37 by 27, the middle place left for the
// club's board). Pointing at one, or tapping it, says what game it was.
const COLS = 37
const ROWS = 27
const MIDDLE = ((ROWS - 1) / 2) * COLS + (COLS - 1) / 2
const Boards = () => {
  const [note, setNote] = React.useState(null)
  const notes = React.useRef(null)
  const look = event => {
    const box = event.currentTarget.getBoundingClientRect()
    const col = Math.floor(((event.clientX - box.left) / box.width) * COLS)
    const row = Math.floor(((event.clientY - box.top) / box.height) * ROWS)
    const place = row * COLS + col
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS || place === MIDDLE) return setNote(null)
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
        alt="Hundreds of tiny chessboards in a grid: how the author’s last thousand games ended, her pieces in green, her opponents’ in ivory. Point at one to see the game."
        width={1776}
        height={1296}
        decoding="async"
      />
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
export const People = () => (
  <Pinned
    open
    reading
    className={c("ch-club")}
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
      { text: <Text name="self" look="lead" /> },
      { text: <Text name="boards" look="lead" /> },
    ]}
  >
    {step => (
      <>
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

const Rows = ({ rows, you = false }) => (
  <div className={c("ch-rows")} data-you={you ? "true" : "false"}>
    {rows.map((parts, index) => (
      <div key={index}>
        {parts.map((width, part) => (
          <i key={part} style={{ width: `${width}%` }} />
        ))}
      </div>
    ))}
  </div>
)

// Part III, first question: what we say about ourselves. Her own prediction
// against her games, then what usernames say against the ratings of the
// opponents you meet (say.js, from real games).
export const Say = () => (
  <section className={c("ch-saySection")} aria-label="Claims and evidence">
    <span id="what-we-say" className={c("ch-mark")} />
    <Pinned
      label="What we say about ourselves"
      steps={[
        <Text
          key="1"
          name="say-message"
          look="cardText"
          className={c("ch-messageCopy")}
        />,
        <Text key="timeline" name="say-isolation" look="cardText" />,
        { card: <Text name="say-prediction" look="cardText" />, rest: 0.45 },
        <Text key="widen" name="say-widen" look="cardText" />,
        <Text key="crowd" name="say-crowd" look="cardText" />,
        <Text key="perspective" name="say-perspective" look="cardText" />,
      ]}
    >
      {step => (
        <div className={c("ch-stack")}>
          <Show flow on={step === 0}>
            <Message />
          </Show>
          <div hidden={step < 1 || step > 5}>
            <RatingStory step={step} />
          </div>
        </div>
      )}
    </Pinned>
    <Usernames />
  </section>
)

// Second question: what we do when things go wrong.
export const Wrong = ({ guess }) => (
  <Pinned
    mark="when-things-go-wrong"
    label="What we do when things go wrong"
    steps={[
      <Text key="1" name="wrong-observation" look="cardText" />,
      <React.Fragment key="2">
        <Text name="wrong-decide" look="cardText" />
        <Guess
          label="Your decision"
          options={["Resign", "Play on"]}
          {...guess}
        />
      </React.Fragment>,
      <Text key="3" name="wrong-outcome" look="cardText" />,
      <Text key="4" name="wrong-crowd" look="cardText" />,
      <Text key="5" name="wrong-you" look="cardText" />,
    ]}
  >
    {step => (
      <div className={c("ch-stack")}>
        <Show flow on={step <= 2}>
          <div className={c("ch-board", "ch-boardSmall")} />
          <p className={c("ch-note")}>
            A real position: the queen has just been lost
            {step === 2 && guess.value
              ? ` · you chose to ${guess.value.toLowerCase()}`
              : ""}
          </p>
        </Show>
        <Show flow on={step >= 3}>
          <Rows
            rows={[
              [36, 14, 50],
              [46, 12, 42],
              [55, 9, 36],
              [65, 6, 29],
            ]}
          />
          <p className={c("ch-note")}>
            After losing the queen: resign, abandon, play on, by rating
          </p>
        </Show>
        <Show flow on={step === 4}>
          <Rows you rows={[[18, 2, 80]]} />
          <p className={c("ch-note")}>You</p>
        </Show>
      </div>
    )}
  </Pinned>
)

// Third question: what our choices reveal. It stays only if the games bear it out.
export const Reveal = () => (
  <Pinned
    mark="what-we-choose"
    label="What our choices reveal"
    steps={[
      <Text key="1" name="reveal-professor" look="cardText" />,
      <Text key="2" name="reveal-games" look="cardText" />,
      <Text key="3" name="reveal-style" look="cardText" />,
    ]}
  >
    {step => (
      <div className={c("ch-stack")}>
        <Show flow on={step === 0}>
          <div className={c("ch-board", "ch-boardSmall")} />
          <p className={c("ch-note")}>The professor’s board again</p>
        </Show>
        <Show flow on={step >= 1}>
          <Holder
            open
            label="Your games over time, the London System months marked"
            ratio="16 / 7"
          />
        </Show>
        <Show flow on={step === 2}>
          <Rows rows={[[34], [58]]} />
          <p className={c("ch-note")}>
            A measure of playing style, before and after
          </p>
        </Show>
      </div>
    )}
  </Pinned>
)
