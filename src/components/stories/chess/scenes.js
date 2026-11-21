"use client"

import * as React from "react"

import { CLUB_REST, ClubBoard } from "./club"
import { c, Guess, Holder, Pinned, Show, Text, useSince } from "./parts"
import { ABOVE_NOTE, Above, FastGap, Patterns } from "./say"

// The pinned scenes of the chess story: the people behind the game, and the
// three questions put to the data. Where a graphic is not made yet, a box says
// what will stand there; each is replaced as its part is built.

const during = (step, ...steps) => steps.includes(step)

// The strangers: an opponent is a username, a rating and a country, and then
// the next one. These four are invented: none is anyone's username (checked
// against Chess.com's public player pages on 19 November 2026, where each
// was unknown). `figure` names each one's picture, and `focus` the point in
// it (its hands) that the picture fades out around.
const STRANGERS = [
  { name: "torre_torta_07", rating: 743, country: "Brazil", flag: "br", tone: "#6f5a4a", figure: "stranger-1", focus: "42% 46%" },
  { name: "pawn_wala_19", rating: 812, country: "India", flag: "in", tone: "#4f5f6b", figure: "stranger-2", focus: "68% 42%" },
  { name: "oga_blunders_ng", rating: 688, country: "Nigeria", flag: "ng", tone: "#5c6650", figure: "stranger-3", focus: "50% 52%" },
  { name: "krzywy_goniec", rating: 905, country: "Poland", flag: "pl", tone: "#6a5266", figure: "stranger-4", focus: "36% 40%" },
]
// Each stays for this much scrolling, in screens: the four pass while three short questions do.
const EACH = 0.55

// A country's flag, drawn: small enough that four simple ones are all it takes.
const FLAGS = {
  br: (
    <>
      <rect width="6" height="4" fill="#1f9a48" />
      <polygon points="3,0.45 5.5,2 3,3.55 0.5,2" fill="#f7d117" />
      <circle cx="3" cy="2" r="0.85" fill="#2a4b9b" />
    </>
  ),
  in: (
    <>
      <rect width="6" height="4" fill="#ffffff" />
      <rect width="6" height="1.34" fill="#f4a13a" />
      <rect y="2.66" width="6" height="1.34" fill="#1c8a3a" />
      <circle cx="3" cy="2" r="0.42" fill="none" stroke="#2a3f9b" strokeWidth="0.16" />
    </>
  ),
  ng: (
    <>
      <rect width="6" height="4" fill="#ffffff" />
      <rect width="2" height="4" fill="#1c8a4a" />
      <rect x="4" width="2" height="4" fill="#1c8a4a" />
    </>
  ),
  pl: (
    <>
      <rect width="6" height="4" fill="#ffffff" />
      <rect y="2" width="6" height="2" fill="#d8323c" />
    </>
  ),
}
const Flag = ({ of }) => (
  <svg className={c("ch-flag")} viewBox="0 0 6 4" aria-hidden="true">
    {FLAGS[of]}
  </svg>
)

