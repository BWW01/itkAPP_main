import {
    bigint, boolean, check, foreignKey, index, integer, jsonb, pgEnum, pgTable,
    primaryKey, serial, smallint, text, timestamp, unique, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import type {CalendarLink} from "#shared/types/calendar";
import {sql} from "drizzle-orm";
export type LdapRawAttributes = Record<string, string[]>;

export const curriculumCategoryType = pgEnum("curriculumCategporyType",[
    "MANDATORY",                    //KÖTELEZŐ
    "ELECTIVE",                     //KÖTVÁL
    "FREE_ELECTIVE",                //SZABVÁL
    "MANDATORY_FOR_SPECIALIZATION", //KÖTELEZŐ SPECEN
    "ELECTIVE_FOR_SPECIALIZATION"   //SZABVÁL SPECEN
]);
export type SubgroupType = (typeof subgroupType.enumValues)[number];


export const curricula = pgTable("Curricula", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    major: text("major").notNull(),
    /** Az importáló számolja: a csoportok összege, a specializáció egyszer számolva (pl. 210). */
    totalCreditsRequired: integer("totalCreditsRequired").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    check("Curricula_totalCredits_positive", sql`${t.totalCreditsRequired} > 0`),
]);

export const curriculumGroups = pgTable("CurriculumGroups", {
    id: serial("id").primaryKey(),
    curriculumId: integer("curriculumId")
        .notNull()
        .references(() => curricula.id, {onDelete: "cascade"}),
    name: text("name").notNull(),
    requiredCredits: integer("requiredCredits").notNull(),
    requiredSubgroupCount: integer("requiredSubgroupCount").notNull().default(1),
    isSpecialization: boolean("isSpecialization").notNull().default(false),
    sortOrder: integer("sortOrder").notNull().default(0),
}, (t) => [
    unique("CurriculumGroups_curriculum_name_unique").on(t.curriculumId, t.name),
    unique("CurriculumGroups_id_curriculum_unique").on(t.id, t.curriculumId),
    check("CurriculumGroups_requiredCredits_nonneg", sql`${t.requiredCredits} >= 0`),
    check("CurriculumGroups_requiredSubgroupCount_pos", sql`${t.requiredSubgroupCount} >= 1`),
]);

export const subjects = pgTable("Subjects", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    nameEn: text("nameEn"),
    credits: integer("credits").notNull(),
    requirementType: text("requirementType"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    check("Subjects_credits_nonneg", sql`${t.credits} >= 0`),
]);

export const curriculumSubgroups = pgTable("CurriculumSubgroups", {
    id: serial("id").primaryKey(),
    groupId: integer("groupId")
        .notNull()
        .references(() => curriculumGroups.id, {onDelete: "cascade"}),
    name: text("name").notNull(),
    type: subgroupType("type").notNull(),
    requiredCredits: integer("requiredCredits").notNull(),
    requiredCount: integer("requiredCount"),
    sortOrder: integer("sortOrder").notNull().default(0),
}, (t) => [
    unique("CurriculumSubgroups_group_name_unique").on(t.groupId, t.name),
    check("CurriculumSubgroups_requiredCredits_nonneg", sql`${t.requiredCredits} >= 0`),
    check("CurriculumSubgroups_requiredCount_pos", sql`${t.requiredCount} IS NULL OR ${t.requiredCount} >= 1`),
]);

export const curriculumSubjects = pgTable("CurriculumSubjects", {
    subgroupId: integer("subgroupId")
        .notNull()
        .references(() => curriculumSubgroups.id, {onDelete: "cascade"}),
    subjectId: integer("subjectId")
        .notNull()
        .references(() => subjects.id, {onDelete: "restrict"}),
    credits: integer("credits").notNull(),
    recommendedSemester: smallint("recommendedSemester"),
    prerequisites: text("prerequisites"),
}, (t) => [
    primaryKey({name: "CurriculumSubjects_pk", columns: [t.subgroupId, t.subjectId]}),
    index("CurriculumSubjects_subjectId_idx").on(t.subjectId),
    check("CurriculumSubjects_credits_nonneg", sql`${t.credits} >= 0`),
]);

