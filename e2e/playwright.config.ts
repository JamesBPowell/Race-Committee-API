import { defineConfig } from '@playwright/test';

const UI_BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:5236';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false, // Serial execution — tests depend on shared state
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1, // Single worker to maintain test ordering
    reporter: [['html', { open: 'never' }], ['list']],

    use: {
        baseURL: UI_BASE_URL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        ignoreHTTPSErrors: true,
        actionTimeout: 10_000,
    },

    // Share across tests
    globalSetup: require.resolve('./global-setup'),
    globalTeardown: require.resolve('./global-teardown'),

    projects: [
        {
            name: 'auth-tests',
            testMatch: '01-auth.spec.ts',
        },
        {
            name: 'rc-setup-tests',
            testMatch: ['02-boats.spec.ts', '03-regattas.spec.ts', '04-fleets.spec.ts', '06-races.spec.ts'],
            use: {
                storageState: 'auth/rc-user.json',
            },
            dependencies: ['auth-tests'],
        },
        {
            name: 'racer-user-tests',
            testMatch: '05-join-regatta.spec.ts',
            use: {
                storageState: 'auth/racer-user.json',
            },
            dependencies: ['rc-setup-tests'],
        },
        {
            name: 'rc-scoring-tests',
            testMatch: ['07-scoring.spec.ts', '08-overall-scoring.spec.ts', '09-role-routing.spec.ts'],
            use: {
                storageState: 'auth/rc-user.json',
            },
            dependencies: ['racer-user-tests'],
        },
    ],

    // Web server configuration — start both UI and API
    webServer: [
        {
            command: 'dotnet run --project ../api',
            url: `${API_BASE_URL}/openapi/v1.json`,
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
        {
            command: 'npm run dev --prefix ../ui',
            url: UI_BASE_URL,
            reuseExistingServer: !process.env.CI,
            timeout: 30_000,
        },
    ],
});

export { UI_BASE_URL, API_BASE_URL };
