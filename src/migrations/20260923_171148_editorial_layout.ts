import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_photographs_selected_layout" AS ENUM('wide', 'large', 'medium-left', 'medium-right', 'portrait-left', 'portrait-right', 'portrait-center');
  CREATE TYPE "public"."enum_photographs_series_layout" AS ENUM('wide', 'large', 'medium-left', 'medium-right', 'portrait-left', 'portrait-right', 'portrait-center');
  ALTER TABLE "photographs" ADD COLUMN "selected_layout" "enum_photographs_selected_layout";
  ALTER TABLE "photographs" ADD COLUMN "selected_group" varchar;
  ALTER TABLE "photographs" ADD COLUMN "series_layout" "enum_photographs_series_layout";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "photographs" DROP COLUMN "selected_layout";
  ALTER TABLE "photographs" DROP COLUMN "selected_group";
  ALTER TABLE "photographs" DROP COLUMN "series_layout";
  DROP TYPE "public"."enum_photographs_selected_layout";
  DROP TYPE "public"."enum_photographs_series_layout";`)
}
