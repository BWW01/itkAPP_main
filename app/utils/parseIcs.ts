import ICAL from 'ical.js'

export interface CalendarEvent {
    id: string
    title: string
    date: number        // day of month
    month: number       // 0-indexed
    year: number
    color: string
    type: string
    time: string        // formatted display string
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
    allDay: boolean
    location?: string
    url?: string
}

export function parseIcsToEvents(icsString: string): CalendarEvent[] {
    const jcalData = ICAL.parse(icsString)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    const events: CalendarEvent[] = []
    const now = new Date()

    for (const vevent of vevents) {
        const event = new ICAL.Event(vevent)

        const start = event.startDate.toJSDate()

        // Csak jövőbeli események
        if (start < now) continue

        const title = event.summary || 'Névtelen esemény'
        const url = vevent.getFirstPropertyValue('url') as string | undefined

        const endDate = event.endDate?.toJSDate()
        const allDay = event.startDate.isDate

        const timeStr = formatTime(start, endDate, allDay)
        const { color, type } = classifyEvent(title)

        const rawLocation = vevent.getFirstProperty('location')?.toICALString()
        const location = rawLocation
            ?.replace(/^LOCATION:/i, '')
            ?.replace(/\\,/g, ', ')
            ?.replace(/\\\n\s*/g, '')
            ?.trim() || undefined

        events.push({
            id: event.uid || crypto.randomUUID(),
            title,
            date: start.getDate(),
            month: start.getMonth(),
            year: start.getFullYear(),
            color,
            type,
            time: timeStr,
            startHour: start.getHours(),
            startMinute: start.getMinutes(),
            endHour: endDate ? endDate.getHours() : start.getHours(),
            endMinute: endDate ? endDate.getMinutes() : start.getMinutes(),
            allDay,
            location,
            url,
        })
    }

    return events
}

function formatTime(start: Date, end?: Date, allDay?: boolean): string {
    if (allDay) return 'Egész nap'
    const fmt = (d: Date) =>
        d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
    if (!end || start.getTime() === end.getTime()) return fmt(start)
    return `${fmt(start)} – ${fmt(end)}`
}

function classifyEvent(title: string): { color: string; type: string } {
    const t = title.toLowerCase()
    if (t.includes('zh') || t.includes('vizsga') || t.includes('exam')) return { color: 'red', type: 'Vizsga' }
    if (t.includes('beadandó') || t.includes('határidő') || t.includes('deadline')) return { color: 'blue', type: 'Határidő' }
    return { color: 'green', type: 'Esemény' }
}