/**
 * Test constants — credentials and config for both test users.
 */
export const RC_USER = {
    email: 'rc-test@racekrewe.com',
    password: 'TestPass123!',
    firstName: 'Race',
    lastName: 'Committee',
};

export const RACER_USER = {
    email: 'racer-test@racekrewe.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Racer',
};

import * as fs from 'fs';
import * as path from 'path';

const idPath = path.join(__dirname, '..', '.test_id');
const sid = fs.existsSync(idPath) ? fs.readFileSync(idPath, 'utf8').trim() : '0000';

export const TEST_BOAT = {
    boatName: `Test Vessel ${sid}`,
    sailNumber: 'USA 001',
    makeModel: 'J/105',
};

export const TEST_BOAT_2 = {
    boatName: `Second Wind ${sid}`,
    sailNumber: 'USA 002',
    makeModel: 'Beneteau First 36.7',
};

export const RACER_BOAT = {
    boatName: `Racer Boat ${sid}`,
    sailNumber: 'USA 100',
    makeModel: 'J/70',
};

export const TEST_REGATTA = {
    name: `E2E Test Regatta ${sid}`,
    organization: 'Playwright Yacht Club',
    location: 'Test Harbor, FL',
    startDate: '2026-07-15',
    endDate: '2026-07-17',
};
