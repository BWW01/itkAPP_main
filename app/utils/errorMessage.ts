import { ErrorCode } from "#shared/types/errorCodes";

const messages: Record<string, string> = {
    [ErrorCode.MISSING_CREDENTIALS]: "Kérlek add meg a felhasználónevet és a jelszót!",
    [ErrorCode.INVALID_CREDENTIALS]: "Hibás felhasználónév vagy jelszó!",
    [ErrorCode.INVALID_URL]: "Érvénytelen URL.",
    [ErrorCode.INVALID_SYNC_INTERVAL]: "Érvénytelen frissítési időköz.",
    [ErrorCode.INVALID_BODY]: "Hibás adatok.",
};

export function errorMessage(e: any): string {
    return messages[e?.data?.data?.code] ?? "Váratlan hiba történt.";
}