/**
 * 04-fleets.spec.ts — Fleet/Class CRUD tests
 *
 * Uses RC user storageState.
 * Depends on: regattaId from 03-regattas.
 * Creates fleets used by downstream race and scoring tests.
 */

import { test, expect } from '@playwright/test';
import { testState } from '../shared-state';

test.describe('Fleet / Class Management', () => {
    test.describe.configure({ mode: 'serial' });

    test('should navigate to Classes tab', async ({ page }) => {
        // If regattaId wasn't captured from 03-regattas, fetch from dashboard
        if (!testState.regattaId) {
            await page.goto('/dashboard');
            const regattaLink = page.getByText('E2E Test Regatta').first();
            await regattaLink.click();
            await page.waitForURL('**/dashboard/regattas/**');
            const url = page.url();
            const idMatch = url.match(/regattas\/(\d+)/);
            if (idMatch) testState.regattaId = parseInt(idMatch[1]);
        }

        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();

        await expect(page.getByRole('heading', { name: 'Racing Classes' })).toBeVisible({ timeout: 5_000 });
    });

    test('should add a first class (PHRF A)', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Racing Classes' })).toBeVisible({ timeout: 5_000 });

        // Click "Add Class"
        await page.getByRole('button', { name: /add class/i }).click();

        // Fill inline form
        const nameInput = page.locator('input[placeholder*="J/70"]');
        await nameInput.fill('PHRF A');

        // Select scoring method (default is PHRF ToT which is fine)
        await page.getByRole('button', { name: /create class/i }).click();

        // Class should appear
        await expect(page.getByText('PHRF A').first()).toBeVisible({ timeout: 5_000 });
    });

    test('should add a second class (One Design)', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();
        await expect(page.getByText('PHRF A').first()).toBeVisible({ timeout: 5_000 });

        await page.getByRole('button', { name: /add class/i }).click();

        const nameInput = page.locator('input[placeholder*="J/70"]');
        await nameInput.fill('J/70 One Design');

        // Change scoring method to One Design
        const scoringSelect = page.locator('select').filter({ hasText: /one design/i }).first();
        await scoringSelect.selectOption({ label: 'One Design (No Handicap)' });

        await page.getByRole('button', { name: /create class/i }).click();

        await expect(page.getByText('J/70 One Design')).toBeVisible({ timeout: 5_000 });
    });

    test('should display both classes', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();

        await expect(page.getByText('PHRF A').first()).toBeVisible({ timeout: 5_000 });
        await expect(page.getByText('J/70 One Design').first()).toBeVisible();
    });

    test('should edit a class name', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'J/70 One Design' }).first()).toBeVisible({ timeout: 10_000 });

        // Target card specifically
        const fleetCard = page.locator('div').filter({ has: page.getByRole('heading', { name: 'J/70 One Design', exact: true }) }).filter({ has: page.getByRole('button', { name: 'Edit Class' }) }).last();

        // Hover
        await fleetCard.hover();

        // Click edit button
        await fleetCard.getByRole('button', { name: 'Edit Class' }).click();

        // The inline form should appear pre-filled
        const nameInput = page.locator('input[placeholder*="J/70"]');
        await nameInput.clear();
        await nameInput.fill('J/70 Fleet');

        await page.getByRole('button', { name: 'Update Class' }).click();

        await expect(page.getByText('J/70 Fleet').first()).toBeVisible({ timeout: 10_000 });
    });

    test('should delete a class', async ({ page }) => {
        await page.goto(`/dashboard/regattas/${testState.regattaId}`);
        await page.getByRole('button', { name: 'Classes', exact: true }).click();
        await expect(page.getByText('J/70 Fleet').first()).toBeVisible({ timeout: 10_000 });

        // Handle confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Target card
        const fleetCard = page.locator('div').filter({ has: page.getByRole('heading', { name: 'J/70 Fleet', exact: true }) }).filter({ has: page.getByRole('button', { name: 'Delete Class' }) }).last();

        // Hover
        await fleetCard.hover();

        // Click the delete button
        await fleetCard.getByRole('button', { name: 'Delete Class' }).click();

        // J/70 should disappear but PHRF A should remain
        await expect(page.getByText('J/70 Fleet')).not.toBeVisible({ timeout: 10_000 });
        await expect(page.getByText('PHRF A').first()).toBeVisible();
    });
});
