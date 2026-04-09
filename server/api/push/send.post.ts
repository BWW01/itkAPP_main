import webpush from "web-push";
import { pushSubscriptions } from "~/drizzle/schema";
import { db } from "~/server/utils/db";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const body = await readBody<{
        title?: string;
        body?: string;
        url?: string;
        userId?: number;
    }>(event);

    webpush.setVapidDetails(
        config.vapidMailto,
        config.public.vapidPublicKey,
        config.vapidPrivateKey
    );

    const query = db.select().from(pushSubscriptions);

    const subs = body.userId
        ? await query.where(eq(pushSubscriptions.userId, body.userId))
        : await query;

    const payload = JSON.stringify({
        title: body.title ?? "Hello!",
        body: body.body ?? "",
        url: body.url ?? "/",
    });

    await Promise.allSettled(
        subs.map((sub) =>
            webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                },
                payload
            )
        )
    );

    return { success: true };
});