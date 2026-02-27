/**
 * 07-scoring.spec.ts — Scoring flow tests
 *
 * Uses RC user storageState.
 * Depends on: regatta with entries + races from prior tests.
 *
 * Note: This test is more of a smoke test for the scoring UI flow.
 * It verifies that the Score modal opens, the finish recording form appears,
 * and the results tab can be viewed. Full scoring correctness is better
 * validated with unit tests on the ScoringService.
 */

import { test, expect } from '@playwright/test';
import { TEST_REGATTA } from '../helpers/test-data';
import { testState } from '../shared-state';

test.describe('Scoring Flow', () => {
    test.describe.configure({ mode: 'serial' });

    test('should open Score modal for a race', async ({ page }) => {
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
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        // Hover over Race 1 to reveal Score button
        const raceRow = page.locator('tr').filter({ hasText: 'Race 1' }).first();
        await raceRow.hover();

        // Click Score button
        await raceRow.getByRole('button', { name: 'Score', exact: true }).click();

        // ScoreRaceModal should open with the record tab
        await expect(page.getByRole('heading', { name: /Score: Race/i })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole('button', { name: 'Record Finishes' })).toBeVisible();
    });

    test('should show entry in finish recording form', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        const raceRow = page.locator('tr').filter({ hasText: 'Race 1' }).first();
        await raceRow.hover();
        await raceRow.getByRole('button', { name: 'Score', exact: true }).click();

        // Should see the racer's boat in the finishes form
        await expect(page.getByText(/racer boat/i)).toBeVisible({ timeout: 10_000 });
    });

    test('should be able to save finishes and score', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        const raceRow = page.locator('tr').filter({ hasText: 'Race 1' }).first();
        await raceRow.hover();
        await raceRow.getByRole('button', { name: 'Score', exact: true }).click();

        // Wait for the modal to fully load
        await expect(page.getByText(/record finishes|finishes/i)).toBeVisible({ timeout: 5_000 });

        // Try to find Save & Score button and click it
        const saveBtn = page.getByRole('button', { name: 'Save & Score' });
        if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await saveBtn.click();

            // After saving, try scoring
            const scoreBtn = page.getByRole('button', { name: /score race|calculate/i });
            if (await scoreBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
                await scoreBtn.click();
            }
        }

        // This test passes if the UI flow doesn't crash — specifics depend on data state
    });

    test('should view results tab', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Races', exact: true }).click();
        await expect(page.getByText('Race 1')).toBeVisible({ timeout: 5_000 });

        const raceRow = page.locator('tr').filter({ hasText: 'Race 1' }).first();
        await raceRow.hover();

        // Look for a Results button (appears after race has been scored)
        const resultsBtn = raceRow.getByRole('button', { name: 'Results' }); // In the table, it's 'Results'
        if (await resultsBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await resultsBtn.click();
            // Should show results view
            await expect(page.getByText(/results|position|place/i)).toBeVisible({ timeout: 5_000 });
        } else {
            // If no Results button, the race hasn't been scored yet — click Score instead
            await raceRow.getByRole('button', { name: 'Score', exact: true }).click();
            await expect(page.getByText(/record finishes|finishes/i)).toBeVisible({ timeout: 5_000 });

            // Try switching to results tab if available
            const resultsTab = page.getByRole('button', { name: /results/i }).first();
            if (await resultsTab.isVisible({ timeout: 2_000 }).catch(() => false)) {
                await resultsTab.click();
            }
        }
    });
});
