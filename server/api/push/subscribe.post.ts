import webpush from "web-push";
import { pushSubscriptions } from "../../db/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const session = await getUserSession(event);

    if (!session?.user) {
        throw createError({ statusCode: 401, message: "Unauthorized" });
    }

    const body = await readBody<{
        endpoint: string;
        keys: { p256dh: string; auth: string };
    }>(event);

    webpush.setVapidDetails(
        config.vapidMailto,
        config.public.vapidPublicKey,
        config.vapidPrivateKey
    );

    // Upsert — avoid duplicates if user re-subscribes
    const existing = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.endpoint, body.endpoint))
        .limit(1);

    if (existing.length === 0) {
        await db.insert(pushSubscriptions).values({
            userId: session.user.id,
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
        });
    }

    return { success: true };
});