// The phone of Part I again, before a game: the board set up, the clocks full.
// Only the opponent changes, as the reader scrolls: on the phone's screen, and
// beside it, large enough to read. The country is shown by its flag alone;
// its name is in the scene's description, for those who cannot see the flag.
// Until one is `matched`, there is nobody on the other side yet.
const Strangers = ({ step, matched }) => {
  const since = useSince(step, EACH, STRANGERS.length - 1)
  const now = matched ? since : -1
  return (
    <div
      className={c("ch-phoneBox")}
      role="img"
      aria-label={`A phone with a game of chess about to begin. The opponent keeps changing: ${STRANGERS.map(
        each => `${each.name}, rated ${each.rating}, ${each.country}`,
      ).join("; ")}.`}
    >
      <img
        src="/images/stories/chess/phone-game.webp"
        srcSet="/images/stories/chess/phone-game-480.webp 480w, /images/stories/chess/phone-game.webp 800w"
        sizes="(max-width: 60rem) 45vw, 260px"
        alt=""
        width={800}
        height={1704}
        decoding="async"
      />
      {/* What the page writes on the phone's screen: the opponent's bar, and both clocks. */}
      <div className={c("ch-screen")} aria-hidden="true">
        {STRANGERS.map((each, index) => (
          <div key={each.name} className={c("ch-screenBar")} data-on={index === now ? "true" : "false"}>
            <i style={{ background: each.tone }} />
            <b>{each.name}</b>
            <span>({each.rating})</span>
            <Flag of={each.flag} />
          </div>
        ))}
        <span className={c("ch-clock")} data-whose="theirs">
          10:00
        </span>
        <span className={c("ch-clock")} data-whose="mine">
          10:00
        </span>
      </div>
      {STRANGERS.map((each, index) => (
        <div key={each.name} className={c("ch-who")} data-on={index === now ? "true" : "false"} aria-hidden="true">
          <b>{each.name}</b>
          <span>
            <Flag of={each.flag} />
            {each.rating}
          </span>
          {each.figure ? (
            <img
              src={`/images/stories/chess/${each.figure}.webp`}
              srcSet={`/images/stories/chess/${each.figure}-300.webp 300w, /images/stories/chess/${each.figure}.webp 520w`}
              sizes="(max-width: 60rem) 34vw, 220px"
              alt=""
              decoding="async"
              style={{ "--at": each.focus }}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

// What the scene shows at each step: the phone, and then its strangers; the
// club's board; the remark, alone; the board among a thousand.
const VIEWS = ["phone", "phone", "phone", "phone", "club", "club", "club", "how", "many", "many"]

// Part II. One board stays on screen: on the phone, where strangers come and
// go; then at the club in London, where the opening is played and the
// professor leans in; then among the thousand games the data holds. Its words
// stand in one place and change with the scroll.
export const People = () => (
  <Pinned
    open
    plain
    mark="the-people"
    label="The people behind the game"
    steps={[
      { text: <Text name="people-intro" look="lead" /> },
      // three questions, one scroll each, while the strangers come and go
      { text: <Text name="strangers" look="lead" /> },
      { text: <Text name="strangers-where" look="lead" /> },
      { text: <Text name="strangers-moment" look="lead" /> },
      // the London System is set up on the board while this step's stretch passes
      { text: <Text name="club" look="lead" />, rest: CLUB_REST },
      { text: <Text name="professor" look="lead" /> },
      // his question, and then what it left behind, are in the scene itself
      {},
      {},
      { text: <Text name="boards" look="lead" /> },
      { text: <Text name="data" look="lead" /> },
    ]}
  >
    {step => (
      <>
        {/* How the author's last 998 games ended, each a tiny board
            (scripts/stories/chess/make-boards.cjs); the middle place is the
            club's. The grid keeps to the scene, clear of the words. */}
        <Show on={step >= 8} className={c("ch-minis")}>
          <img
            src="/images/stories/chess/boards.webp"
            alt="Hundreds of tiny chessboards in a grid: how the author’s last thousand games ended, her pieces in green, her opponents’ in ivory."
            width={1776}
            height={1296}
            decoding="async"
          />
        </Show>
        <div className={c("ch-boardwrap")} data-view={VIEWS[step]}>
          <Show on={step <= 3} className={c("ch-phoneLayer")}>
            <Strangers step={1} matched={step >= 1} />
          </Show>
          {/* The club: its own board, pink and white. The two players are
              hands (club.js); the professor, who leans in once the opening is
              played, is the scene's one figure. */}
          <Show on={during(step, 5, 6, 7)} className={c("ch-professor")}>
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
          <Show on={step >= 4} className={c("ch-clubBoard")}>
            <ClubBoard during={4} />
          </Show>
          <Show on={step === 4} className={c("ch-place")}>
            <svg viewBox="0 0 10 14" aria-hidden="true">
              <path d="M5 0.6a4.2 4.2 0 0 0-4.2 4.2C0.8 8 5 13.4 5 13.4S9.2 8 9.2 4.8A4.2 4.2 0 0 0 5 0.6Zm0 5.9a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
            </svg>
            London
            <span>early 2026</span>
          </Show>
          {/* What he asked, as he asks it: it comes up from him, in a
              speech balloon over his head. */}
          <Show on={step === 6} className={c("ch-bubble")}>
            <Text name="professor-quote" look="said" />
          </Show>
        </div>
        <Show on={step === 7} className={c("ch-how")}>
          <Text name="professor-how" look="large" />
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
export const Say = ({ guess }) => (
  <Pinned
    mark="what-we-say"
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
    mark="when-things-go-wrong"
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
