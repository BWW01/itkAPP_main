CREATE TYPE "public"."UserRole" AS ENUM('COHORT_REP');--> statement-breakpoint
CREATE TABLE "UserRoles" (
	"userId" integer NOT NULL,
	"role" "UserRole" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "UserRoles_pk" PRIMARY KEY("userId","role")
);
--> statement-breakpoint
ALTER TABLE "UserRoles" ADD CONSTRAINT "UserRoles_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;