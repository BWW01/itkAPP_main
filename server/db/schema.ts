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

    dn: text("dn"),
    entryUUID: uuid("entryUUID").unique(),
    displayName: text("displayName"),
    cn: text("cn"),
    cnEn: text("cnEn"),
    familyNameEn: text("familyNameEn"),
    givenNameEn: text("givenNameEn"),

    objectClass: text("objectClass").array().notNull().default(sql`'{}'::text[]`),
    structuralObjectClass: text("structuralObjectClass"),

    uidNumber: integer("uidNumber"),
    gidNumber: integer("gidNumber"),
    homeDirectory: text("homeDirectory"),
    loginShell: text("loginShell"),
    shadowLastChange: bigint("shadowLastChange", {mode: "number"}),

    sambaSID: text("sambaSID"),
    sambaPrimaryGroupSID: text("sambaPrimaryGroupSID"),
    sambaPwdLastSet: bigint("sambaPwdLastSet", {mode: "number"}),

    ppkePersonFaculty: text("ppkePersonFaculty"),
    ppkePersonMajor: text("ppkePersonMajor"),
    ppkePersonOrgID: text("ppkePersonOrgID"),
    ppkePersonActivityStatus: text("ppkePersonActivityStatus"),

    eduPersonAffiliation: text("eduPersonAffiliation").array().notNull().default(sql`'{}'::text[]`),
    eduPersonEntitlement: text("eduPersonEntitlement").array().notNull().default(sql`'{}'::text[]`),
    eduPersonOrgUnitDN: text("eduPersonOrgUnitDN"),

    mailHost: text("mailHost"),
    zimbraMailDeliveryAddress: text("zimbraMailDeliveryAddress"),

    createTimestamp: timestamp("createTimestamp"),
    modifyTimestamp: timestamp("modifyTimestamp"),
    creatorsName: text("creatorsName"),
    modifiersName: text("modifiersName"),
    entryCSN: text("entryCSN"),
    entryDN: text("entryDN"),
    subschemaSubentry: text("subschemaSubentry"),
    hasSubordinates: boolean("hasSubordinates"),

    rawAttributes: jsonb("rawAttributes").$type<LdapRawAttributes>().notNull().default({}),
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