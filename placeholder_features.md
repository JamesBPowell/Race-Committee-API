# Placeholder Features & Unimplemented Enums

A comprehensive audit of features that have UI scaffolding or data model presence but lack backing logic.

---

## 1. Scoring Method Enums — Stubbed Backend Logic

The `ScoringMethod` enum has 7 values selectable in the "Add/Edit Class" dropdown. Only **4** have real corrected-time formulas in [ScoringService.cs](file:///c:/Projects/race-committee/api/Services/ScoringService.cs#L258-L309).

| Enum Value | Dropdown Label | Status |
|---|---|---|
| `OneDesign` (0) | One Design (No Handicap) | ✅ Implemented — returns elapsed time |
| `PHRF_TOT` (1) | PHRF Time-on-Time | ✅ Implemented — configurable A/B coefficients |
| `PHRF_TOD` (2) | PHRF Time-on-Distance | ✅ Implemented — sec/mile allowance |
| `ORR_EZ_GPH` (3) | ORR-EZ General (GPH) | ⚠️ **Approximate** — uses hardcoded `600 / rating` multiplier |
| `ORR_EZ_PC` (4) | ORR-EZ Performance Curve | ❌ **Stubbed** — returns raw elapsed time (`return elapsed;`) |
| `ORR_Full_PC` (5) | ORR Full Performance Curve | ❌ **Stubbed** — returns raw elapsed time (`return elapsed;`) |
| `Portsmouth` (6) | Portsmouth Yardstick | ✅ Implemented — PY number correction |

> [!IMPORTANT]
> `ORR_EZ_PC` and `ORR_Full_PC` are fully selectable in the UI and stored in the database, but scoring produces uncorrected results. The TODO comment at [ScoringService.cs:302-304](file:///c:/Projects/race-committee/api/Services/ScoringService.cs#L300-L305) says:
> *"Mocked interpolation for initial phase. In a full implementation, parse entry.RatingSnapshot JSON to find the exact target speed based on wind speed, wind angle (course type), and calculate custom allowance."*

---

## 2. StartType Enum — Stored but Never Consumed

The `StartType` enum is available in the "Add Race" and "Edit Race" modals:

| Enum Value | Dropdown Label | Status |
|---|---|---|
| `Single_Gun` (0) | Single Gun | ⚠️ **Stored only** — no behavioral difference |
| `Staggered` (1) | Staggered | ❌ **No logic** — no staggered start calculation |
| `Pursuit` (2) | Pursuit | ❌ **No logic** — no pursuit start time calculation |

> [!WARNING]
> The `StartType` field is persisted on `Race` and displayed in the race table, but **no code** in the API reads this value to alter scoring, start sequences, or timing logic. `Staggered` and `Pursuit` starts require fundamentally different timing math (calculated handicap-based offsets) that does not exist.

---

## 3. CourseType Enum — Stored but Never Consumed

The `CourseType` enum appears in race and race-override dropdowns:

| Enum Value | Dropdown Label | Status |
|---|---|---|
| `WindwardLeeward` (0) | Windward Leeward | ⚠️ **Stored only** |
| `RandomLeg` (1) | Random Leg | ❌ **Stored only** |
| `Triangle` (2) | Triangle | ❌ **Stored only** |
| `Olympic` (3) | Olympic | ❌ **Stored only** |

> [!NOTE]
> Course type is used as a **grouping key** for overall rankings ([ScoringService.cs:211](file:///c:/Projects/race-committee/api/Services/ScoringService.cs#L211)), but has no impact on scoring calculations. For ORR Performance Curve scoring, course type should map to wind angles to look up target speeds from polar data — this is explicitly called out as missing.

---

## 4. Race Status Values — Partial Handling

The `Race.Status` field is a freeform string with the following values available in the Edit Race modal dropdown ([EditRaceModal.tsx:148-157](file:///c:/Projects/race-committee/ui/src/components/EditRaceModal.tsx)):

| Status | UI Display | Backend Behavior |
|---|---|---|
| `Scheduled` | ✅ Styled (indigo badge) | Default value |
| `InSequence` | ✅ In dropdown | ❌ **No backend logic** |
| `Racing` | ✅ Styled (emerald badge) | ❌ **No backend logic** — no live timing |
| `Completed` | ✅ Styled (slate badge) | ✅ Set automatically when finishes are saved |
| `Postponed` | ✅ In dropdown | ❌ **No backend logic** |
| `Abandoned` | ✅ In dropdown | ❌ **No backend logic** — should handle resail/discard |

> [!NOTE]
> The `SaveFinishesAsync` method unconditionally sets `race.Status = "Completed"` ([RacesService.cs:206](file:///c:/Projects/race-committee/api/Services/RacesService.cs#L206)). There is no workflow for `Postponed` → `Rescheduled`, or `Abandoned` (which per RRS should result in race discard/resail).

---

## 5. Registration Status — Mismatched Values

The backend `Entry.RegistrationStatus` defaults to `"Pending"` with comment listing: *"Pending, Paid, CheckedIn"* ([Entry.cs:30](file:///c:/Projects/race-committee/api/Models/Entry.cs#L30)).

The UI dropdown in the entries table offers: **Pending, Approved, Rejected** ([page.tsx:349-352](file:///c:/Projects/race-committee/ui/src/app/dashboard/regattas/%5Bid%5D/page.tsx#L349-L352)).

| Status | In UI | In Backend Model Comment | Logic |
|---|---|---|---|
| `Pending` | ✅ | ✅ | Default |
| `Approved` | ✅ | ❌ | ❌ No approval workflow |
| `Rejected` | ✅ | ❌ | ❌ No rejection workflow |
| `Paid` | ❌ | ✅ | ❌ No payment integration |
| `CheckedIn` | ❌ | ✅ | ❌ No check-in feature |

> [!WARNING]
> The UI and backend disagree on the valid statuses. Additionally, no status has any behavioral impact — changing status doesn't gate entry from racing, trigger notifications, or affect scoring eligibility.

---

## 6. Protests — Stat Card with Zero Implementation

The regatta overview page includes a `StatCard` for Protests ([page.tsx:233](file:///c:/Projects/race-committee/ui/src/app/dashboard/regattas/%5Bid%5D/page.tsx#L233)):

```tsx
<StatCard title="Protests" value="0" icon={<Shield />} color="slate" />
```

- **No `Protest` model** exists in the API
- **No controller or service** for protests
- **No UI** for filing, viewing, or adjudicating protests
- Value is **hardcoded `"0"`**

---

## 7. Delete Regatta — UI Button, No Backend

The Settings tab contains a "Danger Zone" with a [Delete Regatta button](file:///c:/Projects/race-committee/ui/src/app/dashboard/regattas/%5Bid%5D/page.tsx#L649-L651):

```tsx
<button className="...">Delete Regatta</button>
```

- **No `onClick` handler** is attached
- **No `DELETE` endpoint** exists on `RegattasController`
- **No `DeleteRegattaAsync`** method in `IRegattasService` or `RegattasService`

---

## 8. "View All" Activity — Dead Button

The Overview tab's "Recent Activity" section has a [View All button](file:///c:/Projects/race-committee/ui/src/app/dashboard/regattas/%5Bid%5D/page.tsx#L254) with **no `onClick` handler** and no activity log system:

```tsx
<button className="...">View All</button>
```

The activity items themselves are also **hardcoded/static** — they just echo the current regatta stats, not an actual event log.

---

## 9. Certificate System — Model Only

A full `Certificate` model exists ([Certificate.cs](file:///c:/Projects/race-committee/api/Models/Certificate.cs)) with fields for:
- `CertificateType` (ORR, ORREZ, PHRF)
- `CertificateNumber`, `IssueDate`, `ValidUntil`
- `GPH` (General Purpose Handicap)
- `RawData` (JSON payload for polars)

The `Boat` model has a `Certificates` collection, and `Entry` has an `ActiveCertificateId` FK.

**However:**
- ❌ No `CertificatesController`
- ❌ No UI to upload/manage certificates
- ❌ No integration into scoring (ORR scoring should pull from certificate polars)
- ❌ No certificate import (e.g., from ORR/US Sailing API)

---

## 10. Entry Configuration Field — Never Exposed

`Entry.Configuration` is set to `"Spinnaker"` by default ([RegattasService.cs:259](file:///c:/Projects/race-committee/api/Services/RegattasService.cs#L259)) but:
- ❌ **Not shown** in any UI
- ❌ **Not editable** by committee or racer
- ❌ **Not used** in scoring (spinnaker vs. non-spinnaker should affect PHRF rating adjustments)

---

## 11. Entry RatingSnapshot — Never Populated

`Entry.RatingSnapshot` is a JSON field designed to hold full polar/performance data for ORR scoring:
- Default: `"{}"` ([Entry.cs:28](file:///c:/Projects/race-committee/api/Models/Entry.cs#L28))
- ❌ **Never written** with real data
- ❌ **Never parsed** by scoring — the TODO at [ScoringService.cs:303](file:///c:/Projects/race-committee/api/Services/ScoringService.cs#L303) confirms this

---

## 12. Landing Page Links — Dead Routes

The [HeroSection.tsx](file:///c:/Projects/race-committee/ui/src/components/HeroSection.tsx) has two CTA buttons:

| Link | Target | Status |
|---|---|---|
| "Register for a Race" | `/events` | ❌ **No `/events` route exists** |
| "RC Login" | `/login` | ✅ Works |

---

## 13. LiveNowSection — Entirely Mocked

The entire [LiveNowSection.tsx](file:///c:/Projects/race-committee/ui/src/components/LiveNowSection.tsx) is a **visual mockup**:
- Leaderboard entries are hardcoded (`"Sonic Spirit"`, `"USA 142"`)
- Course map is a static SVG with CSS-animated boat icons
- "Telemetry Active" indicator is decorative
- "Explore All Live Races" button has **no `onClick` or `href`**
- **No live tracking API, WebSocket, or real-time data infrastructure**

---

## 14. `ScoringConfiguration` / `ScoringParameters` — Minimal Use

Both `Fleet.ScoringConfiguration` and `Race.ScoringParameters` are JSON string fields:
- `ScoringConfiguration` is only read for `PHRF_TOT_A`/`PHRF_TOT_B` coefficients and `DNFScoring`
- ❌ No UI exists to configure these values
- `Race.ScoringParameters` is always set to `"{}"` and **never read**

---

## Summary

| Category | Items | Impact |
|---|---|---|
| **Stubbed Scoring** | ORR_EZ_PC, ORR_Full_PC | Produces wrong results silently |
| **Stored-Only Enums** | StartType.Staggered/Pursuit, all CourseTypes | No behavioral difference |
| **Dead UI** | Delete Regatta, View All, Explore Live, Protests stat, /events link | Buttons/links do nothing |
| **Full Mockups** | LiveNowSection, Activity feed | Decorative only |
| **Model-Only** | Certificates, Configuration, RatingSnapshot, ScoringParameters | Data structures with no code path |
| **Status Mismatch** | Registration statuses (UI ≠ backend) | Confusing data |
