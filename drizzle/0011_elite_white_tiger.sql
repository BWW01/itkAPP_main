CREATE TABLE "CalendarLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"syncInterval" text DEFAULT '1d' NOT NULL,
	"lastSyncedAt" timestamp,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "calendarLinks_user_url_unique" UNIQUE("userId","url"),
	CONSTRAINT "calendarLinks_syncInterval_valid" CHECK ("CalendarLinks"."syncInterval" IN ('1h', '6h', '1d'))
);
--> statement-breakpoint
ALTER TABLE "CalendarLinks" ADD CONSTRAINT "CalendarLinks_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendarLinks_userId_idx" ON "CalendarLinks" USING btree ("userId");