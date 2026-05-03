# Certificate System — Implementation Plan

Implement a certificate management system where **certificates are files stored with the boat** so the Race Committee can review them when accepting entries. ORR/ORR-EZ data is parsed automatically from regattaman.com HTML pages. PHRF data is entered manually with an optional PDF upload for RC verification.

---

## Architecture Summary

### Per-Type Strategy

| Type | Source | Storage | Data Entry | Parsing |
|------|--------|---------|------------|---------|
| **PHRF** | PDF from regional board | Upload PDF to blob storage | **Manual** — owner enters rating | None. PDF is for RC verification of self-stated rating. |
| **ORR-EZ** | HTML on regattaman.com | Store URL + `SourceHtml` snapshot | **Automated** — parse HTML | AngleSharp parses structured tables for polars, GPH, config |
| **ORR** | HTML on regattaman.com | Store URL + `SourceHtml` snapshot | **Automated** — parse HTML | Same as ORR-EZ but more fields |

### Three-Layer Data Model

| Layer | Field(s) | Purpose | Mutability |
|-------|----------|---------|------------|
| **Source** | `Certificate.SourceUrl`, `SourceHtml` | Link to authoritative cert + disaster-recovery snapshot | Updated on refresh |
| **Parsed Data** | `Certificate.RawData` (JSON), `GPH`, dates, cert # | Current certificate data. JSON = schema-flexible | Updated on refresh |
| **Audit Snapshot** | `Entry.RatingSnapshot` (JSON), `Entry.Rating` | Frozen copy at time of scoring. **The audit trail.** | **Never mutated** |

### Snapshot Versioning & Immutability

- Every `RatingSnapshot` includes a `schemaVersion` (e.g., `"ORR-2026-v1"`)
- **Scored races are frozen** — results are read-only, no re-scoring on view
- **Historical rating display** = flat rating number + JSON download link
- **Current rating display** = structured UI (polar tables, benchmarks) only when `schemaVersion` matches the current version constant
- When ORR changes their cert format, we bump the version and update the parser. Old snapshots are untouched — they degrade gracefully to raw download

---

## ORR / ORR-EZ Certificate Structure (regattaman.com)

### URL Patterns
```
List:   https://www.regattaman.com/cert_list.php?crule=ORR
        https://www.regattaman.com/cert_list.php?crule=ORRez
Cert:   https://www.regattaman.com/cert_form.php?sku={sku_id}
```

### ORR Certificate Tabs
- **Data** — Boat specs, measurements, rig, sails, configuration
- **Offshore Polars** — Polar time allowances (wind speed × angle, sec/mi)
- **Short Course Polars** — Same format, different course assumptions
- **Ratings** — GPH, TOT/TOD benchmarks, performance metrics, custom ratings
- **Line Drawing** — Hull profile

### ORR-EZ Certificate Tabs
- **Data** — Simplified boat specs, config
- **Polars** — Polar time allowances, Spinnaker + Non-Spinnaker
- **Std Ratings** — GPH (TOT/TOD), PCS ratings by course type
- **PHRF Ratings** — Standard 5 Winds and Legacy 4 Winds (TOT/TOD × course × wind band)

### Key Data Fields (Both Types)
- **Administrative**: Cert #, Valid Year, Issue/Expiration, Owner, Boat Name, Sail Number, Class
- **Configuration**: Rig Type, Keel Type, Prop Type, Hull/Mast Construction
- **GPH**: General Purpose Handicap (sec/mi)
- **Polar Table**: sec/mi at angles (Beat VMG, 52°–165°, Run VMG) × wind speeds (4–24 kts)
- **Benchmark Ratings**: TOT factor and TOD (sec/mi)
- **PCS Ratings**: By course type (Random Leg, W50/L50, W60/L40, Mostly WW/LW/Reach)

---

## Proposed Changes

### Data Model

#### [MODIFY] [Certificate.cs](file:///c:/Projects/race-committee/api/Models/Certificate.cs)

