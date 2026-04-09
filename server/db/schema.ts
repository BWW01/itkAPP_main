import {
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const ldapInfo = pgTable("LdapInfo", {
    id: serial("id").primaryKey(),
    ldapUsername: text("ldapUsername").notNull().unique(),
    email: text("email"),
    familyName: text("familyName").notNull(),
    givenName: text("givenName").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordlessCred = pgTable("PasswordlessCred", {
    id: serial("id").primaryKey(),
    externalId: text("externalId").notNull().unique(),
    userId: integer("userId")
        .notNull()
        .references(() => ldapInfo.id),
    publicKey: text("publicKey").notNull(),
    algorithm: text("algorithm").notNull(),
    counter: integer("counter").notNull(),
});

export const associations = pgTable("Associations", {
    id: serial("id").primaryKey(),
    ldapUsername: text("ldapUsername")
        .notNull()
        .unique()
        .references(() => ldapInfo.ldapUsername),
    links: text("links").array().notNull().default([]),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const pushSubscriptions = pgTable(
    "PushSubscriptions",
    {
        id: serial("id").primaryKey(),
        userId: integer("userId")
            .notNull()
            .references(() => ldapInfo.id, { onDelete: "cascade" }),
        endpoint: text("endpoint").notNull(),
        p256dh: text("p256dh").notNull(),
        auth: text("auth").notNull(),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
    },
    (table) => [uniqueIndex("endpoint_idx").on(table.endpoint)]
);