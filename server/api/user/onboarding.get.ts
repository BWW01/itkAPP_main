import { db } from "../../db";
import { associations } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const username = getRouterParam(event, "user");

    if (!username) {
        throw createError({ statusCode: 400, statusMessage: "Username required" });
    }

    const association = await db.query.associations.findFirst({
        where: eq(associations.ldapUsername, username),
        columns: { onboardingDone: true },
    });

    if (!association) {
        throw createError({ statusCode: 404, statusMessage: "User not found" });
    }

    return { onboardingDone: association.onboardingDone };
});