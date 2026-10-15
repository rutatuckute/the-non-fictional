import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// No schema change: this rewrites one body, Sarajevo's, for its interactive
// walk (see src/lib/stories.ts for the markers). The "Sights" section — the
// static map and the five sights under it — becomes a story: the heading,
// one step per sight (its name in bold, lifted out as the step's label), and
// a last step that hands the map to the reader. The sights' words are kept
// as written; only their double bold (<strong>**Name:**</strong>) becomes
// plain bold.
//
// The section must match exactly; if the body has been edited since, nothing
// is changed and it is logged. The body as it was is kept in
// posts_body_revisions, so `down` restores it.
const SLUG = 'sarajevo-at-the-crossroads-of-the-worlds'
const MIGRATION = '20261015_122117_sarajevo_walk'

const SIGHTS_FROM = "<h4>SIGHTS</h4>\n\n<p><img class=\"blog-post-img\" src=\"/images/uploads/blog-sarajevo-at-the-crossroads-of-the-worlds-b1.jpg\" width=\"1100\"></p> &nbsp;\n\n\n-  <strong>**Markale:**</strong> When in Markale, the bustling market in the center of Sarajevo, look for a <strong>rose</strong> under your feet. This monument marks the single highest number of human casualties caused by mortar shells during the Siege of Sarajevo. At his time, the marketplace was roofless, yet people would still come, even if only a few could actually afford to buy food as prices were reaching new heights on a daily basis.\n\n-  <strong>**Eternal Flame:**</strong> Established in 1946, Eternal Flame is dedicated to a complex day - <strong>the 6th of April</strong>. On the one hand, it is the one of the liberation from the Nazi Germany in 1945, but it also marks the begining of the Siege in 1992. It is located in the famous Tito street, where an artistic installation of 11 541 empty red chairs took place in 2012 - Sarajevo Red Line.\n\n-  <strong>**Papagajka:**</strong> Papagajka carries the reputation of the <strong>ugliest building</strong> in Sarajevo - the claim I strongly oppose. Built for the Olympics at the initiative of Tito, it was supposed to show that communism is not all about blunt and brutal architecture, but that it can also be, well, funky. As for Tito himself, people have rather mixed feelings - some despise him and some long for the former standards of living. Also, Tito is praised for his way of dealing with the Soviet Union and his attempts to cultivate the identity of Yugoslavs all while keeping national sentiments dormant.\n\n- <strong>**Inat Kuća:**</strong> Next to the <strong>Miljacka river</strong> <em>the house of a stubborn man</em> stands as a genuine embodiment of the Bosnian <strong>stubbornness</strong> and perseverance. As the story goes, during the Austro-Hungarian monarchy rule one man was asked to move out so that the City Hall could be constructed. The stubborn man requested his house to be removed brick by brick and rebuilt on the other bank of the river - and they did. This episode of diplomacy and dialogue symbolizes the Bosnian spirit of defiance but it emphasizes why some do not see the Austro-Hungarian occupation as an unquestionably bad thing too - these 40 years brought modernization, stability and order, some claim.\n\n- <strong>**Street Corner 43°51′28.5″N, 18°25′43.5″E:**</strong> This line in history books about the assassination of <strong>Archduke Franz Ferdinand</strong> and his wife Sophie that occured in 1914 is the reason why nearly everyone has heard of Sarajevo. Sure thing, at the time borders were about to be reshaped anyways and the war was just a matter of time. Yet, this one shot of <strong>Gavrilo Princip</strong> unleashed the chain of events. From the First World War to the Second, this one shot was followed by the deaths of millions. Oddly enough, among all people involved in the planning of the assassination, a 19-year old Gavrilo was the only one to be spared the death sentence as he was considered a minor. As for Franz Ferdinand and Sophie, well, they were killed as their driver took a wrong turn, by mistake.\n\n\n"

const SIGHTS_TO = "<!--story:sarajevo-walk-->\n\n<h4>SIGHTS</h4>\n\n<!--step-->\n\n**Markale:** When in Markale, the bustling market in the center of Sarajevo, look for a <strong>rose</strong> under your feet. This monument marks the single highest number of human casualties caused by mortar shells during the Siege of Sarajevo. At his time, the marketplace was roofless, yet people would still come, even if only a few could actually afford to buy food as prices were reaching new heights on a daily basis.\n\n<!--step-->\n\n**Eternal Flame:** Established in 1946, Eternal Flame is dedicated to a complex day - <strong>the 6th of April</strong>. On the one hand, it is the one of the liberation from the Nazi Germany in 1945, but it also marks the begining of the Siege in 1992. It is located in the famous Tito street, where an artistic installation of 11 541 empty red chairs took place in 2012 - Sarajevo Red Line.\n\n<!--step-->\n\n**Papagajka:** Papagajka carries the reputation of the <strong>ugliest building</strong> in Sarajevo - the claim I strongly oppose. Built for the Olympics at the initiative of Tito, it was supposed to show that communism is not all about blunt and brutal architecture, but that it can also be, well, funky. As for Tito himself, people have rather mixed feelings - some despise him and some long for the former standards of living. Also, Tito is praised for his way of dealing with the Soviet Union and his attempts to cultivate the identity of Yugoslavs all while keeping national sentiments dormant.\n\n<!--step-->\n\n**Inat Kuća:** Next to the <strong>Miljacka river</strong> <em>the house of a stubborn man</em> stands as a genuine embodiment of the Bosnian <strong>stubbornness</strong> and perseverance. As the story goes, during the Austro-Hungarian monarchy rule one man was asked to move out so that the City Hall could be constructed. The stubborn man requested his house to be removed brick by brick and rebuilt on the other bank of the river - and they did. This episode of diplomacy and dialogue symbolizes the Bosnian spirit of defiance but it emphasizes why some do not see the Austro-Hungarian occupation as an unquestionably bad thing too - these 40 years brought modernization, stability and order, some claim.\n\n<!--step-->\n\n**Street Corner 43°51′28.5″N, 18°25′43.5″E:** This line in history books about the assassination of <strong>Archduke Franz Ferdinand</strong> and his wife Sophie that occured in 1914 is the reason why nearly everyone has heard of Sarajevo. Sure thing, at the time borders were about to be reshaped anyways and the war was just a matter of time. Yet, this one shot of <strong>Gavrilo Princip</strong> unleashed the chain of events. From the First World War to the Second, this one shot was followed by the deaths of millions. Oddly enough, among all people involved in the planning of the assassination, a 19-year old Gavrilo was the only one to be spared the death sentence as he was considered a minor. As for Franz Ferdinand and Sophie, well, they were killed as their driver took a wrong turn, by mistake.\n\n<!--step-->\n\n**And the rest:** Your turn. These are all the places passed through. **Choose a kind** or **tap a place** to find it on Google Maps.\n\n<!--/story-->\n\n\n"

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const { rows } = await db.execute(sql`SELECT "id", "body" FROM "posts" WHERE "slug" = ${SLUG}`)
  const post = rows[0] as { id: number; body: string } | undefined
  if (!post) {
    payload.logger.warn(`${MIGRATION}: ${SLUG} not found — nothing changed`)
    return
  }
  if (post.body.split(SIGHTS_FROM).length !== 2) {
    payload.logger.warn(`${MIGRATION}: ${SLUG}'s body has changed — nothing changed`)
    return
  }

  const body = post.body.replace(SIGHTS_FROM, () => SIGHTS_TO)

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
