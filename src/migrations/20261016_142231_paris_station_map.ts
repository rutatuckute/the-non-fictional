import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// No schema change: this rewrites one body, Random Parisian rides', for its
// two figures (see src/lib/stories.ts for the markers). The screenshot of the
// script's map becomes the station map drawn from a snapshot; the Locate
// Control screenshot becomes the close-up around Choiseul – Quatre Septembre.
//
// Every replacement must find exactly the text it replaces; if the body has
// been edited since, nothing is changed and it is logged. The body as it was
// is kept in posts_body_revisions, so `down` restores it.
const SLUG = 'random-parisian-rides-or-hidalgo-py'
const MIGRATION = '20261016_142231_paris_station_map'

const MAP_IMAGE = '<img class="blog-post-img" src="/images/uploads/blog-random-parisian-rides-or-hidalgo-py-b1.jpg" width="900"> &nbsp;'
const LOCATE_IMAGE = '<p><img class="blog-post-img" src="/images/uploads/blog-random-parisian-rides-or-hidalgo-py-b2.jpg" width="600"></p>'

const REPLACEMENTS: [string, string][] = [
  [MAP_IMAGE, '<!--figure:paris-station-map-->'],
  [LOCATE_IMAGE, '<!--figure:paris-locate-closeup-->'],
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const { rows } = await db.execute(sql`SELECT "id", "body" FROM "posts" WHERE "slug" = ${SLUG}`)
  const post = rows[0] as { id: number; body: string } | undefined
  if (!post) {
    payload.logger.warn(`${MIGRATION}: ${SLUG} not found — nothing changed`)
    return
  }
  if (REPLACEMENTS.some(([from]) => post.body.split(from).length !== 2)) {
    payload.logger.warn(`${MIGRATION}: ${SLUG}'s body has changed — nothing changed`)
    return
  }

  const body = REPLACEMENTS.reduce((text, [from, to]) => text.replace(from, () => to), post.body)

  await db.execute(sql`
    INSERT INTO "posts_body_revisions" ("post_id", "migration", "body")
    VALUES (${post.id}, ${MIGRATION}, ${post.body})
    ON CONFLICT DO NOTHING`)
  await db.execute(sql`
    UPDATE "posts" SET "body" = ${body}, "reading_minutes" = ${readingMinutes(body)}
    WHERE "id" = ${post.id}`)
}

// The body goes back exactly as it was before this ran.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "posts" SET "body" = "posts_body_revisions"."body"
     FROM "posts_body_revisions"
     WHERE "posts_body_revisions"."post_id" = "posts"."id"
       AND "posts_body_revisions"."migration" = ${MIGRATION}`)
  await db.execute(sql`DELETE FROM "posts_body_revisions" WHERE "migration" = ${MIGRATION}`)
}
