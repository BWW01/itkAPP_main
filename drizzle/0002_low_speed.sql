CREATE TABLE "Settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"language" text NOT NULL,
	"notificationTime" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
DROP TABLE "PasswordlessCred" CASCADE;--> statement-breakpoint
ALTER TABLE "Associations" RENAME COLUMN "links" TO "neptunLink";--> statement-breakpoint
ALTER TABLE "Associations" ALTER COLUMN "neptunLink" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Associations" ALTER COLUMN "neptunLink" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Associations" ALTER COLUMN "neptunLink" TYPE jsonb USING null;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "moodleLink" jsonb;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "extras" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "mergedCalendarHash" text;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "neptunLastSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "moodleLastSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "extrasLastSyncedAt" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "Associations" ADD COLUMN "onboardingDone" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;