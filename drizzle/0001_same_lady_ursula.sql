CREATE TABLE "bucket_exclusions" (
	"bucket_id" uuid NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "bucket_exclusions_bucket_id_date_pk" PRIMARY KEY("bucket_id","date")
);
--> statement-breakpoint
ALTER TABLE "daily_buckets" ADD COLUMN "persistent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bucket_exclusions" ADD CONSTRAINT "bucket_exclusions_bucket_id_daily_buckets_id_fk" FOREIGN KEY ("bucket_id") REFERENCES "public"."daily_buckets"("id") ON DELETE cascade ON UPDATE no action;