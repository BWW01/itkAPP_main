import {test, expect} from '@playwright/test'

test.describe('Login page', () => {

    test.beforeEach(async ({page}) => {
        await page.goto('/login')
    })

    test('shows login form', async ({page}) => {
        await expect(page.locator('#username')).toBeVisible()
        await expect(page.locator('#password')).toBeVisible()
        await expect(page.getByRole('button', {name: 'Bejelentkezés'})).toBeVisible()
    })

    // Playwright is fast as fuck, meaning it uses .fill to insert text into the static html template as soon as the page loads. Vue is still booting up tho.
    // When vue hydrates slowly, it syncs the inputs with its own state. Because the init is empty, it forcefully clears the already typed in stuff playwright did.
    test('shows error for wrong credentials', async ({page}) => {
        // Wait until Nuxt loads the js
        await page.waitForLoadState('networkidle')

        await page.locator('#username').pressSequentially('wronguser')
        await page.locator('#password').pressSequentially('wrongpassword')

        await page.getByRole('button', {name: 'Bejelentkezés'}).click()

        await page.waitForURL(/\/login/, {timeout: 10000})
        const errorDiv = page.locator('div').filter({hasText: /Érvénytelen|Hibás|hiba/i}).first()
        await expect(errorDiv).toBeVisible({timeout: 5000})
    })

    test('shows error for empty username', async ({page}) => {
        await page.waitForLoadState('networkidle')

        await page.locator('#password').pressSequentially('somepassword')
        await page.getByRole('button', {name: 'Bejelentkezés'}).click()

        await expect(page.locator('#username')).toBeFocused()
    })

    test('shows error for empty password', async ({page}) => {
        await page.waitForLoadState('networkidle')

        await page.locator('#username').pressSequentially('someuser')
        await page.getByRole('button', {name: 'Bejelentkezés'}).click()

        await expect(page.locator('#password')).toBeFocused()
    })

    test('redirects to login when not authenticated', async ({page}) => {
        await page.goto('/')
        await expect(page).toHaveURL(/\/login/)
    })
})