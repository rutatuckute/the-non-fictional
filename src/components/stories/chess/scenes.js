"use client"

import * as React from "react"

import { useFollow, useStill } from "./follow"
import { DROP, TimeChart } from "./time-chart"
import { Knots } from "./thread"
import { CLUB_REST, ClubBoard } from "./club"
import { c, Guess, Holder, Pinned, Show, Text, useSince } from "./parts"
import { Message, PhonePosition, PHONE_GAMES } from "./phone-scenes"
import { RatingStory } from "./ratings"
import { Usernames } from "./say"

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
  {
    name: "torre_torta_07",
    rating: 743,
    country: "Brazil",
    flag: "br",
    tone: "#6f5a4a",
    figure: "stranger-1",
    focus: "42% 46%",
  },
  {
    name: "pawn_wala_19",
    rating: 812,
    country: "India",
    flag: "in",
    tone: "#4f5f6b",
    figure: "stranger-2",
    focus: "68% 42%",
  },
  {
    name: "oga_blunders_ng",
    rating: 688,
    country: "Nigeria",
    flag: "ng",
    tone: "#5c6650",
    figure: "stranger-3",
    focus: "50% 52%",
  },
  {
    name: "krzywy_goniec",
    rating: 905,
    country: "Poland",
    flag: "pl",
    tone: "#6a5266",
    figure: "stranger-4",
    focus: "36% 40%",
  },
].map((stranger, index) => ({ ...stranger, ...PHONE_GAMES[index] }))
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
      <circle
        cx="3"
        cy="2"
        r="0.42"
        fill="none"
        stroke="#2a3f9b"
        strokeWidth="0.16"
      />
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

