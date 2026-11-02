CREATE TYPE "public"."ClassKind" AS ENUM('lab', 'practice', 'lecture', 'other');--> statement-breakpoint
CREATE TABLE "ClassSessions" (
	"id" text PRIMARY KEY NOT NULL,
	"room" text NOT NULL,
	"subject" text NOT NULL,
	"kind" "ClassKind" DEFAULT 'other' NOT NULL,
	"startsAt" timestamp with time zone NOT NULL,
	"endsAt" timestamp with time zone NOT NULL,
	"groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"instructors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capacity" integer,
	"importedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ClassSessions_endsAt_after_startsAt" CHECK ("ClassSessions"."endsAt" > "ClassSessions"."startsAt")
);
--> statement-breakpoint
CREATE INDEX "ClassSessions_startsAt_idx" ON "ClassSessions" USING btree ("startsAt");--> statement-breakpoint
CREATE INDEX "ClassSessions_room_startsAt_idx" ON "ClassSessions" USING btree ("room","startsAt");