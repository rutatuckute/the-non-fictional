import * as React from "react"

import styles from "./site-footer.module.css"

// The name and the year. The menu at the top of every page already links to
// each section, and feed readers find the feed from the page head, so the
// footer no longer repeats either.
export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <span>© {currentYear} Rūta Tučkutė</span>
    </footer>
  )
}
