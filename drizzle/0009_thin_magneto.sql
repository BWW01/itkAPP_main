ALTER TABLE "StudentSites" DROP CONSTRAINT "StudentSites_userId_LdapInfo_id_fk";
--> statement-breakpoint
ALTER TABLE "StudentSites" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD COLUMN "login" text;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD COLUMN "legacyName" text;--> statement-breakpoint
UPDATE "StudentSites" s SET "login" = l."ldapUsername" FROM "LdapInfo" l WHERE s."userId" = l."id";--> statement-breakpoint
ALTER TABLE "StudentSites" ALTER COLUMN "login" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD CONSTRAINT "StudentSites_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD CONSTRAINT "StudentSites_login_unique" UNIQUE("login");