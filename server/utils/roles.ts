import {db} from "#server/db";
import {and, eq} from "drizzle-orm";
import {userRoles} from "#server/db/schema";

import type { H3Event } from "h3";
import {isAdminLogin} from "#server/utils/admin";
import {ErrorCode} from "#shared/types/errorCodes";

export async function isCohortRep(userId: number): Promise<boolean> {
    const [row] = await db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.role, "COHORT_REP")))
        .limit(1);

    return row != undefined;
}

export async function canModerateMidterms(event: H3Event, user: { id: number; login: string }): Promise<boolean> {
    return isAdminLogin(event, user.login) || await isCohortRep(user.id)
}

export async function requireMidtermModerator(event: H3Event) {
    const session = await requireUserSession(event);
    if (!(await canModerateMidterms(event, session.user))) {
        throw createError({ statusCode: 403, data: { code: ErrorCode.NO_PERMISSION } });
    }
    return session;
}
