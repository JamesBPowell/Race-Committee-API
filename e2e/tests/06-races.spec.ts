/**
 * 06-races.spec.ts — Race CRUD tests
 *
 * Uses RC user storageState.
 * Depends on: regattaId from 03-regattas, fleets from 04-fleets.
 */

import { test, expect } from '@playwright/test';
import { TEST_REGATTA } from '../helpers/test-data';
import { testState } from '../shared-state';

test.describe('Race Management', () => {
    test.describe.configure({ mode: 'serial' });

    test('should navigate to Races tab', async ({ page }) => {
        // Recover regattaId if needed
        if (!testState.regattaId) {
            await page.goto('/dashboard');
            const managingSection = page.locator('.glass-container').filter({ hasText: /Managing/i });
            await managingSection.getByText(TEST_REGATTA.name).first().click();
            await page.waitForURL('**/dashboard/regattas/**');
            const url = page.url();
            const idMatch = url.match(/regattas\/(\d+)/);
            if (idMatch) testState.regattaId = parseInt(idMatch[1]);
        }

        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();

        await expect(page.getByRole('heading', { name: 'Races' })).toBeVisible({ timeout: 5_000 });
    });

    test('should add a race', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Races' })).toBeVisible({ timeout: 5_000 });

        // Click "+ Add Race"
        await page.getByRole('button', { name: /add race/i }).click();

        // The AddRaceModal should appear
        await expect(page.getByRole('heading', { name: /configure new race/i })).toBeVisible({ timeout: 5_000 });

        // Race Name defaults to "Race 1" — keep it
        // Click Create Race
        await page.getByRole('button', { name: /create race/i }).click();

        // Modal closes, race appears in list
        await expect(page.getByRole('heading', { name: /configure new race/i })).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });
    });

    test('should add a second race', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        await page.getByRole('button', { name: /add race/i }).click();
        await expect(page.getByRole('heading', { name: /configure new race/i })).toBeVisible({ timeout: 5_000 });

        // Change race name — the input defaults to auto-incremented name
        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.clear();
        await nameInput.fill('Race 2');

        await page.getByRole('button', { name: /create race/i }).click();

        await expect(page.getByRole('heading', { name: /configure new race/i })).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByText('Race 2')).toBeVisible({ timeout: 5_000 });
    });

    test('should display both races in the table', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();

        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });
        await expect(page.getByText('Race 2')).toBeVisible();
    });

    test('should open race detail modal', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        // Hover over Race 1 row to reveal action buttons
        const raceRow = page.locator('tr').filter({ hasText: 'Race 1' }).first();
        await raceRow.hover();

        // Click "Details" button
        await raceRow.getByRole('button', { name: 'Details', exact: true }).click();

        // EditRaceModal should open
        await expect(page.getByRole('heading', { name: /Race \d+ Configuration/i })).toBeVisible({ timeout: 10_000 });

        // Close it
        await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    });

    test('should delete a race', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 2')).toBeVisible({ timeout: 5_000 });

        // Bypass confirm dialog by mocking it
        await page.evaluate(() => {
            window.confirm = () => true;
        });

        // Click Delete button directly by title (more specific)
        const deleteBtn = page.getByTitle('Delete Race').last();
        await deleteBtn.scrollIntoViewIfNeeded();
        await deleteBtn.hover();
        await expect(deleteBtn).toBeVisible({ timeout: 5_000 });
        await deleteBtn.click();

        // Race 2 should disappear, Race 1 should remain
        await expect(page.getByText('Race 2')).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByText('Race 1')).toBeVisible();
    });
});
