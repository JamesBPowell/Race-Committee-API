/**
 * Shared runtime state between test specs.
 * Since all tests run serially in a single worker, this module-level
 * object is safe to mutate across spec files.
 */
export const testState = {
    // IDs created during test runs — downstream specs reference these
    rcUserId: '',
    racerUserId: '',
    boatId: 0,
    secondBoatId: 0,
    racerBoatId: 0,
    regattaId: 0,
    fleetId: 0,
    secondFleetId: 0,
    raceId: 0,
    entryId: 0,
};
