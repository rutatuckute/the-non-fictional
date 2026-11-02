import * as React from "react"

import { TRANSITION_CSS, transition } from "./story-motion"
import styles from "./story.module.css"

// The frame both section stories use: where you are along the top (one
// segment per step, grouped by act, each a button), an arrow on each side,
// the caption centred on the left and the scene on the right. The reader
// clicks an arrow or a segment (or presses ← →); only the content changes.
// The scene remounts, and fades in, when sceneKey changes, not when a step
// only adds to what is shown.
// The same box holds the section's explorer. Two ways into the same
// evidence, named by the section: follow a line of inquiry (the story), or
// pursue your own (the explorer). At the very start they are two editorial
// links with a line each, where the progress bar will be; once the reader is
// inside either, they shrink to their names and stay in the top corner. From
// the explorer, the story link resumes at the step the reader left; past the
// first step, "Start over" (story and explorer alike) goes back to it. The box
// keeps one height in story mode and grows to fit the explorer.
//   steps:     [{ act: 1-based act number, caption, title?, layout?, set?, vt? }]
//              title: the beat's name (progress bar, screen readers)
//              layout: "split" (default), "wide" (the scene runs under the
//                caption) or "full" (the caption above, the scene across)
//              set: steps of one set share one scene (no remount); moving
//                between sets, or into/out of a step with vt, runs a
//                shared-element transition (story-motion.js)
//   variant:   "narrative" for the editorial frame of section 01
//   acts:      [[French, English], ...] act names, in order
//   ways:      { story: { title, desc }, explore: { title, desc } }, pairs
//   mode:      "story" or "explore", held by the section; onMode changes it
//   onExplore: opens the explorer, on what the reader is looking at
//   explorer:  what explore mode shows
// Connect the dots: three points joined; dig into the data: a magnifying glass
const ThreadIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.wayIcon} aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="2.3" />
    <circle cx="12" cy="11.5" r="2.3" />
    <circle cx="18.5" cy="5.5" r="2.3" />
    <path d="m7.3 15.8 3-2.6m3.5-3.3 3-2.6" />
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" className={styles.wayIcon} aria-hidden="true">
    <circle cx="10.5" cy="10.5" r="6.2" />
    <path d="m15.2 15.2 4.8 4.8" />
  </svg>
)

// Back to the first step, from anywhere in the story or the explorer
const Restart = ({ f, onRestart }) => (
  <button type="button" className={styles.restart} onClick={onRestart}>
    <svg viewBox="0 0 24 24" className={styles.restartIcon} aria-hidden="true">
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 4v4.5H9" />
    </svg>
    {f.L(["Recommencer", "Start over"])}
  </button>
)

const Ways = ({ f, ways, mode, full, resume, onStory, onExplore }) => (
  <nav
    className={`${styles.ways} ${full ? styles.isFull : ""}`}
    aria-label={f.L(["Deux façons d'entrer", "Two ways in"])}
  >
    {[
      ["story", ThreadIcon, onStory],
      ["explore", SearchIcon, onExplore],
    ].map(([key, Icon, open]) => (
      <button
        key={key}
        type="button"
        className={styles.way}
        aria-current={mode === key ? "true" : undefined}
        onClick={open}
      >
        <Icon />
        <span className={styles.wayText}>
          <span className={styles.wayTitle}>
            {f.L(ways[key].title)}
            {key === "story" && mode === "explore" && resume ? (
              <span className={styles.wayResume}> · {resume}</span>
            ) : null}
          </span>
          {full ? (
            <span className={styles.wayDesc}>{f.L(ways[key].desc)}</span>
          ) : null}
        </span>
      </button>
    ))}
  </nav>
)

