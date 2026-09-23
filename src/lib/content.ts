import { cache } from 'react'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { MEDIA_BASE } from '../collections/Media'
import { readingMinutes } from './reading-time'

// The page components and the two data builders they lean on (archiveFieldData
// and photoData) were written against the shape Gatsby handed them: a node with
// `fields` and a snake_cased `frontmatter`. Payload stores the same content
// under camelCase names, so it is mapped back into that shape here rather than
// rewriting eight hundred lines of layout logic that has nothing to do with
// where the content is kept.
export type ContentNode = {
  id: string
  excerpt: string
  timeToRead: number
  html?: string
  body?: string
  fields: {
    slug: string
    readingTime: { text: string; minutes: number }
  }
  frontmatter: {
    layout: 'blog' | 'photography'
    title: string | null
    excerpt: string | null
    date: string | null
    cover_image: string | null
    category: string | null
    category_id: string | null
    inquiry: string | null
    link: string | null
    selected: boolean | null
    selectedOrder: number | null
    photo: string | null
    // The frame's own proportions, so a layout can hold them rather than crop
    // to a shape of its own choosing.
    photoWidth: number | null
    photoHeight: number | null
    location: string | null
    series: string | null
    seriesTitle: string | null
    seriesOrder: number | null
    year: string | null
    roll: number | null
    tags: string[]
    type: string | null
    topic: string | null
  }
}

const getClient = cache(async () => getPayload({ config: configPromise }))

// Slugs are stored bare. Every URL on the site carries a leading and trailing
// slash, and the builders compare against that form.
const asPath = (slug: string) => `/${slug.replace(/^\/|\/$/g, '')}/`

const tagList = (tags: unknown): string[] =>
  Array.isArray(tags)
    ? tags
        .map((entry) =>
          typeof entry === 'string' ? entry : ((entry as { tag?: string })?.tag ?? ''),
        )
        .filter(Boolean)
    : []

// "10 September 2020" — the form the article rail has always printed.
const longDate = (value: string | null | undefined): string | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

// Gatsby derived an excerpt from the body when frontmatter carried none. The
// bodies here are largely raw HTML, so tags are stripped before pruning,
// otherwise the excerpt would open with a <p>.
// A frame's photo is an upload now, so the query populates it and this reads
// the served URL off the document. The string branch is what the column held
// before the files moved into R2 — a path under /images/uploads — and is kept
// so the mapper works either side of that migration rather than only after it.
const mediaUrl = (value: unknown): string | null => {
  if (typeof value === 'string') return value || null

  if (value && typeof value === 'object') {
    const doc = value as { filename?: unknown; url?: unknown }

    // Built from the filename rather than read from the document. Payload
    // records an upload's URL as its own /api/media/file/ route, which serves
    // the file by fetching it from the bucket — so every frame on the page
    // would be proxied through the deployment instead of coming from the
    // bucket's own domain, which is the egress this arrangement exists to
    // avoid. The adapter takes a generateFileURL option to change what gets
    // recorded, and it cannot be used: it is a function, Payload serialises
    // the plugin's collection options into the config it sends the browser,
    // and the panel then fails to hydrate and renders blank.
    if (typeof doc.filename === 'string' && doc.filename) {
      return `${MEDIA_BASE}/${encodeURIComponent(doc.filename)}`
    }

    return typeof doc.url === 'string' && doc.url ? doc.url : null
  }

  return null
}

// The stored dimensions of an upload. A frame is laid out at its own ratio, so
// the page has to know it before the image loads or every row would reflow.
const mediaDims = (value: unknown): { width: number | null; height: number | null } => {
  if (value && typeof value === 'object') {
    const doc = value as { width?: unknown; height?: unknown }
    return {
      width: typeof doc.width === 'number' ? doc.width : null,
      height: typeof doc.height === 'number' ? doc.height : null,
    }
  }

  return { width: null, height: null }
}

const deriveExcerpt = (body: string, length = 200): string => {
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= length) return text

  return `${text.slice(0, text.lastIndexOf(' ', length))}…`
}

type PostDoc = {
  id: string | number
  title: string
  slug: string
  publishedAt: string
  categoryId: string
  category?: string | null
  inquiry?: string | null
  topic?: string | null
  excerpt: string
  coverImage: string
  link?: string | null
  selected?: boolean | null
  tags?: unknown
  body: string
  readingMinutes?: number | null
}

type PhotographDoc = {
  id: string | number
  title: string
  slug: string
  // Populated at depth 1; a bare id or a legacy path is still accepted.
  photo: string | number | { url?: string | null } | null
  location?: string | null
  year?: string | null
  roll?: number | null
  type?: string | null
  series?: string | null
  selected?: boolean | null
  selectedOrder?: number | null
  seriesRef?: number | { slug?: string | null; title?: string | null } | null
  seriesOrder?: number | null
  date: string
  tags?: unknown
}

// Membership is the relationship; the slug it resolves to is what the rest of
// the photography code has always keyed a series by, so that is what is handed
// on. The legacy text column is the fallback for anything not yet linked.
const seriesSlug = (doc: PhotographDoc): string | null => {
  const ref = doc.seriesRef
  if (ref && typeof ref === 'object' && typeof ref.slug === 'string' && ref.slug) return ref.slug
  return doc.series || null
}

const seriesTitle = (doc: PhotographDoc): string | null => {
  const ref = doc.seriesRef
  if (ref && typeof ref === 'object' && typeof ref.title === 'string' && ref.title) return ref.title
  return null
}

