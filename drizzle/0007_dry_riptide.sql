CREATE TABLE "OnlineVideos" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacyId" integer,
	"semester" text NOT NULL,
	"semesterOrder" integer NOT NULL,
	"subject" text NOT NULL,
	"title" text NOT NULL,
	"uploader" text,
	"url" text NOT NULL,
	"youtubeId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "OnlineVideos_legacyId_unique" UNIQUE("legacyId")
);
--> statement-breakpoint
CREATE INDEX "online_videos_semester_subject_idx" ON "OnlineVideos" USING btree ("semester","subject");--> statement-breakpoint
CREATE INDEX "online_videos_subject_idx" ON "OnlineVideos" USING btree ("subject");