```csharp
public class Certificate
{
    public int Id { get; set; }

    public int BoatId { get; set; }
    public Boat Boat { get; set; } = default!;

    public string CertificateType { get; set; } = string.Empty; // "PHRF", "ORR", "ORREZ"
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? RatingSpinnaker { get; set; }       // GPH (spin) for ORR/ORREZ, spin rating for PHRF
    public float? RatingNonSpinnaker { get; set; }    // GPH (non-spin) for ORR/ORREZ, non-spin rating for PHRF
    public string? Configuration { get; set; }        // Parsed from cert: crew config, spin type, etc.
    public string RawData { get; set; } = "{}";    // JSON: full parsed output (polars, config, ratings)

    // --- File storage (PHRF PDFs) ---
    public string? FileName { get; set; }
    public string? BlobPath { get; set; }
    public string? ContentType { get; set; }
    public long? FileSizeBytes { get; set; }
    public DateTime? FileUploadedAt { get; set; }

    // --- Remote certificate reference (ORR/ORREZ) ---
    public string? SourceUrl { get; set; }          // regattaman.com cert URL
    public string? SourceSku { get; set; }          // SKU parameter for re-fetching
    public string? SourceHtml { get; set; }         // Raw HTML snapshot for disaster recovery

    // --- Parse status ---
    public string ParseStatus { get; set; } = "None"; // None, Pending, Success, Failed, Manual
    public string? ParseErrors { get; set; }
    public string? SchemaVersion { get; set; }      // e.g. "ORR-2026-v1", "PHRF-v1"
}
```

#### Schema Version Constants

```csharp
public static class CertificateSchemas
{
    public const string CurrentOrr = "ORR-2026-v1";
    public const string CurrentOrrEz = "ORREZ-2026-v1";
    public const string CurrentPhrf = "PHRF-v1";
}
```

#### Entry.RatingSnapshot JSON Structure

```jsonc
{
  "schemaVersion": "ORREZ-2026-v1",
  "capturedAt": "2026-04-12T14:30:00Z",
  "certificateId": 42,
  "certificateNumber": "EZ10025",
  "sourceUrl": "https://www.regattaman.com/cert_form.php?sku=...",
  "ratingSpinnaker": 437.1,
  "ratingNonSpinnaker": 462.8,
  "polarTable": {
    "spinnaker": {
      "beatVmg": { "4": 1453.25, "6": 1032.08, ... },
      "52": { "4": 910.63, "6": 661.39, ... },
      // ... more angles
    },
    "nonSpinnaker": { /* same structure */ }
  },
  "benchmarkRatings": {
    "totSpin": 0.882, "todSpin": 604.4,
    "totNonSpin": 0.828, "todNonSpin": 643.7
  },
  "pcsRatings": { /* by course type */ },
  "configuration": { /* rig, keel, prop, etc. */ }
}
```

---

### Regatta / Race Immutability

#### [MODIFY] [Regatta.cs](file:///c:/Projects/race-committee/api/Models/Regatta.cs) (or Race.cs)

Add finalization state:

```csharp
public bool IsFinalized { get; set; } = false;
public DateTime? FinalizedAt { get; set; }
```

Once finalized:
- Race results are read-only (API rejects score updates)
- Entry rating data renders as flat number + "Download snapshot" link
- No "Refresh Certificate" or "Re-score" actions available

---

### File Storage Service

#### [NEW] [IFileStorageService.cs](file:///c:/Projects/race-committee/api/Services/IFileStorageService.cs)

```csharp
public interface IFileStorageService
{
    Task<string> UploadAsync(string container, string blobPath, Stream file, string contentType);
    Task<Stream?> DownloadAsync(string container, string blobPath);
    Task<string> GetDownloadUrlAsync(string container, string blobPath, TimeSpan expiry);
    Task DeleteAsync(string container, string blobPath);
}
```

#### [NEW] AzureBlobStorageService.cs
Azure Blob implementation. Connection string already in infrastructure (`StorageAccountConnectionString`).

#### [NEW] LocalFileStorageService.cs
Dev fallback — saves to `wwwroot/uploads/certificates/` on disk.

#### [MODIFY] [api.csproj](file:///c:/Projects/race-committee/api/api.csproj)
```xml
<PackageReference Include="Azure.Storage.Blobs" Version="12.24.0" />
<PackageReference Include="AngleSharp" Version="1.3.0" />
```

---

### Certificate Parsing Service

#### [NEW] [ICertificateParserService.cs](file:///c:/Projects/race-committee/api/Services/ICertificateParserService.cs)

