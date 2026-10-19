"use client"

import * as React from "react"

import Masthead from "../masthead"
import SiteFooter from "../site-footer"
import { MARKUP } from "./markup"
import "./photo-space.css"

// The Photography page: one pile of every frame, re-laid as the reader
// scrolls — the edit, the archive by place, by roll and as a grid, then the
// series. The markup is static; ./engine brings it to life after first paint.
// view: "selected", "archive" or "series" — where an address opens the page.
/** @param {{ space: any, view?: string }} props */
const PhotoSpace = ({ space, view }) => {
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    let destroy = null
    let cancelled = false

    import("./engine").then(({ createPhotoSpace }) => {
      if (cancelled || !rootRef.current) return
      destroy = createPhotoSpace(rootRef.current, space, { view })
    })

    return () => {
      cancelled = true
      destroy?.()
    }
  }, [space, view])

  return (
    <>
      <Masthead activeSection="photography" />
      <div
        className="ps-root"
        ref={rootRef}
        dangerouslySetInnerHTML={{ __html: MARKUP }}
      />
      <SiteFooter />
    </>
  )
}

export default PhotoSpace
