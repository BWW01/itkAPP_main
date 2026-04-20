export function parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)([mhd])$/);
    if (!match) throw new Error(`Invalid interval: ${interval}`);
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
}

export function isDue(lastSyncedAt: Date | null, interval: string): boolean {
    if (!lastSyncedAt) return true;
    const elapsed = Date.now() - new Date(lastSyncedAt).getTime();
    return elapsed >= parseInterval(interval);
}