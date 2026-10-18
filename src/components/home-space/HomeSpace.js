"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import Masthead from "../masthead"
import SiteFooter from "../site-footer"
import styles from "./home-space.module.css"

const STEPS = [
  {
    number: "01",
    title: "Everything, unsorted",
    body: "Made in motion, across cities and years. Nothing planned. The pattern is hindsight.",
  },
  {
    number: "02",
    title: "Ways of being in it",
    body: "Arguing about it, living through it, seeing what's behind it, or merely documenting it.",
  },
  {
    number: "03",
    title: "What I keep asking",
    body: "Everything starts and ends with perception.",
  },
  {
    number: "04",
    title: "Not everything connects",
    body: "But I wish everything ultimately would.",
  },
  {
    number: "05",
    title: "I keep looping back",
    body: "And what if time is just a flat circle?",
  },
]

const Arrow = ({ d }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

// The homepage: every published work hanging in one room, rearranged by the
// five steps as they scroll past. The room itself is drawn by ./engine, which
// is loaded after the page so three.js stays out of the first paint.
const HomeSpace = ({ space }) => {
  const rootRef = React.useRef(null)
  const router = useRouter()

  React.useEffect(() => {
    let destroy = null
    let cancelled = false

    import("./engine").then(({ createHomeSpace }) => {
      if (cancelled || !rootRef.current) return
      destroy = createHomeSpace(rootRef.current, space, {
        navigate: href => router.push(href),
      })
    })

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [space, router])

  return (
    <div className={styles.root} ref={rootRef}>
      <Masthead />

      <div className={styles.story}>
        <div className={styles.stage} data-hs="stage" data-scene="-1">
          <canvas
            className={styles.canvas}
            data-hs="space"
            tabIndex={0}
            aria-label="Every published work, hanging in a room. Drag to look around; W and S, or the arrow keys once this is focused, move; Escape leaves."
          />
          <div className={styles.vignette} aria-hidden="true" />
          <div className={styles.scrim} aria-hidden="true" />
          <div className={styles.layer} data-hs="layer" aria-hidden="true" />

          <div
            className={styles.pad}
            data-hs="pad"
            role="group"
            aria-label="Look around"
          >
            <span className={styles.padLabel}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M8 1.5 14 5v6l-6 3.5L2 11V5z" />
                  <path d="M2 5l6 3.5L14 5M8 8.5v6" />
                </g>
              </svg>
              Look around
            </span>
            <span className={styles.padKeys}>
              <button type="button" data-move="left" aria-label="Move left">
                <Arrow d="M8.5 3 4.5 7l4 4" />
              </button>
              <button type="button" data-move="fwd" aria-label="Move in">
                <Arrow d="M3 8.5 7 4.5l4 4" />
              </button>
              <button type="button" data-move="back" aria-label="Move back">
                <Arrow d="M3 5.5 7 9.5l4-4" />
              </button>
              <button type="button" data-move="right" aria-label="Move right">
                <Arrow d="M5.5 3 9.5 7l-4 4" />
              </button>
            </span>
            <button type="button" className={styles.padReset} data-hs="pad-reset">
              Back to the start
            </button>
          </div>

          <ul className={styles.key} aria-hidden="true">
            <li>
              <svg width="16" height="10">
                <g stroke="var(--hs-essay)" strokeWidth="1.6">
                  <path d="M2 2h12M2 5h12M2 8h12" />
                </g>
              </svg>
              Essay
            </li>
            <li>
              <svg width="16" height="10">
                <g stroke="var(--hs-reflection)" strokeWidth="1.6">
                  <path d="M2 3h12M2 7h12" />
                </g>
              </svg>
              Reflection
            </li>
            <li>
              <svg width="16" height="10">
                <g stroke="var(--hs-data)" strokeWidth="1.6">
                  <path d="M2 2h12M2 5h12M2 8h8" />
                </g>
                <circle cx="13" cy="8" r="1.6" fill="var(--hs-data)" />
              </svg>
              Data
            </li>
            <li>
              <svg width="14" height="14">
                <path
                  d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9"
                  stroke="var(--hs-photography)"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              Photograph
            </li>
          </ul>
        </div>

        <main className={styles.text} data-hs="text">
          <section className={styles.hero} aria-labelledby="hero-title">
            <p className={styles.kicker}>
              Writings <span aria-hidden="true">&middot;</span> Photography
            </p>
            <h1 className={styles.title} id="hero-title">
              <span>I need</span> <span>structure</span>{" "}
              <span>
                to <em>think</em>.
              </span>
            </h1>
            <p className={styles.intro}>
              So I&apos;m building one: <b>essays</b> about how things work,
              (un)structured <b>reflections</b>, the stories <b>data</b> can
              tell, and <b>photographs</b> on film. I never felt like writing
              anything fictional - only questioning, starting with myself.
              <br />
              <Link className={styles.argue} href="/about/">
                Argue with me.
              </Link>
            </p>
            <p className={styles.cue} data-hs="cue" aria-hidden="true">
              <span>↓</span>
            </p>
          </section>

          <section aria-label="Archive structure">
            {STEPS.map((step, index) => (
              <article
                className={`${styles.step} ${index === STEPS.length - 1 ? styles.long : ""}`}
                data-hs="step"
                data-active="false"
                key={step.number}
              >
                <div className={styles.inner} data-hs="inner">
                  <span className={styles.num}>{step.number}</span>
                  <h2>{step.title}</h2>
                  <p>{step.body}</p>
                </div>
              </article>
            ))}
          </section>

          <nav aria-label="Works in the field">
            <ul className={styles.works} data-hs="works" />
          </nav>
        </main>
      </div>

      <div className={styles.footer}>
        <SiteFooter />
      </div>

      <div className={styles.tip} data-hs="tip" aria-hidden="true" />
    </div>
  )
}

export default HomeSpace
