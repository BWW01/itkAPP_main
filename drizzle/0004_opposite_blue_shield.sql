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
ALTER TABLE "StudentSites" ADD CONSTRAINT "StudentSites_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;