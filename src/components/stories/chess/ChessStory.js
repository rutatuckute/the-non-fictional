"use client"

import * as React from "react"

import { Chapters, Mark } from "./chapters"
import { c, Picture, Text, Words } from "./parts"
import { Device } from "./origin"
import { People, Say } from "./scenes"
import { Reveal } from "./reveal"
import { Hub } from "./hub"
import { ReaderProvider } from "./reader"
import { InvestigationHeader } from "./investigation-header"
import { Travellers } from "./travellers"
import { Chat } from "./phone-scenes"
import { Wrong } from "./wrong"
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
  // where the reader is asked for their Chess.com username, easy to come back to (28 Nov, owner)
  { id: "your-username", label: "Your username" },
  {
    id: "the-investigation",
    label: "The data",
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
// Three separated strands leave the cover. The author follows the memory;
// the reader's strand stays at the right, another life at the left. The
// story's original chess/no-chess tint remains.
const LINES = {
  cover: {
    "other-1": [[24, 97, 30, 97]],
    a: [[62, 97, 62, 97]],
    you: [[84, 97, 84, 97]],
  },
  open: {
    "other-1": [[-6, 0, -3, 0], [-7, 50, -3, 50], [-6, 100, -3, 100]],
    a: [[74, 0, 72, 0], [82, 28, 103.5, 16], [90, 65, 103.5, 60], [92, 100, 103.5, 100]],
    // the reader's strand stays in view, at the column's right edge, until the
    // years (27 Nov, owner: it left too soon to be noticed)
    you: [[96, 0, 96, 0], [98, 36, 101.5, 30], [98.5, 100, 101.5, 100]],
  },
  memory: {
    a: [[92, 0, 103.5, 0, "grey"], [88, 20, 96, 12], [48, 42, 80, 19], [26, 68, 50, 30, "clay"], [24, 100, 103.5, 60, "clay"]],
    "other-1": [[-6, 0, -3, 0], [-7, 50, -3, 50], [-6, 100, -3, 100]],
    you: [[98.5, 0, 101.5, 0], [99, 50, 101.5, 50], [98.5, 100, 101.5, 100]],
  },
  years: {
    // (on a phone it crosses between "Life went on." and "No chess.")
    a: [[24, 0, 103.5, 0], [44, 18, 100, 9], [64, 36, 62, 24, "grey"], [58, 54, 10, 40], [34, 78, 5, 70, "grey"], [26, 100, 5, 100]],
    "other-1": [[-6, 0, -3, 0], [-7, 50, -3, 50], [-6, 100, -3, 100]],
    // it leaves by the right edge before "No chess."
    you: [[98.5, 0, 101.5, 0], [104, 30, 106, 26], [110, 64, 112, 56], [112, 100, 112, 100]],
  },
  wooden: {
    a: [[26, 0.4, 5, 0.4, "clay"], [24, 23.5, 5, 23.5], [22, 44, 5, 44], [23, 58, 5, 58], [22, 70, 5, 70]],
    "other-1": [[-6, 0.4, -3, 0.3], [OFF_LEFT, 4, OFF_LEFT, 4], [OFF_LEFT, 60, OFF_LEFT, 60]],
    you: [[112, 0.4, 112, 0.3], [OFF_RIGHT, 4, OFF_RIGHT, 4], [OFF_RIGHT, 60, OFF_RIGHT, 60]],
  },
  // the first stretch of Part IV, above its title: the thread comes in from the recap
  arrive: {
    b: [[14, "7vh", 6, "7vh"]],
  },
  // Part IV: the reader's thread (kept at the opening) comes back beside the story's.
  // It left by the right edge of the screen during the years, so it comes back in by
  // the right edge (28 Nov, owner), crosses above the words, runs down between the
  // message and the words, and then goes beside the story's down the left, and on
  // together into the others
  encounter: {
    b: [[1, 30, -3, 2], [2, 60, -3, 50], [6, 104, -3, 99]],
    "you-back": [[OFF_RIGHT, 0, OFF_RIGHT, 0], [104, 3, 112, 2], [92, 8, 101.5, 8], [66, 14, 101.5, 30], [53, 34, 101.5, 60], [52, 72, 101.5, 86], [22, 103, 101.5, 102]],
  },
  close: {
    b: [[9, 35, -3, 50], [10, 96, -3, 100]],
    "you-back": [[17, 6, 101.5, 6], [18, 50, 101.5, 50], [17, 99, 101.5, 99]],
    "other-b1": [[-6, 30, -12, 20], [4, 70, -12, 60], [5.5, 99, -12, 90]],
    "other-b2": [[106, 10, 112, 10], [96, 50, 112, 50], [95, 99, 112, 90]],
    "other-b3": [[106, 62, 112, 62]],
  },
  onward: {
    b: [[16, 6, 2, 14], [38, 28, 16, 34], [46, 60, 36, 60], [48.5, 112, 42, 112]],
    "you-back": [[18, 6, 96, 8], [40, 32, 70, 50], [53, 62, 64, 62], [56, 112, 56, 112]],
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
  const opening = React.useRef(null)
  // Has the reader kept a thread of their own? (only for this reading)
  const [yours, setYours] = React.useState(false)
  // How many times en passant has been asked for, and how it is going.
  const [passant, setPassant] = React.useState(0)
  const [passantState, setPassantState] = React.useState("idle")

  return (
    <Words.Provider value={words}>
      <div className={c("ch-story")} data-you={yours ? "true" : "false"}>
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
          {/* the threads come out from under the cover's lower edge */}
          <div className={c("ch-coverWrap")} data-thread-floor="">
            <Picture
              className={c("ch-cover")}
              name="cover"
              alt="Two hands over a pink and white chessboard, seen from above: an older man's in a tweed sleeve reaching for a black piece, a woman's with a signet ring at the near side. Behind them, a dark grid of tiny green and grey boards."
              width={1600}
              height={1067}
              small={800}
              sizes="(max-width: 60rem) 92vw, 680px"
            />
            <Knots of={LINES.cover} />
          </div>
        </header>

        <div className={c("ch-open")} ref={opening}>
          <Text name="opening" look="large" />
          <Text name="opening-aside" look="aside" />
          {/* the reader may keep one of the grey threads as theirs */}
          <div className={c("ch-hold")}>
            <button type="button" className={c("ch-ask")} aria-pressed={yours} onClick={() => setYours(on => !on)}>
              <i aria-hidden="true" />
              {yours ? "That thread is yours now" : "I have one"}
            </button>
          </div>
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
            <Device opening={opening} run={passant} onState={setPassantState} />
            <div className={c("ch-col", "ch-told2")}>
              <Text name="memory" look="medium" />
              <Text name="memory-aside" look="quiet" />
              {/* en passant, played on the device's own board */}
              <button type="button" className={c("ch-ask")} disabled={passantState === "playing"} onClick={() => setPassant(n => n + 1)}>
                <i aria-hidden="true" />
                {passantState === "done" ? "Again" : "Show me on the board"}
              </button>
            </div>
            <Knots of={LINES.memory} />
          </div>

          {/* The years between, in brief: the thread runs bare among the
              others, and the 2020s come. */}
          <div className={c("ch-years")}>
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "90%", "--pat": "92%" }}>
              2020s
            </span>
            <Text name="years" className={c("ch-yearsText")} reveal />
            <Text name="years-none" className={c("ch-yearsText", "ch-yearsNone")} reveal />
            <Knots of={LINES.years} />
          </div>

        </section>

        {/* The wooden set, then the same phone into Part II (wooden.js), then
            the club (scenes.js). Part II's name stays at the top of the screen
            from the moment the first stranger is found to the end of the part. */}
        <ReaderProvider>
          <div className={c("ch-people")} data-people="" data-titled="false">
            <div className={c("ch-peopleTitle")}>
              <Text name="people-title" look="partTitle" />
            </div>
            <Wooden lines={LINES.wooden} />
            <People />
          </div>

          {/* Part III: the parent label and each question's board/title stay at
              the top while its investigation is read, including its sub-sections. */}
          <div className={c("ch-people", "ch-part3")} data-part="investigation" data-titled="true">
            <div className={c("ch-peopleTitle")}>
              <InvestigationHeader />
              <Travellers />
            </div>
            {/* After each question, the three again, answered so far (hub.js); the
                reader's guesses and choices are carried between them (reader.js). */}
            {/* The first question opens with its mark, for the boards, the hubs
                and the navigation. The reader's Chess.com username was asked at
                the hinge before it (scenes.js, you.js). */}
            <section data-investigation-part="what-we-say" className={c("ch-question")}>
              <span id="what-we-say" className={c("ch-mark")} />
              <Say />
              <Hub upto={1} />
            </section>
            {/* the second and third start under the recap before them, so each is named
                over its own scene, dimmed (opening.js, hub.js) */}
            <section data-investigation-part="when-things-go-wrong" className={c("ch-next")}><Wrong /><Hub upto={2} /></section>
            <section data-investigation-part="what-we-choose" className={c("ch-next")}><Reveal /><Hub upto={3} /></section>
          </div>

        <section className={c("ch-free", "ch-back")} aria-label="Back to the threads of life">
          <Mark id="the-ending" />
          {/* the thread arrives from the last recap, clear of the title */}
          <Knots of={LINES.arrive} />
          {/* the part's name, as Part II's: at the left, then held at the top of
              the screen, on the page's own ground, to the end of the part */}
          <div className={c("ch-peopleTitle", "ch-endingTitle")}>
            <Text name="ending-title" look="partTitle" />
          </div>
          <div className={c("ch-row", "ch-encounter")}>
            {/* the message that started it, and her answer, as at the start of
                Part III: no phone (phone-scenes.js) */}
            <Chat />
            <Text name="encounter" look="lead" className={c("ch-col")} />
            <Knots of={LINES.encounter} />
          </div>
          <div className={c("ch-row", "ch-close")}>
            <div className={c("ch-col")}>
              <Text name="continuing" look="lead" />
              <Text name="last-question" look="large" />
              <Text name="yours" look="quiet" />
            </div>
            <Knots of={LINES.close} />
          </div>
          {/* The other threads are back, and none of them ends: together they
              go on past the end of the story. */}
          <div className={c("ch-onward")}>
            <Knots of={LINES.onward} />
          </div>
        </section>
        </ReaderProvider>

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