const postToNode = (doc: PostDoc): ContentNode => {
  const minutes = doc.readingMinutes ?? readingMinutes(doc.body || '')

  return {
    id: String(doc.id),
    excerpt: deriveExcerpt(doc.body || ''),
    timeToRead: minutes,
    body: doc.body,
    fields: {
      slug: asPath(doc.slug),
      readingTime: { text: `${minutes} min read`, minutes },
    },
    frontmatter: {
      layout: 'blog',
      title: doc.title ?? null,
      excerpt: doc.excerpt ?? null,
      date: doc.publishedAt ?? null,
      cover_image: doc.coverImage ?? null,
      category: doc.category ?? null,
      category_id: doc.categoryId ?? null,
      inquiry: doc.inquiry ?? null,
      link: doc.link ?? null,
      selected: doc.selected ?? null,
    selectedOrder: null,
      photo: null,
    photoWidth: null,
    photoHeight: null,
      location: null,
      series: null,
    seriesTitle: null,
    seriesOrder: null,
      year: doc.publishedAt ? String(new Date(doc.publishedAt).getUTCFullYear()) : null,
      roll: null,
      tags: tagList(doc.tags),
      type: null,
      topic: doc.topic ?? null,
    },
  }
}

const photographToNode = (doc: PhotographDoc): ContentNode => ({
  id: String(doc.id),
  excerpt: '',
  timeToRead: 0,
  fields: {
    slug: asPath(doc.slug),
    readingTime: { text: '', minutes: 0 },
  },
  frontmatter: {
    layout: 'photography',
    title: doc.title ?? null,
    excerpt: null,
    date: doc.date ?? null,
    cover_image: null,
    category: null,
    category_id: null,
    inquiry: null,
    link: null,
    selected: doc.selected ?? null,
    selectedOrder: typeof doc.selectedOrder === 'number' ? doc.selectedOrder : null,
    photo: mediaUrl(doc.photo),
    photoWidth: mediaDims(doc.photo).width,
    photoHeight: mediaDims(doc.photo).height,
    location: doc.location ?? null,
    series: seriesSlug(doc),
    seriesTitle: seriesTitle(doc),
    seriesOrder: typeof doc.seriesOrder === 'number' ? doc.seriesOrder : null,
    year: doc.year ?? null,
    roll: Number.isFinite(doc.roll) ? (doc.roll as number) : null,
    tags: tagList(doc.tags),
    type: doc.type ?? null,
    topic: null,
  },
})

export const getPosts = cache(async (): Promise<ContentNode[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 1000,
    sort: '-publishedAt',
    depth: 0,
    pagination: false,
  })

  return (docs as unknown as PostDoc[]).map(postToNode)
})

export const getPhotographs = cache(async (): Promise<ContentNode[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'photographs',
    limit: 2000,
    sort: '-date',
    // The photo is an upload; at depth 0 it comes back as an id and the frame
    // has no URL to render.
    depth: 1,
    pagination: false,
  })

  return (docs as unknown as PhotographDoc[]).map(photographToNode)
})

// The homepage field draws on everything at once.
export const getAllNodes = cache(async (): Promise<ContentNode[]> => {
  const [posts, photographs] = await Promise.all([getPosts(), getPhotographs()])
  return [...posts, ...photographs]
})

export type Article = {
  node: ContentNode
  dateLabel: string | null
  previous: { slug: string; title: string } | null
  next: { slug: string; title: string } | null
}

// Adjacency is oldest-first, which is the order the old build walked the posts
// in, so "Previous" on a piece still points at the piece written before it.
export const getArticle = cache(async (slug: string): Promise<Article | null> => {
  const posts = await getPosts()
  const oldestFirst = [...posts].reverse()
  const index = oldestFirst.findIndex((post) => post.fields.slug === asPath(slug))

  if (index === -1) return null

  const node = oldestFirst[index]
  const previous = index > 0 ? oldestFirst[index - 1] : null
  const next = index < oldestFirst.length - 1 ? oldestFirst[index + 1] : null
  const label = (entry: ContentNode | null) =>
    entry ? { slug: entry.fields.slug, title: entry.frontmatter.title || entry.fields.slug } : null

  return {
    node,
    dateLabel: longDate(node.frontmatter.date),
    previous: label(previous),
    next: label(next),
  }
})

export const getPhotographSlugs = cache(async (): Promise<string[]> => {
  const photographs = await getPhotographs()
  return photographs.map((frame) => frame.fields.slug.replace(/^\/|\/$/g, ''))
})

export type SeriesEntry = {
  id: string | number
  title: string
  slug: string
  order: number | null
  // The frame chosen to stand for the series, by slug. Unset, the series page
  // and index fall back to the first frame by seriesOrder.
  coverSlug: string | null
}

type SeriesDoc = {
  id: string | number
  title?: string | null
  slug?: string | null
  order?: number | null
  cover?: number | { slug?: string | null } | null
}

// Manual order first, unset last, then title so the tail is at least stable.
const bySeriesOrder = (a: SeriesEntry, b: SeriesEntry): number => {
  if (a.order !== b.order) {
    if (a.order === null) return 1
    if (b.order === null) return -1
    return a.order - b.order
  }

  return a.title.localeCompare(b.title)
}

export const getSeries = cache(async (): Promise<SeriesEntry[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'series',
    limit: 500,
    // The cover is a relationship to a photograph; depth 1 resolves it far
    // enough to read the slug the frame is keyed by.
    depth: 1,
    pagination: false,
  })

  return (docs as unknown as SeriesDoc[])
    .filter((doc) => doc.slug)
    .map((doc) => ({
      id: doc.id,
      title: doc.title || String(doc.slug),
      slug: String(doc.slug),
      order: typeof doc.order === 'number' ? doc.order : null,
      coverSlug:
        doc.cover && typeof doc.cover === 'object' && typeof doc.cover.slug === 'string'
          ? doc.cover.slug
          : null,
    }))
    .sort(bySeriesOrder)
})
