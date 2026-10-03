CREATE TABLE "Associations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ldapUsername" text NOT NULL,
	"neptunLink" jsonb,
	"moodleLink" jsonb,
	"extras" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mergedCalendarHash" text,
	"neptunLastSyncedAt" timestamp,
	"moodleLastSyncedAt" timestamp,
	"extrasLastSyncedAt" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboardingDone" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Associations_ldapUsername_unique" UNIQUE("ldapUsername")
);
--> statement-breakpoint
CREATE TABLE "LdapInfo" (
	"id" serial PRIMARY KEY NOT NULL,
	"ldapUsername" text NOT NULL,
	"email" text,
	"familyName" text NOT NULL,
	"givenName" text NOT NULL,
	"fullName" text NOT NULL,
	"ppkePersonActivityStatus" text,
	"eduPersonOrgUnitDN" text,
	"rawAttributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ldapSyncedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "LdapInfo_ldapUsername_unique" UNIQUE("ldapUsername")
);
--> statement-breakpoint
CREATE TABLE "PushSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"language" text NOT NULL,
	"notificationTime" integer DEFAULT 15 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "StudentSites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category" text DEFAULT 'current' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StudentSites_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "Associations" ADD CONSTRAINT "Associations_ldapUsername_LdapInfo_ldapUsername_fk" FOREIGN KEY ("ldapUsername") REFERENCES "public"."LdapInfo"("ldapUsername") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PushSubscriptions" ADD CONSTRAINT "PushSubscriptions_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD CONSTRAINT "StudentSites_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "endpoint_idx" ON "PushSubscriptions" USING btree ("endpoint");