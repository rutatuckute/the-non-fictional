// Turns the series slug each photograph carries into series documents, and
// points the frames at them.
//
// Membership already exists — nine slugs across thirty-one frames — so nothing
// here decides which frames belong together. It creates a document per slug,
// links the frames to it, and writes seriesOrder from the order those frames
// are already shown in, so the series pages open reading the way the site
// reads today. Order is editorial from then on: change it in the panel.
//
// Idempotent. A series that already exists is reused, a frame already linked is
// left alone, and an order already set by hand is never overwritten.
//
//   npm run migrate:series -- --dry-run
//   npm run migrate:series

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { seriesLabel, splitTitleIndex } from '../src/components/photography/photoData'

const dryRun = process.argv.includes('--dry-run')

type Frame = {
  id: number
  title?: string | null
  series?: string | null
  year?: string | null
  roll?: number | null
  seriesRef?: unknown
  seriesOrder?: number | null
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'photographs',
    limit: 2000,
    depth: 0,
    pagination: false,
  })

  const frames = docs as unknown as Frame[]
  const bySlug = new Map<string, Frame[]>()

  for (const frame of frames) {
    const slug = (frame.series || '').trim()
    if (!slug) continue
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    bySlug.get(slug)!.push(frame)
  }

  if (!bySlug.size) {
    console.log('no series slugs found — nothing to migrate')
    process.exit(0)
  }

  console.log(`${bySlug.size} series across ${[...bySlug.values()].flat().length} frames`)

  let createdSeries = 0
  let linked = 0
  let ordered = 0

  // The index order the slugs are met in, so the series index opens in the
  // order the archive already groups them.
  let position = 1

  for (const [slug, members] of bySlug) {
    const existing = await payload.find({
      collection: 'series',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })

    let seriesId: number

    if (existing.docs.length) {
      seriesId = existing.docs[0].id as number
    } else if (dryRun) {
      console.log(`  would create series  ${slug}  (${seriesLabel(slug)}) with ${members.length} frames`)
      position += 1
      continue
    } else {
      const doc = await payload.create({
        collection: 'series',
        data: { title: seriesLabel(slug), slug, order: position },
      })
      seriesId = doc.id as number
      createdSeries += 1
    }

    position += 1

    // Same rule the archive already reads a series by: the numeral in the
    // title ascends, so the body of work runs forwards.
    const sequence = [...members].sort((a, b) => {
      const left = splitTitleIndex(a.title || '')
      const right = splitTitleIndex(b.title || '')
      const base = left.base.localeCompare(right.base)
      return base !== 0 ? base : left.index - right.index
    })

    for (const [i, frame] of sequence.entries()) {
      const needsLink = !frame.seriesRef
      const needsOrder = frame.seriesOrder === null || frame.seriesOrder === undefined

      if (!needsLink && !needsOrder) continue

      if (dryRun) {
        console.log(`  would set  ${frame.title} -> ${slug} #${i + 1}`)
        continue
      }

      await payload.update({
        collection: 'photographs',
        id: frame.id,
        depth: 0,
        data: {
          ...(needsLink ? { seriesRef: seriesId } : {}),
          ...(needsOrder ? { seriesOrder: i + 1 } : {}),
        },
      })

      if (needsLink) linked += 1
      if (needsOrder) ordered += 1
    }
  }

  console.log(
    dryRun
      ? 'dry run — nothing written'
      : `done: ${createdSeries} series created, ${linked} frames linked, ${ordered} ordered`,
  )

  process.exit(0)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
