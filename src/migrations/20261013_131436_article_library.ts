import { randomBytes } from 'node:crypto'

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

import { readingMinutes } from '../lib/reading-time'

// Generated for the Library (posts.sources) and the side note
// (posts.side_note_*), then given the move of the existing content into them.
//
// Five pieces end on a block set off by rules: a list of sources written as an
// icon and a link per line, and in three of them a closing note. Each block is
// lifted out of the body into the new fields, as written below — the entries
// were read off those lines (author, year, title, publisher) and the kind off
// the icon that marked them.
//
// A post whose body no longer ends the way it did when this was written is
// left alone and logged, rather than cut at the wrong place. What is cut is
// kept in posts_body_tails, so `down` can put every body back as it was.
type Source = {
  kind: string
  title: string
  url: string | null
  author: string | null
  year: string | null
  publisher: string | null
}
type Move = {
  slug: string
  cut: string
  sources: Source[]
  sideNote: { label: string | null; text: string } | null
}

const MOVES: Move[] = [
  {
    slug: "war-in-ukraine-kremlins-playbook-for-dummies",
    // Everything from here to the end of the body moves into the fields.
    cut: "\n\n\n- - -\nThis is certainly not exhaustive",
    sources: [{"kind": "books", "title": "Day of the Oprichnik", "url": "https://www.goodreads.com/book/show/9479238-day-of-the-oprichnik", "author": "Vladimir Sorokin", "year": "2006", "publisher": null}, {"kind": "books", "title": "Nothing Is True and Everything Is Possible: The Surreal Heart of the New Russia", "url": "https://www.goodreads.com/en/book/show/21413849-nothing-is-true-and-everything-is-possible", "author": "Peter Pomerantsev", "year": "2014", "publisher": null}, {"kind": "press", "title": "Lithuania’s prime minister, Ingrida Simonyte, says Russia’s invasion was predictable", "url": "https://www.economist.com/by-invitation/2022/03/02/lithuanias-prime-minister-ingrida-simonyte-says-russias-invasion-was-predictable", "author": "The Economist", "year": "2022", "publisher": null}, {"kind": "data", "title": "EUvsDisinfo", "url": "https://euvsdisinfo.eu/", "author": null, "year": null, "publisher": null}, {"kind": "data", "title": "Arena Research Program", "url": "https://arenaresearch.org/", "author": null, "year": null, "publisher": null}, {"kind": "film", "title": "Frost", "url": "https://www.imdb.com/title/tt6464290/", "author": "Šarūnas Bartas", "year": "2017", "publisher": null}, {"kind": "film", "title": "The Fool", "url": "https://www.imdb.com/title/tt3560686/", "author": "Yuriy Bykov", "year": "2014", "publisher": null}, {"kind": "film", "title": "An evening with Anne Applebaum | On propaganda & fake news", "url": "https://www.youtube.com/watch?v=N0NCzTIpJjs", "author": null, "year": "2020", "publisher": null}],
    sideNote: {"label": null, "text": "This is certainly not exhaustive and shall be completed whenever needed."},
  },
  {
    slug: "decoding-lithuania-a-tiny-country-with-reminiscences-of-greatness",
    // Everything from here to the end of the body moves into the fields.
    cut: "\n\n\n- - -\n\nMay this article",
    sources: [{"kind": "books", "title": "The Great Terror", "url": "https://www.goodreads.com/book/show/52137.The_Great_Terror", "author": "Robert Conquest", "year": "1968", "publisher": null}],
    sideNote: {"label": null, "text": "May this article serve as an introduction to a larger series of articles that would cover a tiny bit less Lithuania of the past and focus more on Lithuania of the present."},
  },
  {
    slug: "random-parisian-rides-or-hidalgo-py",
    // Everything from here to the end of the body moves into the fields.
    cut: "\n\n\n- - -\n\n<em>Post Scriptum:</em>",
    sources: [],
    sideNote: {"label": "Post scriptum", "text": "My know-how in python is as random as Parisians driving. I am amused by finding means of *how to get there* once the desired finality is clarified, building it block by block. Any in-depth comprehension on how the infrastructure behind truly works and else is, alas, lacking."},
  },
  {
    slug: "living-without-the-general-theory",
    // Everything from here to the end of the body moves into the fields.
    cut: "\n\n\n- - -\n\n<img class=\"icon\"",
    sources: [{"kind": "press", "title": "Liberals and Conservatives are Similarly Motivated to Avoid Exposure to One Another’s Opinions", "url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2953780", "author": "Jeremy A. Frimer, Linda J. Skitka & Matt Motyl", "year": "2017", "publisher": "Journal of Experimental Social Psychology"}, {"kind": "books", "title": "The Enigma of Reason", "url": "https://www.hup.harvard.edu/catalog.php?isbn=9780674237827", "author": "Hugo Mercier & Dan Sperber", "year": "2019", "publisher": "Harvard University Press"}],
    sideNote: null,
  },
  {
    slug: "sarajevo-at-the-crossroads-of-the-worlds",
    // Everything from here to the end of the body moves into the fields.
    cut: "\n\n\n---\n\n<img class=\"icon\"",
    sources: [{"kind": "film", "title": "Quo Vadis, Aida?", "url": "https://www.imdb.com/title/tt8633462/", "author": "Jasmila Žbanić", "year": "2020", "publisher": null}, {"kind": "film", "title": "The Death of Yugoslavia", "url": "https://www.youtube.com/watch?v=tj9Zw5fN3rE&list=PLdw7wnKe0wiUSNdugFGpnSfm6wt-9gvUt/", "author": "BBC", "year": "1995", "publisher": null}, {"kind": "press", "title": "Is neuroscience getting closer to explaining evil behaviour?", "url": "https://aeon.co/essays/is-neuroscience-getting-closer-to-explaining-evil-behaviour", "author": "Noga Arikha", "year": "2018", "publisher": null}, {"kind": "press", "title": "Why the Balkans Demand Amorality", "url": "https://www.washingtonpost.com/archive/opinions/1999/02/28/why-the-balkans-demand-amorality/3a47a86e-4733-4852-9677-9b70c47a510e/", "author": "Robert D. Kaplan", "year": "1999", "publisher": null}, {"kind": "music", "title": "Dubioza kolektiv", "url": "https://open.spotify.com/artist/02IFYoziC7CpQRK8fbehUY/", "author": null, "year": null, "publisher": null}],
    sideNote: null,
  },
]

