"use client"

import * as React from "react"

import { c, Holder, Picture, Text, Words } from "./parts"
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
  // The years between are a short stretch: two beads, and the 2020s come.
  years: {
    a: [[50, 5, 18, 5], [51, 26, 19, 26, "mark"], [49, 48, 17.5, 48], [50.5, 70, 18.5, 70, "mark"], [50, 99, 18, 99]],
    "other-1": [[36, 6, 70, 3], [43.5, 20, 36, 8], [45, 38, 26, 20], [50, 50, 18, 50], [55.5, 62, 10.5, 62], [57, 80, 11, 80], [60.5, 96, 9, 96]],
    "other-2": [[55, 6, 108, 2], [57, 22, 40, 9], [56, 40, 31.5, 20], [57.5, 58, 34, 28], [66, 68, 70, 33], [88, 74, 100, 35], [106, 77, 110, 36]],
    "other-4": [[74, 12, -8, 5], [65, 30, 9, 12], [64, 56, 5.5, 50], [66, 80, 6, 78], [78, 95, -8, 99]],
    "other-6": [[-6, 28, -8, 56], [20, 33, 14, 64], [36, 41, 28, 74], [38.5, 58, 30, 84], [37, 80, 29, 92], [34, 97, 26, 99]],
  },
  // The wooden set is pinned: its stretch is several screens long, and the
  // board and the words stay on screen while the stretch passes behind them.
  // So the other threads leave by the screen's edge in the first screen and
  // stay out; only the story's thread is there, coming down the screen and in
  // behind the board (on a phone, at the left, clear of the words above the
  // board). It ends under the scene's own ground, which comes when the phone
  // does: from there the thread is the line that comes out of the phone.
  wooden: {
    a: [[30, 0.4, 18, 0.4], [24, 23.5, 12, 23.5], [22, 44, 12, 44], [23, 58, 12, 58], [22, 70, 12, 70]],
    "other-1": [[58, 0.5, 12, 0.3], [82, 1.6, OFF_LEFT, 2.2], [OFF_RIGHT, 2.9, OFF_LEFT, 30], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-4": [[90, 0.8, OFF_LEFT, 1], [OFF_RIGHT, 2.1, OFF_LEFT, 30], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-6": [[30, 0.8, 24, 0.3], [22, 3.1, OFF_LEFT, 2.6], [OFF_LEFT, 7, OFF_LEFT, 30]],
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
        <Thread />

        <header className={c("ch-open")}>
          <p className={c("ch-kicker")}>
            <time dateTime={date || undefined} itemProp="datePublished">
              {dateLabel}
            </time>
            {form ? ` · ${form}` : ""}
            {minutes ? ` · ${minutes} min` : ""}
          </p>
          <h1 className={c("ch-title")} itemProp="headline">
            {title}
          </h1>
          <Text name="opening" look="large" />
          <Knots of={LINES.open} />
        </header>

        <section className={c("ch-free")} aria-label="One of the threads in a life">
          {/* The memory, under its decade. One thread takes its colour as
              it reaches the words: this one. */}
          <div className={c("ch-row", "ch-memory")}>
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "0px", "--pat": "-14px" }}>
              2000s
            </span>
            <Text name="mine" look="headline" className={c("ch-mine")} />
            <Picture
              className={c("ch-device")}
              name="device"
              alt="A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display."
              width={800}
              height={1231}
              small={480}
              sizes="(max-width: 60rem) 72vw, 400px"
            />
            <Text name="memory" look="lead" className={c("ch-col")} />
            <Knots of={LINES.memory} />
          </div>

          {/* The years between, in brief: the thread runs bare, with a bead
              where a game was played, among the others, and the 2020s come. */}
          <div className={c("ch-years")}>
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "74%", "--pat": "72%" }}>
              2020s
            </span>
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
          <Text name="data-intro" />
        </section>
        <Say guess={guess("names")} />
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
          <Text name="method" />
        </section>
      </div>
    </Words.Provider>
  )
}

export default ChessStory
