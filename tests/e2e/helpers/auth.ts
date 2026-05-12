import type {Page} from '@playwright/test'

export async function login(page: Page) {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.locator('#username').pressSequentially(process.env.PLAYWRIGHT_USERNAME ?? '')
    await page.locator('#password').pressSequentially(process.env.PLAYWRIGHT_PASSWORD ?? '')
    await page.getByRole('button', {name: 'Bejelentkezés'}).click()
    await page.waitForURL('/', {timeout: 15000})
    await page.waitForLoadState('networkidle')
}