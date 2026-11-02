import * as React from "react"

import { TRANSITION_CSS, shared, still, transition } from "./story-motion"
import styles from "./story-stage.module.css"

// Where "Connect the dots" happens: directly on the page, no box around it.
// Along the top, once the story has begun, a small label (the chapter, and
// what the investigation has narrowed down to so far), a quiet way out to the
// data, and a contents control. Back and forward stay at the bottom. The scene
// keeps one height on wide screens, so the page doesn't jump between beats.
// The same place holds the explorer; the story keeps its place while the reader
// is there.
//   steps: [{ act, caption, title, memory?, layout?, quiet?, set?, vt? }]
//          title: the beat's name, in the contents only
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

// The contents: the chapters, what each holds, and starting over. Beats that
// build on the same scene are one entry.
const Contents = ({ f, acts, steps, at, inStory, onGo, onRestart }) => {
  const [open, setOpen] = React.useState(false)
  const box = React.useRef(null)
  const toggle = React.useRef(null)
  const close = refocus => {
    setOpen(false)
    if (refocus) toggle.current?.focus()
  }
  React.useEffect(() => {
    if (!open) return undefined
    box.current?.querySelector("[data-here], button")?.focus()
    const away = e => {
      if (
        !box.current?.contains(e.target) &&
        !toggle.current?.contains(e.target)
      )
        setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    return () => document.removeEventListener("pointerdown", away)
  }, [open])
  const entries = steps
    .map((s, j) => ({ ...s, j }))
    .filter((s, k, all) => k === 0 || all[k - 1].title !== s.title)
  const here = entries.filter(s => s.j <= at).at(-1)?.j
  return (
    <div
      className={styles.contents}
      onKeyDown={e => {
        // inside the contents, the arrow keys don't turn the story
        if (open) e.stopPropagation()
        if (open && e.key === "Escape") close(true)
      }}
    >
      <button
        ref={toggle}
        type="button"
        className={styles.quiet}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {f.L(["Sommaire", "Contents"])}
      </button>
      {open ? (
        <div ref={box} className={styles.contentsPanel}>
          {acts.map((name, a) => (
            <div key={name[1]} className={styles.contentsAct}>
              <span>{f.L(name)}</span>
              <ol>
                {entries
                  .filter(s => s.act === a + 1)
                  .map(s => (
                    <li key={s.j}>
                      <button
                        type="button"
                        data-here={inStory && s.j === here ? "" : undefined}
                        aria-current={
                          inStory && s.j === here ? "step" : undefined
                        }
                        onClick={() => {
                          close(true)
                          onGo(s.j)
                        }}
                      >
                        {s.title}
                      </button>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
          <button
            type="button"
            className={styles.restart}
            onClick={() => {
              close(true)
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

  // The story fits the window as the reader moves through it: past the heading
  // on the first step, and on a phone back to the top of a longer scene.
  const align = smooth => {
    const box = frameRef?.current?.getBoundingClientRect()
    if (!box) return
    if (box.top < 0 || box.bottom > window.innerHeight)
      window.scrollBy({
        top: box.top - 16,
        behavior: smooth && !still() ? "smooth" : "auto",
      })
  }
  const go = to => {
    const j = Math.max(0, Math.min(steps.length - 1, to))
    if (j === i) return
    const a = steps[i]
    const b = steps[j]
    // what both sides share travels from one beat to the next
    if (a.set !== b.set || a.vt || b.vt) {
      align(false)
      transition(() => onGo(j))
    } else {
      align(true)
      onGo(j)
    }
  }
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
  const contents = (
    <Contents
      f={f}
      acts={acts}
      steps={steps}
      at={i}
      inStory={mode === "story"}
      onGo={j => {
        if (mode === "explore") {
          onGo(j)
          backToStory()
        } else go(j)
      }}
      onRestart={() => {
        if (mode === "explore") {
          onGo(0)
          backToStory()
        } else go(0)
      }}
    />
  )
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
          <>
            <Ways
              f={f}
              ways={ways}
              mode={mode}
              resume={i > 0 ? f.L(["reprendre", "resume"]) : null}
              onStory={backToStory}
              onExplore={onExplore}
            />
            <span className={styles.tools}>{contents}</span>
          </>
        ) : (
          <>
            <span className={styles.where}>
              <span className={styles.chapter}>{f.L(acts[act - 1])}</span>
              {memory ? (
                <span className={styles.memory} style={shared("memory")}>
                  {memory}
                </span>
              ) : null}
            </span>
            <span className={styles.tools}>
              <button
                type="button"
                className={styles.quiet}
                onClick={onExplore}
              >
                {f.L(["Explorer les données", "Explore the data"])} ↗
              </button>
              {contents}
            </span>
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
              type="button"
              className={styles.arrow}
              onClick={() => go(i - 1)}
              disabled={i === 0}
              aria-label={f.L(["Précédent", "Back"])}
            >
              <Chevron back />
            </button>
            <button
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