```csharp
public interface ICertificateParserService
{
    Task<ParsedCertificateData> ParseFromUrlAsync(string url, string certType);
    Task<ParsedCertificateData> ParseFromHtmlAsync(string html, string certType);
}

public class ParsedCertificateData
{
    public string CertificateNumber { get; set; }
    public string BoatName { get; set; }
    public string SailNumber { get; set; }
    public string BoatClass { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public float? RatingSpinnaker { get; set; }
    public float? RatingNonSpinnaker { get; set; }
    public string SchemaVersion { get; set; }
    public string RawHtml { get; set; }               // For SourceHtml storage
    public string RawDataJson { get; set; }            // Full parsed output as JSON
}
```

#### [NEW] [RegattamanParserService.cs](file:///c:/Projects/race-committee/api/Services/RegattamanParserService.cs)

Implementation using `HttpClient` + `AngleSharp`:
1. Fetch cert page HTML
2. Parse `<input>` elements with `title` attributes for labeled values
3. Parse structured tables for polar data (wind speed × angle grid)
4. Extract GPH, benchmark ratings, PCS ratings, configuration
5. Store raw HTML in `SourceHtml`
6. Stamp with current `SchemaVersion`

---

### Certificate List Service (for dropdown search)

#### [NEW] [ICertificateListService.cs](file:///c:/Projects/race-committee/api/Services/ICertificateListService.cs)

Fetches and caches the regattaman.com valid certificate lists for dropdown selection:

```csharp
public interface ICertificateListService
{
    Task<IEnumerable<CertificateListItem>> SearchAsync(string certType, string query);
}

public class CertificateListItem
{
    public string Sku { get; set; }                // SKU for cert_form.php URL
    public string CertificateNumber { get; set; }  // e.g. "EZ10025" or "US43209"
    public string BoatName { get; set; }
    public string SailNumber { get; set; }
    public string BoatType { get; set; }
    public string DisplayText { get; set; }        // "EZ10025 - Geronimo - USA 198"
    public string Url { get; set; }                // Full cert_form.php URL
}
```

Implementation:
- Fetches `cert_list.php?crule=ORR` and `cert_list.php?crule=ORRez` via HttpClient
- **Filters to valid (non-expired) certificates only** — uses the `effDate` parameter or filters by expiration column
- Parses the HTML table rows to extract cert ID, boat name, sail number, SKU link
- Caches results in memory with a configurable TTL (e.g., 1 hour)
- `SearchAsync` filters by boat name OR sail number (case-insensitive contains)
- Cert number suffixes (-SH, -DH, -OD, etc.) provide natural disambiguation of multiple certs per boat

#### [NEW] CertificateListController or endpoint on CertificatesController

```
GET api/certificates/search?type=ORR&query=geronimo
GET api/certificates/search?type=ORREZ&query=USA+198
```

Returns matching `CertificateListItem[]` for the dropdown.

---

### DTOs

#### [NEW] [CertificateDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/CertificateDto.cs)

```csharp
public class CertificateDto
{
    public int Id { get; set; }
    public int BoatId { get; set; }
    public string CertificateType { get; set; }
    public string CertificateNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? RatingSpinnaker { get; set; }
    public float? RatingNonSpinnaker { get; set; }
    public string? Configuration { get; set; }
    public string? FileName { get; set; }
    public bool HasFile { get; set; }
    public string? FileDownloadUrl { get; set; }
    public string? SourceUrl { get; set; }
    public string ParseStatus { get; set; }
    public string? SchemaVersion { get; set; }
}

public class CreateCertificateManualDto       // PHRF
{
    public string CertificateType { get; set; }  // "PHRF"
    public string? CertificateNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? RatingSpinnaker { get; set; }      // PHRF spin rating
    public float? RatingNonSpinnaker { get; set; }    // PHRF non-spin rating
}

public class ImportCertificateDto              // ORR/ORREZ
{
    public string CertificateType { get; set; }  // "ORR" or "ORREZ"
    public string SourceUrl { get; set; }        // regattaman.com cert URL
}

public class UpdateCertificateDto
{
    public string? CertificateNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? RatingSpinnaker { get; set; }
    public float? RatingNonSpinnaker { get; set; }
}
```

---

### Certificates Service & Controller

#### [NEW] ICertificatesService / CertificatesService

Methods:
- `GetCertificatesForBoatAsync(boatId, userId)` → list
- `GetCertificateAsync(id, userId)` → single with download URL
- `CreateCertificateManualAsync(boatId, dto, userId)` → PHRF manual entry
- `ImportCertificateAsync(boatId, dto, userId)` → fetch + parse regattaman URL
- `UploadFileAsync(boatId, certId, file, userId)` → attach PDF
- `UpdateCertificateAsync(id, dto, userId)` → edit data
- `DeleteCertificateAsync(id, userId)` → delete cert + blob
- `RefreshFromSourceAsync(id, userId)` → re-fetch + re-parse from SourceUrl
- `GetSnapshotDownloadAsync(entryId, userId)` → download RatingSnapshot JSON

