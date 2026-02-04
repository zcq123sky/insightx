CREATE TYPE "public"."pr_status" AS ENUM('open', 'merged', 'closed', 'analyzed');--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"pr_id" integer NOT NULL,
	"summary" text NOT NULL,
	"complexity_score" integer,
	"quality_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(512) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"author" varchar(100) NOT NULL,
	"repository" varchar(255) NOT NULL,
	"status" "pr_status" DEFAULT 'open' NOT NULL,
	"files_changed" integer,
	"additions" integer,
	"deletions" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "pull_requests_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_pr_id_pull_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."pull_requests"("id") ON DELETE no action ON UPDATE no action;