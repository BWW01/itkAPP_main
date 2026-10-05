CREATE TABLE "MidtermDates" (
	"id" serial PRIMARY KEY NOT NULL,
	"subjectId" integer NOT NULL,
	"createdBy" integer,
	"startsAt" timestamp with time zone NOT NULL,
	"location" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "MidtermDates" ADD CONSTRAINT "MidtermDates_subjectId_Subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."Subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MidtermDates" ADD CONSTRAINT "MidtermDates_createdBy_LdapInfo_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."LdapInfo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "MidtermDates_subjectId_idx" ON "MidtermDates" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "MidtermDates_startsAt_idx" ON "MidtermDates" USING btree ("startsAt");