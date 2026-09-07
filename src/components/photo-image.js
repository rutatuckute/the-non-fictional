"use client"

import * as React from "react"

import { imageUrl } from "../lib/images"

// Every photograph on the site goes through here.
//
// On Netlify this rendered a <picture> offering AVIF or WebP depending on the
// size being asked for, because AVIF only won in a middle band. Next negotiates
// the format itself from the browser's Accept header, and next.config.mjs pins
// that to WebP for the reasons recorded there, so the <source> has nothing left
// to decide and a plain <img> is all that is needed.
//
// The error fallback is kept. If the optimizer does not answer, the original
// file in the repository is used instead, so a frame is never simply missing —
// this is also what keeps the site legible under `next dev` for anyone running
// without the optimizer warmed up.
const PhotoImage = ({
  source,
  px,
  quality = "lightest",
  alt = "",
  className,
  loading = "lazy",
  ...rest
}) => {
  const [failed, setFailed] = React.useState(false)

  // The lightbox steps between photographs without remounting, so a failure on
  // one frame must not stick to the next.
  React.useEffect(() => setFailed(false), [source])

  if (!source) {
    return null
  }

  // Vectors have nothing to resize, and a frame the optimizer failed on falls
  // back to the file as committed.
  const src = failed || source.endsWith(".svg") ? source : imageUrl(source, px, quality)

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}

export default PhotoImage
