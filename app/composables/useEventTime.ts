// app/composables/useEventTime.ts
import type {CalendarEvent} from '@/utils/parseIcs'

export const HOUR_HEIGHT = 64

export function useEventTime() {
    const eventTop = (event: CalendarEvent) =>
        (event.startHour + event.startMinute / 60) * HOUR_HEIGHT

    const eventHeight = (event: CalendarEvent) => {
        const start = event.startHour + event.startMinute / 60
        const end = event.endHour + event.endMinute / 60
        return Math.max(end - start, 0.5) * HOUR_HEIGHT
    }

    return {eventTop, eventHeight, HOUR_HEIGHT}
}