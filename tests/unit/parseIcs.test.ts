import {describe, it, expect} from 'vitest'
import {parseIcsToEvents} from '../../app/utils/parseIcs'

// Generates a future date string in iCal format to pass the "future events only" filter
function futureDate(daysFromNow: number, hour = 10, minute = 0): string {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Builds a minimal valid iCal string from a list of event definitions
function makeIcs(events: {
    uid?: string
    summary: string
    dtstart: string
    dtend?: string
    location?: string
    url?: string
    allDay?: boolean
}[]): string {
    const vevents = events.map(e => {
        const dtstart = e.allDay
            ? `DTSTART;VALUE=DATE:${e.dtstart.slice(0, 8)}`
            : `DTSTART:${e.dtstart}`
        const dtend = e.dtend
            ? e.allDay
                ? `DTEND;VALUE=DATE:${e.dtend.slice(0, 8)}`
                : `DTEND:${e.dtend}`
            : ''
        return [
            'BEGIN:VEVENT',
            `UID:${e.uid ?? crypto.randomUUID()}`,
            `SUMMARY:${e.summary}`,
            dtstart,
            dtend,
            e.location ? `LOCATION:${e.location}` : '',
            e.url ? `URL:${e.url}` : '',
            'END:VEVENT',
        ].filter(Boolean).join('\r\n')
    }).join('\r\n')

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Test//Test//EN',
        vevents,
        'END:VCALENDAR',
    ].join('\r\n')
}

// --- Event classification ---

describe('classifyEvent', () => {
    it('returns red + Vizsga when title contains "vizsga"', () => {
        const ics = makeIcs([{summary: 'Matematika vizsga', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('red')
        expect(event.type).toBe('Vizsga')
    })

    it('returns red + Vizsga when title contains "zh"', () => {
        const ics = makeIcs([{summary: 'Adatstruktúrák ZH', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('red')
        expect(event.type).toBe('Vizsga')
    })

    it('returns red + Vizsga when title contains "exam"', () => {
        const ics = makeIcs([{summary: 'Final Exam', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('red')
        expect(event.type).toBe('Vizsga')
    })

    it('returns blue + Határidő when title contains "beadandó"', () => {
        const ics = makeIcs([{summary: 'Projekt beadandó', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('blue')
        expect(event.type).toBe('Határidő')
    })

    it('returns blue + Határidő when title contains "deadline"', () => {
        const ics = makeIcs([{summary: 'Assignment deadline', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('blue')
        expect(event.type).toBe('Határidő')
    })

    it('returns green + Esemény when no keyword matches', () => {
        const ics = makeIcs([{summary: 'Előadás', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('green')
        expect(event.type).toBe('Esemény')
    })

    it('classification is case-insensitive', () => {
        const ics = makeIcs([{summary: 'MATEMATIKA VIZSGA', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('red')
    })
})

// --- Parsing ---

describe('parseIcsToEvents', () => {
    it('filters out past events', () => {
        const past = new Date()
        past.setDate(past.getDate() - 1)
        const pastStr = past.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

        const ics = makeIcs([
            {summary: 'Past event', dtstart: pastStr},
            {summary: 'Future event', dtstart: futureDate(3)},
        ])
        const events = parseIcsToEvents(ics)
        expect(events).toHaveLength(1)
        expect(events[0].title).toBe('Future event')
    })

    it('sorts events by start time ascending', () => {
        const ics = makeIcs([
            {summary: 'Third', dtstart: futureDate(5)},
            {summary: 'First', dtstart: futureDate(1)},
            {summary: 'Second', dtstart: futureDate(3)},
        ])
        const events = parseIcsToEvents(ics)
        expect(events[0].title).toBe('First')
        expect(events[1].title).toBe('Second')
        expect(events[2].title).toBe('Third')
    })

    it('maps date fields correctly', () => {
        const d = new Date()
        d.setDate(d.getDate() + 5)
        d.setHours(14, 30, 0, 0)
        const dtstart = d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

        const ics = makeIcs([{summary: 'Test', dtstart}])
        const [event] = parseIcsToEvents(ics)

        expect(event.date).toBe(d.getDate())
        expect(event.month).toBe(d.getMonth())
        expect(event.year).toBe(d.getFullYear())
        expect(event.startHour).toBe(14)
        expect(event.startMinute).toBe(30)
    })

    it('strips LOCATION: prefix from location field', () => {
        const ics = makeIcs([{summary: 'Lecture', dtstart: futureDate(3), location: 'IT 408'}])
        const [event] = parseIcsToEvents(ics)
        expect(event.location).toBe('IT 408')
    })

    it('includes url field when present', () => {
        const ics = makeIcs([{summary: 'Moodle task', dtstart: futureDate(3), url: 'https://moodle.ppke.hu/task/1'}])
        const [event] = parseIcsToEvents(ics)
        expect(event.url).toBe('https://moodle.ppke.hu/task/1')
    })

    it('falls back to "Névtelen esemény" when summary is empty', () => {
        const ics = makeIcs([{summary: '', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.title).toBe('Névtelen esemény')
    })

    it('sets allDay = true and time = "Egész nap" for all-day events', () => {
        const d = new Date()
        d.setDate(d.getDate() + 5)
        // ical.js VALUE=DATE expects exactly YYYYMMDD - no time component
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}${month}${day}`

        const ics = makeIcs([{summary: 'Holiday', dtstart: dateStr, allDay: true}])
        const [event] = parseIcsToEvents(ics)
        expect(event.allDay).toBe(true)
        expect(event.time).toBe('Egész nap')
    })

    it('returns empty array for empty calendar', () => {
        const ics = makeIcs([])
        const events = parseIcsToEvents(ics)
        expect(events).toHaveLength(0)
    })

    it('uses uid as event id', () => {
        const ics = makeIcs([{uid: 'test-uid-123', summary: 'Test', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.id).toBe('test-uid-123')
    })
})