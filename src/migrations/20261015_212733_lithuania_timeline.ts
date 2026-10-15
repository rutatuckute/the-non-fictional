import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// No schema change: this rewrites one body, Decoding Lithuania's, for its
// interactive timeline (see src/lib/stories.ts for the markers).
//
// - "A brief history of Lithuania" becomes a story: the heading and first
//   line pinned, the three history paragraphs cut at their natural breaks
//   into ten steps (every word kept, in order), a last step that hands the
//   timeline to the reader, and the closing line. The timeline image goes.
// - The author's corrections: Gediminas, a 40-years press ban, forbade,
//   occurred.
//
// Every replacement must find exactly the text it replaces; if the body has
// been edited since, nothing is changed and it is logged. The body as it was
// is kept in posts_body_revisions, so `down` restores it.
const SLUG = 'decoding-lithuania-a-tiny-country-with-reminiscences-of-greatness'
const MIGRATION = '20261015_212733_lithuania_timeline'

const HISTORY_FROM = "<h4>A BRIEF HISTORY OF LITHUANIA</h4>\n\nMy intent is not to bother you with heavy historic facts, but rather to introduce the <span style=\"color: #8ac926\"><em>narrative</em></span>.\n\n<img class=\"blog-post-img\" src=\"/images/uploads/blog-decoding-lithuania-a-tiny-country-with-reminiscences-of-greatness-b1.jpg\" width=\"1100\"> &nbsp;\n\nNearly unknown to most, the history of the statehood of Lithuania goes all the way back to the 13th century when a <em>soon-to-be</em> king Mindaugas consolidated Lithuanian lands. <span style=\"color: #8ac926\">The Grand Duchy of Lithuania</span> emerged. Skilled merchants, craftsmen, farmers and traders from Western Europe were invited to settle in Lithuania in exchange of tax concessions and pieces of land, among other privileges, under the rule of the duke Gemininas. Think of it as a sort of free economic zone of the 14th century with favourable tax conditions. Underpinned by great tolerance towards diverse religious and ethnic groups, the prosperity of the Grand Duchy of Lithuania reached its peak in the 15th century, with a territory stretching all the way to the Black Sea.\n\nLater on, as new threats emerged, Lithuania entered into a union with the Kingdom of Poland in 1569, forming a <span style=\"color: #8ac926\">Polish-Lithuanian Commonwealth</span>. While the Union adopted the very first written European constitution on 3 May 1791 (you cannot beat that, France), a burdensome political system alongside with a series of lost wars eventually led to three partitions orchestrated by Prussia, the <span style=\"color: #8ac926\">Russian Empire</span> and the Habsburg Monarchy. Lithuania fell under the Tsarist Russia rule by the end of the 18th century. With the 50-years press ban, which forbided Lithuanian publications and the usage of Latin alphabet, in place, Russian empire attempted to suppress the very core of Lithuanian culture, yet in vain. Russification was met with a resistance movement of book smugglers <em>« on the front lines »</em> who illegally carried books through the border - a unique and unprecedented phenomenon.\n\nAs soon as the 1st World War ended and the Russian Revolution was born, Lithuania seized its chance to recreate what was forcefully formerly taken - its statehood and independence. 1918-1940 may be renowned as the period of a brief prosperity. Brief, as shortly thereafter while the whole Europe was plunging into chaos, Lithuania ended up caught in between the Soviet and Nazi empires. In 1940 Lithuania was annexed by the <span style=\"color: #8ac926\">Soviet Union</span> and hence, forgotten by the world and erased from the map. The onset of the occupation was two-fold: (1) on the one hand, it is a story of mass arrests, interrogations, deportations and executions of the hundreds of thousands of Lithuanians, (2) on the other hand, it is a story of ardent resistance, this time, with Lithuanian partisans on the front lines and in the woods. The years behind the iron curtain resulted in a long and continuous process of shaping a <em>homo sovieticus</em>, detrimental to any form of individualism and fostering indifference. Accelerated by <em>perestroika,</em> Lithuania declared <span style=\"color: #8ac926\">independence</span> on March 11, 1990, laying the foundations for the dissolution of the entire Soviet bloc.\n\nThis brief historical prologue is crucial to understanding Lithuania."

