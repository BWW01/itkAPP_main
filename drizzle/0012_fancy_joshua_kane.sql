CREATE TYPE "public"."SyncInterval" AS ENUM('1h', '6h', '1d');--> statement-breakpoint
ALTER TABLE "CalendarLinks" ALTER COLUMN "syncInterval" SET DEFAULT '1d'::"public"."SyncInterval";--> statement-breakpoint
ALTER TABLE "CalendarLinks" ALTER COLUMN "syncInterval" SET DATA TYPE "public"."SyncInterval" USING "syncInterval"::"public"."SyncInterval";