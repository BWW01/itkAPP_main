import { pushSubscriptions } from "../../drizzle/schema";
import { db } from "../utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const body = await readBody<{ endpoint: string }>(event);

    await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint));

    return { success: true };
});