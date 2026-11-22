"use client"

import * as React from "react"

import { Chapters, Mark } from "./chapters"
import { c, Holder, Picture, Text, Words } from "./parts"
import { Device } from "./origin"
import { People, Reveal, Say, Wrong } from "./scenes"
import { Knots, Thread } from "./thread"
import { Wooden } from "./wooden"

// The chess story is the whole piece: one continuous scroll in four parts,
// with threads running through it.
//
//   Opening   one screen: the question, and several grey threads coming down
//   I         free scroll: the memory, where one thread takes its colour; the
//             years; the board; the obsession
//   II        one pinned scene: the people behind the game
//   III       the investigation: three pinned questions, then what stays unknown
//   IV        free scroll, short: the message, and the other threads back
//
// Its words come from the body, each step by name (see scripts/stories/chess).
// It is built part by part: where a picture or a chart is not made yet, a box
// says what will stand there.

// Where the threads run, stretch by stretch of the page. "a" and "b" are the
// story's own thread; the others are the rest of a life, unnamed. Each comes
// and goes in its own time — one leaves the opening by the screen's edge, one
// arrives in the 2000s, one crosses the story's thread in the 2010s — and none
// of them ends: they go on beyond the frame. Only the story's thread is
// followed, behind the board and on to the games.
//
// A point is [x, y] in percent of its stretch, then the same on a phone, where
// the words take the whole width and a thread passes them in the margin or
// off the screen. "mark" shows a bead; "from" and "to" are where the story's
// thread turns from grey to its colour.
// The chapters, for the navigation beside the story (chapters.js). Each `id`
// is a mark in the page, set where that chapter is to be opened.
const CHAPTERS = [
  { id: "the-thread", label: "The thread" },
  { id: "the-people", label: "The people" },
  {
    id: "the-investigation",
    label: "The investigation",
    parts: [
      { id: "what-we-say", label: "What we say" },
      { id: "when-things-go-wrong", label: "When things go wrong" },
      { id: "what-we-choose", label: "What we choose" },
    ],
  },
  { id: "the-ending", label: "The ending" },
  { id: "method-and-data", label: "Method & data" },
]

