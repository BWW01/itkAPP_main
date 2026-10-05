CREATE TYPE "public"."SubgroupType" AS ENUM('MANDATORY', 'ELECTIVE', 'FREE_ELECTIVE');--> statement-breakpoint
CREATE TABLE "Curricula" (
                             "id" serial PRIMARY KEY NOT NULL,
                             "code" text NOT NULL,
                             "name" text NOT NULL,
                             "major" text NOT NULL,
                             "totalCreditsRequired" integer NOT NULL,
                             "createdAt" timestamp DEFAULT now() NOT NULL,
                             CONSTRAINT "Curricula_code_unique" UNIQUE("code"),
                             CONSTRAINT "Curricula_totalCredits_positive" CHECK ("Curricula"."totalCreditsRequired" > 0)
);
--> statement-breakpoint
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
CREATE TABLE "Subjects" (
                            "id" serial PRIMARY KEY NOT NULL,
                            "code" text NOT NULL,
                            "name" text NOT NULL,
                            "nameEn" text,
                            "credits" integer NOT NULL,
                            "requirementType" text,
                            "createdAt" timestamp DEFAULT now() NOT NULL,
                            CONSTRAINT "Subjects_code_unique" UNIQUE("code"),
                            CONSTRAINT "Subjects_credits_nonneg" CHECK ("Subjects"."credits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "CurriculumSubjects" (
                                      "subgroupId" integer NOT NULL,
                                      "subjectId" integer NOT NULL,
                                      "credits" integer NOT NULL,
                                      "recommendedSemester" smallint,
                                      "prerequisites" text,
                                      CONSTRAINT "CurriculumSubjects_pk" PRIMARY KEY("subgroupId","subjectId"),
                                      CONSTRAINT "CurriculumSubjects_credits_nonneg" CHECK ("CurriculumSubjects"."credits" >= 0)
);
--> statement-breakpoint
CREATE TABLE "StudentCurricula" (
                                    "id" serial PRIMARY KEY NOT NULL,
                                    "userId" integer NOT NULL,
                                    "curriculumId" integer NOT NULL,
                                    "specializationGroupId" integer,
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
                                      "grade" smallint,
                                      "createdAt" timestamp DEFAULT now() NOT NULL,
                                      CONSTRAINT "SubjectCompletions_user_subject_semester_unique" UNIQUE("userId","subjectId","semester"),
                                      CONSTRAINT "SubjectCompletions_grade_range" CHECK ("SubjectCompletions"."grade" IS NULL OR "SubjectCompletions"."grade" BETWEEN 1 AND 5),
                                      CONSTRAINT "SubjectCompletions_semester_format" CHECK ("SubjectCompletions"."semester" ~ '^[0-9]{4}/[0-9]{2}/[12]$')
    );
--> statement-breakpoint
ALTER TABLE "CurriculumGroups" ADD CONSTRAINT "CurriculumGroups_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubgroups" ADD CONSTRAINT "CurriculumSubgroups_groupId_CurriculumGroups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."CurriculumGroups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_subgroupId_CurriculumSubgroups_id_fk" FOREIGN KEY ("subgroupId") REFERENCES "public"."CurriculumSubgroups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CurriculumSubjects" ADD CONSTRAINT "CurriculumSubjects_subjectId_Subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."Subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_curriculumId_Curricula_id_fk" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curricula"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StudentCurricula" ADD CONSTRAINT "StudentCurricula_specialization_same_curriculum_fk" FOREIGN KEY ("specializationGroupId","curriculumId") REFERENCES "public"."CurriculumGroups"("id","curriculumId") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ADD CONSTRAINT "SubjectCompletions_userId_LdapInfo_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."LdapInfo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubjectCompletions" ADD CONSTRAINT "SubjectCompletions_subjectId_Subjects_id_fk" FOREIGN KEY ("subjectId") REFERENCES "public"."Subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "CurriculumSubjects_subjectId_idx" ON "CurriculumSubjects" USING btree ("subjectId");--> statement-breakpoint
CREATE INDEX "SubjectCompletions_userId_idx" ON "SubjectCompletions" USING btree ("userId");