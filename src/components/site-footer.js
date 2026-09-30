import * as React from "react"
import Link from "next/link"

import styles from "./site-footer.module.css"

export default function SiteFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.identity}>
        <span>© {currentYear} Rūta Tučkutė</span>
        <span className={styles.statement}>Writing and photography</span>
      </div>
      <nav className={styles.navigation} aria-label="Footer navigation">
        <Link href="/blog/">Writings</Link>
        <Link href="/photography/">Photography</Link>
        <Link href="/about/">In Brief</Link>
        <Link href="/contacts/">Contact</Link>
        <a href="/rss.xml">RSS</a>
      </nav>
    </footer>
  )
}
