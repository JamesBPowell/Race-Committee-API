/**
 * 03-regattas.spec.ts — Regatta creation & management tests
 *
 * Uses RC user storageState.
 * Creates a regatta for use in downstream tests (fleets, races, scoring).
 */

import { test, expect } from '@playwright/test';
import { testState } from '../shared-state';
import { TEST_REGATTA } from '../helpers/test-data';

test.describe('Regatta Management', () => {
    test.describe.configure({ mode: 'serial' });

    test('should create a new regatta', async ({ page }) => {
        await page.goto('/dashboard');

        // Click "New Regatta" button
        await page.getByRole('button', { name: /new regatta/i }).click();

        // Fill the modal
        await expect(page.getByRole('heading', { name: 'Create New Regatta' })).toBeVisible();
        await page.getByPlaceholder('e.g. Annual Summer Regatta').fill(TEST_REGATTA.name);
        await page.getByPlaceholder('e.g. New Orleans Yacht Club').fill(TEST_REGATTA.organization);
        // Date inputs don't have placeholders, find them by type
        const dateInputs = page.locator('input[type="date"]');
        await dateInputs.first().fill(TEST_REGATTA.startDate);
        await dateInputs.nth(1).fill(TEST_REGATTA.endDate);
        await page.getByPlaceholder('e.g. New Orleans, LA').fill(TEST_REGATTA.location);

        await page.getByRole('button', { name: 'Create Regatta' }).click();

        // Modal should close
        await expect(page.getByRole('heading', { name: 'Create New Regatta' })).not.toBeVisible({ timeout: 5_000 });
    });

    test('should show regatta in Managing as RC list', async ({ page }) => {
        await page.goto('/dashboard');

        // Look in the "Managing as RC" section specifically
        const managingSection = page.locator('.glass-container').filter({ hasText: /Managing/i });
        await expect(managingSection.getByText(TEST_REGATTA.name).first()).toBeVisible({ timeout: 10_000 });
    });

    test('should navigate to regatta detail page', async ({ page }) => {
        await page.goto('/dashboard');

        // Click on the regatta card in the managing section
        const managingSection = page.locator('.glass-container').filter({ hasText: /Managing/i });
        await managingSection.getByText(TEST_REGATTA.name).first().click();

        // Should land on regatta detail page
        await page.waitForURL('**/dashboard/regattas/**');
        await expect(page.getByRole('heading', { name: TEST_REGATTA.name })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText(TEST_REGATTA.organization)).toBeVisible();

        // Capture the regatta ID from the URL for downstream tests
        const url = page.url();
        const idMatch = url.match(/regattas\/(\d+)/);
        if (idMatch) {
            testState.regattaId = parseInt(idMatch[1]);
        }
    });

    test('should show overview tab by default', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);

        await expect(page.getByText('Recent Activity')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('Quick Actions')).toBeVisible();
    });

    test('should update regatta settings', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);

        // Navigate to Settings tab
        await page.getByRole('button', { name: 'Settings' }).click();

        await expect(page.getByText('Regatta Settings')).toBeVisible({ timeout: 5_000 });

        // Handle the settings saved alert
        page.on('dialog', dialog => dialog.accept());

        // Click Save to verify the flow works
        await page.getByRole('button', { name: /save changes/i }).click();

        // After dismissing alert, page should still be functional
        await expect(page.getByText('Regatta Settings')).toBeVisible();
    });
});
