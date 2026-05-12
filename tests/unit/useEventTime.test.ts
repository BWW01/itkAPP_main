import {describe, it, expect} from 'vitest'
import {useEventTime, HOUR_HEIGHT} from '../../app/composables/useEventTime'
import type {CalendarEvent} from '../../app/utils/parseIcs'

const {eventTop, eventHeight} = useEventTime()

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
    return {
        id: 'test',
        title: 'Test',
        date: 1,
        month: 0,
        year: 2026,
        color: 'green',
        type: 'Esemény',
        time: '10:00',
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
        allDay: false,
        ...overrides,
    }
}

describe('HOUR_HEIGHT', () => {
    it('is 64px', () => {
        expect(HOUR_HEIGHT).toBe(64)
    })
})

describe('eventTop', () => {
    it('returns 0 for midnight (00:00)', () => {
        const event = makeEvent({startHour: 0, startMinute: 0})
        expect(eventTop(event)).toBe(0)
    })

    it('returns correct top for whole hour', () => {
        const event = makeEvent({startHour: 10, startMinute: 0})
        expect(eventTop(event)).toBe(10 * HOUR_HEIGHT)
    })

    it('returns correct top for half hour', () => {
        const event = makeEvent({startHour: 10, startMinute: 30})
        expect(eventTop(event)).toBe(10.5 * HOUR_HEIGHT)
    })

    it('returns correct top for quarter hour', () => {
        const event = makeEvent({startHour: 9, startMinute: 15})
        expect(eventTop(event)).toBeCloseTo(9.25 * HOUR_HEIGHT)
    })

    it('returns correct top for end of day (23:00)', () => {
        const event = makeEvent({startHour: 23, startMinute: 0})
        expect(eventTop(event)).toBe(23 * HOUR_HEIGHT)
    })
})

describe('eventHeight', () => {
    it('returns correct height for 1 hour event', () => {
        const event = makeEvent({startHour: 10, startMinute: 0, endHour: 11, endMinute: 0})
        expect(eventHeight(event)).toBe(HOUR_HEIGHT)
    })

    it('returns correct height for 2 hour event', () => {
        const event = makeEvent({startHour: 9, startMinute: 0, endHour: 11, endMinute: 0})
        expect(eventHeight(event)).toBe(2 * HOUR_HEIGHT)
    })

    it('returns correct height for 30 minute event', () => {
        const event = makeEvent({startHour: 10, startMinute: 0, endHour: 10, endMinute: 30})
        expect(eventHeight(event)).toBe(0.5 * HOUR_HEIGHT)
    })

    it('returns correct height for 90 minute event', () => {
        const event = makeEvent({startHour: 10, startMinute: 0, endHour: 11, endMinute: 30})
        expect(eventHeight(event)).toBe(1.5 * HOUR_HEIGHT)
    })

    it('enforces minimum height of 0.5 * HOUR_HEIGHT for zero-duration events', () => {
        const event = makeEvent({startHour: 10, startMinute: 0, endHour: 10, endMinute: 0})
        expect(eventHeight(event)).toBe(0.5 * HOUR_HEIGHT)
    })

    it('enforces minimum height when end is before start', () => {
        const event = makeEvent({startHour: 11, startMinute: 0, endHour: 10, endMinute: 0})
        expect(eventHeight(event)).toBe(0.5 * HOUR_HEIGHT)
    })

    it('handles events spanning minutes correctly', () => {
        const event = makeEvent({startHour: 10, startMinute: 15, endHour: 11, endMinute: 45})
        expect(eventHeight(event)).toBeCloseTo(1.5 * HOUR_HEIGHT)
    })
})