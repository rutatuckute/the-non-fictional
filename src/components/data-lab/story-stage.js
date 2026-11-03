import * as React from "react"

import { TRANSITION_CSS, shared, still, transition } from "./story-motion"
import styles from "./story-stage.module.css"

// Where "Connect the dots" happens: directly on the page, no box around it.
// Along the top, once the story has begun, a slim row: three chapters with thin
// progress lines, each opening its own list of scenes, and a quiet way out to
// the data. Back and forward stay at the bottom. The scene keeps one height on
// wide screens, so nothing below it moves. The same place holds the explorer;
// the story keeps its place while the reader is there.
//
// The page scrolls itself in only two cases: on the first step, when the story
// doesn't yet fit in the window, and on a phone, when a new scene would start
// above it. A reveal inside a scene never scrolls anything.
//   steps: [{ act, caption, title, memory?, layout?, quiet?, set?, vt? }]
//          title: the scene's name, in the chapter lists only
//          memory: the quiet line that keeps what has been narrowed down
//          layout: "split" (default), "wide" (the scene runs under the
//            narration), "full" (the narration above the scene)
//          quiet: the scene sets the narration itself
//          set: steps of one set share a scene (no remount); moving between
//            sets, or into a step with vt, runs a shared-element transition

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
const Chevron = ({ back }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path d={back ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"} />
  </svg>
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

// One chapter: its name, its progress, and, opened from its name, a short list
// of its scenes (steps that build on one scene are one entry) with "Start over".
// The list floats over the scene: opening it moves nothing.
const Chapter = ({
  f,
  name,
  entries,
  here,
  fill,
  state,
  side,
  open,
  onToggle,
  onGo,
  onRestart,
}) => {
  const box = React.useRef(null)
  const toggle = React.useRef(null)
  const close = () => {
    onToggle(false)
    toggle.current?.focus({ preventScroll: true })
  }
  React.useEffect(() => {
    if (!open) return undefined
    box.current
      ?.querySelector("[data-here], button")
      ?.focus({ preventScroll: true })
    const away = e => {
      if (
        !box.current?.contains(e.target) &&
        !toggle.current?.contains(e.target)
      )
        onToggle(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      className={styles.chapter}
      data-state={state}
      onKeyDown={e => {
        // inside a list, the arrow keys don't turn the story
        if (open) e.stopPropagation()
        if (open && e.key === "Escape") close()
      }}
    >
      <button
        ref={toggle}
        type="button"
        className={styles.chapterName}
        aria-expanded={open}
        aria-current={state === "current" ? "true" : undefined}
        onClick={() => onToggle(!open)}
      >
        {f.L(name)}
      </button>
      <span className={styles.chapterLine} aria-hidden="true">
        <i style={{ transform: `scaleX(${fill})` }} />
      </span>
      {open ? (
        <div ref={box} className={styles.scenes} data-side={side}>
          <ol>
            {entries.map(s => (
              <li key={s.j}>
                <button
                  type="button"
                  data-here={s.j === here ? "" : undefined}
                  aria-current={s.j === here ? "step" : undefined}
                  onClick={() => {
                    close()
                    onGo(s.j)
                  }}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            className={styles.restart}
            onClick={() => {
              close()
              onRestart()
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className={styles.restartIcon}
              aria-hidden="true"
            >
              <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
              <path d="M4.5 4v4.5H9" />
            </svg>
            {f.L(["Recommencer", "Start over"])}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function StoryStage({
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
  children,
}) {
  const i = Math.min(at, steps.length - 1)
  const { act, caption, layout, quiet, memory } = steps[i]
  const full = layout === "full"
  const wide = layout === "wide"
  // the narrator's last words fade out instead of vanishing
  const [heard, setHeard] = React.useState(caption)
  React.useEffect(() => {
    if (caption) setHeard(caption)
  }, [caption])

  const [listed, setListed] = React.useState(null)
  const go = to => {
    const j = Math.max(0, Math.min(steps.length - 1, to))
    if (j === i) return
    const a = steps[i]
    const b = steps[j]
    const newScene = a.set !== b.set
    const travels = newScene || a.vt || b.vt
    const box = frameRef?.current?.getBoundingClientRect()
    if (box) {
      const phone = window.matchMedia("(max-width: 860px)").matches
      const firstStep =
        i === 0 && (box.top < 0 || box.bottom > window.innerHeight)
      if (firstStep || (phone && newScene && box.top < 0))
        window.scrollBy({
          top: box.top - 12,
          behavior: travels || still() ? "auto" : "smooth",
        })
    }
    if (travels) transition(() => onGo(j))
    else onGo(j)
  }
  // During a transition the browser hands every click to the page's root. A
  // click where back or next stands still counts, and ends the transition: the
  // reader can always go on.
  const backRef = React.useRef(null)
  const nextRef = React.useRef(null)
  React.useEffect(() => {
    const through = e => {
      if (e.target !== document.documentElement || mode !== "story") return
      const on = el => {
        const r = el?.getBoundingClientRect()
        return (
          r &&
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        )
      }
      if (on(nextRef.current)) go(i + 1)
      else if (on(backRef.current)) go(i - 1)
    }
    document.addEventListener("click", through)
    return () => document.removeEventListener("click", through)
  })
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
  const entry = mode === "story" && i === 0
  const backToStory = () => {
    onMode?.("story")
    requestAnimationFrame(() => {
      const top = frameRef?.current?.getBoundingClientRect().top
      if (top < 0) frameRef.current.scrollIntoView({ block: "start" })
    })
  }
  // what each chapter holds, and how far along it the reader is
  const entries = steps
    .map((s, j) => ({ ...s, j }))
    .filter((s, k, all) => k === 0 || all[k - 1].title !== s.title)
  const here = entries.filter(s => s.j <= i).at(-1)?.j
  const chapters = acts.map((name, a) => {
    const own = steps.map((s, j) => [s, j]).filter(([s]) => s.act === a + 1)
    const state = a + 1 < act ? "done" : a + 1 === act ? "current" : "future"
    const fill =
      state === "done"
        ? 1
        : state === "future"
          ? 0
          : (i - own[0][1] + 1) / own.length
    return { name, state, fill, entries: entries.filter(s => s.act === a + 1) }
  })
  return (
    <div
      ref={frameRef}
      className={`${styles.story} ${mode === "explore" ? styles.isExplore : ""} ${wide ? styles.isWide : ""} ${full ? styles.isFull : ""} ${full && (!caption || quiet) ? styles.isUncaptioned : ""}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label={f.L(label)}
      onKeyDown={e => {
        if (mode !== "story" || e.altKey || e.metaKey || e.ctrlKey) return
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
      <style>{TRANSITION_CSS}</style>
      <div className={styles.top}>
        {entry ? (
          <Ways
            f={f}
            ways={ways}
            mode={mode}
            full
            onStory={backToStory}
            onExplore={onExplore}
          />
        ) : mode === "explore" ? (
          <Ways
            f={f}
            ways={ways}
            mode={mode}
            resume={i > 0 ? f.L(["reprendre", "resume"]) : null}
            onStory={backToStory}
            onExplore={onExplore}
          />
        ) : (
          <>
            <div className={styles.where}>
              <nav
                className={styles.chapters}
                aria-label={f.L(["Chapitres", "Chapters"])}
              >
                {chapters.map((c, a) => (
                  <Chapter
                    key={c.name[1]}
                    f={f}
                    name={c.name}
                    entries={c.entries}
                    here={here}
                    fill={c.fill}
                    state={c.state}
                    side={a === chapters.length - 1 ? "end" : "start"}
                    open={listed === a}
                    onToggle={on => setListed(on ? a : null)}
                    onGo={go}
                    onRestart={() => go(0)}
                  />
                ))}
              </nav>
              <span
                className={styles.memory}
                style={memory ? shared("memory") : undefined}
              >
                {memory || ""}
              </span>
            </div>
            <button type="button" className={styles.quiet} onClick={onExplore}>
              {f.L(["Explorer les données", "Explore the data"])} ↗
            </button>
          </>
        )}
      </div>

      {mode === "explore" ? (
        <div className={styles.explorer}>{explorer}</div>
      ) : (
        <>
          <div className={styles.body}>
            <div
              className={`${styles.caption} ${caption ? "" : styles.isSilent}`}
            >
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
          </div>
          <div className={styles.controls}>
            <button
              ref={backRef}
              type="button"
              className={styles.arrow}
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label={f.L(["Précédent", "Back"])}
            >
              <Chevron back />
            </button>
            <button
              ref={nextRef}
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              onClick={() => go(i + 1)}
              disabled={i === steps.length - 1}
              aria-label={f.L(["Suivant", "Next"])}
            >
              <Chevron />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
