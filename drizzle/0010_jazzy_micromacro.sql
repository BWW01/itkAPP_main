ALTER TABLE "StudentSites" ADD COLUMN "isPublic" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "StudentSites" ADD COLUMN "isPhpEnabled" boolean DEFAULT false NOT NULL;