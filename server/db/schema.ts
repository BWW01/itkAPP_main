import {
    boolean, check, foreignKey, index,
    integer, bigint,
    jsonb, pgEnum,
    pgTable, primaryKey,
    serial, smallint,
    text,
    timestamp, unique,
    uniqueIndex,
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


export const curricula = pgTable("Curricula",{
        id: serial("id").primaryKey(),
        code: text("code").notNull().unique(), //pl mi-bsc-2023
        name: text("name").notNull(), //pl Mérnökinformatikus BSc, 2019-es
        totalCreditsRequired: integer("totalCreditsRequired").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    }, (t) => [
        check("Curricula_totalCredits_positive", sql`${t.totalCreditsRequired} > 0`)
    ]
);

export const curriculumCategories = pgTable("CurriculumCategories",{
    id: serial("id").primaryKey(),
    curriculumId: integer("curriculumId").notNull().references(
        ()=> curricula.id, {onDelete:"cascade"}
    ),
    name: text("name").notNull(),
    type: curriculumCategoryType("type").notNull(),
    requiredCredits: integer("requiredCredits").notNull(),
    sortOrder: integer("sortOrder").notNull().default(0),
}, (t) => [
    unique("CurriculumCategories_curriculum_name_unique").on(t.curriculumId, t.name),
    unique("CurriculumCategories_id_curriculum_unique").on(t.id, t.curriculumId),
    check("CurriculumCategories_requiredCredits_nonneg", sql`${t.requiredCredits} >= 0`),
]);

export const subjects = pgTable("Subjects", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),               // Neptun tárgykód
    name: text("name").notNull(),
    credits: integer("credits").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    check("Subjects_credits_nonneg", sql`${t.credits} >= 0`),
]);

export const curriculumSubjects = pgTable("CurriculumSubjects", {
    curriculumId: integer("curriculumId")
        .notNull()
        .references(() => curricula.id, {onDelete: "cascade"}),
    subjectId: integer("subjectId")
        .notNull()
        .references(() => subjects.id, {onDelete: "restrict"}),
    categoryId: integer("categoryId").notNull(),
    creditsOverride: integer("creditsOverride"),
    recommendedSemester: smallint("recommendedSemester"),
}, (t) => [
    primaryKey({name: "CurriculumSubjects_pk", columns: [t.curriculumId, t.subjectId]}),
    foreignKey({
        name: "CurriculumSubjects_category_same_curriculum_fk",
        columns: [t.categoryId, t.curriculumId],
        foreignColumns: [curriculumCategories.id, curriculumCategories.curriculumId],
    }).onDelete("cascade"),
    index("CurriculumSubjects_categoryId_idx").on(t.categoryId),
    check("CurriculumSubjects_creditsOverride_nonneg", sql`${t.creditsOverride} IS NULL OR ${t.creditsOverride} >= 0`),
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
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export const subjectCompletions = pgTable("SubjectCompletions", {
    id: serial("id").primaryKey(),
    userId: integer("userId")
        .notNull()
        .references(() => ldapInfo.id, {onDelete: "cascade"}),
    subjectId: integer("subjectId")
        .notNull()
        .references(() => subjects.id, {onDelete: "restrict"}),
    semester: text("semester").notNull(),                // "2023/24/1"
    grade: smallint("grade").notNull(),                  // 1–5
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
    unique("SubjectCompletions_user_subject_semester_unique").on(t.userId, t.subjectId, t.semester),
    index("SubjectCompletions_userId_idx").on(t.userId),
    check("SubjectCompletions_grade_range", sql`${t.grade} BETWEEN 1 AND 5`),
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