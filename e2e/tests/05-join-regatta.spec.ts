/**
 * 05-join-regatta.spec.ts — Racer joins a regatta
 *
 * Uses RACER user storageState.
 * Depends on: regatta from 03-regattas + racer boat from globalSetup.
 */

import { test, expect } from '@playwright/test';
import { TEST_REGATTA, RACER_BOAT } from '../helpers/test-data';

test.describe('Join Regatta (Racer Flow)', () => {
    test.describe.configure({ mode: 'serial' });

    test('should open Find Race modal', async ({ page }) => {
        await page.goto('/dashboard');

        await page.getByRole('button', { name: /find race/i }).click();

        // The modal should appear
        await expect(page.getByRole('heading', { name: 'Find Race' })).toBeVisible({ timeout: 5_000 });
    });

    test('should find and join the test regatta', async ({ page }) => {
        await page.goto('/dashboard');

        await page.getByRole('button', { name: /find race/i }).click();
        await expect(page.getByRole('heading', { name: 'Find Race' })).toBeVisible({ timeout: 5_000 });

        // Select the regatta from the dropdown
        const regattaSelect = page.locator('select').first();
        // Find the option that contains our test regatta name
        const regattaOption = regattaSelect.locator('option', { hasText: TEST_REGATTA.name });
        const regattaValue = await regattaOption.getAttribute('value');
        if (regattaValue) {
            await regattaSelect.selectOption(regattaValue);
        }

        // The boat dropdown should have the racer's boat
        const boatSelect = page.locator('select').nth(1);
        const boatOption = boatSelect.locator('option', { hasText: RACER_BOAT.boatName });
        const boatValue = await boatOption.getAttribute('value');
        if (boatValue) {
            await boatSelect.selectOption(boatValue);
        }

        // Click Join
        await page.getByRole('button', { name: /join regatta/i }).click();

        // Should show success message
        await expect(page.getByText(/entry submitted/i)).toBeVisible({ timeout: 10_000 });
    });

    test('should show regatta in Racing list', async ({ page }) => {
        await page.goto('/dashboard');

        // The regatta should now appear in the "Racing" section
        await expect(page.getByText(TEST_REGATTA.name)).toBeVisible({ timeout: 10_000 });
    });
});
