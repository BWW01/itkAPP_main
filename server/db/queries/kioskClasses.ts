import {asc, gt, lt, and} from "drizzle-orm";
import type {PostgresJsDatabase} from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import {classSessions} from "../schema";

export type Db = PostgresJsDatabase<typeof schema>;

export async function findClassSessions(db: Db, from: Date, to: Date) {
    return db
        .select()
        .from(classSessions)
        .where(and(lte(classSessions.startsAt, now), gt(classSessions.endsAt, now)))
        .orderBy(asc(classSessions.startsAt), asc(classSessions.room));
}