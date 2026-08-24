import * as React from "react"

import * as styles from "./redesign-lab.module.css"
import logo from "../images/logo.jpeg"

const RedesignLabPage = () => (
  <div className={styles.page}>
    <div className={styles.frame}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img
            className={styles.brandLogo}
            src={logo}
            alt=""
            aria-hidden="true"
          />
          <span>The Non Fictional</span>
        </div>

        <nav className={styles.navigation} aria-label="Primary navigation">
          <span>Front</span>
          <span>Writings</span>
          <span>Photography</span>
          <span>In Brief</span>
        </nav>

        <span className={styles.searchMark} role="img" aria-label="Search" />
      </header>

      <main className={styles.main} />
    </div>
  </div>
)

export default RedesignLabPage

export const Head = () => (
  <>
    <title>Redesign Lab | The Non Fictional</title>
    <meta name="robots" content="noindex,nofollow" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin="anonymous"
    />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;800&display=swap"
    />
  </>
)
