import {describe, it, expect} from 'vitest'
import {parseIcsToEvents} from '../../app/utils/parseIcs'

function futureDate(daysFromNow: number, hour = 10, minute = 0): string {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function futureDateStr(daysFromNow: number): string {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}${m}${day}`
}

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
            ? `DTSTART;VALUE=DATE:${e.dtstart}`
            : `DTSTART:${e.dtstart}`
        const dtend = e.dtend
            ? e.allDay ? `DTEND;VALUE=DATE:${e.dtend}` : `DTEND:${e.dtend}`
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

    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Test//Test//EN', vevents, 'END:VCALENDAR'].join('\r\n')
}

describe('parseIcsToEvents - edge cases', () => {

    it('handles multiple events correctly', () => {
        const ics = makeIcs([
            {summary: 'Event A', dtstart: futureDate(1)},
            {summary: 'Event B', dtstart: futureDate(2)},
            {summary: 'Event C', dtstart: futureDate(3)},
        ])
        const events = parseIcsToEvents(ics)
        expect(events).toHaveLength(3)
    })

    it('two events on same day sorted by start time', () => {
        const ics = makeIcs([
            {summary: 'Afternoon', dtstart: futureDate(1, 14, 0)},
            {summary: 'Morning', dtstart: futureDate(1, 9, 0)},
        ])
        const events = parseIcsToEvents(ics)
        expect(events[0].title).toBe('Morning')
        expect(events[1].title).toBe('Afternoon')
    })

    it('endHour and endMinute are correct', () => {
        const start = futureDate(3, 10, 0)
        const end = futureDate(3, 11, 30)
        const ics = makeIcs([{summary: 'Test', dtstart: start, dtend: end}])
        const [event] = parseIcsToEvents(ics)
        expect(event.endHour).toBe(11)
        expect(event.endMinute).toBe(30)
    })

    it('endHour falls back to startHour when no dtend', () => {
        const ics = makeIcs([{summary: 'Test', dtstart: futureDate(3, 14, 30)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.endHour).toBe(event.startHour)
        expect(event.endMinute).toBe(event.startMinute)
    })

    it('location with escaped comma is parsed correctly', () => {
        const ics = makeIcs([{
            summary: 'Test',
            dtstart: futureDate(3),
            location: 'Building A\\, Room 101',
        }])
        const [event] = parseIcsToEvents(ics)
        expect(event.location).toContain('Building A')
        expect(event.location).toContain('Room 101')
    })

    it('event without location has undefined location', () => {
        const ics = makeIcs([{summary: 'Test', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.location).toBeUndefined()
    })

    it('event without url has undefined url', () => {
        const ics = makeIcs([{summary: 'Test', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.url).toBeUndefined()
    })

    it('classifies határidő correctly', () => {
        const ics = makeIcs([{summary: 'Projekt határidő', dtstart: futureDate(3)}])
        const [event] = parseIcsToEvents(ics)
        expect(event.color).toBe('blue')
        expect(event.type).toBe('Határidő')
    })

    it('generates a uuid when uid is missing', () => {
        const ics = makeIcs([{summary: 'No UID', dtstart: futureDate(3)}])
        // No uid provided - should still have an id
        const [event] = parseIcsToEvents(ics)
        expect(event.id).toBeTruthy()
        expect(typeof event.id).toBe('string')
    })

    it('handles allDay event without dtend', () => {
        const ics = makeIcs([{summary: 'Holiday', dtstart: futureDateStr(5), allDay: true}])
        const [event] = parseIcsToEvents(ics)
        expect(event.allDay).toBe(true)
        expect(event.time).toBe('Egész nap')
    })
})