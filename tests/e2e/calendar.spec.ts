import {test, expect} from '@playwright/test'
import {login} from './helpers/auth'

const hasCredentials = !!process.env.PLAYWRIGHT_USERNAME && !!process.env.PLAYWRIGHT_PASSWORD

test.describe('Calendar', () => {
    test.skip(!hasCredentials, 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run')

    test.beforeEach(async ({page}) => {
        await login(page)
        await page.goto('/calendar')
        await page.waitForLoadState('networkidle')
    })

    test('shows calendar header', async ({page}) => {
        await expect(page.getByTestId('cal-header').first()).toBeVisible()
    })

    test('cycles through all views', async ({page}) => {
        const views = ['month', 'week', '3day', 'day']

        // wait for hydration
        await expect(page.locator('.bg-primary\\/15').filter({visible: true}).first()).toBeVisible({timeout: 10000})

        // only the visible buttons, because there are two instances of the component for desktop and mobile respectively
        for (const view of views) {
            const button = page.getByTestId(`view-${view}`).filter({visible: true})

            await button.click()

            // gets the active class (just diff color)
            await expect(button).toHaveClass(/bg-primary\/15/)

            for (const other of views.filter(v => v !== view)) {
                const otherButton = page.getByTestId(`view-${other}`).filter({visible: true})
                await expect(otherButton).not.toHaveClass(/bg-primary\/15/)
            }
        }
    })

    test('shows sidebar on desktop', async ({page}) => {
        await page.setViewportSize({width: 1280, height: 800})
        await page.reload()
        await page.waitForLoadState('networkidle')
        await expect(page.locator('.hidden.lg\\:flex')).toBeVisible()
    })

    test('FAB visible on mobile', async ({page}) => {
        await page.setViewportSize({width: 390, height: 844})
        await page.reload()
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('fab')).toBeVisible()
    })

    test('FAB opens connect modal on mobile', async ({page}) => {
        await page.setViewportSize({width: 390, height: 844})
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.getByTestId('fab').click()
        await expect(page.locator('.fixed.z-50.bg-card')).toBeVisible({timeout: 3000})
    })
})