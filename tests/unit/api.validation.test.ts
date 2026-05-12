import {describe, it, expect} from 'vitest'

// Test the URL validation logic extracted from importCalLinks.post.ts
// This mirrors the server-side validateUrl function exactly

function validateUrl(urlString: string | null | undefined): string | null {
    if (!urlString || urlString.trim() === '') return null
    try {
        new URL(urlString.trim())
        return urlString.trim()
    } catch {
        throw new Error('Érvénytelen URL formátum!')
    }
}

describe('importCalLinks - URL validation', () => {

    it('returns null for null input', () => {
        expect(validateUrl(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
        expect(validateUrl(undefined)).toBeNull()
    })

    it('returns null for empty string', () => {
        expect(validateUrl('')).toBeNull()
    })

    it('returns null for whitespace-only string', () => {
        expect(validateUrl('   ')).toBeNull()
    })

    it('accepts valid https neptun URL', () => {
        const url = 'https://neptun.ppke.hu/hallgato/ical/abc123'
        expect(validateUrl(url)).toBe(url)
    })

    it('accepts valid https moodle URL with query params', () => {
        const url = 'https://moodle.ppke.hu/calendar/export.php?preset_what=all&preset_time=custom'
        expect(validateUrl(url)).toBe(url)
    })

    it('accepts valid http URL', () => {
        const url = 'http://example.com/calendar'
        expect(validateUrl(url)).toBe(url)
    })

    it('throws for invalid URL - no protocol', () => {
        expect(() => validateUrl('not-a-url')).toThrow('Érvénytelen URL formátum!')
    })

    it('throws for invalid URL - just text', () => {
        expect(() => validateUrl('hello world')).toThrow()
    })

    it('throws for invalid URL - partial url', () => {
        expect(() => validateUrl('moodle.ppke.hu/calendar')).toThrow()
    })

    it('trims whitespace from valid URL', () => {
        const url = 'https://neptun.ppke.hu/ical/test'
        expect(validateUrl(`  ${url}  `)).toBe(url)
    })
})