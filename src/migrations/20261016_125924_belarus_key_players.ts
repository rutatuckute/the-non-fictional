import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// No schema change: this rewrites one body, Elections in Belarus's, for its
// key players figure (see src/lib/stories.ts for the markers). The image of
// the four candidates and what became of each becomes the ballot that sets
// them as text, with the author's engravings.
//
// The replacement must find exactly the text it replaces; if the body has
// been edited since, nothing is changed and it is logged. The body as it was
// is kept in posts_body_revisions, so `down` restores it.
const SLUG = 'elections-in-belarus-97-to-make-the-realm-crumble'
const MIGRATION = '20261016_125924_belarus_key_players'

const IMAGE = '<p><img class="blog-post-img" src="/images/uploads/blog-elections-in-belarus-97-to-make-the-realm-crumble-b1.jpg" width=900></p>'

const REPLACEMENTS: [string, string][] = [[IMAGE, '<!--figure:belarus-key-players-->']]

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
