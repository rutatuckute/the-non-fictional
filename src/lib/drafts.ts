import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

// A piece still being written. A document in the panel is live the moment it
// is saved — the collection has no draft state, and the previews read the same
// database as the live site — so an unfinished piece is kept as a file in
// drafts/ instead: its fields on top, between two lines of three dashes, and
// its body beneath, exactly as it would be typed into the panel.
//
// Drafts are shown where work is looked at — a development machine and
// Vercel's preview deployments — and nowhere else. The check names the places
// they may appear, so anywhere it does not know shows none, and the live site
// never does. SHOW_DRAFTS=1 is for building them on a development machine.
//
// To publish a draft: create its document in the panel with the same address,
// paste the body in, and delete the file. Until the file is gone the document
// wins, so the two never show at once.
export type Draft = {
  id: string
  title: string
  slug: string
  publishedAt: string
  categoryId: string
  category: string | null
  inquiry: string | null
  topic: string | null
  excerpt: string
  // A path under public/, e.g. /images/uploads/…: the cover on cards and shares.
  coverImage: string | null
  body: string
}

const live = process.env.VERCEL_ENV === 'production'
const shown =
  !live &&
  (process.env.VERCEL_ENV === 'preview' ||
    (process.env.NODE_ENV === 'development' && !process.env.VERCEL_ENV) ||
    process.env.SHOW_DRAFTS === '1')

// Read by path at render time, so the files are named in next.config.mjs for
// the deployment to carry them.
const DIR = path.join(process.cwd(), 'drafts')
const FIELDS = /^---\n([\s\S]*?)\n---\n/

const parse = (file: string, text: string): Draft => {
  const head = text.match(FIELDS)
  if (!head) throw new Error(`drafts/${file} does not open with its fields`)

  const fields: Record<string, string> = {}
  for (const line of head[1].split('\n')) {
    const colon = line.indexOf(':')
    if (colon > 0) fields[line.slice(0, colon).trim()] = line.slice(colon + 1).trim()
  }
  if (!fields.title || !fields.date) throw new Error(`drafts/${file} needs a title and a date`)

  const slug = fields.slug || file.replace(/\.md$/, '')
  return {
    id: `draft-${slug}`,
    title: fields.title,
    slug,
    publishedAt: new Date(fields.date).toISOString(),
    categoryId: fields.form || 'essays',
    category: fields.category || null,
    inquiry: fields.inquiry || null,
    topic: fields.topic || null,
    excerpt: fields.excerpt || '',
    coverImage: fields.cover || null,
    body: text.slice(head[0].length),
  }
}

export const getDrafts = async (): Promise<Draft[]> => {
  if (!shown) return []

  const files = (await readdir(DIR).catch(() => [] as string[])).filter((file) => file.endsWith('.md')).sort()
  return Promise.all(
    files.map(async (file) => parse(file, (await readFile(path.join(DIR, file), 'utf8')).replace(/\r\n/g, '\n'))),
  )
}
