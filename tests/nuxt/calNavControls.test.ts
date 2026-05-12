import {describe, it, expect} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import CalViewSwitcher from '../../app/components/calendar/header/CalViewSwitcher.vue'

describe('CalViewSwitcher', () => {

    it('renders 4 view buttons', async () => {
        // Pass component into mountSuspended (waits until fully loaded)
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'month'},
        })
        expect(wrapper.findAll('button')).toHaveLength(4)
    })

    it('active view button has active class', async () => {
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'week'},
        })
        const buttons = wrapper.findAll('button')
        const activeButton = buttons.find(b => b.classes().includes('bg-primary/15'))
        expect(activeButton).toBeDefined()
    })

    it('emits change event with correct view when button clicked', async () => {
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'month'},
        })
        const buttons = wrapper.findAll('button')
        await buttons[1]!.trigger('click') // week
        expect(wrapper.emitted('change')).toBeTruthy()
        expect(wrapper.emitted('change')![0]).toEqual(['week'])
    })

    it('emits correct view for each button', async () => {
        const views = ['month', 'week', '3day', 'day']
        for (let i = 0; i < views.length; i++) {
            const wrapper = await mountSuspended(CalViewSwitcher, {
                props: {view: 'month'},
            })
            const buttons = wrapper.findAll('button')
            await buttons[i]!.trigger('click')
            expect(wrapper.emitted('change')![0]).toEqual([views[i]])
        }
    })

    it('shows Check icon only on active view', async () => {
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'day'},
        })
        // Only the last button (day) should have an svg (Check icon)
        const buttons = wrapper.findAll('button')
        const withIcon = buttons.filter(b => b.find('svg').exists())
        expect(withIcon).toHaveLength(1)
    })

    it('applies w-full class when fullWidth prop is true', async () => {
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'month', fullWidth: true},
        })
        expect(wrapper.find('div').classes()).toContain('w-full')
    })

    it('does not apply w-full class when fullWidth is false', async () => {
        const wrapper = await mountSuspended(CalViewSwitcher, {
            props: {view: 'month', fullWidth: false},
        })
        expect(wrapper.find('div').classes()).not.toContain('w-full')
    })
})