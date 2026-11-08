ALTER TABLE "ClassSessions" ADD COLUMN "subjectCode" text;--> statement-breakpoint
CREATE INDEX "ClassSessions_subjectCode_idx" ON "ClassSessions" USING btree ("subjectCode");