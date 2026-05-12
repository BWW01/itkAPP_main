import {describe, it, expect} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import ListItem from '../../app/components/shared/list/ListItem.vue'

describe('ListItem', () => {

    it('renders as div by default', async () => {
        const wrapper = await mountSuspended(ListItem)
        expect(wrapper.element.tagName).toBe('DIV')
    })

    it('renders as anchor when href is provided', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {href: 'https://example.com'},
        })
        expect(wrapper.element.tagName).toBe('A')
        expect(wrapper.attributes('href')).toBe('https://example.com')
    })

    it('renders as custom element when as prop is provided', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {as: 'button'},
        })
        expect(wrapper.element.tagName).toBe('BUTTON')
    })

    it('has hover class when static is false', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {static: false},
        })
        expect(wrapper.classes().join(' ')).toContain('hover:bg-muted/60')
    })

    it('does not have hover class when static is true', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {static: true},
        })
        expect(wrapper.classes().join(' ')).not.toContain('hover:bg-muted/60')
    })

    it('renders slot content', async () => {
        const wrapper = await mountSuspended(ListItem, {
            slots: {default: '<span>Test content</span>'},
        })
        expect(wrapper.text()).toContain('Test content')
    })

    it('applies additional class via class prop', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {class: 'custom-class'},
        })
        expect(wrapper.classes()).toContain('custom-class')
    })

    it('sets target attribute on anchor', async () => {
        const wrapper = await mountSuspended(ListItem, {
            props: {href: 'https://example.com', target: '_blank'},
        })
        expect(wrapper.attributes('target')).toBe('_blank')
    })
})