import { db } from "../../db";
import { studentSites } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    await db.delete(studentSites).where(eq(studentSites.userId, user.id));

    return { ok: true };
});