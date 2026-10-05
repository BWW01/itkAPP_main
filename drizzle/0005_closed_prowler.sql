CREATE TYPE "public"."SubgroupType" AS ENUM('MANDATORY', 'ELECTIVE', 'FREE_ELECTIVE');--> statement-breakpoint
CREATE TABLE "CurriculumGroups" (
	"id" serial PRIMARY KEY NOT NULL,
	"curriculumId" integer NOT NULL,
	"name" text NOT NULL,
	"requiredCredits" integer NOT NULL,
	"requiredSubgroupCount" integer DEFAULT 1 NOT NULL,
	"isSpecialization" boolean DEFAULT false NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "CurriculumGroups_curriculum_name_unique" UNIQUE("curriculumId","name"),
	CONSTRAINT "CurriculumGroups_id_curriculum_unique" UNIQUE("id","curriculumId"),
	CONSTRAINT "CurriculumGroups_requiredCredits_nonneg" CHECK ("CurriculumGroups"."requiredCredits" >= 0),
	CONSTRAINT "CurriculumGroups_requiredSubgroupCount_pos" CHECK ("CurriculumGroups"."requiredSubgroupCount" >= 1)
);
--> statement-breakpoint
CREATE TABLE "CurriculumSubgroups" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"name" text NOT NULL,
	"type" "SubgroupType" NOT NULL,
	"requiredCredits" integer NOT NULL,
	"requiredCount" integer,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "CurriculumSubgroups_group_name_unique" UNIQUE("groupId","name"),
	CONSTRAINT "CurriculumSubgroups_requiredCredits_nonneg" CHECK ("CurriculumSubgroups"."requiredCredits" >= 0),
	CONSTRAINT "CurriculumSubgroups_requiredCount_pos" CHECK ("CurriculumSubgroups"."requiredCount" IS NULL OR "CurriculumSubgroups"."requiredCount" >= 1)
);
--> statement-breakpoint
ALTER TABLE "CurriculumCategories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "CurriculumCategories" CASCADE;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP CONSTRAINT "CurriculumSubjects_creditsOverride_nonneg";--> statement-breakpoint
ALTER TABLE "SubjectCompletions" DROP CONSTRAINT "SubjectCompletions_grade_range";--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP CONSTRAINT "CurriculumSubjects_curriculumId_Curricula_id_fk";
--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP CONSTRAINT "CurriculumSubjects_category_same_curriculum_fk";
--> statement-breakpoint
DROP INDEX "CurriculumSubjects_categoryId_idx";--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ALTER COLUMN "grade" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Curricula" ADD COLUMN "major" text NOT NULL;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD COLUMN "subgroupId" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD COLUMN "credits" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD COLUMN "prerequisites" text;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD COLUMN "specializationGroupId" integer;--> statement-breakpoint
ALTER TABLE "Subjects" ADD COLUMN "nameEn" text;--> statement-breakpoint
ALTER TABLE "Subjects" ADD COLUMN "requirementType" text;--> statement-breakpoint
ALTER TABLE "CurriculumGroups" ADD CONSTRAINT "CurriculumGroups_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubgroups" ADD CONSTRAINT "CurriculumSubgroups_groupId_CurriculumGroups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."CurriculumGroups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_subgroupId_CurriculumSubgroups_id_fk" FOREIGN KEY ("subgroupId") REFERENCES "public"."CurriculumSubgroups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_specialization_same_curriculum_fk" FOREIGN KEY ("specializationGroupId","curriculumId") REFERENCES "public"."CurriculumGroups"("id","curriculumId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "CurriculumSubjects_subjectId_idx" ON "CurriculumSubjects" USING btree ("subjectId");--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP COLUMN "curriculumId";--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP COLUMN "categoryId";--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP COLUMN "creditsOverride";--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" DROP CONSTRAINT "CurriculumSubjects_pk";
--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_pk" PRIMARY KEY("subgroupId","subjectId");--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_credits_nonneg" CHECK ("CurriculumSubjects"."credits" >= 0);--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ADD CONSTRAINT "SubjectCompletions_grade_range" CHECK ("SubjectCompletions"."grade" IS NULL OR "SubjectCompletions"."grade" BETWEEN 1 AND 5);