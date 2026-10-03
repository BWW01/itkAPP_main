ALTER TABLE "LdapInfo" ADD COLUMN "dn" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "entryUUID" uuid;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "displayName" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "cn" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "cnEn" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "familyNameEn" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "givenNameEn" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "objectClass" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "structuralObjectClass" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "uidNumber" integer;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "gidNumber" integer;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "homeDirectory" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "loginShell" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "shadowLastChange" bigint;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "sambaSID" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "sambaPrimaryGroupSID" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "sambaPwdLastSet" bigint;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "ppkePersonFaculty" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "ppkePersonMajor" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "ppkePersonOrgID" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "ppkePersonActivityStatus" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "eduPersonAffiliation" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "eduPersonEntitlement" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "eduPersonOrgUnitDN" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "mailHost" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "zimbraMailDeliveryAddress" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "createTimestamp" timestamp;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "modifyTimestamp" timestamp;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "creatorsName" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "modifiersName" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "entryCSN" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "entryDN" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "subschemaSubentry" text;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "hasSubordinates" boolean;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "rawAttributes" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "ldapSyncedAt" timestamp;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "LdapInfo" ADD CONSTRAINT "LdapInfo_entryUUID_unique" UNIQUE("entryUUID");