"use client"

import * as React from "react"

import { c, Guess, Holder, Pinned, Show, Text } from "./parts"
import { ABOVE_NOTE, Above, FastGap, Patterns } from "./say"

// The pinned scenes of the chess story: the people behind the game, and the
// three questions put to the data. For now every graphic is a box that says
// what will stand there; each is replaced as its part is built.

const during = (step, ...steps) => steps.includes(step)

// Where the six opponents sit around the board, in percent of it.
const CHIPS = [
  { left: "-22%", top: "10%" },
  { right: "-20%", top: "-5%" },
  { right: "-26%", top: "44%" },
  { left: "-28%", top: "62%" },
  { left: "16%", bottom: "-7%" },
  { left: "22%", top: "-9%" },
]

// Part II. One board stays on screen: first the strangers around it, then the
// club and the professor's remark, then the board among thousands of others.
export const People = () => (
  <Pinned
    label="The people behind the game"
    steps={[
      <Text key="1" name="strangers" look="cardText" />,
      <Text key="2" name="strangers-many" look="cardText" />,
      <Text key="3" name="professor" look="cardText" />,
      <Text key="4" name="professor-remark" look="cardText" />,
      <Text key="5" name="boards" look="cardText" />,
      <Text key="6" name="question" look="cardText" />,
    ]}
  >
    {step => (
      <div className={c("ch-boardwrap")} data-club={during(step, 2, 3) ? "true" : "false"}>
        <Show on={step >= 4} className={c("ch-minis")}>
          {Array.from({ length: 162 }, (_, index) => (
            <b key={index} />
          ))}
        </Show>
        {/* The club: its own board, pink and white, and the professor
            standing at its left, watching. */}
        <Show on={during(step, 2, 3)} className={c("ch-professor")}>
          <img
            src="/images/stories/chess/professor.webp"
            srcSet="/images/stories/chess/professor-300.webp 300w, /images/stories/chess/professor.webp 520w"
            sizes="(max-width: 60rem) 45vw, 380px"
            alt="An older man in a dark jacket, seen from behind, bows over the board, his hands clasped behind his back."
            width={520}
            height={780}
            decoding="async"
          />
        </Show>
        {/* You, in the foreground: we look over your shoulder at the game. */}
        <Show on={during(step, 2, 3)} className={c("ch-me")}>
          <img
            src="/images/stories/chess/me-club.webp"
            srcSet="/images/stories/chess/me-club-320.webp 320w, /images/stories/chess/me-club.webp 560w"
            sizes="(max-width: 60rem) 50vw, 420px"
            alt="The author, seen from behind, her long hair over her shoulders, bent over the board."
            width={560}
            height={840}
            decoding="async"
          />
        </Show>
        <Show on={during(step, 2, 3)} className={c("ch-clubBoard")}>
          <img
            src="/images/stories/chess/club-board.webp"
            srcSet="/images/stories/chess/club-board-600.webp 600w, /images/stories/chess/club-board.webp 1000w"
            sizes="(max-width: 60rem) 60vw, 540px"
            alt="The club's board: pink and white squares with letters and numbers along its edges, the black and white plastic pieces set up for a game."
            width={1000}
            height={824}
            decoding="async"
          />
        </Show>
        <div className={c("ch-board")} data-small={step >= 4 ? "true" : "false"} data-away={during(step, 2, 3) ? "true" : "false"} />
        {CHIPS.map((place, index) => (
          <Show key={index} on={index === 0 ? step <= 1 : step === 1} className={c("ch-chip")} style={place}>
            username · rating · country
          </Show>
        ))}
        <Show on={step === 3} className={c("ch-said")}>
          <Text name="professor-quote" />
        </Show>
        <Show on={step === 5} className={c("ch-ask")}>
          <Text name="question-large" look="medium" />
        </Show>
      </div>
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
export const Say = ({ guess }) => (
  <Pinned
    label="What we say about ourselves"
    steps={[
      <Text key="1" name="say-message" look="cardText" />,
      <Text key="2" name="say-prediction" look="cardText" />,
      <React.Fragment key="3">
        <Text name="say-guess" look="cardText" />
        <Guess label="Your guess" options={["Rated higher", "About the same", "Rated lower"]} {...guess} />
      </React.Fragment>,
      <Text key="4" name="say-answer" look="cardText" />,
      <Text key="5" name="say-surprise" look="cardText" />,
      <Text key="6" name="say-limits" look="cardText" />,
    ]}
  >
    {step => (
      <div className={c("ch-stack")}>
        <Show flow on={step === 0}>
          <Holder label="The message" ratio="5 / 2" />
        </Show>
        <Show flow on={step === 1}>
          <FastGap />
        </Show>
        <Show flow on={step === 2}>
          <Patterns of="bad" />
        </Show>
        <Show flow on={step === 3}>
          <Above keys={["bad"]} />
          <p className={c("ch-note")}>
            {ABOVE_NOTE}
            {guess.value ? ` · your guess: ${guess.value.toLowerCase()}` : ""}
          </p>
        </Show>
        <Show flow on={step >= 4}>
          <Above keys={["bad", "good", "jokes", "aims"]} />
          <p className={c("ch-note")}>{ABOVE_NOTE}</p>
        </Show>
      </div>
    )}
  </Pinned>
)

// Second question: what we do when things go wrong.
export const Wrong = ({ guess }) => (
  <Pinned
    label="What we do when things go wrong"
    steps={[
      <Text key="1" name="wrong-observation" look="cardText" />,
      <React.Fragment key="2">
        <Text name="wrong-decide" look="cardText" />
        <Guess label="Your decision" options={["Resign", "Play on"]} {...guess} />
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
            {step === 2 && guess.value ? ` · you chose to ${guess.value.toLowerCase()}` : ""}
          </p>
        </Show>
        <Show flow on={step >= 3}>
          <Rows rows={[[36, 14, 50], [46, 12, 42], [55, 9, 36], [65, 6, 29]]} />
          <p className={c("ch-note")}>After losing the queen: resign, abandon, play on, by rating</p>
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
          <Holder open label="Your games over time, the London System months marked" ratio="16 / 7" />
        </Show>
        <Show flow on={step === 2}>
          <Rows rows={[[34], [58]]} />
          <p className={c("ch-note")}>A measure of playing style, before and after</p>
        </Show>
      </div>
    )}
  </Pinned>
)
