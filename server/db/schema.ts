import {
    bigint,
    boolean,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import type {CalendarLink} from "#shared/types/calendar";
import {sql} from "drizzle-orm";
export type LdapRawAttributes = Record<string, string[]>;

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