#### [NEW] CertificatesController

Routes: `api/boats/{boatId}/certificates`

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | List certs for boat |
| `GET` | `/{id}` | Get single cert |
| `POST` | `/` | Manual entry (PHRF) |
| `POST` | `/import` | Import from regattaman URL (ORR/ORREZ) |
| `POST` | `/{id}/upload` | Upload PDF file (multipart) |
| `PUT` | `/{id}` | Update cert data |
| `DELETE` | `/{id}` | Delete cert + file |
| `POST` | `/{id}/refresh` | Re-parse from source URL |
| `GET` | `/{id}/download` | Download uploaded file |

Search endpoint (not boat-scoped):

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `api/certificates/search?type=ORR&query=...` | Search regattaman cert list |

---

### DI & Configuration

#### [MODIFY] [Program.cs](file:///c:/Projects/race-committee/api/Program.cs)

```csharp
builder.Services.AddScoped<ICertificatesService, CertificatesService>();
builder.Services.AddScoped<ICertificateParserService, RegattamanParserService>();
builder.Services.AddScoped<ICertificateListService, RegattamanCertificateListService>();
builder.Services.AddHttpClient<ICertificateParserService, RegattamanParserService>();
builder.Services.AddHttpClient<ICertificateListService, RegattamanCertificateListService>();

var storageConn = builder.Configuration["StorageAccountConnectionString"];
if (!string.IsNullOrEmpty(storageConn))
    builder.Services.AddSingleton<IFileStorageService>(new AzureBlobStorageService(storageConn));
else
    builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
```

---

### BoatDto & Entry Integration

#### [MODIFY] [BoatDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/BoatDto.cs)
Add `Certificates` collection.

#### [MODIFY] [BoatsService.cs](file:///c:/Projects/race-committee/api/Services/BoatsService.cs)
Include certificates when fetching boats.

#### [MODIFY] [UpdateEntryDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/UpdateEntryDto.cs)
Add `ActiveCertificateId`.

#### [MODIFY] [RegattasService.cs](file:///c:/Projects/race-committee/api/Services/RegattasService.cs)
- When `ActiveCertificateId` is set: validate cert belongs to boat, populate `Entry.Rating` from `RatingSpinnaker` or `RatingNonSpinnaker` based on race/class spinnaker configuration, snapshot full cert data into `RatingSnapshot` with `schemaVersion`
- When regatta is finalized: reject score updates

#### [MODIFY] [RegattaDetailsDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/RegattaDetailsDto.cs)
Add `ActiveCertificateId`, `ActiveCertificateType`, `IsFinalized` to relevant DTOs.

---

### Frontend

#### [NEW] [useCertificates.ts](file:///c:/Projects/race-committee/ui/src/hooks/useCertificates.ts)

```typescript
interface CertificateResponse {
    id: number;
    boatId: number;
    certificateType: string;
    certificateNumber: string;
    issueDate: string | null;
    validUntil: string | null;
    ratingSpinnaker: number | null;
    ratingNonSpinnaker: number | null;
    fileName: string | null;
    hasFile: boolean;
    fileDownloadUrl: string | null;
    sourceUrl: string | null;
    parseStatus: string;
    schemaVersion: string | null;
}

interface CertificateSearchResult {
    sku: string;
    certificateNumber: string;
    boatName: string;
    sailNumber: string;
    boatType: string;
    displayText: string;    // "EZ10025 - Geronimo - USA 198"
    url: string;
}

// Hooks
useCertificates(boatId) → { certificates, isLoading, error, refetch }

// Mutations
createCertificateManual(boatId, data)
importCertificate(boatId, { type, sourceUrl })
uploadFile(boatId, certId, file)
updateCertificate(boatId, certId, data)
deleteCertificate(boatId, certId)
refreshCertificate(boatId, certId)

// Search (for dropdown)
searchCertificates(type, query) → CertificateSearchResult[]
```

#### [NEW] [CertificateFormModal.tsx](file:///c:/Projects/race-committee/ui/src/components/CertificateFormModal.tsx)

**Step 1: Choose certificate type** (PHRF, ORR, ORR-EZ)

