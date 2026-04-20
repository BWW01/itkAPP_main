import { db } from "../../db";
import { associations } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const username = query.username as string;

    if (!username) return null;

    const [assoc] = await db.select().from(associations).where(eq(associations.ldapUsername, username));
    return assoc || null;
});