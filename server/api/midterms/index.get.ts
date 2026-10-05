import {db} from "../../db";
import {midtermDates, subjects} from "../../db/schema";
import {asc, eq, gte} from "drizzle-orm";

export default defineEventHandler(async (event) => {
    await requireUserSession(event);

    return await db
        .select({
            id: midtermDates.id,
            createdBy: midtermDates.createdBy,
            startsAt: midtermDates.startsAt,
            location: midtermDates.location,
            subject: {
                id: subjects.id,
                name: subjects.name,
                code: subjects.code,
            }
        })
        .from(midtermDates)
        .innerJoin(subjects, eq(midtermDates.subjectId, subjects.id))
        .where(gte(midtermDates.startsAt, new Date()))
        .orderBy(asc(midtermDates.startsAt));
});