import * as React from "react"
import { graphql, Link } from "gatsby"

import Masthead from "../components/masthead"
import ArchiveField from "../components/redesign/ArchiveField"
import ArchiveScrolly from "../components/redesign/ArchiveScrolly"
import { enrichSampleWorks } from "../components/redesign/archiveFieldData"
import SiteFooter from "../components/site-footer"
import * as styles from "./redesign-lab.module.css"

const IndexPage = ({ data, location }) => {
  const works = React.useMemo(
    () => enrichSampleWorks(data.allMarkdownRemark.nodes),
    [data.allMarkdownRemark.nodes]
  )

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <Masthead location={location} />

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
                <Link className={styles.heroLink} to="/contacts/">
                  Argue with me.
                </Link>
              </p>
            </div>

            <figure className={styles.fieldFigure} id="archive-field">
              <ArchiveField className={styles.archiveField} works={works} />
            </figure>
          </section>

          <ArchiveScrolly works={works} />
        </main>

        <SiteFooter />
      </div>
    </div>
  )
}

export default IndexPage

export const Head = ({ data }) => (
  <>
    <title>{data.site.siteMetadata.title}</title>
    <meta name="description" content={data.site.siteMetadata.description} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin="anonymous"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,300;8..60,400&display=swap"
    />
  </>
)

export const query = graphql`
  query HomePageMetadata {
    site {
      siteMetadata {
        title
        description
      }
    }
    allMarkdownRemark {
      nodes {
        frontmatter {
          date
          layout
          title
          year
        }
      }
    }
  }
`
