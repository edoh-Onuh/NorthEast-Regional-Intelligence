CREATE TABLE "indicator_observations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "indicator_observations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"la_code" varchar(9) NOT NULL,
	"domain" text NOT NULL,
	"metric" text NOT NULL,
	"period" text NOT NULL,
	"period_type" text NOT NULL,
	"value" numeric(16, 4) NOT NULL,
	"unit" text,
	"source_dataset" text NOT NULL,
	"source_url" text,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "ingestion_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"domain" text NOT NULL,
	"source" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"rows_written" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "local_authorities" (
	"code" varchar(9) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"nomis_id" text,
	"police_force" text,
	"color_var" varchar(40) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "indicator_observations" ADD CONSTRAINT "indicator_observations_la_code_local_authorities_code_fk" FOREIGN KEY ("la_code") REFERENCES "public"."local_authorities"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_observation" ON "indicator_observations" USING btree ("la_code","domain","metric","period");--> statement-breakpoint
CREATE INDEX "idx_observation_domain" ON "indicator_observations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_observation_metric" ON "indicator_observations" USING btree ("metric");