// The phone of Part I again: a different position and pair of clocks for
// each invented opponent, changing together as the reader scrolls, and
// beside it, large enough to read. The country is shown by its flag alone;
// its name is in the scene's description, for those who cannot see the flag.
// Until one is `matched`, there is nobody on the other side yet.
const Strangers = ({ step, matched }) => {
  const since = useSince(step, EACH, STRANGERS.length - 1)
  const now = matched ? since : -1
  const game = STRANGERS[Math.max(0, now)]
  return (
    <div
      className={c("ch-phoneBox")}
      role="img"
      aria-label={`Illustrative games in progress, with different positions and clocks. The opponent keeps changing: ${STRANGERS.map(
        each =>
          `${each.name}, rated ${each.rating}, ${each.country}, clocks ${each.clocks.join(" and ")}`,
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
      {/* Position and clocks change with the opponent; the phone frame stays. */}
      <PhonePosition game={game} />
      <div className={c("ch-screen")} aria-hidden="true">
        {STRANGERS.map((each, index) => (
          <div
            key={each.name}
            className={c("ch-screenBar")}
            data-on={index === now ? "true" : "false"}
          >
            <i style={{ background: each.tone }} />
            <b>{each.name}</b>
            <span>({each.rating})</span>
            <Flag of={each.flag} />
          </div>
        ))}
        {matched && <span className={c("ch-phoneMove")}>{game.move}</span>}
        <span className={c("ch-clock")} data-whose="theirs">
          {game.clocks[0]}
        </span>
        <span className={c("ch-clock")} data-whose="mine">
          {game.clocks[1]}
        </span>
      </div>
      {STRANGERS.map((each, index) => (
        <div
          key={each.name}
          className={c("ch-who")}
          data-on={index === now ? "true" : "false"}
          aria-hidden="true"
        >
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
const VIEWS = [
  "phone",
  "phone",
  "phone",
  "phone",
  "club",
  "club",
  "club",
  "how",
  "many",
  "many",
]

// Part II. One board stays on screen: on the phone, where strangers come and
// go; then at the club in London, where the opening is played and the
// professor leans in; then among the thousand games the data holds. Its words
// stand in one place and change with the scroll.
// The same phone carries the habit into the people chapter. These first
// three passages, like the later ones, occupy their own positions in the page.
export const People = ({ lines }) => (
  <Pinned open plain reading className={c("ch-online")} label="From a first game to the people behind the game" trail={<div className={c("ch-onlineKnots")}><Knots of={lines} /></div>} steps={[
    { text: <Text name="chess-com" look="lead" /> },
    { text: <Text name="obsession" look="lead" /> },
    { text: <Text name="obsession-questions" look="lead" /> },
    { mark: "the-people", text: <><Text name="people-title" look="partTitle" /><Text name="people-intro" look="lead" /></> },
    { text: <Text name="strangers" look="lead" /> },
    { text: <Text name="strangers-where" look="lead" /> },
    { text: <Text name="strangers-moment" look="lead" /> },
    { text: <Text name="club" look="lead" />, rest: CLUB_REST },
    { text: <Text name="professor" look="lead" /> },
    {}, {},
    { text: <Text name="boards" look="lead" /> },
    { text: <Text name="data" look="lead" /> },
  ]}>
    {step => <OnlineScene step={step} lines={lines} />}
  </Pinned>
)

const between = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
const ease = t => t * t * (3 - 2 * t)
const OnlineScene = ({ step, lines }) => {
  const root = React.useRef(null)
  const phone = React.useRef(null)
  const firstGame = React.useRef(null)
  const nextGame = React.useRef(null)
  const chart = React.useRef(null)
  const link = React.useRef(null)
  const incoming = React.useRef(null)
  const still = useStill()
  const part = step - 3
  const goal = () => -root.current.closest("section").getBoundingClientRect().top / window.innerHeight
  const paint = t => {
    const shrink = still ? (t >= 0.6 ? 1 : 0) : ease(between(t, 0.36, 0.7))
    const returnToGame = still ? (t >= 1.75 ? 1 : 0) : ease(between(t, 1.47, 1.95))
    const small = shrink * (1 - returnToGame)
    root.current.style.setProperty("--intro-space", (returnToGame * (1 - (still ? (t >= 2.7 ? 1 : 0) : ease(between(t, 2.5, 2.85))))).toFixed(4))
    const narrow = window.matchMedia("(max-width: 60rem)").matches
    // Measure the original phone slot, independent of its current transform.
    phone.current.style.transform = "none"
    const held = phone.current.getBoundingClientRect()
    const origin = chart.current.querySelector("[data-plot]").getBoundingClientRect()
    const screen = root.current.getBoundingClientRect()
    const scale = (window.innerHeight * (narrow ? 0.12 : 0.14)) / held.height
    const restX = origin.left - held.width * scale / 2
    const restY = origin.bottom + DROP
    // The first-game screenshot gets the whole mobile column, before the
    // next opponent needs room for a portrait beside the same phone.
    const heldScale = narrow ? 1 + 0.3 * (1 - returnToGame) : 1
    const art = chart.current.parentElement.getBoundingClientRect()
    const heldX = narrow ? (art.left + art.width / 2 - held.width * heldScale / 2 - held.left) * (1 - returnToGame) : 0
    const heldY = -held.height * (heldScale - 1) / 2
    const size = heldScale + (scale - heldScale) * small
    const x = heldX + (restX - held.left - heldX) * small
    const y = heldY + (restY - held.top - heldY) * small
    phone.current.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${size.toFixed(4)})`
    firstGame.current.style.opacity = (1 - between(returnToGame, 0.35, 0.8)).toFixed(3)
    nextGame.current.style.opacity = between(returnToGame, 0.35, 0.8).toFixed(3)
    firstGame.current.setAttribute("aria-hidden", returnToGame > 0.5 ? "true" : "false")
    nextGame.current.setAttribute("aria-hidden", returnToGame > 0.5 ? "false" : "true")
    // Reveal the whole period at once; reverse scrolling never undraws it.
    chart.current.style.opacity = (between(t, 0.52, 0.72) * (1 - between(returnToGame, 0.02, 0.65))).toFixed(3)
    chart.current.style.setProperty("--peak", between(t, 0.72, 0.88).toFixed(3))
    chart.current.setAttribute("aria-hidden", t < 0.52 || returnToGame > 0.65 ? "true" : "false")
    const source = (incoming.current?.isConnected ? incoming.current : null) || (incoming.current = root.current.closest('[class*="__ch-story"]').querySelector('path[data-run="a"]'))
    if (source && t < 2.05) {
      const box = source.ownerSVGElement.getBoundingClientRect()
      let lo = 0, hi = source.getTotalLength()
      for (let i = 0; i < 25; i++) {
        const mid = (lo + hi) / 2
        if (source.getPointAtLength(mid).y < screen.top - box.top) lo = mid
        else hi = mid
      }
      const start = source.getPointAtLength((lo + hi) / 2)
      const startX = start.x + box.left - screen.left
      const endX = held.left + x + held.width * size / 2 - screen.left
      const endY = held.top + y + held.height * size * 0.58 - screen.top
      const gutter = narrow ? 3 : origin.left - screen.left - 39
      const lane = startX + (gutter - startX) * small
      const bend = narrow ? 32 : 70
      link.current.setAttribute("d", `M${startX.toFixed(2)},0 C${startX.toFixed(2)},${bend / 2} ${lane.toFixed(2)},${bend / 2} ${lane.toFixed(2)},${bend} L${lane.toFixed(2)},${Math.max(bend, endY - 40).toFixed(2)} Q${lane.toFixed(2)},${endY.toFixed(2)} ${endX.toFixed(2)},${endY.toFixed(2)}`)
    }
    link.current.parentElement.style.opacity = (1 - between(returnToGame, 0.4, 0.9)).toFixed(3)
  }
  useFollow(goal, paint, { still, watch: root })
  return (
    <div className={c("ch-onlineGraphic")} ref={root} data-part={part}>
      <svg className={c("ch-onlineLink")} aria-hidden="true"><path ref={link} /></svg>
      <div className={c("ch-onlineArt")}>
        <div className={c("ch-onlineChart")} ref={chart} style={{ opacity: 0 }}><TimeChart /></div>
        {/* How the author's last 998 games ended, each a tiny board
            (scripts/stories/chess/make-boards.cjs); the middle place is the
            club's. The grid keeps to the scene, clear of the words. */}
        <Show on={part >= 8} className={c("ch-minis")}>
          <img
            src="/images/stories/chess/boards.webp"
            alt="Hundreds of tiny chessboards in a grid: how the author’s last thousand games ended, her pieces in green, her opponents’ in ivory."
            width={1776}
            height={1296}
            decoding="async"
          />
        </Show>
        <div className={c("ch-boardwrap")} data-view={VIEWS[Math.max(0, part)]}>
          <div ref={phone} className={c("ch-layer", "ch-phoneLayer")} data-on={part <= 3 ? "true" : "false"}>
            <img className={c("ch-firstGamePhone")} ref={firstGame} src="/images/stories/chess/phone.webp" srcSet="/images/stories/chess/phone-480.webp 480w, /images/stories/chess/phone.webp 800w" sizes="(max-width: 60rem) 55vw, 320px" alt="The first game on Chess.com: 1. e4 Nf6, then the opponent resigned. Both names and profile pictures are blurred." width={800} height={1704} />
            <div className={c("ch-nextGamePhone")} ref={nextGame}><Strangers step={4} matched /></div>
          </div>
          {/* The club: its own board, pink and white. The two players are
              hands (club.js); the professor, who leans in once the opening is
              played, is the scene's one figure. */}
          <Show on={during(part, 5, 6, 7)} className={c("ch-professor")}>
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
          <Show on={part >= 4} className={c("ch-clubBoard")}>
            <ClubBoard during={7} />
          </Show>
          <Show on={part === 4} className={c("ch-place")}>
            <svg viewBox="0 0 10 14" aria-hidden="true">
              <path d="M5 0.6a4.2 4.2 0 0 0-4.2 4.2C0.8 8 5 13.4 5 13.4S9.2 8 9.2 4.8A4.2 4.2 0 0 0 5 0.6Zm0 5.9a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Z" />
            </svg>
            London
            <span>early 2026</span>
          </Show>
          {/* What he asked, as he asks it: it comes up from him, in a
              speech balloon over his head. */}
          <Show on={part === 6} className={c("ch-bubble")}>
            <Text name="professor-quote" look="said" />
          </Show>
        </div>
        <Show on={part === 7} className={c("ch-how")}>
          <Text name="professor-how" look="large" />
        </Show>
      </div>
    </div>
  )
}

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