const Chevron = ({ back }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d={back ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"} />
  </svg>
)

export default function StoryFrame({
  f,
  label,
  acts,
  steps,
  at,
  onGo,
  sceneKey,
  ways,
  mode = "story",
  onMode,
  onExplore,
  explorer,
  frameRef,
  variant,
  children,
}) {
  const i = Math.min(at, steps.length - 1)
  const { act, caption, dim, wide, layout, stage, quiet } = steps[i]
  const full = layout === "full"
  const narrative = variant === "narrative"
  // swipe, on touch screens: a mostly horizontal drag past the stage
  const touch = React.useRef(null)
  const onTouchStart = e => {
    const t = e.touches[0]
    touch.current = e.target.closest("dialog")
      ? null
      : { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = e => {
    const from = touch.current
    touch.current = null
    if (!from || mode !== "story") return
    const t = e.changedTouches[0]
    const dx = t.clientX - from.x
    const dy = t.clientY - from.y
    if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6)
      go(dx < 0 ? i + 1 : i - 1)
  }
  // a step can be silent (no caption): the narrator's last words fade out,
  // or stay dimmed (dim), instead of vanishing; a wide step lets its scene
  // run under the caption
  const [heard, setHeard] = React.useState(caption)
  React.useEffect(() => {
    if (caption) setHeard(caption)
  }, [caption])
  const go = to => {
    const j = Math.max(0, Math.min(steps.length - 1, to))
    if (j === i) return
    const a = steps[i]
    const b = steps[j]
    // a set of its own on each side, or a step that asks for it: the shared
    // elements travel from one beat to the next
    if (a.set !== undefined && (a.set !== b.set || a.vt || b.vt))
      transition(() => onGo(j))
    else onGo(j)
  }
  // the entry: the story's first step, before the reader has gone anywhere
  const entry = mode === "story" && i === 0
  const backToStory = () => {
    onMode?.("story")
    requestAnimationFrame(() => {
      const top = frameRef?.current?.getBoundingClientRect().top
      if (top < 0) frameRef.current.scrollIntoView({ block: "start" })
    })
  }
  const restart = () => {
    go(0)
    backToStory()
  }
  return (
    <div
      ref={frameRef}
      className={`${styles.story} ${variant === "narrative" ? styles.isNarrative : ""} ${mode === "explore" ? styles.isExplore : ""} ${(wide || layout === "wide") && mode === "story" ? styles.isWide : ""} ${full && mode === "story" ? styles.isSpread : ""} ${narrative && full && (!caption || quiet) ? styles.isUncaptioned : ""}`}
      style={narrative && stage ? { "--stage": `${stage}px` } : undefined}
      onTouchStart={narrative ? onTouchStart : undefined}
      onTouchEnd={narrative ? onTouchEnd : undefined}
      role="region"
      aria-label={f.L(label)}
      onKeyDown={e => {
        if (mode !== "story") return
        if (e.key === "ArrowRight") {
          e.preventDefault()
          go(i + 1)
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          go(i - 1)
        }
      }}
    >
      {variant === "narrative" ? <style>{TRANSITION_CSS}</style> : null}
      <div className={styles.top}>
        <Ways
          f={f}
          ways={ways}
          mode={mode}
          full={entry}
          resume={
            i > 0
              ? narrative
                ? f.L(["reprendre", "resume"])
                : f.L([
                    `reprendre à l'étape ${i + 1}`,
                    `resume at step ${i + 1}`,
                  ])
              : null
          }
          onStory={backToStory}
          onExplore={onExplore}
        />
        {mode === "explore" && i > 0 ? (
          <Restart f={f} onRestart={restart} />
        ) : null}
        {mode === "story" && !entry ? (
          <nav
            className={styles.progress}
            aria-label={f.L(
              narrative ? ["Progression", "Progress"] : ["Étapes", "Steps"],
            )}
          >
            {acts.map((name, a) => {
              const mine = steps
                .map((s, j) => [s, j])
                .filter(([s]) => s.act === a + 1)
              return (
                <div
                  key={name[1]}
                  className={styles.progressAct}
                  style={{ flex: mine.length }}
                >
                  <span
                    className={`${styles.progressName} ${a + 1 === act ? styles.isHere : ""}`}
                  >
                    {f.L(name)}
                  </span>
                  <div className={styles.progressSteps}>
                    {mine.map(([s, j]) => (
                      <button
                        key={j}
                        type="button"
                        className={`${j <= i ? styles.isDone : ""} ${j === i ? styles.isOn : ""}`}
                        title={s.title || undefined}
                        aria-label={
                          narrative && s.title
                            ? s.title
                            : `${f.L(["Étape", "Step"])} ${j + 1} / ${steps.length}`
                        }
                        aria-current={j === i ? "step" : undefined}
                        onClick={() => go(j)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>
        ) : null}
        {mode === "story" && i > 0 ? (
          <Restart f={f} onRestart={restart} />
        ) : null}
      </div>

      {mode === "explore" ? (
        <div className={styles.explorer}>{explorer}</div>
      ) : (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowBack}`}
            onClick={() => go(i - 1)}
            disabled={i === 0}
            aria-label={f.L(["Étape précédente", "Previous step"])}
          >
            <Chevron back />
          </button>

          <div
            className={`${styles.caption} ${caption ? "" : dim ? styles.isDim : styles.isSilent}`}
          >
            {narrative ? null : (
              <span className={styles.act}>{f.L(acts[act - 1])}</span>
            )}
            <p
              className={styles.captionText}
              aria-live="polite"
              aria-hidden={caption ? undefined : "true"}
            >
              {caption || heard}
            </p>
          </div>

          <div className={styles.stage}>
            <div className={styles.scene} key={sceneKey}>
              {children}
            </div>
          </div>

          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={() => go(i + 1)}
            disabled={i === steps.length - 1}
            aria-label={f.L(["Étape suivante", "Next step"])}
          >
            <Chevron />
          </button>
        </>
      )}
    </div>
  )
}
