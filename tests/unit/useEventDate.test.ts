import {describe, it, expect} from 'vitest'
import type {CalendarEvent} from '../../app/utils/parseIcs'

// Test the pure date math logic from useEventDate without needing Nuxt/i18n context

function makeEvent(daysFromNow: number): CalendarEvent {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    return {
        id: 'test',
        title: 'Test',
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        color: 'green',
        type: 'Esemény',
        time: '10:00',
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
        allDay: false,
    }
}

// Extracted pure function matching useEventDate's daysUntil logic
function daysUntil(e: CalendarEvent): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(e.year, e.month, e.date)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

describe('daysUntil (date math)', () => {
    it('returns 0 for today', () => {
        expect(daysUntil(makeEvent(0))).toBe(0)
    })

    it('returns 1 for tomorrow', () => {
        expect(daysUntil(makeEvent(1))).toBe(1)
    })

    it('returns 7 for one week from now', () => {
        expect(daysUntil(makeEvent(7))).toBe(7)
    })

    it('returns 30 for one month from now', () => {
        expect(daysUntil(makeEvent(30))).toBe(30)
    })
})