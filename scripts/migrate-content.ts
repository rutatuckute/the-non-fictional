/**
 * Moves the markdown archive in content/ into Payload.
 *
 * Run once against a fresh database, or again at any time — entries are matched
 * on slug and updated in place, so re-running does not duplicate anything.
 *
 *   npm run migrate:content
 *
 * Slugs are taken from the paths Gatsby published under and are not
 * regenerated. content/blog/<dir>/index.md was served at /<dir>/, and
 * content/photography/<name>.md at /<name>/. Four of those names carry
 * diacritics (lutèce, laumės) and those URLs are indexed, so the bytes are
 * carried across exactly as they are rather than folded to ASCII.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import matter from 'gray-matter'
import { getPayload } from 'payload'

import config from '../src/payload.config.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT = path.resolve(dirname, '..', 'content')

const asTags = (tags: unknown) =>
  Array.isArray(tags)
    ? tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => ({ tag: String(tag) }))
    : []

const readBlog = () => {
  const root = path.join(CONTENT, 'blog')
  if (!fs.existsSync(root)) return []

  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = path.join(root, entry.name, 'index.md')
      const { data, content } = matter(fs.readFileSync(file, 'utf8'))

      return {
        slug: entry.name,
        title: String(data.title ?? entry.name).trim(),
        category: data.category ? String(data.category) : null,
        categoryId: String(data.category_id ?? 'essays'),
        inquiry: data.inquiry ? String(data.inquiry) : null,
        topic: data.topic ? String(data.topic) : null,
        excerpt: String(data.excerpt ?? '').trim(),
        coverImage: String(data.cover_image ?? ''),
        link: data.link ? String(data.link) : null,
        selected: Boolean(data.selected),
        publishedAt: new Date(data.date).toISOString(),
        tags: asTags(data.tags),
        body: content,
      }
    })
}

const readPhotography = () => {
  const root = path.join(CONTENT, 'photography')
  if (!fs.existsSync(root)) return []

  return fs
    .readdirSync(root)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const { data } = matter(fs.readFileSync(path.join(root, name), 'utf8'))

      return {
        slug: name.replace(/\.md$/, ''),
        title: String(data.title ?? '').trim(),
        photo: String(data.photo ?? ''),
        location: data.location ? String(data.location) : null,
        year: data.year != null ? String(data.year) : null,
        roll: Number.isFinite(Number(data.roll)) && data.roll != null ? Number(data.roll) : null,
        type: data.type ? String(data.type) : null,
        series: data.series ? String(data.series) : null,
        date: new Date(data.date).toISOString(),
        tags: asTags(data.tags),
      }
    })
}

const run = async () => {
  const payload = await getPayload({ config })

  // Payload will not let the panel be reached until a user exists, and the
  // first one has to be made from outside it.
  const { totalDocs: userCount } = await payload.count({ collection: 'users' })

  if (userCount === 0) {
    const email = process.env.PAYLOAD_ADMIN_EMAIL || 'hello@thenonfictional.com'
    const password = process.env.PAYLOAD_ADMIN_PASSWORD || 'change-me-now'

    await payload.create({
      collection: 'users',
      data: { email, password, name: 'Rūta Tučkutė' },
    })

    console.log(`created admin user ${email}`)
    if (!process.env.PAYLOAD_ADMIN_PASSWORD) {
      console.log('   password is "change-me-now" — change it on first sign-in')
    }
  }

  for (const [collection, entries] of [
    ['posts', readBlog()],
    ['photographs', readPhotography()],
  ] as const) {
    let created = 0
    let updated = 0

    for (const data of entries) {
      const existing = await payload.find({
        collection,
        where: { slug: { equals: data.slug } },
        limit: 1,
        depth: 0,
      })

      if (existing.docs.length) {
        await payload.update({
          collection,
          id: existing.docs[0].id,
          data: data as never,
        })
        updated += 1
      } else {
        await payload.create({ collection, data: data as never })
        created += 1
      }
    }

    console.log(`${collection}: ${created} created, ${updated} updated`)
  }

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