// Payload's own row ids are 24 hex characters.
const rowId = () => randomBytes(12).toString('hex')


export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_sources_kind" AS ENUM('books', 'press', 'film', 'music', 'data');
  CREATE TABLE "posts_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_posts_sources_kind" DEFAULT 'books' NOT NULL,
  	"title" varchar NOT NULL,
  	"url" varchar,
  	"author" varchar,
  	"year" varchar,
  	"publisher" varchar
  );
  
  ALTER TABLE "posts" ADD COLUMN "side_note_label" varchar;
  ALTER TABLE "posts" ADD COLUMN "side_note_text" varchar;
  ALTER TABLE "posts_sources" ADD CONSTRAINT "posts_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "posts_sources_order_idx" ON "posts_sources" USING btree ("_order");
  CREATE INDEX "posts_sources_parent_id_idx" ON "posts_sources" USING btree ("_parent_id");
  CREATE TABLE "posts_body_tails" (
  	"post_id" integer PRIMARY KEY NOT NULL REFERENCES "public"."posts"("id") ON DELETE cascade,
  	"tail" varchar NOT NULL
  );`)

  for (const move of MOVES) {
    const { rows } = await db.execute(sql`SELECT "id", "body" FROM "posts" WHERE "slug" = ${move.slug}`)
    const post = rows[0] as { id: number; body: string } | undefined
    const at = post ? post.body.lastIndexOf(move.cut) : -1

    if (!post || at < 0) {
      payload.logger.warn(`article_library: ${move.slug} not moved — its ending has changed`)
      continue
    }

    const body = post.body.slice(0, at).replace(/\s+$/, '') + '\n'
    const tail = post.body.slice(at)

    await db.execute(sql`INSERT INTO "posts_body_tails" ("post_id", "tail") VALUES (${post.id}, ${tail})`)
    await db.execute(sql`
      UPDATE "posts" SET
        "body" = ${body},
        "reading_minutes" = ${readingMinutes(body)},
        "side_note_label" = ${move.sideNote?.label ?? null},
        "side_note_text" = ${move.sideNote?.text ?? null}
      WHERE "id" = ${post.id}`)

    for (const [order, source] of move.sources.entries()) {
      await db.execute(sql`
        INSERT INTO "posts_sources" ("_order", "_parent_id", "id", "kind", "title", "url", "author", "year", "publisher")
        VALUES (${order + 1}, ${post.id}, ${rowId()}, ${source.kind}, ${source.title}, ${source.url}, ${source.author}, ${source.year}, ${source.publisher})`)
    }
  }
}

// Every body gets back the block that was cut from it. The reading time is
// left as it is; the next save from the panel derives it again.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "posts" SET "body" = regexp_replace("posts"."body", '\\s+$', '') || "posts_body_tails"."tail"
     FROM "posts_body_tails" WHERE "posts_body_tails"."post_id" = "posts"."id";
   DROP TABLE "posts_body_tails";
   DROP TABLE "posts_sources" CASCADE;
  ALTER TABLE "posts" DROP COLUMN "side_note_label";
  ALTER TABLE "posts" DROP COLUMN "side_note_text";
  DROP TYPE "public"."enum_posts_sources_kind";`)
}
