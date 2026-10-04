import { eq } from "drizzle-orm";
import { db } from "../../db";
import { associations } from "../../db/schema";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const association = await db.query.associations.findFirst({
        where: eq(associations.ldapUsername, user.login),
        columns: { onboardingDone: true },
    });

    return { onboardingDone: association?.onboardingDone ?? false };
});