**PHRF mode:**
- Certificate Number (text)
- PHRF Rating (number)
- Issue Date / Valid Until (date pickers)
- File upload drop zone (PDF for RC verification)

**ORR / ORR-EZ mode — two input methods:**

1. **Dropdown search** (primary):
   - Searchable dropdown (filters as you type)
   - Filters regattaman cert list by boat name OR sail number
   - Display text: `"EZ10025 - Geronimo - USA 198"` or `"US43209 - MEANIE - NZL10000"`
   - After selection: shows spin/non-spin ratings for confirmation
   - On select: auto-fills the URL, triggers import + parse
   
2. **Manual URL entry** (fallback):
   - Text field: "Paste regattaman.com certificate URL"
   - Validates URL matches `cert_form.php?sku=...` pattern
   - On submit: triggers import + parse

**After import:**
- Shows extracted data summary (cert #, boat name, spin/non-spin ratings, validity)
- Parse status indicator (✅ Success, ❌ Failed with errors)
- If parse failed: manual rating entry fallback (spin + non-spin fields)

Uses existing design system classes.

#### [MODIFY] [BoatCard.tsx](file:///c:/Projects/race-committee/ui/src/components/BoatCard.tsx)

- Certificate count badge
- Each cert: type pill + cert # + validity status
- 📄 icon (has uploaded file) or 🔗 icon (linked to regattaman)
- Click cert → edit modal
- "View Certificate" → opens regattaman URL or downloads PDF
- "Add Certificate" button

#### [MODIFY] Regatta entries table

**Active regatta (not finalized):**
- Certificate column: type badge + cert #
- "View Cert" link (regattaman URL or PDF download)
- Certificate selector dropdown in edit mode
- If `schemaVersion` matches current: show structured rating info on hover/expand (spin/non-spin ratings, key benchmarks)

**Finalized regatta:**
- Certificate column: type badge + flat rating number
- "Download Rating Snapshot" link (JSON file)
- No edit controls, no "Refresh", no re-score
- No structured polar/rating display (avoids backwards-compat burden)

---

## Scoping Decisions

### Expiration Handling (MVP)
- **Certificate dropdowns and search filter to valid (non-expired) only** — reduces noise from variant suffixes (-OD-3 etc.)
- **Expired certs remain in the DB** — not deleted, just hidden from selection
- **No RC override for expired certs in MVP** — planned as future feature (see below)
- **Multiple certs per boat fully supported** — a boat may have base, -SH, -DH, -OD certs simultaneously; only valid ones appear in selection

### Future Feature: Expired Certificate Override
Race committees sometimes need to accept last-minute entries with expired certificates. A future `AllowExpiredCertificates` regatta-level setting would:
- Unlock expired certs in the entry certificate selector
- Require the expired cert's `schemaVersion` to match the regatta's scoring method
- Show a clear visual warning that the cert is expired
- **Not implementing in MVP** — noted here for future planning

---

## Open Questions

> [!IMPORTANT]
> **RC access control**: Race Committee members need to view certificates for boats entered in their regatta. Add read-only cert access for RC members?

> [!NOTE]
> **Certificate types**: Constrain to `PHRF`, `ORR`, `ORREZ`? Or allow IRC, ORC Club, etc.?

> [!NOTE]
> **Delete behavior**: Block deletion if entry references cert, or null-out and fall back?

> [!NOTE]
> **Cache TTL for cert list**: 1 hour for the regattaman cert list cache? Configurable?

---

## Verification Plan

### Build Checks
- `dotnet build` from `api/`
- `npm run dev` from `ui/`
- `npx playwright test` from `e2e/`

### Manual Verification
1. **PHRF manual entry**: Add cert → enter rating → upload PDF → download works
2. **ORR-EZ dropdown import**: Search "Geronimo" → select from dropdown → data auto-parsed → spin/non-spin ratings populated
3. **ORR URL import**: Paste regattaman URL → parsed → cert linked
4. **Refresh**: Click refresh → re-fetches, updates data
5. **Entry integration**: Select cert on entry → rating auto-populates → RatingSnapshot created
6. **Finalized regatta**: Results read-only, rating shows flat number + download link
7. **Schema mismatch**: Old snapshot with outdated schemaVersion → shows download only, no structured view
8. **RC review**: Committee member views entry → can open regattaman link or download PDF
9. **Local dev**: Works without Azure connection string (filesystem fallback)
