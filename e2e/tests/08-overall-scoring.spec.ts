/**
 * 08-overall-scoring.spec.ts — Overall scoring logic tests
 * 
 * Verifies that the 'Include In Overall' flag works correctly to group or exclude
 * fleets from cross-fleet overall standings.
 */

import { test, expect } from '@playwright/test';
import { testState } from '../shared-state';
import { TEST_REGATTA, TEST_BOAT, RACER_BOAT } from '../helpers/test-data';

test.describe('Overall Scoring Logic', () => {
    test.describe.configure({ mode: 'serial' });

    test.beforeEach(async ({ page }) => {
        // Ensure we have regattaId
        if (!testState.regattaId) {
            await page.goto('/dashboard');
            const managingSection = page.locator('.glass-container').filter({ hasText: /Managing/i });
            await managingSection.getByText(TEST_REGATTA.name).first().click();
            await page.waitForURL('**/dashboard/regattas/**');
            const url = page.url();
            const idMatch = url.match(/regattas\/(\d+)/);
            if (idMatch) testState.regattaId = parseInt(idMatch[1]);
        }
    });

    test('should ensure at least two fleets exist for comparison', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();

        // Ensure "PHRF A" exists (from 04-fleets)
        await expect(page.getByRole('heading', { name: 'Racing Classes' })).toBeVisible({ timeout: 10_000 });

        // Add "PHRF A" if missing
        if (!(await page.getByText('PHRF A', { exact: true }).first().isVisible().catch(() => false))) {
            await page.getByRole('button', { name: /add class/i }).click();
            await page.locator('input[placeholder*="J/70"]').fill('PHRF A');
            await page.getByRole('button', { name: /create class/i }).click();
        }

        // Add a second fleet "PHRF B" if it doesn't exist
        if (!(await page.getByText('PHRF B', { exact: true }).first().isVisible().catch(() => false))) {
            await page.getByRole('button', { name: /add class/i }).click();
            await page.locator('input[placeholder*="J/70"]').fill('PHRF B');
            await page.getByRole('button', { name: /create class/i }).click();
        }

        await expect(page.getByText('PHRF A', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('PHRF B', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    });

    test('should ensure both fleets have entries', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Entries', exact: true }).click();

        // Join as RC user with TEST_BOAT if not already entered
        if (!(await page.getByText(TEST_BOAT.boatName).isVisible().catch(() => false))) {
            await page.goto('/dashboard');
            await page.getByRole('button', { name: /find race/i }).click();
            const regSelect = page.locator('select').first();
            const regOpt = regSelect.locator('option', { hasText: TEST_REGATTA.name });
            const regVal = await regOpt.getAttribute('value');
            if (regVal) await regSelect.selectOption(regVal);

            const boatSelect = page.locator('select').nth(1);
            const boatOpt = boatSelect.locator('option', { hasText: TEST_BOAT.boatName });
            const boatVal = await boatOpt.getAttribute('value');
            if (boatVal) {
                await boatSelect.selectOption(boatVal);
                await page.getByRole('button', { name: /join regatta/i }).click();
                await expect(page.getByText(/entry submitted/i)).toBeVisible({ timeout: 15_000 });
            }
        }

        // Now assign one boat to PHRF A and the other to PHRF B
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Entries', exact: true }).click();

        await expect(page.getByText(TEST_BOAT.boatName)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(RACER_BOAT.boatName)).toBeVisible({ timeout: 15_000 });

        const rowA = page.locator('tr').filter({ hasText: TEST_BOAT.boatName }).first();
        await rowA.hover();
        await rowA.getByTitle('Edit Entry').click();
        await rowA.getByTitle('Fleet Selection').selectOption({ label: 'PHRF A' });
        await rowA.getByTitle('Save Entry').click();
        await expect(rowA.getByText('PHRF A')).toBeVisible({ timeout: 10_000 });

        const rowB = page.locator('tr').filter({ hasText: RACER_BOAT.boatName }).first();
        await rowB.hover();
        await rowB.getByTitle('Edit Entry').click();
        await rowB.getByTitle('Fleet Selection').selectOption({ label: 'PHRF B' });
        await rowB.getByTitle('Save Entry').click();
        await expect(rowB.getByText('PHRF B')).toBeVisible({ timeout: 10_000 });
    });

    test('should create a race and configure cross-fleet scoring', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();

        await page.getByRole('button', { name: /add race/i }).click();
        await expect(page.getByRole('heading', { name: /configure new race/i })).toBeVisible();

        const nameInput = page.locator('input[type="text"]').first();
        await nameInput.clear();
        await nameInput.fill('Overall Test Race');

        // Set a scheduled start time (required for scoring to work)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isoString = tomorrow.toISOString().substring(0, 16); // "YYYY-MM-DDTHH:MM"
        await page.locator('input[type="datetime-local"]').fill(isoString);

        await page.getByRole('button', { name: /create race/i }).click();
        await expect(page.getByText('Overall Test Race')).toBeVisible({ timeout: 20_000 });
    });

    test('should configure overall flags in Race Overrides modal', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();

        // PHRF A
        const phrfACard = page.locator('div').filter({ has: page.getByRole('heading', { name: 'PHRF A', exact: true }) }).filter({ has: page.getByRole('button', { name: /overrides/i }) }).last();
        await phrfACard.hover();
        await phrfACard.getByRole('button', { name: /overrides/i }).click();
        await expect(page.getByRole('heading', { name: /Race Overrides: PHRF A/i })).toBeVisible({ timeout: 15_000 });

        const raceRowA = page.locator('div.group').filter({ hasText: 'Overall Test Race' });
        await expect(raceRowA.getByTitle(/include this fleet in overall results/i)).toBeChecked();
        await page.getByRole('button', { name: 'Close overrides modal' }).click();

        // PHRF B
        const phrfBCard = page.locator('div').filter({ has: page.getByRole('heading', { name: 'PHRF B', exact: true }) }).filter({ has: page.getByRole('button', { name: /overrides/i }) }).last();
        await phrfBCard.hover();
        await phrfBCard.getByRole('button', { name: /overrides/i }).click();
        await expect(page.getByRole('heading', { name: /Race Overrides: PHRF B/i })).toBeVisible({ timeout: 15_000 });

        const raceRowB = page.locator('div.group').filter({ hasText: 'Overall Test Race' });
        await raceRowB.getByTitle(/include this fleet in overall results/i).uncheck();
        await page.getByRole('button', { name: 'Save All Overrides' }).click();
        await expect(page.getByRole('heading', { name: /Race Overrides: PHRF B/i })).not.toBeVisible({ timeout: 15_000 });
    });

    test('should calculate results and verify overall ranking exclusion', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Overall Test Race')).toBeVisible({ timeout: 15_000 });

        const raceRow = page.locator('tr').filter({ hasText: 'Overall Test Race' }).first();
        await raceRow.hover();
        await raceRow.getByTitle('Score').click();
        await expect(page.getByRole('heading', { name: /Score: Overall Test Race/i })).toBeVisible({ timeout: 20_000 });

        // Fill finish times
        await page.locator('tr').filter({ hasText: TEST_BOAT.boatName }).first().getByTitle('Finish Time').fill('13:00:00');
        await page.locator('tr').filter({ hasText: RACER_BOAT.boatName }).first().getByTitle('Finish Time').fill('13:05:00');

        // Save & Score
        await page.getByRole('button', { name: 'Save & Score' }).click();

        // Explicitly wait for tab switch and list rendering
        await expect(page.getByRole('button', { name: 'Calculated Results' })).toHaveClass(/text-indigo-400/, { timeout: 20_000 });

        // Ensure both fish results are rendered
        await expect(page.getByText(TEST_BOAT.boatName).first()).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(RACER_BOAT.boatName).first()).toBeVisible({ timeout: 15_000 });

        // Verify Overall columns
        const rowResultA = page.locator('tr').filter({ hasText: TEST_BOAT.boatName }).first();
        const overallCellA = rowResultA.locator('td').nth(6);
        await expect(overallCellA).not.toHaveText('-', { timeout: 10_000 });

        const rowResultB = page.locator('tr').filter({ hasText: RACER_BOAT.boatName }).first();
        const overallCellB = rowResultB.locator('td').nth(6);
        await expect(overallCellB).toHaveText('-', { timeout: 10_000 });
    });
});
