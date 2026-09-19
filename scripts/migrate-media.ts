// Moves the frames out of the repository and into R2.
//
// Until now a photograph carried a path — /images/uploads/name.jpg — pointing at
// a file committed alongside the site. The field is an upload now, so each file
// has to exist as a media document before a frame can point at it. This reads
// the old paths straight out of the column the migration deliberately kept,
// uploads each file once, and links every frame that used it.
//
// It is idempotent: frames already linked are skipped, and a file already in the
// bucket is reused rather than uploaded again, so it can be re-run after a
// failure without duplicating anything.
//
//   npm run migrate:media -- --dry-run   report what it would do
//   npm run migrate:media                do it
//
// This has been run. The column it reads was dropped afterwards, so against the
// current schema it fails at the query rather than doing anything — it is kept
// for a database that predates that migration, and as the record of how the
// files moved.

import fs from 'fs'
import path from 'path'

import { getPayload } from 'payload'
import { Client } from 'pg'

import config from '../src/payload.config'

const UPLOADS = path.join(process.cwd(), 'public', 'images', 'uploads')
const dryRun = process.argv.includes('--dry-run')

type Row = { id: number; photo: string }

const run = async (): Promise<void> => {
  const connectionString = process.env.DATABASE_URI
  if (!connectionString) throw new Error('DATABASE_URI is not set')

  const sql = new Client({ connectionString })
  await sql.connect()

  // The old column is not part of the schema any more, so Payload cannot read
  // it. Frames already carrying a photo_id are left alone.
  const { rows } = await sql.query<Row>(
    `select id, photo from photographs
      where photo is not null and photo <> '' and photo_id is null
      order by id`,
  )

  if (!rows.length) {
    console.log('nothing to migrate — every frame already points at an upload')
    await sql.end()
    return
  }

  console.log(`${rows.length} frame(s) to link`)

  const payload = await getPayload({ config })

  // One media document per file. Several frames can share a file, and the
  // filename index is unique, so uploading per frame would fail on the second.
  const byFile = new Map<string, number>()
  let created = 0
  let linked = 0
  let missing = 0

  for (const row of rows) {
    const basename = path.basename(row.photo)
    const filePath = path.join(UPLOADS, basename)

    if (!fs.existsSync(filePath)) {
      console.warn(`  MISSING  ${basename} (frame ${row.id})`)
      missing += 1
      continue
    }

    let mediaId = byFile.get(basename)

    if (!mediaId) {
      // Already uploaded by an earlier run?
      const existing = await payload.find({
        collection: 'media',
        where: { filename: { equals: basename } },
        limit: 1,
        depth: 0,
      })

      if (existing.docs.length) {
        mediaId = existing.docs[0].id as number
      } else if (dryRun) {
        console.log(`  would upload  ${basename}`)
        byFile.set(basename, -1)
        continue
      } else {
        const doc = await payload.create({ collection: 'media', data: {}, filePath })
        mediaId = doc.id as number
        created += 1
      }

      byFile.set(basename, mediaId)
    }

    if (mediaId === -1) continue

    if (dryRun) {
      console.log(`  would link    frame ${row.id} -> ${basename}`)
      continue
    }

    await payload.update({
      collection: 'photographs',
      id: row.id,
      data: { photo: mediaId },
      depth: 0,
    })
    linked += 1
  }

  console.log(
    dryRun
      ? 'dry run — nothing written'
      : `done: ${created} file(s) uploaded, ${linked} frame(s) linked, ${missing} missing`,
  )

  await sql.end()
  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
