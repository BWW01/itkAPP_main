import ICAL from 'ical.js'

export interface CalendarEvent {
    id: string
    title: string
    date: number        // day of month
    month: number       // 0-indexed
    year: number
    color: string
    type: string
    time: string
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

        // Időpont formázása
        const endDate = event.endDate?.toJSDate()
        const timeStr = formatTime(start, endDate)

        // Típus és szín meghatározása a cím alapján
        const { color, type } = classifyEvent(title)

        events.push({
            id: event.uid || crypto.randomUUID(),
            title,
            date: start.getDate(),
            month: start.getMonth(),
            year: start.getFullYear(),
            color,
            type,
            time: timeStr,
            url,
        })
    }

    return events
}

function formatTime(start: Date, end?: Date): string {
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