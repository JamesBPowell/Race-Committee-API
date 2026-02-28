/**
 * 09-role-routing.spec.ts — Role-based routing and view tests
 *
 * This spec verifies that navigating to the regatta details page (/dashboard/regattas/[id])
 * serves the correct view based on the user's role (RC vs Racer).
 */

import { test, expect } from '@playwright/test';
import { TEST_REGATTA } from '../helpers/test-data';
import { testState } from '../shared-state';

test.describe('Role-based Routing', () => {
    test.describe.configure({ mode: 'serial' });

    // Helper to ensure we have regattaId
    async function ensureRegattaId(page: any) {
        if (!testState.regattaId) {
            await page.goto('/dashboard');
            // Look for the test regatta in the list
            await expect(page.getByText(TEST_REGATTA.name).first()).toBeVisible({ timeout: 10_000 });

            // Click to navigate to details
            await page.getByText(TEST_REGATTA.name).first().click();
            await page.waitForURL('**/dashboard/regattas/**');

            const url = page.url();
            const idMatch = url.match(/regattas\/(\d+)/);
            if (idMatch) {
                testState.regattaId = parseInt(idMatch[1]);
            }
        }
    }

    test.describe('As Race Committee Member', () => {
        test.use({ storageState: 'auth/rc-user.json' });

        test('should see RC management view', async ({ page }) => {
            await ensureRegattaId(page);
            await page.goto(`/dashboard/regattas/${testState.regattaId}`);

            // 1. Verify RC Badge
            await expect(page.getByText(/race committee/i)).toBeVisible();

            // 2. Verify Management Tabs
            const expectedTabs = ['Overview', 'Entries', 'Classes', 'Races', 'Results', 'Settings'];
            for (const tabName of expectedTabs) {
                await expect(page.getByRole('button', { name: tabName, exact: true })).toBeVisible();
            }

            // 3. Verify specifically the new "Results" tab
            await page.getByRole('button', { name: 'Results', exact: true }).click();
            await expect(page.getByRole('heading', { name: /regatta results/i })).toBeVisible();
        });
    });

    test.describe('As Racer (Competitor)', () => {
        test.use({ storageState: 'auth/racer-user.json' });

        test('should see Racer results view', async ({ page }) => {
            await ensureRegattaId(page);
            await page.goto(`/dashboard/regattas/${testState.regattaId}`);

            // 1. Verify Racer-specific tabs
            const expectedTabs = ['Results', 'Schedule', 'My Entry', 'Class'];
            for (const tabName of expectedTabs) {
                await expect(page.getByRole('button', { name: tabName, exact: true })).toBeVisible();
            }

            // 2. Verify "At-a-glance" standing is visible (since 07-scoring scored a race)
            // It should show a rank like "1/5" or similar
            await expect(page.getByText(/\d+\/\d+/).first()).toBeVisible({ timeout: 20_000 });
            await expect(page.getByText(/After \d+/)).toBeVisible({ timeout: 10_000 });

            // 3. Verify My Entry tab works
            await page.getByRole('button', { name: 'My Entry', exact: true }).click();
            await expect(page.getByRole('heading', { name: 'My Entry' })).toBeVisible();
            // Should see the boat name from test data
            await expect(page.getByText(/racer boat/i)).toBeVisible();

            // 4. Verify Class tab works
            await page.getByRole('button', { name: 'Class', exact: true }).click();
            await expect(page.getByText(/Competitors/i)).toBeVisible();
        });

        test('should navigate to racer page when clicking RegattaCard from dashboard', async ({ page }) => {
            await page.goto('/dashboard');

            // Find the regatta card for the test regatta
            const regattaCard = page.locator('.glass-container').filter({ hasText: TEST_REGATTA.name });
            await expect(regattaCard).toBeVisible();

            // Card should be a link or have a link inside it
            await regattaCard.click();

            // Should land on regatta details page
            await page.waitForURL('**/dashboard/regattas/**');

            // Should see racer tabs
            await expect(page.getByRole('button', { name: 'Results', exact: true })).toBeVisible();
            await expect(page.getByRole('button', { name: 'Schedule', exact: true })).toBeVisible();
            // Should NOT see RC "Settings" tab
            await expect(page.getByRole('button', { name: 'Settings', exact: true })).not.toBeVisible();
        });
    });
});
