import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { subjectCompletions } from "../../../db/schema";

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const id = Number(getRouterParam(event, "id"));
    if (!Number.isInteger(id) || id <= 0) {
        throw createError({ statusCode: 400, message: "Érvénytelen azonosító." });
    }

    // A userId feltétel biztosítja, hogy csak a saját bejegyzését törölhesse.
    const deleted = await db
        .delete(subjectCompletions)
        .where(and(eq(subjectCompletions.id, id), eq(subjectCompletions.userId, session.user.id)))
        .returning({ id: subjectCompletions.id });

    if (deleted.length === 0) {
        throw createError({ statusCode: 404, message: "Nincs ilyen bejegyzés." });
    }
    return { ok: true };
});