import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Generated, then edited in one place — the same one 20260919_165228_r2_media
// was, for the same reason.
//
// The generator wrote cover_id NOT NULL, because the field is required, and
// Postgres refuses that on a table that already has seven posts and no default
// to give them. It is added nullable instead: Payload enforces the field's
// requiredness on write regardless, and scripts/migrate-covers.ts backfills the
// existing posts by uploading the file each one's cover_image points at.
//
// cover_image itself is kept, with its NOT NULL lifted so that posts created
// from the panel, which no longer set it, can still be inserted. The mapper
// falls back to it for any post not yet linked, so the covers keep showing
// between this deploying and the script being run. A later migration drops it.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ALTER COLUMN "cover_image" DROP NOT NULL;
  ALTER TABLE "posts" ADD COLUMN "cover_id" integer;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "posts_cover_idx" ON "posts" USING btree ("cover_id");`)
}

// Restoring NOT NULL on cover_image fails if a post was created from the panel
// after this ran, since nothing gives it a path. That post needs one set by hand
// before going back.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP CONSTRAINT "posts_cover_id_media_id_fk";
  
  DROP INDEX "posts_cover_idx";
  ALTER TABLE "posts" ALTER COLUMN "cover_image" SET NOT NULL;
  ALTER TABLE "posts" DROP COLUMN "cover_id";`)
}
