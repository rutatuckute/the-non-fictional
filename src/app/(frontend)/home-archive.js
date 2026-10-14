"use client"

import * as React from "react"
import Link from "next/link"

import Masthead from "../../components/masthead"
import FieldKey from "../../components/redesign/FieldKey"
import HomeField from "../../components/redesign/HomeField"
import {
  buildWorks,
  deriveConnections,
} from "../../components/redesign/archiveFieldData"
import WorkRail from "../../components/redesign/WorkRail"
import SiteFooter from "../../components/site-footer"
import styles from "../../styles/redesign-lab.module.css"

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

const NARROW = "(max-width: 860px)"

// A step is current once its top passes a line through the reading area:
// mid-screen beside the field, or high on a phone, where the field is pinned
// along the bottom and the text is read above it. Above the first step the
// hero is current, and the field cycles.
const readingLine = () =>
  window.innerHeight * (window.matchMedia(NARROW).matches ? 0.36 : 0.55)

const useCurrentStep = stepElements => {
  const [step, setStep] = React.useState(-1)

  React.useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const line = readingLine()
      let current = -1

      stepElements.current.forEach((element, index) => {
        if (element && element.getBoundingClientRect().top <= line) {
          current = index
        }
      })
      setStep(current)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [stepElements])

  return step
}

const HomeArchive = ({ nodes }) => {
  const works = React.useMemo(() => buildWorks(nodes), [nodes])
  const connections = React.useMemo(() => deriveConnections(works), [works])
  const [selectedWorkId, setSelectedWorkId] = React.useState(null)
  const selectedWork = works.find(work => work.id === selectedWorkId) || null
  const selectWork = React.useCallback(workId => {
    setSelectedWorkId(current => (current === workId ? null : workId))
  }, [])
  const closeRail = React.useCallback(() => setSelectedWorkId(null), [])
  const stepElements = React.useRef([])
  const step = useCurrentStep(stepElements)
  const inHero = step < 0

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <Masthead />

        <main className={styles.main}>
          <div className={styles.layout}>
            <section className={styles.hero} aria-labelledby="hero-title">
              <p className={`${styles.label} ${styles.kicker}`}>
                Writings <span aria-hidden="true">&middot;</span> Photography
              </p>
              <h1
                className={`${styles.display} ${styles.heroTitle}`}
                id="hero-title"
              >
                <span>I need</span> <span>structure</span>{" "}
                <span>
                  to <em>think</em>.
                </span>
              </h1>
              <p className={`${styles.lead} ${styles.heroIntro}`}>
                So I'm building one: <b>essays</b> about how things work,
                (un)structured <b>reflections</b>, the stories <b>data</b> can
                tell, and <b>photographs</b> on film. I never felt like writing
                anything fictional - only questioning, starting with myself.
                <Link className={styles.argue} href="/about/">
                  Argue with me.
                </Link>
              </p>
              {/* Scrolling down is what changes the field; the arrow says so. */}
              <p
                className={styles.cue}
                data-visible={inHero ? "true" : "false"}
                aria-hidden="true"
              >
                <span>↓</span>
              </p>
            </section>

            <div className={styles.figure}>
              <div className={styles.pinned}>
                <HomeField
                  className={`${styles.archiveField} ${styles.field}`}
                  connections={connections}
                  cycling={inHero}
                  replayClassName={`${styles.meta} ${styles.replay}`}
                  scene={step}
                  selectedWorkId={selectedWorkId}
                  works={works}
                  onWorkSelect={selectWork}
                />
                <FieldKey className={`${styles.meta} ${styles.key}`} />
              </div>
            </div>

            <section className={styles.steps} aria-label="Archive structure">
              {STEPS.map((item, index) => (
                <article
                  className={styles.step}
                  data-active={step === index ? "true" : "false"}
                  key={item.number}
                  ref={element => {
                    stepElements.current[index] = element
                  }}
                >
                  <span className={`${styles.numeral} ${styles.stepNumber}`}>
                    {item.number}
                  </span>
                  <h2 className={styles.title}>{item.title}</h2>
                  <p className={styles.support}>{item.body}</p>
                </article>
              ))}
            </section>
          </div>
        </main>

        <SiteFooter />
      </div>

      <WorkRail work={selectedWork} onClose={closeRail} />
    </div>
  )
}

export default HomeArchive
