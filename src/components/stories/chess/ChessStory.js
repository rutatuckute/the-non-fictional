"use client"

import * as React from "react"

import { c, Holder, Text, Words } from "./parts"
import { People, Reveal, Say, Wrong } from "./scenes"
import { Knot, Thread } from "./thread"

// The chess story is the whole piece: one continuous scroll in four parts,
// with a thread running through it.
//
//   Opening   one screen: the question, and the thread's first stretch
//   I         free scroll: the memory, the years, the board, the obsession
//   II        one pinned scene: the people behind the game
//   III       the investigation: three pinned questions, then what stays unknown
//   IV        free scroll, short: the message, and the thread leaving the page
//
// Its words come from the body, each step by name (see scripts/stories/chess).
// This is the skeleton: the scroll and the thread work, and every picture and
// chart is a box that says what will stand there.

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
          <Knot x={18} y={74} px={14} py={76} />
          <Knot x={20} y={97} px={16} py={98} />
        </header>

        <section className={c("ch-free")} aria-label="One of the threads in a life">
          <div className={c("ch-row", "ch-memory")}>
            <Holder className={c("ch-device")} label="The childhood chess device" ratio="5 / 9" />
            <Text name="memory" className={c("ch-col")} />
            <Knot x={39} y={38} px={60} py={22} />
            <Knot x={41} y={96} px={103} py={70} />
          </div>

          {/* Empty on purpose: the years pass, and only the thread crosses them. */}
          <div className={c("ch-row", "ch-years")}>
            <Knot x={72} y={30} px={78} py={24} />
            <Knot x={30} y={82} px={20} py={84} />
          </div>

          <div className={c("ch-row", "ch-recurring")}>
            <Holder className={c("ch-b1")} label="The wooden chessboard" ratio="4 / 3" />
            <Text name="recurring" className={c("ch-col")} />
            <Holder className={c("ch-b3")} label="A game, some other year" ratio="3 / 4" />
            <Holder className={c("ch-b2")} label="Another period, another opponent" ratio="1" />
            <Knot x={46} y={4} px={103} py={30} />
            <Knot x={46.5} y={52} px={30} py={66} />
            <Knot x={30} y={99} px={-3} py={99} />
          </div>

          <div className={c("ch-row", "ch-obsession")}>
            <Knot x={-2.5} y={16} py={14} />
            <Knot x={-2.5} y={52} py={50} />
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
            <Knot run="b" x={3} y={30} px={-3} py={2} />
            <Knot run="b" x={6} y={60} px={-3} py={20} />
            <Knot run="b" x={30} y={108} px={103} py={56} />
          </div>
          <div className={c("ch-row", "ch-close")}>
            <div className={c("ch-col")}>
              <Text name="continuing" />
              <Text name="last-question" look="large" />
            </div>
            <Knot run="b" x={10} y={55} px={103} py={40} />
          </div>
          {/* The thread does not end: it leaves by the edge of the screen. */}
          <div className={c("ch-row", "ch-exit")}>
            <Knot run="b" x={40} y={55} px={62} py={55} />
            <Knot run="b" x={112} y={82} px={125} py={86} />
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
