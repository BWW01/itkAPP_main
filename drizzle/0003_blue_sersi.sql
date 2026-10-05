CREATE TYPE "public"."curriculumCategporyType" AS ENUM('MANDATORY', 'ELECTIVE', 'FREE_ELECTIVE', 'MANDATORY_FOR_SPECIALIZATION', 'ELECTIVE_FOR_SPECIALIZATION');--> statement-breakpoint
CREATE TABLE "Curricula" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"totalCreditsRequired" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Curricula_code_unique" UNIQUE("code"),
	CONSTRAINT "Curricula_totalCredits_positive" CHECK ("Curricula"."totalCreditsRequired" > 0)
);
--> statement-breakpoint
CREATE TABLE "CurriculumCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"curriculumId" integer NOT NULL,
	"name" text NOT NULL,
	"type" "curriculumCategporyType" NOT NULL,
	"requiredCredits" integer NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "CurriculumCategories_curriculum_name_unique" UNIQUE("curriculumId","name"),
	CONSTRAINT "CurriculumCategories_id_curriculum_unique" UNIQUE("id","curriculumId"),
	CONSTRAINT "CurriculumCategories_requiredCredits_nonneg" CHECK ("CurriculumCategories"."requiredCredits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "CurriculumSubjects" (
	"curriculumId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"categoryId" integer NOT NULL,
	"creditsOverride" integer,
	"recommendedSemester" smallint,
	CONSTRAINT "CurriculumSubjects_pk" PRIMARY KEY("curriculumId","subjectId"),
	CONSTRAINT "CurriculumSubjects_creditsOverride_nonneg" CHECK ("CurriculumSubjects"."creditsOverride" IS NULL OR "CurriculumSubjects"."creditsOverride" >= 0)
);
--> statement-breakpoint
CREATE TABLE "StudentCurricula" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"curriculumId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StudentCurricula_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "SubjectCompletions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"subjectId" integer NOT NULL,
	"semester" text NOT NULL,
	"grade" smallint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SubjectCompletions_user_subject_semester_unique" UNIQUE("userId","subjectId","semester"),
	CONSTRAINT "SubjectCompletions_grade_range" CHECK ("SubjectCompletions"."grade" BETWEEN 1 AND 5),
	CONSTRAINT "SubjectCompletions_semester_format" CHECK ("SubjectCompletions"."semester" ~ '^[0-9]{4}/[0-9]{2}/[12]$')
);
--> statement-breakpoint
CREATE TABLE "Subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Subjects_code_unique" UNIQUE("code"),
	CONSTRAINT "Subjects_credits_nonneg" CHECK ("Subjects"."credits" >= 0)
);
--> statement-breakpoint
ALTER TABLE "CurriculumCategories" ADD CONSTRAINT "CurriculumCategories_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_subjectId_Subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."Subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_category_same_curriculum_fk" FOREIGN KEY ("categoryId","curriculumId") REFERENCES "public"."CurriculumCategories"("id","curriculumId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ADD CONSTRAINT "SubjectCompletions_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ADD CONSTRAINT "SubjectCompletions_subjectId_Subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."Subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "CurriculumSubjects_categoryId_idx" ON "CurriculumSubjects" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "SubjectCompletions_userId_idx" ON "SubjectCompletions" USING btree ("userId");