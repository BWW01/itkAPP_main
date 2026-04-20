const COLOR_MAP = {
    red: {bg: 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200', dot: 'bg-rose-400'},
    blue: {bg: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', dot: 'bg-blue-400'},
    green: {bg: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300', dot: 'bg-emerald-400'},
} as const

export function useEventColor() {
    const eventColor = (color: string, type: 'bg' | 'dot' = 'bg') =>
        COLOR_MAP[color as keyof typeof COLOR_MAP]?.[type] ?? COLOR_MAP.green[type]

    return {eventColor}
}