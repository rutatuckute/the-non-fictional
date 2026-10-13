"use client"

import * as React from "react"

// The code blocks arrive as rendered HTML (see withCodeFrames in
// src/lib/markdown.ts). This folds the long ones and makes Copy and Show all
// work. It renders nothing; without it the code shows in full and the
// buttons stay hidden.
const CodeBlocks = () => {
  React.useEffect(() => {
    const figures = [...document.querySelectorAll("figure.code")]
    figures.forEach(figure => {
      figure.dataset.ready = "true"
      if (figure.dataset.long === "true") figure.dataset.open = "false"
    })

    const onClick = async event => {
      const copy = event.target.closest?.(".code-copy")
      if (copy) {
        const code = copy.closest("figure.code")?.querySelector("code")
        try {
          await navigator.clipboard.writeText(code?.innerText || "")
          copy.textContent = "Copied"
        } catch {
          copy.textContent = "Press ⌘C"
        }
        window.setTimeout(() => {
          copy.textContent = "Copy"
        }, 1600)
        return
      }

      const more = event.target.closest?.(".code-more")
      if (more) {
        const figure = more.closest("figure.code")
        const open = figure.dataset.open !== "true"
        figure.dataset.open = open ? "true" : "false"
        more.setAttribute("aria-expanded", open ? "true" : "false")
        more.textContent = open ? "Show fewer" : `Show all ${figure.dataset.lines} lines`
        if (!open) figure.scrollIntoView({ block: "nearest" })
      }
    }

    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [])

  return null
}

export default CodeBlocks
