import {describe, it, expect} from 'vitest'
import {useEventColor} from '../../app/composables/useEventColor'

// useEventColor has no Vue/Nuxt dependencies so it can run in Node environment

const {eventColor} = useEventColor()

describe('useEventColor', () => {

    describe('bg type (default)', () => {
        it('returns red bg classes for red color', () => {
            const result = eventColor('red')
            expect(result).toContain('bg-rose-50')
            expect(result).toContain('text-rose-700')
        })

        it('returns blue bg classes for blue color', () => {
            const result = eventColor('blue')
            expect(result).toContain('bg-blue-50')
            expect(result).toContain('text-blue-700')
        })

        it('returns green bg classes for green color', () => {
            const result = eventColor('green')
            expect(result).toContain('bg-emerald-100')
            expect(result).toContain('text-emerald-700')
        })

        it('falls back to green for unknown color', () => {
            const result = eventColor('purple')
            expect(result).toContain('bg-emerald-100')
        })
    })

    describe('dot type', () => {
        it('returns red dot class for red color', () => {
            expect(eventColor('red', 'dot')).toBe('bg-rose-400')
        })

        it('returns blue dot class for blue color', () => {
            expect(eventColor('blue', 'dot')).toBe('bg-blue-400')
        })

        it('returns green dot class for green color', () => {
            expect(eventColor('green', 'dot')).toBe('bg-emerald-400')
        })

        it('falls back to green dot for unknown color', () => {
            expect(eventColor('unknown', 'dot')).toBe('bg-emerald-400')
        })
    })

    describe('badge type', () => {
        it('returns red badge classes for red color', () => {
            const result = eventColor('red', 'badge')
            expect(result).toContain('bg-red-100')
            expect(result).toContain('text-red-700')
        })

        it('returns blue badge classes for blue color', () => {
            const result = eventColor('blue', 'badge')
            expect(result).toContain('bg-blue-100')
            expect(result).toContain('text-blue-700')
        })

        it('returns green badge classes for green color', () => {
            const result = eventColor('green', 'badge')
            expect(result).toContain('bg-green-100')
            expect(result).toContain('text-green-700')
        })

        it('falls back to green badge for unknown color', () => {
            const result = eventColor('unknown', 'badge')
            expect(result).toContain('bg-green-100')
        })
    })

    describe('default type', () => {
        it('defaults to bg type when no type is specified', () => {
            expect(eventColor('red')).toBe(eventColor('red', 'bg'))
        })
    })
})