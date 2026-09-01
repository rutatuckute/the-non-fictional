import * as React from "react"

import { photoUrl } from "./photography/photoData"

// Every photograph on the site goes through here. AVIF is offered first and
// roughly halves the bytes of the WebP the CDN would otherwise negotiate; the
// <img> keeps no `fm` of its own, so a browser without AVIF still gets whatever
// Netlify decides it can take. Nothing is forced on an old browser.
//
// The <picture> is display:contents so it leaves no box of its own — the <img>
// lays out as a direct child of whatever wraps it, and the existing frame and
// card CSS keeps working untouched.
const PhotoImage = ({
  source,
  px,
  quality = "lightest",
  alt = "",
  className,
  loading = "lazy",
  ...rest
}) => {
  if (!source) {
    return null
  }

  // Vectors have nothing to resize, and the CDN would only rasterise them.
  if (source.endsWith(".svg")) {
    return (
      <img
        className={className}
        src={source}
        alt={alt}
        loading={loading}
        decoding="async"
        {...rest}
      />
    )
  }

  // If the CDN ever fails to answer, fall back to the file in the repo rather
  // than showing a broken frame. It is the unresized master, so this costs
  // bytes — which is the point: it only happens when the alternative is nothing.
  const onError = (event) => {
    const img = event.currentTarget

    if (img.dataset.fallback) {
      return
    }

    img.dataset.fallback = "1"
    img.src = source
  }

  return (
    <picture style={{ display: "contents" }}>
      <source type="image/avif" srcSet={photoUrl(source, px, quality, "avif")} />
      <img
        className={className}
        src={photoUrl(source, px, quality)}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={onError}
        {...rest}
      />
    </picture>
  )
}

export default PhotoImage
