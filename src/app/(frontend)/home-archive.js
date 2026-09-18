"use client"

import * as React from "react"
import Link from "next/link"

import Masthead from "../../components/masthead"
import ArchiveField from "../../components/redesign/ArchiveField"
import ArchiveScrolly from "../../components/redesign/ArchiveScrolly"
import {
  buildWorks,
  deriveConnections,
} from "../../components/redesign/archiveFieldData"
import WorkRail from "../../components/redesign/WorkRail"
import SiteFooter from "../../components/site-footer"
import styles from "../../styles/redesign-lab.module.css"

const HomeArchive = ({ nodes }) => {
  const works = React.useMemo(() => buildWorks(nodes), [nodes])
  const connections = React.useMemo(() => deriveConnections(works), [works])
  // Selection lives here so the hero and the scrolly share one rail.
  const [selectedWorkId, setSelectedWorkId] = React.useState(null)
  const selectedWork = works.find(work => work.id === selectedWorkId) || null
  const selectWork = React.useCallback(workId => {
    setSelectedWorkId(current => (current === workId ? null : workId))
  }, [])
  const closeRail = React.useCallback(() => setSelectedWorkId(null), [])

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <Masthead />

        <main className={styles.main}>
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.heroKicker}>
                Photography <span aria-hidden="true">&middot;</span> Writings
              </p>
              <h1 className={styles.heroTitle} id="hero-title">
                <span>I need</span>
                <span>structure</span>
                <span>to think.</span>
              </h1>
              <p className={styles.heroIntro}>
                So I'm building one:{" "}
                <span className={styles.introHighlight}>essays</span> about how
                things work, (un)structured{" "}
                <span className={styles.introHighlight}>reflections</span>, the
                stories <span className={styles.introHighlight}>data</span> can
                tell, and{" "}
                <span className={styles.introHighlight}>photographs</span> on
                film. I never felt like writing anything fictional - only
                questioning, starting with myself.{" "}
                <Link className={styles.heroLink} href="/contacts/">
                  Argue with me.
                </Link>
              </p>
            </div>

            <figure className={styles.fieldFigure} id="archive-field">
              <ArchiveField
                className={styles.archiveField}
                connections={connections}
                selectedWorkId={selectedWorkId}
                works={works}
                onWorkSelect={selectWork}
              />
            </figure>
          </section>

          <ArchiveScrolly
            connections={connections}
            selectedWorkId={selectedWorkId}
            works={works}
            onWorkSelect={selectWork}
          />
        </main>

        <SiteFooter />
      </div>

      <WorkRail work={selectedWork} onClose={closeRail} />
    </div>
  )
}

export default HomeArchive
