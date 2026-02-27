/**
 * Global Setup — runs ONCE before all test suites.
 *
 * 1. Registers two test users (RC Committee + Racer) via direct API calls
 * 2. Logs them in via the browser and saves storageState (cookies)
 * 3. Seeds a boat for the Racer user via API (needed for join-regatta flow)
 */

import { chromium, type FullConfig } from '@playwright/test';
import { registerUser, loginUser, AuthenticatedClient } from './helpers/api-client';
import { RC_USER, RACER_USER, RACER_BOAT } from './helpers/test-data';
import * as fs from 'fs';
import * as path from 'path';

// Generate a random ID for this specific test run
const TEST_ID = Math.floor(Math.random() * 10000).toString();
process.env.TEST_SESSION_ID = TEST_ID;
fs.writeFileSync(path.join(__dirname, '.test_id'), TEST_ID);


export default async function globalSetup(_config: FullConfig) {
    console.log('\n🔧 Global Setup: Registering test users...');

    // Ensure auth/ directory exists
    const authDir = path.join(__dirname, 'auth');
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    // 1. Register both users (idempotent — tolerates "already exists")
    await registerUser(RC_USER);
    await registerUser(RACER_USER);

    console.log('✅ Users registered (or already existed)');

    // 2. Create browser contexts, log in, save storageState
    const browser = await chromium.launch();

    // --- RC User ---
    const rcContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const rcPage = await rcContext.newPage();
    await rcPage.goto('http://localhost:3000/login');
    await rcPage.getByLabel('Email').fill(RC_USER.email);
    await rcPage.getByLabel('Password').fill(RC_USER.password);
    await rcPage.getByRole('button', { name: 'Sign In' }).click();
    await rcPage.waitForURL('**/dashboard', { timeout: 10_000 });
    await rcContext.storageState({ path: path.join(authDir, 'rc-user.json') });
    await rcContext.close();
    console.log('✅ RC user logged in, storageState saved');

    // --- Racer User ---
    const racerContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const racerPage = await racerContext.newPage();
    await racerPage.goto('http://localhost:3000/login');
    await racerPage.getByLabel('Email').fill(RACER_USER.email);
    await racerPage.getByLabel('Password').fill(RACER_USER.password);
    await racerPage.getByRole('button', { name: 'Sign In' }).click();
    await racerPage.waitForURL('**/dashboard', { timeout: 10_000 });
    await racerContext.storageState({ path: path.join(authDir, 'racer-user.json') });
    await racerContext.close();
    console.log('✅ Racer user logged in, storageState saved');

    await browser.close();

    // 3. Seed racer's boat via API (needed for join-regatta test)
    const racerCookies = await loginUser(RACER_USER);
    const racerClient = new AuthenticatedClient(racerCookies);

    try {
        // Use the fresh TEST_ID directly to ensure the seeded boat name matches what tests expect.
        // Node's module cache might cause RACER_BOAT to have an old ID if imported before file write.
        const freshRacerBoat = {
            ...RACER_BOAT,
            boatName: `Racer Boat ${TEST_ID}`
        };
        await racerClient.post('/api/boats', freshRacerBoat);
        console.log(`✅ Racer boat seeded via API: ${freshRacerBoat.boatName}`);
    } catch {
        console.log('ℹ️  Racer boat may already exist (skipping)');
    }

    console.log('🚀 Global setup complete!\n');
}
