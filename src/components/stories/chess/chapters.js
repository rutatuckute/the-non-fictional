"use client"

import * as React from "react"

import { c } from "./parts"

// The story's chapters, always at hand: a rail in the right margin of a wide
// screen, a slim bar at the top of a narrower one, whose button opens the same
// list. It says where the reader is and takes them to any chapter's opening.
//
// A chapter's link is a plain link to a mark: an empty element with the
// chapter's id, set in the page at the point where that chapter is to be
// opened (`Mark`). So a jump is the browser's own: at once, with no script,
// from a link pasted elsewhere too, and the keyboard's next Tab goes on from
// the chapter. What is drawn by the scroll finds its place from where the
// page then stands, as it does on any scroll.
//
// Nothing here counts: no numbers, no steps. A thin line in the story's clay
// fills from one chapter to the next as the reader goes.

// Where a chapter is opened: its top comes to the top of the screen.
export const Mark = ({ id }) => <span id={id} className={c("ch-mark")} />

// The chapter being read is the last whose section has come up past this share
// of the screen's height, or whose mark the page has reached.
const READ_AT = 0.4

export const Chapters = ({ chapters }) => {
  const box = React.useRef(null)
  const button = React.useRef(null)
  const panel = React.useRef(null)
  const list = React.useRef(null)
  const panelId = React.useId()
  const [at, setAt] = React.useState({ chapter: chapters[0].id, part: null })
  const [open, setOpen] = React.useState(false)

  // Where the reader is: which chapter, which part of it, and how far the line has filled.
  React.useEffect(() => {
    let frame = 0
    const story = box.current.parentElement
    const update = () => {
      frame = 0
      const y = window.scrollY
      const screen = window.innerHeight
      const topOf = node => node.getBoundingClientRect().top + y
      const marks = chapters.map(chapter => document.getElementById(chapter.id))
      if (marks.some(mark => !mark)) return
      const lands = marks.map(topOf)
      let now = 0
      marks.forEach((mark, index) => {
        // A chapter inside a shared pinned scene starts at its own mark,
        // rather than at the start of the parent that also holds Part I.
        const entered = !mark.hasAttribute("data-chapter-at-mark") && topOf(mark.parentElement) <= y + screen * READ_AT
        if (index && (entered || lands[index] <= y + 1)) now = index
      })
      let part = null
      for (const each of chapters[now].parts || []) {
        const section = document.getElementById(each.id)?.parentElement
        if (!section) continue
        const place = section.getBoundingClientRect()
        if (place.top <= screen * READ_AT && place.bottom > screen * READ_AT) part = each.id
      }
      setAt(before => (before.chapter === chapters[now].id && before.part === part ? before : { chapter: chapters[now].id, part }))

      // The line: from one chapter's mark to the next, then to the story's end.
      const end = topOf(story) + story.offsetHeight - screen
      let reached = 0
      lands.forEach((land, index) => {
        if (land <= y + 1) reached = index
      })
      const from = lands[reached]
      const to = reached + 1 < lands.length ? lands[reached + 1] : end
      const share = to > from ? Math.max(0, Math.min(1, (y - from) / (to - from))) : y >= from ? 1 : 0
      const done = y < lands[0] ? 0 : (reached + share) / chapters.length
      box.current.style.setProperty("--done", done.toFixed(4))
      // on the rail the line runs through the chapters' dots, wherever they now are
      const rows = [...list.current.children]
      const dot = row => row.offsetTop + row.firstElementChild.offsetHeight / 2
      const first = dot(rows[0])
      const last = dot(rows[rows.length - 1])
      const tail = 22
      const here = dot(rows[reached])
      const next = reached + 1 < rows.length ? dot(rows[reached + 1]) : last + tail
      list.current.style.setProperty("--line-top", `${first}px`)
      list.current.style.setProperty("--line-long", `${last + tail - first}px`)
      list.current.style.setProperty("--line-done", `${y < lands[0] ? 0 : here + share * (next - here) - first}px`)

    }
    const wake = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", wake, { passive: true })
    window.addEventListener("resize", wake)
    const observer = new ResizeObserver(wake)
    observer.observe(story)
    observer.observe(list.current)
    return () => {
      window.removeEventListener("scroll", wake)
      window.removeEventListener("resize", wake)
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [chapters])

  // The list, opened from the bar: Escape or a touch elsewhere closes it, and
  // so does scrolling on; focus goes to the chapter being read.
  React.useEffect(() => {
    if (!open) return
    const start = window.scrollY
    const current = panel.current.querySelector('[aria-current="true"]') || panel.current.querySelector("a")
    current?.focus({ preventScroll: true })
    const onKey = event => {
      if (event.key !== "Escape") return
      setOpen(false)
      button.current?.focus({ preventScroll: true })
    }
    const onPress = event => {
      if (!box.current.contains(event.target)) setOpen(false)
    }
    const onScroll = () => {
      if (Math.abs(window.scrollY - start) > 40) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPress)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPress)
      window.removeEventListener("scroll", onScroll)
    }
  }, [open])

  // Up and down the list with the arrow keys; Home and End to its ends.
  const onKeyDown = event => {
    const move = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" }[event.key]
    if (!move) return
    const links = [...list.current.querySelectorAll("a")].filter(link => link.offsetParent !== null)
    const index = links.indexOf(document.activeElement)
    const next = move === "first" ? 0 : move === "last" ? links.length - 1 : Math.max(0, Math.min(links.length - 1, index + move))
    if (index < 0 && typeof move === "number") return
    event.preventDefault()
    links[next]?.focus()
  }

  const reading = chapters.find(chapter => chapter.id === at.chapter)
  const link = (item, current) => (
    <a href={`#${item.id}`} aria-current={current ? "true" : undefined} onClick={() => setOpen(false)}>
      {item.label}
    </a>
  )

  return (
    <nav className={c("ch-nav")} ref={box} aria-label="Chapters" data-open={open ? "true" : "false"}>
      <button
        type="button"
        ref={button}
        className={c("ch-navBar")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(now => !now)}
      >
        <span className={c("ch-navNow")}>
          <span className={c("ch-navHidden")}>Chapter: </span>
          {reading.label}
        </span>
        <span className={c("ch-navAsk")}>
          Contents
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M1 2.5h10M1 6h10M1 9.5h10" />
          </svg>
        </span>
        <i className={c("ch-navDone")} aria-hidden="true" />
      </button>
      <div className={c("ch-navPanel")} id={panelId} ref={panel} onKeyDown={onKeyDown}>
        <p className={c("ch-navHead")}>In this story</p>
        <ol className={c("ch-navList")} ref={list}>
          {chapters.map(chapter => (
            <li key={chapter.id} data-on={chapter.id === at.chapter ? "true" : "false"}>
              {link(chapter, chapter.id === at.chapter)}
              {chapter.parts ? (
                <ol className={c("ch-navParts")}>
                  {chapter.parts.map(each => (
                    <li key={each.id}>{link(each, each.id === at.part)}</li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
