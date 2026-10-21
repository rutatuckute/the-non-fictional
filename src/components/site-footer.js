import * as React from "react"

import styles from "./site-footer.module.css"

// The name and the year, and a nod to the portfolio the design grew from.
// The menu at the top of every page already links to each section, and feed
// readers find the feed from the page head, so the footer repeats neither.
export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <span>© {currentYear} Rūta Tučkutė</span>
      <span className={styles.sep} aria-hidden="true">
        ·
      </span>
      <span>
        Design inspired by{" "}
        <a
          className={styles.credit}
          href="https://hamedmp.com/p/portfolio-of-projects"
          target="_blank"
          rel="noopener"
        >
          hamedmp
        </a>
      </span>
    </footer>
  )
}