// Beyond the screen's edge, whatever the window's width: the column is centred in it.
const OFF_LEFT = "calc(50% - 60vw)"
const OFF_RIGHT = "calc(50% + 60vw)"
const LINES = {
  open: {
    a: [[58, 0, 40, 0], [74, 16, 108, 22], [89.5, 36, 108, 50], [91, 66, 108, 74, "from"], [72, 90, 76, 92]],
    "other-1": [[12, 0, 8, 0], [50, 14, 70, 14], [85, 32, 108, 30], [86.5, 68, 108, 80], [60, 94, 84, 96]],
    "other-2": [[36, 0, 70, 0], [66, 12, 108, 12], [93.5, 34, 112, 34], [95, 70, 112, 70], [82, 96, 112, 96]],
    "other-4": [[106, 10, -10, 40], [98, 38, -10, 60], [99, 74, -10, 80]],
    "other-5": [[106, 46, 100, 0], [101.5, 62, 88, 12], [102.5, 86, 108, 24]],
  },
  memory: {
    a: [[47, 6, 82, 5, "to"], [45.5, 45, 40, 30], [46, 80, -3, 72], [46, 97, -3, 99]],
    "other-1": [[38, 3, 96, 10], [30, 32, 107, 36], [26, 100, 107, 99]],
    "other-2": [[53, 28, 108, 30], [52, 60, 108, 50], [52.5, 96, 108, 80]],
    "other-4": [[101.5, 20, -10, 30], [102, 96, -10, 80]],
    "other-5": [[106, 8, 112, 8]],
  },
  // The years between are a short stretch, with no bead on the story's thread:
  // no chess. The others keep clear of the few words there (right of the
  // thread from 28% to 40% down; on a phone, right of it from 38% to 54%).
  // The years between are a short stretch, with no bead on the story's thread:
  // no chess. Its two lines are the chapter's largest words, at the left from
  // about 18% to 48% down (on a phone, the whole width from 26% to 46%); the
  // threads keep to the right of them, and on a phone to the margins.
  years: {
    a: [[50, 3, 18, 4], [66, 12, 60, 14], [72, 30, 102, 26], [70, 50, 102, 46], [54, 70, 40, 62], [50, 99, 5, 97]],
    "other-1": [[36, 4, 70, 3], [58, 10, 30, 7], [78, 22, -6, 13], [82, 40, -6, 30], [66, 60, -6, 52], [57, 80, 11, 80], [60.5, 96, 9, 96]],
    "other-2": [[55, 6, 108, 2], [64, 12, 40, 9], [86, 17, 31.5, 16], [106, 22, 60, 20], [108, 30, 100, 22], [108, 40, 110, 24], [108, 50, 110, 36]],
    "other-4": [[74, 3, -8, 5], [90, 16, -6, 20], [94, 44, -6, 50], [86, 76, 6, 78], [78, 95, -8, 99]],
    "other-6": [[-6, 56, -8, 60], [16, 60, 12, 68], [30, 66, 24, 78], [36, 76, 22, 86], [37, 86, 14, 93], [34, 97, 9, 99]],
  },
  // The wooden set is pinned: its stretch is several screens long, and the
  // board and the words stay on screen while the stretch passes behind them.
  // So the other threads leave by the screen's edge in the first screen and
  // stay out; only the story's thread is there, coming down the screen and in
  // behind the board (on a phone, at the far left, clear of the words above
  // the board). It ends under the scene's own ground, which comes when the phone
  // does: from there the thread is the line that comes out of the phone.
  wooden: {
    a: [[30, 0.4, 5, 0.4], [24, 23.5, 5, 23.5], [22, 44, 5, 44], [23, 58, 5, 58], [22, 70, 5, 70]],
    "other-1": [[58, 0.5, 12, 0.3], [82, 1.6, OFF_LEFT, 2.2], [OFF_RIGHT, 2.9, OFF_LEFT, 30], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-4": [[90, 0.8, OFF_LEFT, 1], [OFF_RIGHT, 2.1, OFF_LEFT, 30], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-6": [[30, 0.8, 8, 0.2], [22, 3.1, OFF_LEFT, 2], [OFF_LEFT, 7, OFF_LEFT, 30]],
  },
  encounter: {
    b: [[3, 30, -3, 2], [6, 60, -3, 50], [8, 104, -3, 99]],
  },
  close: {
    b: [[9, 35, -3, 50], [10, 96, -3, 100]],
    "other-b1": [[-6, 30, -12, 20], [4, 70, -12, 60], [5.5, 99, -12, 90]],
    "other-b2": [[106, 10, 112, 10], [96, 50, 112, 50], [95, 99, 112, 90]],
    "other-b3": [[106, 62, 112, 62]],
  },
  onward: {
    b: [[16, 6, 2, 14], [38, 28, 16, 34], [46, 60, 36, 60], [48.5, 112, 42, 112]],
    "other-b1": [[22, 18, -8, 5], [40, 65, 20, 40], [41.5, 112, 28, 112]],
    "other-b2": [[76, 22, 108, 0], [57.5, 62, 75, 35], [55.5, 112, 62, 112]],
    "other-b3": [[86, 18, 108, 30], [64, 60, 80, 70], [62, 112, 72, 112]],
    "other-b4": [[-6, 5, -8, 30], [20, 36, 18, 50], [43, 56, 38, 68], [52, 80, 50, 88], [52.5, 112, 52, 112]],
  },
}

const ChessStory = ({ steps = [], names = [], title, date, dateLabel, form, minutes }) => {
  const words = React.useMemo(
    () => Object.fromEntries(names.map((name, index) => [name, steps[index]]).filter(([name]) => name)),
    [names, steps],
  )
  // What the reader answered, kept for the step that shows the result.
  const [guesses, setGuesses] = React.useState({})
  const guess = key => ({ value: guesses[key], onChange: value => setGuesses(all => ({ ...all, [key]: value })) })
  const opening = React.useRef(null)

  return (
    <Words.Provider value={words}>
      <div className={c("ch-story")}>
        <Chapters chapters={CHAPTERS} />
        <Thread />

        {/* The title and a short text at the left, the cover at the right;
            then the story begins. */}
        <header className={c("ch-hero")}>
          <Mark id="the-thread" />
          <div className={c("ch-heroWords")}>
            <h1 className={c("ch-title")} itemProp="headline">
              {title}
            </h1>
            <Text name="intro" look="lead" className={c("ch-intro")} />
          </div>
          <Picture
            className={c("ch-cover")}
            name="cover"
            alt="Two hands over a pink and white chessboard, seen from above: an older man's in a tweed sleeve reaching for a black piece, a woman's with a signet ring at the near side. Behind them, a dark grid of tiny green and grey boards."
            width={1600}
            height={1067}
            small={800}
            sizes="(max-width: 60rem) 92vw, 640px"
          />
        </header>

        <div className={c("ch-open")} ref={opening}>
          <Text name="opening" look="large" />
          <Text name="opening-aside" look="aside" />
          <Knots of={LINES.open} />
        </div>

        <section className={c("ch-free")} aria-label="One of the threads in a life">
          {/* The memory, under its decade. One thread takes its colour as
              it reaches the words: this one. The device, first glimpsed at
              the opening's right, comes to its place here (origin.js). */}
          <div className={c("ch-row", "ch-memory")}>
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "0px", "--pat": "-14px" }}>
              2000s
            </span>
            <div className={c("ch-mine")}>
              <Text name="mine" look="headline" />
              <Text name="mine-one" look="quiet" />
            </div>
            <Device opening={opening} />
            <div className={c("ch-col", "ch-told2")}>
              <Text name="memory" look="medium" />
              <Text name="memory-aside" look="quiet" />
            </div>
            <Knots of={LINES.memory} />
          </div>

          {/* The years between, in brief: the thread runs bare among the
              others, and the 2020s come. */}
          <div className={c("ch-years")}>
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "74%", "--pat": "76%" }}>
              2020s
            </span>
            <Text name="years" className={c("ch-yearsText")} />
            <Knots of={LINES.years} />
          </div>

          {/* The wooden set: different stages of life, the same game. It is
              held on screen while it turns over to the board and a game is
              played on it (wooden.js). The story's thread passes behind it;
              the others pass it by. */}
          <Wooden lines={LINES.wooden} />
        </section>

        {/* Part II: its name stays at the top of the screen for the whole of it. */}
        <section className={c("ch-people")}>
          <Text name="people-title" look="partTitle" className={c("ch-peopleTitle")} />
          <People />
        </section>

        <section className={c("ch-turn")} aria-label="Looking for answers in the data">
          <Mark id="the-investigation" />
          <Text name="data-intro" />
        </section>
        <Say />
        <Wrong guess={guess("resign")} />
        <Reveal />
        <section className={c("ch-free", "ch-unknown")} aria-label="What we cannot know">
          <Text name="unknown" />
          <div className={c("ch-two")}>
            <Text name="unknown-showed" />
            <Text name="unknown-cannot" />
          </div>
        </section>

        <section className={c("ch-free", "ch-back")} aria-label="Back to the threads of life">
          <Mark id="the-ending" />
          <div className={c("ch-row", "ch-encounter")}>
            <Holder className={c("ch-chat")} label="The message" ratio="4 / 3" />
            <Text name="encounter" className={c("ch-col")} />
            <Knots of={LINES.encounter} />
          </div>
          <div className={c("ch-row", "ch-close")}>
            <div className={c("ch-col")}>
              <Text name="continuing" />
              <Text name="last-question" look="large" />
            </div>
            <Knots of={LINES.close} />
          </div>
          {/* The other threads are back, and none of them ends: together they
              go on past the end of the story. */}
          <div className={c("ch-onward")}>
            <Knots of={LINES.onward} />
          </div>
        </section>

        <section className={c("ch-method")} aria-label="Method and data">
          <Mark id="method-and-data" />
          <p className={c("ch-storyMeta")}>
            <time dateTime={date || undefined} itemProp="datePublished">{dateLabel}</time>
            {form ? ` · ${form}` : ""}{minutes ? ` · ${minutes} min read` : ""}
          </p>
          <Text name="method" />
        </section>
      </div>
    </Words.Provider>
  )
}

export default ChessStory
