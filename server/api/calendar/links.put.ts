import { ErrorCode } from "#shared/types/errorCodes";

// Replaced by /api/calendar/v2/links. Remove after the old Associations columns are dropped.
export default defineEventHandler(() => {
    throw createError({
        statusCode: 410,
        data: { code: ErrorCode.ENDPOINT_REMOVED },
    });
});