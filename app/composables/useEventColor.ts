const COLOR_MAP = {
    red: {bg: 'bg-red-50 text-red-700 hover:bg-red-100', dot: 'bg-red-400'},
    blue: {bg: 'bg-primary/10 text-primary hover:bg-primary/20', dot: 'bg-primary'},
    green: {bg: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-400'},
} as const

export function useEventColor() {
    const eventColor = (color: string, type: 'bg' | 'dot' = 'bg') =>
        COLOR_MAP[color as keyof typeof COLOR_MAP]?.[type] ?? COLOR_MAP.green[type]

    return {eventColor}
}