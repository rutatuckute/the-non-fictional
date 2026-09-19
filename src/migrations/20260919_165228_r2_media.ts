import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Generated, then edited in one place: the generator ended up() with
//
//   ALTER TABLE "photographs" DROP COLUMN "photo"
//
// because the field became an upload and the old text column is no longer part
// of the schema. Dropping it here would throw away the only record of which
// file each of the seventy-three frames points at, before any of those files
// have been uploaded to R2 — leaving nothing to match a frame to its image.
//
// The column is kept and its NOT NULL lifted instead, so that rows created from
// the panel, which no longer set it, can still be inserted. That also leaves the
// previous deployment able to read the column while the new one rolls out.
// scripts/migrate-media.ts reads it to do the upload, and a later migration
// drops it once the frames are confirmed to be serving from the bucket.
//
// photo_id is added nullable, for the same reason. The field is required, so the
// generator wrote NOT NULL, which Postgres refuses on a table that already has
// seventy-three rows and no default to give them. Payload enforces the field's
// requiredness on write regardless; the constraint can follow once every frame
// has been backfilled.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  ALTER TABLE "photographs" ADD COLUMN "photo_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  ALTER TABLE "photographs" ADD CONSTRAINT "photographs_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "photographs_photo_idx" ON "photographs" USING btree ("photo_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  ALTER TABLE "photographs" ALTER COLUMN "photo" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "media" CASCADE;
  ALTER TABLE "photographs" DROP CONSTRAINT "photographs_photo_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  DROP INDEX "photographs_photo_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  ALTER TABLE "photographs" ADD COLUMN "photo" varchar NOT NULL;
  ALTER TABLE "photographs" DROP COLUMN "photo_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";`)
}
