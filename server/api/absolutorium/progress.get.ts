import { db } from "../../db";
import { getAbsolutoriumProgress } from "../../db/queries/absolutorium";

export default defineEventHandler(async (event) => {
    const session = await requireUserSession(event);

    const progress = await getAbsolutoriumProgress(db, session.user.id);
    if (!progress) {
        throw createError({
            statusCode: 404,
            message: "Még nincs tanterv kiválasztva.",
        });
    }
    return progress;
});