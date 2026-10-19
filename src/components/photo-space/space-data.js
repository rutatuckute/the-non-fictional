import { imageUrl } from "../../lib/images"
import { LIVED_IN, buildFrames } from "../photography/photoData"

// What the page needs for every frame, worked out on the server: the facts it
// shows and filters on, and an image URL at each size it draws — a print on
// the pile, a frame in a grid, and the one opened large.
export const buildPhotoSpace = (nodes, seriesDocs) => {
  const frames = buildFrames(nodes)
    .filter((frame) => frame.photo)
    .map((frame) => ({
      id: frame.ref,
      title: frame.title,
      year: Number.parseInt(frame.year, 10) || null,
      location: frame.location,
      city: frame.city,
      country: frame.country,
      type: frame.type,
      roll: frame.roll,
      selected: frame.selected,
      selectedOrder: frame.selectedOrder,
      series: frame.series,
      seriesTitle: frame.seriesName,
      seriesOrder: frame.seriesOrder,
      w: frame.width,
      h: frame.height,
      s: imageUrl(frame.photo, 420, "lighter"),
      m: imageUrl(frame.photo, 828, "lighter"),
      l: imageUrl(frame.photo, 2048, "normal"),
    }))

  const series = seriesDocs
    .filter((entry) => frames.some((frame) => frame.series === entry.slug))
    .map((entry) => ({ slug: entry.slug, title: entry.title, order: entry.order }))

  return { frames, series, lived: LIVED_IN }
}
