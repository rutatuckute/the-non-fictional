"use client"

import * as React from "react"

import { Chapters, Mark } from "./chapters"
import { c, Holder, Text, Words } from "./parts"
import { People, Reveal, Say, Wrong } from "./scenes"
import { Knots, Thread } from "./thread"
import { Origin } from "./origin"
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
const LINES = {
  open: {
    a: [[86, 0, 96, 0], [90, 32, 98, 34], [87, 64, 96, 68, "from"], [80, 99, 95, 99]],
    "other-1": [[70, 0, 95, 0], [76, 34, 96, 34], [75, 99, 95, 99]],
    "other-2": [[96, 0, -5, 0], [98, 30, -5, 30], [96, 99, -5, 99]],
  },
  memory: {
    a: [[78, 2, -3, 2, "to"], [76, 52, -3, 52], [72, 74, -3, 74], [-2, 99, -3, 99]],
    "other-1": [[78, 5, 95, 5], [88, 48, 100, 48], [105, 82, 110, 82]],
    "other-2": [[96, 5, -5, 5], [103, 42, -10, 42], [110, 70, -14, 70]],
  },
  years: {
    a: [[-2, 0, -3, 0], [-2.5, 50, -3, 50], [24, 100, -3, 100]],
  },
  wooden: {
    a: [[25, 0, -3, 0], [25, 50, -3, 50], [44, 100, -3, 100]],
  },
  online: {
    a: [[45, 0, -3, 0], [44, 28, -3, 28], [44, 60, -3, 60], [44, 100, -3, 100]],
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

  return (
    <Words.Provider value={words}>
      <div className={c("ch-story")}>
        <Chapters chapters={CHAPTERS} />
        <Thread />

        <Origin title={title} lines={LINES} />
        <section className={c("ch-firstChapter")} aria-label="The years and the wooden set">
          <div className={c("ch-years")}>
            <Text name="years" className={c("ch-yearsText")} />
            <Knots of={LINES.years} />
          </div>
          <Wooden lines={LINES.wooden} />
        </section>
        <People lines={LINES.online} />

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
