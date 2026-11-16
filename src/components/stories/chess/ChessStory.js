"use client"

import * as React from "react"

import { c, Holder, Picture, Text, Words } from "./parts"
import { People, Reveal, Say, Wrong } from "./scenes"
import { Knot, Knots, Thread } from "./thread"

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
const LINES = {
  open: {
    a: [[58, 0, 40, 0], [74, 16, 108, 22], [87, 36, 108, 50], [88.5, 66, 108, 74], [70, 90, 64, 90, "from"]],
    "other-1": [[12, 0, 8, 0], [50, 14, 70, 14], [82, 32, 108, 30], [84, 68, 108, 80], [58, 94, 84, 96]],
    "other-2": [[36, 0, 70, 0], [66, 12, 108, 12], [91, 34, 112, 34], [92.5, 70, 112, 70], [80, 96, 112, 96]],
    "other-4": [[106, 10, -10, 40], [96, 38, -10, 60], [97, 74, -10, 80]],
    "other-5": [[106, 46, 100, 0], [99, 62, 88, 12], [100.5, 86, 108, 24]],
  },
  memory: {
    a: [[46, 20, 30, 4], [45.5, 45, -3, 64, "to"], [46, 96, -3, 99]],
    "other-1": [[32, 6, 86, 12], [28, 50, 107, 36], [26, 100, 107, 99]],
    "other-2": [[53, 28, 108, 30], [52, 60, 108, 50], [52.5, 96, 108, 80]],
    "other-4": [[101.5, 20, -10, 30], [102, 96, -10, 80]],
    "other-5": [[106, 8, 112, 8]],
  },
  years: {
    a: [[50, 5, 18, 5], [51, 22, 19, 22, "mark"], [49, 45, 17.5, 45], [50.5, 63, 18.5, 63, "mark"], [49.5, 69, 18, 69, "mark"], [50.5, 87, 19, 87, "mark"], [50, 99, 18, 99]],
    "other-1": [[36, 6, 60, -3], [43.5, 20, 36, 6], [45, 38, 26, 20], [50, 50, 18, 50], [55.5, 62, 10.5, 62], [57, 80, 11, 80], [60.5, 96, 9, 96]],
    "other-2": [[55, 6, 108, 2], [57, 22, 40, 9], [56, 40, 31.5, 28], [62, 52, 33, 60], [84, 60, 60, 70], [106, 64, 108, 76]],
    "other-4": [[74, 12, -8, 5], [65, 30, 9, 12], [64, 56, 5.5, 50], [66, 80, 6, 78], [78, 95, -8, 99]],
    "other-6": [[-6, 28, -8, 56], [20, 33, 14, 64], [36, 41, 28, 74], [38.5, 58, 30, 84], [37, 80, 29, 92], [34, 97, 26, 99]],
  },
  wooden: {
    a: [[30, 4, 18, 2], [22, 50, 10, 30], [8, 98, -3, 60], [2, 104, -3, 100]],
    "other-1": [[50, 20, 12, 8], [49.5, 80, -8, 40]],
    "other-4": [[101.5, 15, -12, 20], [102, 70, -12, 60], [106, 96, -12, 90]],
    "other-6": [[30, 10, 24, 6], [22, 55, 60, 30], [-6, 80, 110, 45]],
  },
  obsession: {
    a: [[-2.5, 16, -2.5, 14], [-2.5, 52, -2.5, 50]],
    "other-1": [[80, 3, -12, 0], [106, 8, -12, 4]],
  },
  encounter: {
    b: [[3, 30, -3, 2], [6, 60, -3, 50], [8, 104, -3, 99]],
  },
  close: {
    b: [[9, 35, -3, 50], [11, 85, -3, 96]],
    "other-b1": [[-6, 20, -12, 20], [4, 55, -12, 60]],
    "other-b2": [[106, 10, 112, 10], [96, 50, 112, 50]],
    "other-b3": [[106, 62, 112, 62]],
  },
  onward: {
    b: [[38, 25, 10, 15], [46, 60, 36, 55], [48.5, 112, 42, 112]],
    "other-b1": [[30, 22, -8, 5], [40, 65, 20, 40], [41.5, 112, 28, 112]],
    "other-b2": [[70, 20, 108, 0], [57.5, 62, 75, 35], [55.5, 112, 62, 112]],
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
          {/* The memory. Beside it one thread takes its colour: this one. */}
          <div className={c("ch-row", "ch-memory")}>
            <Picture
              className={c("ch-device")}
              name="device"
              alt="A Chess King Pocket Micro, a pocket chess computer: a small board with flat round pieces, set up after the moves e4 and e5, above a keypad and a tiny display."
              width={800}
              height={1231}
              small={480}
              sizes="(max-width: 60rem) 72vw, 400px"
            />
            <Text name="memory" className={c("ch-col")} />
            <Knots of={LINES.memory} />
          </div>

          {/* The years between. The thread runs bare for long stretches, with
              a bead where a game was played, among the others. */}
          <div className={c("ch-years")}>
            {["2000s", "2010s", "2020s"].map((decade, index) => (
              <span
                key={decade}
                className={c("ch-decade")}
                data-reveal=""
                style={{ "--at": `${[10, 48, 96][index]}%`, "--pat": `${[6, 42, 95][index]}%` }}
              >
                {decade}
              </span>
            ))}
            <Text name="years" className={c("ch-aside", "ch-right")} style={{ "--at": "25%", "--pat": "15%" }} />
            <Text name="not-a-player" className={c("ch-aside", "ch-left")} style={{ "--at": "47%", "--pat": "51%" }} />
            <Knots of={LINES.years} />
          </div>

          {/* The wooden board: different stages of life, the same game. The
              story's thread passes behind it; the others pass it by. */}
          <div className={c("ch-row", "ch-wooden")}>
            <Picture
              className={c("ch-woodenBoard")}
              name="wooden-set"
              alt="A wooden travel chess set lying open: the pieces rest in hollows of green felt, the light ones in the left half and the dark ones in the right."
              width={1000}
              height={829}
              small={600}
              sizes="(max-width: 60rem) 72vw, 400px"
              lazy
            />
            <Text name="board" className={c("ch-col")} />
            <Knots of={LINES.wooden} />
          </div>

          <div className={c("ch-row", "ch-obsession")}>
            <Knots of={LINES.obsession} />
            <Text name="obsession" className={c("ch-c1")} />
            <Holder open className={c("ch-games")} label="Your games, one mark each" ratio="16 / 5" />
            <Text name="obsession-time" className={c("ch-c2")} />
            {/* Here the thread is the chart's own line: time on chess, rising. */}
            <Holder open className={c("ch-chart")} label="Time on chess and on social media" ratio="16 / 7">
              <Knot x={6} y={86} />
              <Knot x={40} y={74} />
              <Knot x={68} y={40} />
              <Knot x={94} y={22} />
            </Holder>
            <Text name="obsession-questions" className={c("ch-c3")} />
          </div>

          {/* The thread leads to the board of the next part. */}
          <div className={c("ch-row", "ch-enter")}>
            <Knot x={86} y={10} px={70} py={30} />
            <Knot x={70} y={128} px={50} py={128} />
          </div>
        </section>

        <People />

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
