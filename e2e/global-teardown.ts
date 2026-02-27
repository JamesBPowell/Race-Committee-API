/**
 * Global Teardown — runs ONCE after all test suites complete.
 *
 * Currently a no-op. Add database cleanup or API teardown here if needed.
 * For now, test isolation is handled by using unique test data per run
 * (or accepting stale data from previous runs).
 */

import type { FullConfig } from '@playwright/test';

export default async function globalTeardown(_config: FullConfig) {
    console.log('\n🧹 Global teardown complete (no-op for now).\n');
}
