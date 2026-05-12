import {describe, it, expect} from 'vitest'
import {mountSuspended} from '@nuxt/test-utils/runtime'
import {nextTick, ref} from 'vue'
import AppModal from '../../app/components/shared/appModal/AppModal.vue'

describe('AppModal', () => {

    it('is hidden when open is false', async () => {
        const wrapper = await mountSuspended(AppModal, {
            props: {
                'onUpdate:open': (_v: boolean | undefined) => {
                }, open: false
            },
        })
        expect(wrapper.find('.fixed.z-50.bg-card').exists()).toBe(false)
    })

    it('shows content when open is true', async () => {
        await mountSuspended(AppModal, {
            attachTo: document.body,
            props: {
                'onUpdate:open': (_v: boolean | undefined) => {
                }, open: true
            },
        })
        await nextTick()
        expect(document.querySelector('.fixed.z-50.bg-card')).toBeTruthy()
    })

    it('renders title when provided', async () => {
        await mountSuspended(AppModal, {
            attachTo: document.body,
            props: {
                'onUpdate:open': (_v: boolean | undefined) => {
                }, open: true, title: 'Test Title'
            },
        })
        await nextTick()
        expect(document.body.textContent).toContain('Test Title')
    })

    it('renders description when provided', async () => {
        await mountSuspended(AppModal, {
            attachTo: document.body,
            props: {
                'onUpdate:open': (_v: boolean | undefined) => {
                },
                open: true,
                title: 'Title',
                description: 'Test description',
            },
        })
        await nextTick()
        expect(document.body.textContent).toContain('Test description')
    })

    it('renders slot content', async () => {
        await mountSuspended(AppModal, {
            attachTo: document.body,
            props: {
                'onUpdate:open': (_v: boolean | undefined) => {
                }, open: true
            },
            slots: {default: '<p>Modal body</p>'},
        })
        await nextTick()
        expect(document.body.textContent).toContain('Modal body')
    })
})