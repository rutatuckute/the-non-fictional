import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"cover_id" integer,
  	"slug" varchar,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "photographs" ADD COLUMN "selected" boolean DEFAULT false;
  ALTER TABLE "photographs" ADD COLUMN "selected_order" numeric;
  ALTER TABLE "photographs" ADD COLUMN "series_ref_id" integer;
  ALTER TABLE "photographs" ADD COLUMN "series_order" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "series_id" integer;
  ALTER TABLE "series" ADD CONSTRAINT "series_cover_id_photographs_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."photographs"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "series_cover_idx" ON "series" USING btree ("cover_id");
  CREATE UNIQUE INDEX "series_slug_idx" ON "series" USING btree ("slug");
  CREATE INDEX "series_updated_at_idx" ON "series" USING btree ("updated_at");
  CREATE INDEX "series_created_at_idx" ON "series" USING btree ("created_at");
  ALTER TABLE "photographs" ADD CONSTRAINT "photographs_series_ref_id_series_id_fk" FOREIGN KEY ("series_ref_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "photographs_series_ref_idx" ON "photographs" USING btree ("series_ref_id");
  CREATE INDEX "payload_locked_documents_rels_series_id_idx" ON "payload_locked_documents_rels" USING btree ("series_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "series" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "series" CASCADE;
  ALTER TABLE "photographs" DROP CONSTRAINT "photographs_series_ref_id_series_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_series_fk";
  
  DROP INDEX "photographs_series_ref_idx";
  DROP INDEX "payload_locked_documents_rels_series_id_idx";
  ALTER TABLE "photographs" DROP COLUMN "selected";
  ALTER TABLE "photographs" DROP COLUMN "selected_order";
  ALTER TABLE "photographs" DROP COLUMN "series_ref_id";
  ALTER TABLE "photographs" DROP COLUMN "series_order";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "series_id";`)
}
