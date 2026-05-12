import {defineConfig, devices} from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    retries: 1,
    timeout: 30000,
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        launchOptions: {
            args: ['--disable-autofill-keyboard-accessory-view', '--disable-save-password-bubble'],
        },
    },
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },
        {
            name: 'mobile',
            use: {...devices['Pixel 7']},
        },
    ],
    // webServer: { command: 'bun run dev', url: 'http://localhost:3000' }
})