export const studentCurricula = pgTable("StudentCurricula", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .notNull()
        .unique()
        .references(() => ldapInfo.id, {onDelete: "cascade"}),
    curriculumId: integer("curriculumId")
        .notNull()
        .references(() => curricula.id, {onDelete: "restrict"}),
    specializationGroupId: integer("specializationGroupId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
    foreignKey({
        name: "StudentCurricula_specialization_same_curriculum_fk",
        columns: [t.specializationGroupId, t.curriculumId],
        foreignColumns: [curriculumGroups.id, curriculumGroups.curriculumId],
    }),
]);

export const subjectCompletions = pgTable("SubjectCompletions", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .notNull()
        .references(() => ldapInfo.id, {onDelete: "cascade"}),
    subjectId: integer("subjectId")
        .notNull()
        .references(() => subjects.id, {onDelete: "restrict"}),
    semester: text("semester").notNull(),                // "2025/26/1"
    grade: smallint("grade"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    unique("SubjectCompletions_user_subject_semester_unique").on(t.userId, t.subjectId, t.semester),
    index("SubjectCompletions_userId_idx").on(t.userId),
    check("SubjectCompletions_grade_range", sql`${t.grade} IS NULL OR ${t.grade} BETWEEN 1 AND 5`),
    check("SubjectCompletions_semester_format", sql`${t.semester} ~ '^[0-9]{4}/[0-9]{2}/[12]$'`),
]);

export const ldapInfo = pgTable("LdapInfo", {
    id: serial("id").primaryKey(),

    ldapUsername: text("ldapUsername").notNull().unique(),
    email: text("email"),
    familyName: text("familyName").notNull(),
    givenName: text("givenName").notNull(),
    fullName: text("fullName").notNull(),
    eduPersonOrgUnitDN: text("eduPersonOrgUnitDN"),
    ldapSyncedAt: timestamp("ldapSyncedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const associations = pgTable("Associations", {
    id: serial("id").primaryKey(),
    ldapUsername: text("ldapUsername")
        .notNull()
        .unique()
        .references(() => ldapInfo.ldapUsername),
    neptunLink: jsonb("neptunLink").$type<CalendarLink | null>(),
    moodleLink: jsonb("moodleLink").$type<CalendarLink | null>(),
    extras: jsonb("extras").$type<CalendarLink[]>().notNull().default([]),
    mergedCalendarHash: text("mergedCalendarHash"),
    neptunLastSyncedAt: timestamp("neptunLastSyncedAt"),
    moodleLastSyncedAt: timestamp("moodleLastSyncedAt"),
    extrasLastSyncedAt: jsonb("extrasLastSyncedAt")
        .$type<Record<string, string>>()
        .notNull()
        .default({}),
    onboardingDone: boolean("onboardingDone").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable(
    "PushSubscriptions",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId")
            .notNull()
            .references(() => ldapInfo.id, {onDelete: "cascade"}),
        endpoint: text("endpoint").notNull(),
        p256dh: text("p256dh").notNull(),
        auth: text("auth").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => [uniqueIndex("endpoint_idx").on(table.endpoint)]
);

export const settings = pgTable("Settings", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .notNull()
        .unique()
        .references(() => ldapInfo.id, {onDelete: "cascade"}),
    language: text("language").notNull(),
    notificationTime: integer("notificationTime").notNull().default(15),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const studentSites = pgTable("StudentSites", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .notNull()
        .unique()
        .references(() => ldapInfo.id, {onDelete: "cascade"}),
    name: text("name").notNull(),
    url: text("url").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    category: text("category").notNull().default("current"), // 'og' | 'current' | 'wip'
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const midtermDates = pgTable("MidtermDates", {
    id: serial("id").primaryKey(),
    subjectId: integer("subjectId").notNull().references(() => subjects.id, {onDelete: "cascade"}),
    createdBy: integer("createdBy").references(() => ldapInfo.id, {onDelete: "set null"}),
    startsAt: timestamp("startsAt", { withTimezone: true }).notNull(),
    location: text("location"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    index("MidtermDates_subjectId_idx").on(t.subjectId),
    index("MidtermDates_startsAt_idx").on(t.startsAt),
])