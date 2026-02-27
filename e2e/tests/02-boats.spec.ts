/**
 * 02-boats.spec.ts — Boat CRUD tests
 *
 * Uses RC user storageState (already logged in).
 * Creates boats that will be used in downstream tests.
 */

import { test, expect } from '@playwright/test';
import { testState } from '../shared-state';
import { TEST_BOAT, TEST_BOAT_2 } from '../helpers/test-data';

test.describe('Boat Management', () => {
    test.describe.configure({ mode: 'serial' });

    test('should navigate to My Boats page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.getByRole('link', { name: 'My Boats' }).click();
        await page.waitForURL('**/dashboard/boats');

        await expect(page.getByRole('heading', { name: 'My Boats' })).toBeVisible();
    });

    test('should add a first boat', async ({ page }) => {
        await page.goto('/dashboard/boats');

        // Click "Add Boat" button
        await page.getByRole('button', { name: /add boat/i }).click();

        // Fill the modal form
        await page.getByPlaceholder('e.g. Relentless').fill(TEST_BOAT.boatName);
        await page.getByPlaceholder('e.g. USA 420').fill(TEST_BOAT.sailNumber);
        await page.getByPlaceholder('e.g. J/105').fill(TEST_BOAT.makeModel);

        await page.locator('form').getByRole('button', { name: 'Add Boat' }).click();

        // Modal should close and boat should appear
        await expect(page.getByRole('heading', { name: 'Add New Boat' })).not.toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole('heading', { name: TEST_BOAT.boatName }).first()).toBeVisible({ timeout: 10_000 });
    });

    test('should add a second boat', async ({ page }) => {
        await page.goto('/dashboard/boats');

        await page.getByRole('button', { name: /add boat/i }).click();

        await page.getByPlaceholder('e.g. Relentless').fill(TEST_BOAT_2.boatName);
        await page.getByPlaceholder('e.g. USA 420').fill(TEST_BOAT_2.sailNumber);
        await page.getByPlaceholder('e.g. J/105').fill(TEST_BOAT_2.makeModel);

        await page.locator('form').getByRole('button', { name: 'Add Boat' }).click();

        await expect(page.getByRole('heading', { name: 'Add New Boat' })).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole('heading', { name: TEST_BOAT_2.boatName }).first()).toBeVisible({ timeout: 5_000 });
    });

    test('should display both boats in the list', async ({ page }) => {
        await page.goto('/dashboard/boats');

        await expect(page.getByRole('heading', { name: TEST_BOAT.boatName }).first()).toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole('heading', { name: TEST_BOAT_2.boatName }).first()).toBeVisible();
    });

    test('should edit a boat name', async ({ page }) => {
        await page.goto('/dashboard/boats');

        // Find the specific boat card that contains BOTH the heading and the edit button
        const boatCard = page.locator('div').filter({ has: page.getByRole('heading', { name: TEST_BOAT_2.boatName, exact: true }) }).filter({ has: page.getByRole('button', { name: 'Edit Boat' }) }).last();
        await boatCard.hover();
        await boatCard.getByRole('button', { name: 'Edit Boat' }).click();

        // Modal should be in edit mode
        await expect(page.getByRole('heading', { name: 'Edit Boat' })).toBeVisible();

        // Change the name
        const nameInput = page.getByPlaceholder('e.g. Relentless');
        await nameInput.clear();
        await nameInput.fill('Second Wind Updated');

        await page.getByRole('button', { name: 'Save Changes' }).click();

        // Modal closes and updated name shows
        await expect(page.getByRole('heading', { name: 'Edit Boat' })).not.toBeVisible({ timeout: 5_000 });
        await expect(page.getByRole('heading', { name: 'Second Wind Updated' }).first()).toBeVisible({ timeout: 5_000 });
    });

    test('should delete a boat', async ({ page }) => {
        await page.goto('/dashboard/boats');

        // Handle the confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Find the updated boat card
        const boatCard = page.locator('div').filter({ has: page.getByRole('heading', { name: 'Second Wind Updated', exact: true }) }).filter({ has: page.getByRole('button', { name: 'Delete Boat' }) }).last();
        await boatCard.hover();
        await boatCard.getByRole('button', { name: 'Delete Boat' }).click();

        // The deleted boat should disappear
        await expect(page.getByText('Second Wind Updated')).not.toBeVisible({ timeout: 5_000 });

        // First boat should still be there
        await expect(page.getByRole('heading', { name: TEST_BOAT.boatName }).first()).toBeVisible();
    });
});
