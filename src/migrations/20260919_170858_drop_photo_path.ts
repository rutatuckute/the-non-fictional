import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// The text column a frame used to carry, holding a path to a file committed
// under public/images/uploads. 20260919_165228_r2_media deliberately kept it:
// it was the only record of which file each frame used, and scripts/migrate-
// media.ts read it to upload them. Every frame now points at a media document
// instead, the files are in the bucket, and the site has been serving them from
// there — so the column is finally redundant.
//
// The files themselves stay in the repository. They are not only the
// photographs: the about page's icon and the seven article covers live in the
// same directory and are still read from it.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "photographs" DROP COLUMN IF EXISTS "photo";`)
}

// The paths cannot come back — nothing recorded them once the column was gone.
// Restoring the shape is the most this can do; scripts/migrate-content.ts
// reseeds from content/ if it is ever actually needed.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "photographs" ADD COLUMN IF NOT EXISTS "photo" varchar;`)
}
