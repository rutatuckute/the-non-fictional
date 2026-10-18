import { imageUrl } from "../../lib/images"
import { buildWorks, deriveConnections } from "../redesign/archiveFieldData"

// The writing covers are composed at 1600 × 1067.
const COVER_RATIO = 1.5

// What the room needs to hang every work, worked out on the server so the
// page ships a short list rather than every content node: a writing's cover,
// a photograph's frame (a series hangs as its first), their proportions,
// where each one links, and the writing ↔ photograph connections.
export const buildSpace = nodes => {
  const works = buildWorks(nodes)
  const bySlug = new Map(nodes.map(node => [node.fields?.slug, node]))
  const minutesOf = slug => bySlug.get(slug)?.fields?.readingTime?.minutes ?? null
  const ratioOf = slug => {
    const fm = bySlug.get(slug)?.frontmatter
    return fm?.photoWidth && fm?.photoHeight ? fm.photoWidth / fm.photoHeight : 1.5
  }

  const writings = works
    .filter(work => work.kind === "writing" && work.image)
    .map(work => ({
      id: work.id,
      kind: "writing",
      format: work.format,
      inquiry: work.inquiry,
      title: work.title,
      date: work.date,
      year: work.year,
      minutes: minutesOf(work.slug),
      href: work.slug,
      ratio: COVER_RATIO,
      img: imageUrl(work.image, 828, "lighter"),
    }))

  const photographs = works
    .filter(work => work.kind === "photography" && work.image)
    .map(work => ({
      id: work.id,
      kind: "photography",
      format: "photography",
      title: work.title,
      year: work.year,
      location: work.location,
      frameCount: work.frameCount || 1,
      href: `/photography/?frame=${work.slug.replace(/^\/|\/$/g, "")}`,
      ratio: ratioOf(work.slug),
      img: imageUrl(work.image, 420, "lighter"),
    }))

  const hung = new Set([...writings, ...photographs].map(work => work.id))
  const connections = deriveConnections(works)
    .filter(link => hung.has(link.from) && hung.has(link.to))
    .map(({ from, to, place }) => ({ from, to, place }))

  return { writings, photographs, connections }
}
