"use client"

import * as React from "react"

import { Chapters, Mark } from "./chapters"
import { c, Picture, Text, Words } from "./parts"
import { Device } from "./origin"
import { People, Say } from "./scenes"
import { Reveal } from "./reveal"
import { Hub } from "./hub"
import { ReaderProvider } from "./reader"
import { YouOnChessCom } from "./you"
import { InvestigationHeader } from "./investigation-header"
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
// Part I's threads, as one family. They come out from under the cover
// together and run down the right of the opening as a loose bundle, clear of
// the question. "a" is the story's thread: clay wherever chess is in the life,
// grey where it is not (the knots marked "clay" and "grey" set its colour). It
// is grey through the opening, takes its colour as it goes in behind the
// device in its place, goes grey again through the years with no chess, and
// is clay again as it reaches the wooden set. "you" is the reader's own: one
// of the grey ones until they keep it (see the opening). The others leave in
// their own time, one in the memory, the rest by the screen's edges at the set.
const LINES = {
  // percent of the cover picture: a leaves from the author's sleeve
  cover: {
    "other-1": [[12, 97, 14, 97]],
    you: [[24, 97, 30, 97]],
    "other-2": [[34, 97, 46, 97]],
    a: [[62, 97, 62, 97]],
    "other-4": [[84, 97, 84, 97]],
  },
  // the question stands at the left (to 56%) from about 25% down; the device
  // peeks in at the right edge, level with it
  open: {
    "other-1": [[48, 0, 22, 0], [70, 20, -4, 14], [76, 56, -4, 60], [78, 100, -4, 100]],
    you: [[56, 0, 40, 0], [64, 22, 101.5, 12], [66, 58, 101.5, 60], [64, 100, 101.5, 100]],
    "other-2": [[62, 0, 56, 0], [84, 16, 110, 8], [86, 52, 112, 40], [86, 100, 112, 100]],
    a: [[74, 0, 72, 0], [80, 24, 103.5, 12], [90, 52, 103.5, 56], [93, 80, 103.5, 82], [92, 100, 103.5, 100]],
    "other-4": [[92, 0, 86, 0], [102, 14, 112, 6], [112, 30, 114, 20]],
  },
  // "This is mine." at the upper left (to 57% across, to 15% down), the device
  // under it (to 44% across), the father's words at the right, level with
  // the device's middle; on a phone, the words above and below the device
  memory: {
    a: [[92, 0, 103.5, 0, "grey"], [76, 9, 96, 12], [52, 19, 80, 19], [36, 30, 50, 30, "clay"], [26, 62, 60, 46], [24, 100, 103.5, 60, "clay"]],
    you: [[64, 0, 101.5, 0], [60, 16, 101.5, 30], [53, 40, 101.5, 60], [52, 72, 101.5, 80], [46, 100, 101.5, 100]],
    "other-1": [[80, 0, -4, 0], [90, 18, -4, 40], [104, 40, -4, 70], [106, 70, -4, 90], [100, 100, -4, 100]],
    "other-2": [[86, 0, 112, 0], [100, 12, 112, 20], [110, 34, 114, 40]],
  },
  // "Years went by." at the upper left (to about 45% across, 18% to 30%
  // down), "No chess." at the lower right (from 64% across, 58% to 70%); the
  // threads weave between them. On a phone: 26% to 33% down across three
  // quarters, and from 52% across, 50% to 58%.
  years: {
    a: [[30, 0, 103.5, 0], [50, 9, 100, 12], [60, 28, 103, 24, "grey"], [50, 46, 100, 40], [38, 64, 40, 46, "grey"], [30, 84, 10, 62], [26, 100, 5, 100]],
    you: [[44, 0, 101.5, 0], [62, 8, 101.5, 20], [72, 26, 101.5, 40], [62, 44, 70, 46], [46, 58, 30, 48], [44, 80, -4, 64], [48, 100, -6, 100]],
    "other-1": [[60, 0, -4, 0], [78, 10, -4, 18], [86, 28, -4, 44], [80, 46, 16, 50], [56, 54, 30, 64], [52, 76, 20, 82], [62, 100, 14, 100]],
    // one arrives in the years, from the left
    "other-3": [[-6, 40, -8, 40], [10, 52, -6, 60], [20, 72, 4, 80], [16, 100, 8, 100]],
  },
  // The wooden set is pinned: its stretch is several screens long, and the
  // board and the words stay on screen while the stretch passes behind them.
  // So the other threads leave by the screen's edge in the first screen and
  // stay out; only the story's thread is there, coming down the screen and in
  // behind the board (on a phone, at the far left, clear of the words above
  // the board). It ends under the scene's own ground, which comes when the phone
  // does: from there the thread is the line that comes out of the phone.
  wooden: {
    a: [[26, 0.4, 5, 0.4, "clay"], [24, 23.5, 5, 23.5], [22, 44, 5, 44], [23, 58, 5, 58], [22, 70, 5, 70]],
    you: [[50, 0.4, -6, 0.3], [OFF_RIGHT, 2.2, OFF_LEFT, 2.2], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-1": [[62, 0.5, 14, 0.3], [82, 1.6, OFF_LEFT, 2.2], [OFF_RIGHT, 2.9, OFF_LEFT, 30], [OFF_RIGHT, 60, OFF_LEFT, 60]],
    "other-3": [[16, 0.8, 8, 0.2], [OFF_LEFT, 3.1, OFF_LEFT, 2], [OFF_LEFT, 7, OFF_LEFT, 30]],
  },
  encounter: {
    b: [[3, 30, -3, 2], [6, 60, -3, 50], [8, 104, -3, 99]],
  },
  close: {
    b: [[9, 35, -3, 50], [10, 96, -3, 100]],
    "you-back": [[OFF_RIGHT, 10, OFF_RIGHT, 10], [94, 50, 101.5, 50], [90, 99, 101.5, 99]],
    "other-b1": [[-6, 30, -12, 20], [4, 70, -12, 60], [5.5, 99, -12, 90]],
    "other-b2": [[106, 10, 112, 10], [96, 50, 112, 50], [95, 99, 112, 90]],
    "other-b3": [[106, 62, 112, 62]],
  },
  onward: {
    b: [[16, 6, 2, 14], [38, 28, 16, 34], [46, 60, 36, 60], [48.5, 112, 42, 112]],
    "you-back": [[84, 10, 96, 8], [62, 50, 70, 50], [57, 112, 56, 112]],
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
            <span className={c("ch-decade")} data-reveal="" style={{ "--at": "90%", "--pat": "80%" }}>
              2020s
            </span>
            <Text name="years" className={c("ch-yearsText")} />
            <Text name="years-none" className={c("ch-yearsText", "ch-yearsNone")} />
            <Knots of={LINES.years} />
          </div>

        </section>

        {/* The wooden set, then the same phone into Part II (wooden.js), then
            the club (scenes.js). Part II's name stays at the top of the screen
            from the moment the first stranger is found to the end of the part. */}
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
          </div>
          {/* After each question, the three again, answered so far (hub.js); the
              reader's guesses and choices are carried between them (reader.js). */}
          <ReaderProvider>
            {/* The first question opens (its mark, for the boards, the hubs and
                the navigation) on the reader's own Chess.com ratings, if they
                want them (you.js). */}
            <section data-investigation-part="what-we-say" className={c("ch-question")}>
              <span id="what-we-say" className={c("ch-mark")} />
              <YouOnChessCom />
              <Say />
              <Hub upto={1} />
            </section>
            <section data-investigation-part="when-things-go-wrong"><Wrong /><Hub upto={2} /></section>
            <section data-investigation-part="what-we-choose"><Reveal /><Hub upto={3} /></section>
          </ReaderProvider>
        </div>

        <section className={c("ch-free", "ch-back")} aria-label="Back to the threads of life">
          <Mark id="the-ending" />
          <Text name="ending-title" look="partTitle" className={c("ch-endingTitle")} />
          <div className={c("ch-row", "ch-encounter")}>
            {/* the message that started it, and her answer (phone-scenes.js) */}
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
