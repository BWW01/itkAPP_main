CREATE TYPE "public"."MidtermType" AS ENUM('MIDTERM', 'RETAKE', 'CONSULTATION');--> statement-breakpoint
ALTER TABLE "MidtermDates" ADD COLUMN "type" "MidtermType" DEFAULT 'MIDTERM' NOT NULL;--> statement-breakpoint
CREATE INDEX "MidtermDates_type_idx" ON "MidtermDates" USING btree ("type");