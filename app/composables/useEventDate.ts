import type {CalendarEvent} from '~/utils/parseIcs'

export function useEventDate() {
    const {t, locale} = useI18n()
    const today = new Date()

    function eventMonth(e: CalendarEvent) {
        return new Date(e.year, e.month).toLocaleDateString(
            locale.value === 'hu' ? 'hu-HU' : 'en-US', {month: 'short'}
        )
    }

    function eventDateStr(e: CalendarEvent) {
        return new Date(e.year, e.month, e.date).toLocaleDateString(
            locale.value === 'hu' ? 'hu-HU' : 'en-US',
            {month: 'short', day: 'numeric', weekday: 'short'}
        )
    }

    function daysUntil(e: CalendarEvent): number {
        const d = new Date(e.year, e.month, e.date)
        return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    function daysUntilLabel(e: CalendarEvent, short = false): string {
        const n = daysUntil(e)
        if (n === 0) return t('dashboard.today')
        if (n === 1) return t('dashboard.tomorrow')
        return short ? t('dashboard.daysUntilShort', {n}) : t('dashboard.daysUntil', {n})
    }

    return {today, eventMonth, eventDateStr, daysUntil, daysUntilLabel}
}