import {ErrorCode} from "#shared/types/errorCodes";
import {db} from "../../db";
import {findClassSessions, findSubjectCurricula} from "../../db/queries/kioskClasses";
import {
    KIOSK_KEY_HEADER,
    buildSubjectIndex,
    kioskClassesQuerySchema,
    kioskKeyMatches,
    lookupSubject,
    subjectCodeCandidates,
    toKioskClass,
} from "../../utils/kioskClasses";

export default defineEventHandler(async (event) => {
    const expected = useRuntimeConfig(event).kioskApiKey;
    if (!expected) {
        throw createError({statusCode: 503, data: {code: ErrorCode.KIOSK_NOT_CONFIGURED}});
    }
    if (!kioskKeyMatches(getHeader(event, KIOSK_KEY_HEADER), expected)) {
        throw createError({statusCode: 401, data: {code: ErrorCode.NO_PERMISSION}});
    }

    const parsed = kioskClassesQuerySchema.safeParse(getQuery(event));
    if (!parsed.success) {
        throw createError({
            statusCode: 400,
            data: {code: parsed.error.issues[0]?.message ?? ErrorCode.INVALID_BODY},
        });
    }

    const rows = await findClassSessions(
        db,
        new Date(parsed.data.from),
        new Date(parsed.data.to),
    );
    const codes = [...new Set(rows.flatMap((r) => subjectCodeCandidates(r.subjectCode)))];
    const index = buildSubjectIndex(await findSubjectCurricula(db, codes));

    return {classes: rows.map((r) => toKioskClass(r, lookupSubject(index, r.subjectCode)))};
});