import {asc, gt, lt, and} from "drizzle-orm";
import type {PostgresJsDatabase} from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import {classSessions} from "../schema";
export type Db = PostgresJsDatabase<typeof schema>;

export async function findClassSessions(db:Db, from: Data, to: Date){
    return db
        .select()
        .from(ClassSessions)
        .where(and(lt(classSessions.startsAt, to), gt(classSessions.endsAt, from)))
        .orderBy(asc(classSessions.startsAt), asc(ClassSessions.room));
}