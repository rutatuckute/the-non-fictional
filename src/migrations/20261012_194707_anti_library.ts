import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Generated, then given one row: the entry the Writings page was designed
// around, so the (Anti)library has something in it the moment this deploys.
// Everything after it is added from the panel.
const FIRST = {
  source: 'Aeon',
  format: 'Essay',
  title: 'Reason is more than a tool',
  url: 'https://aeon.co/essays/why-real-intelligence-is-something-more-than-optimisation',
  standfirst:
    'If intelligence is merely optimisation then machines will outrun us. Kant tells us why human reason is so much more.',
  author: 'Sasha Mudd',
  notes: [
    "As an ardent advocate for the no-free-will argument (built on Sapolsky's turtles), this nudged me a bit outside of it, making me reflect more on human agency (& expansion).",
    "One brilliant thing about this whole AI/AGI/ASI madness is that it brings the consciousness question back. And that's a major one.",
  ].join('\n\n'),
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_library_kind" AS ENUM('reading', 'watching', 'listening');
  CREATE TABLE "library" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_library_kind" DEFAULT 'reading' NOT NULL,
  	"source" varchar NOT NULL,
  	"format" varchar,
  	"title" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"standfirst" varchar,
  	"author" varchar,
  	"notes" varchar,
  	"added_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "library_id" integer;
  CREATE INDEX "library_updated_at_idx" ON "library" USING btree ("updated_at");
  CREATE INDEX "library_created_at_idx" ON "library" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_library_fk" FOREIGN KEY ("library_id") REFERENCES "public"."library"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_library_id_idx" ON "payload_locked_documents_rels" USING btree ("library_id");`)

  await db.execute(sql`
  INSERT INTO "library" ("kind", "source", "format", "title", "url", "standfirst", "author", "notes", "added_at")
  VALUES ('reading', ${FIRST.source}, ${FIRST.format}, ${FIRST.title}, ${FIRST.url}, ${FIRST.standfirst}, ${FIRST.author}, ${FIRST.notes}, now());`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "library" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "library" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_library_fk";
  
  DROP INDEX "payload_locked_documents_rels_library_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "library_id";
  DROP TYPE "public"."enum_library_kind";`)
}
