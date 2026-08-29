import * as React from "react"

import * as styles from "./site-footer.module.css"

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <span>© {currentYear} Rūta Tučkutė</span>
    </footer>
  )
}
