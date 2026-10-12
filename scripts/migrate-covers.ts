// Moves the writing covers out of the repository and into R2.
//
// A post's cover was a path — /images/uploads/blog-<slug>-cover.jpg — pointing
// at a file committed alongside the site, so replacing one meant a commit and a
// deploy. The field is an upload now, so each file has to exist as a media
// document before a post can point at it. This reads the old path off the
// superseded coverImage field, uploads the file once, and links the post to it.
//
// It is idempotent: posts already linked are skipped, and a file already in the
// bucket is reused rather than uploaded again, so it can be re-run after a
// failure without duplicating anything.
//
//   npm run migrate:covers -- --dry-run   report what it would do
//   npm run migrate:covers                do it
//
// It writes to whichever database and bucket .env names, so against production
// it needs production's DATABASE_URI, PAYLOAD_SECRET and R2_* variables.

import fs from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const UPLOADS = path.join(process.cwd(), 'public', 'images', 'uploads')
const dryRun = process.argv.includes('--dry-run')

type PostRow = {
  id: number
  slug?: string | null
  cover?: number | { id: number } | null
  coverImage?: string | null
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'posts',
    limit: 1000,
    depth: 0,
    pagination: false,
  })

  const rows = (docs as unknown as PostRow[]).filter((doc) => !doc.cover && doc.coverImage)

  if (!rows.length) {
    console.log('nothing to migrate — every post already points at an uploaded cover')
    process.exit(0)
  }

  console.log(`${rows.length} post(s) to link`)

  let created = 0
  let linked = 0
  let missing = 0

  for (const row of rows) {
    const basename = path.basename(row.coverImage as string)
    const filePath = path.join(UPLOADS, basename)

    if (!fs.existsSync(filePath)) {
      console.warn(`  MISSING  ${basename} (post ${row.slug ?? row.id})`)
      missing += 1
      continue
    }

    // Already uploaded by an earlier run? The filename index on media is
    // unique, so a second upload of the same file would come back renamed.
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: basename } },
      limit: 1,
      depth: 0,
    })

    let mediaId = existing.docs[0]?.id as number | undefined

    if (dryRun) {
      console.log(
        mediaId
          ? `  would link    ${row.slug} -> ${basename} (already uploaded)`
          : `  would upload  ${basename} and link ${row.slug}`,
      )
      continue
    }

    if (!mediaId) {
      const doc = await payload.create({ collection: 'media', data: {}, filePath })
      mediaId = doc.id as number
      created += 1
    }

    await payload.update({
      collection: 'posts',
      id: row.id,
      data: { cover: mediaId },
      depth: 0,
    })
    console.log(`  linked  ${row.slug} -> ${basename}`)
    linked += 1
  }

  console.log(
    dryRun
      ? 'dry run — nothing written'
      : `done: ${created} file(s) uploaded, ${linked} post(s) linked, ${missing} missing`,
  )

  process.exit(missing ? 1 : 0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
