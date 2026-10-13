"use client"

import * as React from "react"

import styles from "../../../styles/blog-post.module.css"

// The headings are written in capitals in the source; the contents set them in
// sentence case.
const sentence = label => {
  const lower = label.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

// Numbered, in the serif, with the section being read marked in the form's
// colour. The marker follows the reader: the last heading above the upper
// third of the screen is the current one.
const ArticleContents = ({ sections, heading = true }) => {
  const [active, setActive] = React.useState(null)

  React.useEffect(() => {
    const heads = sections.map(section => document.getElementById(section.id)).filter(Boolean)
    let frame = 0
    const update = () => {
      frame = 0
      const passed = heads.filter(head => head.getBoundingClientRect().top < window.innerHeight * 0.3)
      setActive(passed.length ? passed[passed.length - 1].id : null)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [sections])

  return (
    <nav className={styles.contents} aria-label="Contents">
      {heading ? <p className={`${styles.label} ${styles.quiet}`}>Contents</p> : null}
      <ol>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              data-on={active === section.id ? "true" : "false"}
              aria-current={active === section.id ? "location" : undefined}
            >
              <span className={styles.contentsNo}>{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.contentsTitle}>{sentence(section.label)}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default ArticleContents
