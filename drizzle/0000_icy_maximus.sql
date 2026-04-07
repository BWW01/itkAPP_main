CREATE TABLE "Associations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ldapUsername" text NOT NULL,
	"links" text[] DEFAULT '{}' NOT NULL,
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
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "LdapInfo_ldapUsername_unique" UNIQUE("ldapUsername")
);
--> statement-breakpoint
CREATE TABLE "PasswordlessCred" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" text NOT NULL,
	"userId" integer NOT NULL,
	"publicKey" text NOT NULL,
	"algorithm" text NOT NULL,
	"counter" integer NOT NULL,
	CONSTRAINT "PasswordlessCred_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
ALTER TABLE "Associations" ADD CONSTRAINT "Associations_ldapUsername_LdapInfo_ldapUsername_fk" FOREIGN KEY ("ldapUsername") REFERENCES "public"."LdapInfo"("ldapUsername") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "PasswordlessCred" ADD CONSTRAINT "PasswordlessCred_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE no action ON UPDATE no action;