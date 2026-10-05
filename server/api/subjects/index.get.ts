import {db} from "../../db";
import {subjects} from "../../db/schema";
import {asc} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    return await db
        .select({
            id: subjects.id,
            name: subjects.name,
            code: subjects.code,
        })
        .from(subjects)
        .orderBy(asc(subjects.name));
});