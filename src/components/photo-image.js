import * as React from "react"

import { photoUrl, preferredFormat } from "./photography/photoData"

// Every photograph on the site goes through here. The <source> asks for
// whichever format actually wins at this size (see preferredFormat), and the
// <img> keeps no `fm` of its own, so a browser that cannot take the offered
// format still gets whatever Netlify decides it can. Nothing is forced on an
// old browser.
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
  const [failed, setFailed] = React.useState(false)

  // The lightbox steps between photographs without remounting, so a failure on
  // one frame must not stick to the next.
  React.useEffect(() => setFailed(false), [source])

  if (!source) {
    return null
  }

  // Two cases render a bare <img>: vectors, which have nothing to resize, and
  // anything the CDN failed to serve, which falls back to the file in the repo.
  //
  // The fallback has to drop the <picture> rather than reassign the <img> src.
  // Once the browser has chosen a <source> it goes on choosing it, so pointing
  // the inner <img> at the original is ignored for as long as that <source> is
  // still on offer — the only way back to the plain file is to stop offering
  // it. This is also what makes the site legible under `gatsby develop`, which
  // serves no /.netlify/images at all.
  if (failed || source.endsWith(".svg")) {
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

  const format = preferredFormat(px)

  return (
    <picture style={{ display: "contents" }}>
      <source
        type={`image/${format}`}
        srcSet={photoUrl(source, px, quality, format)}
      />
      <img
        className={className}
        src={photoUrl(source, px, quality)}
        alt={alt}
        loading={loading}
        decoding="async"
        onError={() => setFailed(true)}
        {...rest}
      />
    </picture>
  )
}

export default PhotoImage
