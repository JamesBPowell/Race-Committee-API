/**
 * 01-auth.spec.ts — Authentication tests
 *
 * These run FIRST with no pre-existing storageState.
 * They validate the registration and login UI flows.
 */

import { test, expect } from '@playwright/test';

// Use unique emails to avoid collision with globalSetup users
const UNIQUE_EMAIL = `auth-test-${Date.now()}@racekrewe.com`;
const PASSWORD = 'TestPass123!';

test.describe('Authentication', () => {
    test.describe.configure({ mode: 'serial' });

    test('should register a new user', async ({ page }) => {
        await page.goto('/register');

        await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

        await page.getByLabel('First Name').fill('Auth');
        await page.getByLabel('Last Name').fill('Tester');
        await page.getByLabel('Email Address').fill(UNIQUE_EMAIL);
        await page.getByLabel('Password').fill(PASSWORD);

        await page.getByRole('button', { name: 'Register' }).click();

        // Should redirect to login page after successful registration
        await page.waitForURL('**/login', { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'RC Login' })).toBeVisible();
    });

    test('should reject duplicate registration', async ({ page }) => {
        await page.goto('/register');

        await page.getByLabel('First Name').fill('Dupe');
        await page.getByLabel('Last Name').fill('User');
        await page.getByLabel('Email Address').fill(UNIQUE_EMAIL);
        await page.getByLabel('Password').fill(PASSWORD);

        await page.getByRole('button', { name: 'Register' }).click();

        // Should show an error, NOT redirect
        await expect(page.getByText(/failed|already|error/i)).toBeVisible({ timeout: 5_000 });
    });

    test('should log in with valid credentials', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: 'RC Login' })).toBeVisible();

        await page.getByLabel('Email').fill(UNIQUE_EMAIL);
        await page.getByLabel('Password').fill(PASSWORD);

        await page.getByRole('button', { name: 'Sign In' }).click();

        // Should redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10_000 });
        await expect(page.getByRole('heading', { name: 'Mission Control' })).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel('Email').fill('nobody@example.com');
        await page.getByLabel('Password').fill('WrongPassword!');

        await page.getByRole('button', { name: 'Sign In' }).click();

        // Should show error message
        await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5_000 });
        // Should NOT navigate away
        await expect(page).toHaveURL(/\/login/);
    });

    test('should log out successfully', async ({ page }) => {
        // First log in
        await page.goto('/login');
        await page.getByLabel('Email').fill(UNIQUE_EMAIL);
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.waitForURL('**/dashboard', { timeout: 10_000 });

        // Click sign out
        await page.getByRole('button', { name: /sign out|logout|log out/i }).click();

        // Should redirect away from dashboard (to login or home)
        await expect(page).not.toHaveURL(/\/dashboard/);
    });
});