const HISTORY_TO = "<!--story:lithuania-timeline-->\n\n<h4>A BRIEF HISTORY OF LITHUANIA</h4>\n\nMy intent is not to bother you with heavy historic facts, but rather to introduce the <span style=\"color: #8ac926\"><em>narrative</em></span>.\n\n<!--step-->\n\nNearly unknown to most, the history of the statehood of Lithuania goes all the way back to the 13th century when a <em>soon-to-be</em> king Mindaugas consolidated Lithuanian lands. <span style=\"color: #8ac926\">The Grand Duchy of Lithuania</span> emerged.\n\n<!--step-->\n\nSkilled merchants, craftsmen, farmers and traders from Western Europe were invited to settle in Lithuania in exchange of tax concessions and pieces of land, among other privileges, under the rule of the duke Gediminas. Think of it as a sort of free economic zone of the 14th century with favourable tax conditions.\n\n<!--step-->\n\nUnderpinned by great tolerance towards diverse religious and ethnic groups, the prosperity of the Grand Duchy of Lithuania reached its peak in the 15th century, with a territory stretching all the way to the Black Sea.\n\n<!--step-->\n\nLater on, as new threats emerged, Lithuania entered into a union with the Kingdom of Poland in 1569, forming a <span style=\"color: #8ac926\">Polish-Lithuanian Commonwealth</span>.\n\n<!--step-->\n\nWhile the Union adopted the very first written European constitution on 3 May 1791 (you cannot beat that, France), a burdensome political system alongside with a series of lost wars eventually led to three partitions orchestrated by Prussia, the <span style=\"color: #8ac926\">Russian Empire</span> and the Habsburg Monarchy. Lithuania fell under the Tsarist Russia rule by the end of the 18th century.\n\n<!--step-->\n\nWith the 40-years press ban, which forbade Lithuanian publications and the usage of Latin alphabet, in place, Russian empire attempted to suppress the very core of Lithuanian culture, yet in vain. Russification was met with a resistance movement of book smugglers <em>« on the front lines »</em> who illegally carried books through the border - a unique and unprecedented phenomenon.\n\n<!--step-->\n\nAs soon as the 1st World War ended and the Russian Revolution was born, Lithuania seized its chance to recreate what was forcefully formerly taken - its statehood and independence. 1918-1940 may be renowned as the period of a brief prosperity.\n\n<!--step-->\n\nBrief, as shortly thereafter while the whole Europe was plunging into chaos, Lithuania ended up caught in between the Soviet and Nazi empires. In 1940 Lithuania was annexed by the <span style=\"color: #8ac926\">Soviet Union</span> and hence, forgotten by the world and erased from the map.\n\n<!--step-->\n\nThe onset of the occupation was two-fold: (1) on the one hand, it is a story of mass arrests, interrogations, deportations and executions of the hundreds of thousands of Lithuanians, (2) on the other hand, it is a story of ardent resistance, this time, with Lithuanian partisans on the front lines and in the woods. The years behind the iron curtain resulted in a long and continuous process of shaping a <em>homo sovieticus</em>, detrimental to any form of individualism and fostering indifference.\n\n<!--step-->\n\nAccelerated by <em>perestroika,</em> Lithuania declared <span style=\"color: #8ac926\">independence</span> on March 11, 1990, laying the foundations for the dissolution of the entire Soviet bloc.\n\n<!--step-->\n\nYour turn. **Choose a date** to see what happened.\n\n<!--closing-->\n\nThis brief historical prologue is crucial to understanding Lithuania.\n\n<!--/story-->"

const REPLACEMENTS: [string, string][] = [
  [HISTORY_FROM, HISTORY_TO],
  ['occured', 'occurred'],
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
