import {test, expect} from '@playwright/test'
import {login} from './helpers/auth'

const hasCredentials = !!process.env.PLAYWRIGHT_USERNAME && !!process.env.PLAYWRIGHT_PASSWORD

test.describe('Dashboard', () => {
    test.skip(!hasCredentials, 'Set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD to run')

    test.beforeEach(async ({page}) => {
        await login(page)
    })

    test('shows greeting after login', async ({page}) => {
        await expect(page.getByTestId("page-title").first()).toBeVisible()
    })

    test('shows today date', async ({page}) => {
        await expect(page.getByTestId("page-subtitle").first()).toBeVisible()
    })

    test('shows quick links section', async ({page}) => {
        await expect(page.getByTestId('dashboard-links')).toBeVisible()
    })

    test('navigates to calendar', async ({page}) => {
        await page.goto('/calendar')
        await expect(page).toHaveURL('/calendar')
        await expect(page.locator('header')).toBeVisible()
    })

    test('navigates to profile', async ({page}) => {
        await page.goto('/profile')
        await expect(page).toHaveURL('/profile')
    })

    test('unauthenticated access redirects to login', async ({page}) => {
        await page.context().clearCookies()
        await page.goto('/')
        await expect(page).toHaveURL(/\/login/)
    })
})