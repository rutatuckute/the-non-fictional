import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// No schema change: this rewrites one body, Take me home's, for its
// interactive story (see src/lib/stories.ts for the markers).
//
// - The batch-file screenshot becomes a fenced code block.
// - The Save-as and Task Scheduler screenshots become interactive figures.
// - "Outcome & price fluctuations" becomes a story: its heading and paragraph,
//   five steps, and the closing paragraph, in place of the static chart.
//
// Each replacement must find exactly the text it replaces; if the body has
// been edited since this was written, nothing is changed and it is logged.
// The body as it was is kept in posts_body_revisions, so `down` restores it.
const SLUG = 'take-me-home-country-roads-scheduler'
const MIGRATION = '20261014_160138_take_me_home_story'

const image = (name: string, width: number) =>
  `<p><img class="blog-post-img" src="/images/uploads/blog-take-me-home-country-roads-scheduler-${name}.jpg" width="${width}"></p>`

const BATCH = String.raw`~~~bat
"C:\Users\ruttuc\AppData\Local\Programs\Python\Python38-32\python.exe"
"C:\Users\ruttuc\Desktop\take_me_home\skyscanner.py"
pause
~~~`

const OUTCOME_FROM = `<h4>OUTCOME & PRICE FLUCTUATIONS</h4>

The script allowed me to collect 18-days data on the minimum price for my round-trip flight. Unsurprisingly, it skyrockets prior to Christmas, the effect exacerbated by a significant reduction in flight frequency.

${image('cover', 500)}

At the end of the day, both having a clue on how to connect to an open source API and schedule your script are handy skills to have. Regardless of whether you will use it to plan your next trip - a daring assumption nowadays - or to automate data extraction for any other purpose.`

const OUTCOME_TO = `<!--story:take-me-home-prices-->

<h4>OUTCOME & PRICE FLUCTUATIONS</h4>

The script allowed me to collect 18-days data on the minimum price for my round-trip flight. Unsurprisingly, it skyrockets prior to Christmas, the effect exacerbated by a significant reduction in flight frequency.

<!--step-->

Each day, the script saved one number: the cheapest round trip available. On **1 December** it was **€219**.

<!--step-->

Within a week, the same flight costs **€547**, or x2.5 more, D-13 to take-off.

<!--step-->

From **14 December** it held at **€607** for three days – the peak, almost x3 the first quote.

<!--step-->

Then, three days before departure, it fell by **€100** as the Lithuanian government imposed tougher Covid-19 restrictions.

<!--step-->

Your turn. **Select a day** to book and see what that trip back home would have cost you.

<!--closing-->

At the end of the day, both having a clue on how to connect to an open source API and schedule your script are handy skills to have. Regardless of whether you will use it to plan your next trip - a daring assumption nowadays - or to automate data extraction for any other purpose.

<!--/story-->`

const REPLACEMENTS: [string, string][] = [
  [image('b1', 800), BATCH],
  [image('b2', 700), '<!--figure:take-me-home-save-dialog-->'],
  [image('b3', 700), '<!--figure:take-me-home-scheduler-path-->'],
  [OUTCOME_FROM, OUTCOME_TO],
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "posts_body_revisions" (
  	"post_id" integer NOT NULL REFERENCES "public"."posts"("id") ON DELETE cascade,
  	"migration" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	PRIMARY KEY ("post_id", "migration")
  );`)

  const { rows } = await db.execute(sql`SELECT "id", "body" FROM "posts" WHERE "slug" = ${SLUG}`)
  const post = rows[0] as { id: number; body: string } | undefined
  if (!post) {
    payload.logger.warn(`${MIGRATION}: ${SLUG} not found — nothing changed`)
    return
  }

  const missing = REPLACEMENTS.filter(([from]) => post.body.split(from).length !== 2)
  if (missing.length) {
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
