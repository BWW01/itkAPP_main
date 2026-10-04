import { db } from "../../db";
import { associations } from "../../db/schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);

    const [assoc] = await db
        .select({
            neptunLink: associations.neptunLink,
            moodleLink: associations.moodleLink,
            extras: associations.extras,
            neptunLastSyncedAt: associations.neptunLastSyncedAt,
            moodleLastSyncedAt: associations.moodleLastSyncedAt,
        })
        .from(associations)
        .where(eq(associations.ldapUsername, user.login));

    return assoc ?? {
        neptunLink: null,
        moodleLink: null,
        extras: [],
        neptunLastSyncedAt: null,
        moodleLastSyncedAt: null,
    };
});