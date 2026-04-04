# Certificate System — Revised Implementation Plan

Implement a certificate management system that treats **certificates as files first, data second**. Boat owners upload their rating certificate PDFs, the system stores them in blob storage, and (for ORR/ORR-EZ) automatically parses out the structured rating data. The Race Committee can review the original certificate document when accepting entries.

## User Review Required

> [!IMPORTANT]
> **The big change: Certificates are files.**
> The previous plan treated certificates as purely manual data entry. This revision adds file upload/storage as the primary workflow. The certificate PDF is the source of truth — data fields (GPH, polar tables, etc.) are *extracted from* it. For PHRF, where certificates are simpler and vary by region, manual data entry is also supported.

> [!IMPORTANT]
> **Per-type data entry strategy:**
> - **PHRF**: Manual entry of rating number + optional file upload. PHRF certs vary wildly by region and are often just a single number. Manual entry is appropriate.
> - **ORR-EZ**: PDF upload with automated parsing. Structured polar table (wind speed × angle grid), GPH, cert number, dates. Target: parse from the PDF.
> - **ORR (Full)**: PDF upload with automated parsing. Same as ORR-EZ but with more data (additional measurement details, full polar curves). Target: parse from the PDF.

> [!WARNING]
> **PDF Parsing is a phased effort.**
> Building robust PDF parsers for ORR/ORR-EZ certificates requires example files to develop against. Phase 1 (this plan) builds the upload + storage infrastructure and a manual-entry fallback. Phase 2 (separate effort) implements the PDF parsing pipeline once we have sample certificate files to reverse-engineer the layout.

> [!IMPORTANT]
> **Storage backend: Azure Blob Storage.**
> The infrastructure already provisions a Storage Account (`sonicspiritstorage`). We'll use Azure Blob Storage with a `certificates` container. Files are stored as `{boatId}/{certificateId}/{filename}` and served via SAS URLs for authorized download. This requires adding the `Azure.Storage.Blobs` NuGet package.

---

## Research Findings

### Certificate File Formats by Type

| Type | Format | Data Complexity | Entry Strategy |
|------|--------|----------------|----------------|
| **PHRF** | Varies by region. Often a simple letter/card. Sometimes a PDF. | Single rating number (sec/nm) + optional adjustments for spinnaker/non-spinnaker | **Manual entry** of rating. Optional file upload for reference. |
| **ORR-EZ** | Standardized PDF from Regatta Management (regattaman.com) | Cert #, GPH, polar table (sec/mi at 8 wind speeds × 10+ angles), config (rig type, keel, prop) | **PDF upload → automated parse.** Fallback: manual GPH entry. |
| **ORR (Full)** | Standardized PDF from ORA via US Sailing | Everything in ORR-EZ plus detailed measurement data, full polar curves, sail inventory | **PDF upload → automated parse.** Fallback: manual GPH entry. |

### Key Data Fields to Extract (ORR-EZ / ORR)

**Administrative:** Certificate Number, Issue Date, Expiration Date, Boat Name, Sail Number, Owner
**Configuration:** Rig Type, Keel Type, Propeller Type/Installation, Propeller Blades
**Performance (Polar Table):**
- Wind speeds: 6, 8, 10, 12, 14, 16, 20, 25 kts
- Angles: Beat VMG, 52°, 60°, 75°, 90°, 110°, 120°, 135°, 150°, 165°, Run VMG
- Values: seconds per nautical mile at each wind speed × angle combination
- GPH (General Purpose Handicap): the single "all-purpose" rating number

### Sources for Example Certificates

To build the PDF parser, we need example certificate files. Potential sources:

1. **regattaman.com** → ORR-EZ valid list has links to individual PDF certs
2. **offshoreracingrule.org** → Official ORR resource, may have sample certs
3. **Regatta entry lists** (Newport Bermuda, Transpac, Rolex Big Boat Series) → Published fleet ratings often link to certs
4. **Your own certificates** — Do you have ORR or ORR-EZ certificates we can use as development samples?

> [!IMPORTANT]
> **Action needed:** We need 2-3 sample ORR-EZ and/or ORR certificate PDFs to develop the parser against. Can you provide examples, or should I attempt to download public ones from regatta entry lists?

---

## Proposed Changes

### Phase 1: Upload, Storage & Manual Entry (This Implementation)

---

### API — Data Model Updates

#### [MODIFY] [Certificate.cs](file:///c:/Projects/race-committee/api/Models/Certificate.cs)

Add file metadata fields to the existing Certificate model:

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

    public float? GPH { get; set; }

    public string RawData { get; set; } = "{}"; // JSON: parsed polar data, config, etc.

    // --- NEW: File storage fields ---
    public string? FileName { get; set; }         // Original uploaded filename
    public string? BlobPath { get; set; }          // Path in blob storage: "{boatId}/{certId}/{filename}"
    public string? ContentType { get; set; }       // MIME type (application/pdf, image/jpeg, etc.)
    public long? FileSizeBytes { get; set; }        // File size for display/validation
    public DateTime? FileUploadedAt { get; set; }   // When the file was uploaded

    // --- NEW: Parsing status ---
    public string ParseStatus { get; set; } = "None"; // "None", "Pending", "Success", "Failed", "Manual"
    public string? ParseErrors { get; set; }           // JSON array of parsing error messages
}
```

**Key decisions:**
- `BlobPath` stores the blob key (not a URL) — URLs are generated on-demand with SAS tokens for security
- `ParseStatus` tracks whether automated data extraction has been attempted and its result
- `ParseErrors` captures specific issues so the user can fix/re-upload
- `"Manual"` parse status means the user chose to enter data by hand (valid for PHRF)

---

### API — File Storage Service

#### [NEW] [IFileStorageService.cs](file:///c:/Projects/race-committee/api/Services/IFileStorageService.cs)

Abstraction over blob storage to keep controllers clean and enable local dev with filesystem fallback:

```csharp
public interface IFileStorageService
{
    Task<string> UploadAsync(string containerName, string blobPath, Stream fileStream, string contentType);
    Task<Stream?> DownloadAsync(string containerName, string blobPath);
    Task<string> GetDownloadUrlAsync(string containerName, string blobPath, TimeSpan expiry);
    Task DeleteAsync(string containerName, string blobPath);
}
```

#### [NEW] [AzureBlobStorageService.cs](file:///c:/Projects/race-committee/api/Services/AzureBlobStorageService.cs)

Implementation using `Azure.Storage.Blobs`:
- Connects via connection string from `appsettings.json` (`StorageAccountConnectionString`)
- `GetDownloadUrlAsync` generates a time-limited SAS URL (e.g., 15 min) for secure file access
- Container `certificates` is auto-created on first use

#### [NEW] [LocalFileStorageService.cs](file:///c:/Projects/race-committee/api/Services/LocalFileStorageService.cs)

Development fallback: stores files to `wwwroot/uploads/certificates/` on disk. Used when no Azure connection string is configured.

---

### API — DTOs

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
    public float? GPH { get; set; }

    // File info for the UI
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public bool HasFile { get; set; }               // Computed: BlobPath != null
    public string? FileDownloadUrl { get; set; }     // SAS URL, populated on request

    // Parse status
    public string ParseStatus { get; set; }
    public string? ParseErrors { get; set; }
}

// For PHRF manual entry (no file required)
public class CreateCertificateManualDto
{
    public string CertificateType { get; set; }       // "PHRF"
    public string? CertificateNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? GPH { get; set; }                   // PHRF rating value
}

// For updating manually-entered data (any type)
public class UpdateCertificateDto
{
    public string? CertificateNumber { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ValidUntil { get; set; }
    public float? GPH { get; set; }
    public string? RawData { get; set; }
}
```

File upload is handled as `multipart/form-data` on the controller endpoint, not via a JSON DTO.

---

### API — Certificates Service

#### [NEW] [ICertificatesService.cs](file:///c:/Projects/race-committee/api/Services/ICertificatesService.cs)

```
GetCertificatesForBoatAsync(int boatId, string userId) → IEnumerable<CertificateDto>
GetCertificateAsync(int id, string userId) → CertificateDto?
CreateCertificateManualAsync(int boatId, CreateCertificateManualDto dto, string userId) → CertificateDto
UploadCertificateAsync(int boatId, string certType, IFormFile file, string userId) → CertificateDto
UpdateCertificateAsync(int id, UpdateCertificateDto dto, string userId) → bool
DeleteCertificateAsync(int id, string userId) → (bool Success, string ErrorMessage)
GetFileDownloadUrlAsync(int id, string userId) → string?  // SAS URL for PDF download
```

#### [NEW] [CertificatesService.cs](file:///c:/Projects/race-committee/api/Services/CertificatesService.cs)

Implementation:
- All methods verify `Boat.OwnerId == userId` OR user is on the regatta committee (for RC review)
- `UploadCertificateAsync`:
  1. Validates file type (PDF, JPG, PNG — max 10MB)
  2. Creates Certificate record with `ParseStatus = "Pending"` for ORR/ORREZ, `"Manual"` for PHRF
  3. Uploads to blob storage at `{boatId}/{certId}/{filename}`
  4. Sets `BlobPath`, `FileName`, `ContentType`, `FileSizeBytes`, `FileUploadedAt`
  5. (Phase 2) Kicks off parsing pipeline for ORR/ORREZ
  6. (Phase 1) For now, sets `ParseStatus = "Pending"` — user can manually enter GPH as a fallback
- Delete cascades to blob storage (deletes the file too)

---

### API — Controller

#### [NEW] [CertificatesController.cs](file:///c:/Projects/race-committee/api/Controllers/CertificatesController.cs)

Nested under boats: `api/boats/{boatId}/certificates`

| Method | Route | Content-Type | Description |
|--------|-------|-------------|-------------|
| `GET` | `api/boats/{boatId}/certificates` | JSON | List all certificates for a boat |
| `GET` | `api/boats/{boatId}/certificates/{id}` | JSON | Get single certificate with download URL |
| `POST` | `api/boats/{boatId}/certificates` | JSON | Add certificate via manual entry (PHRF) |
| `POST` | `api/boats/{boatId}/certificates/upload` | multipart/form-data | Upload certificate PDF (ORR/ORREZ) |
| `PUT` | `api/boats/{boatId}/certificates/{id}` | JSON | Update certificate data |
| `DELETE` | `api/boats/{boatId}/certificates/{id}` | — | Delete certificate + blob |
| `GET` | `api/boats/{boatId}/certificates/{id}/download` | Redirect | Get SAS URL / redirect to download |

---

### API — DI & Configuration

#### [MODIFY] [Program.cs](file:///c:/Projects/race-committee/api/Program.cs)

```csharp
// Storage service: Azure Blob in production, local filesystem in dev
var storageConnectionString = builder.Configuration["StorageAccountConnectionString"];
if (!string.IsNullOrEmpty(storageConnectionString))
{
    builder.Services.AddSingleton<IFileStorageService>(
        new AzureBlobStorageService(storageConnectionString));
}
else
{
    builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
}

builder.Services.AddScoped<ICertificatesService, CertificatesService>();
```

#### [MODIFY] [api.csproj](file:///c:/Projects/race-committee/api/api.csproj)

Add NuGet package:
```xml
<PackageReference Include="Azure.Storage.Blobs" Version="12.24.0" />
```

---

### API — DB Migration

#### [NEW] EF Migration

Add migration for the new Certificate columns:
```
dotnet ef migrations add AddCertificateFileFields
```

New columns: `FileName`, `BlobPath`, `ContentType`, `FileSizeBytes`, `FileUploadedAt`, `ParseStatus`, `ParseErrors`

---

### API — BoatDto & Entry Integration

*(Unchanged from previous plan — include certificates in BoatDto, ActiveCertificateId on entries, auto-populate rating from GPH)*

#### [MODIFY] [BoatDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/BoatDto.cs)
Add `Certificates` collection to BoatDto.

#### [MODIFY] [BoatsService.cs](file:///c:/Projects/race-committee/api/Services/BoatsService.cs)
Include certificates when fetching boats.

#### [MODIFY] [UpdateEntryDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/UpdateEntryDto.cs)
Add `ActiveCertificateId` field.

#### [MODIFY] [RegattasService.cs](file:///c:/Projects/race-committee/api/Services/RegattasService.cs)
Auto-populate entry rating from selected certificate GPH.

#### [MODIFY] [RegattaDetailsDto.cs](file:///c:/Projects/race-committee/api/Models/DTOs/RegattaDetailsDto.cs)
Add `ActiveCertificateId` and `ActiveCertificateType` to EntryDto.

---

### Frontend — Hooks

#### [NEW] [useCertificates.ts](file:///c:/Projects/race-committee/ui/src/hooks/useCertificates.ts)

```typescript
interface CertificateResponse {
    id: number;
    boatId: number;
    certificateType: string;
    certificateNumber: string;
    issueDate: string | null;
    validUntil: string | null;
    gph: number | null;
    fileName: string | null;
    fileSizeBytes: number | null;
    hasFile: boolean;
    fileDownloadUrl: string | null;
    parseStatus: string;
    parseErrors: string | null;
}

// Hooks
useCertificates(boatId) → { certificates, isLoading, error, refetch }

// Mutation functions
createCertificateManual(boatId, data) → CertificateResponse
uploadCertificate(boatId, certType, file) → CertificateResponse  // FormData upload
updateCertificate(boatId, certId, data) → void
deleteCertificate(boatId, certId) → void
downloadCertificate(boatId, certId) → triggers browser download
```

---

### Frontend — Certificate Modal

#### [NEW] [CertificateFormModal.tsx](file:///c:/Projects/race-committee/ui/src/components/CertificateFormModal.tsx)

Two-mode modal depending on certificate type:

**Mode A: PHRF (Manual Entry)**
- Certificate Type: dropdown (pre-selected to PHRF)
- Certificate Number (text)
- PHRF Rating (number — the main value)
- Issue Date / Valid Until (date pickers)
- Optional: File upload drop zone for reference copy

**Mode B: ORR / ORR-EZ (File Upload Primary)**
- Certificate Type: dropdown (ORR or ORR-EZ)
- **File upload drop zone** (drag & drop or click to browse)
  - Accepts: PDF, JPG, PNG (max 10MB)
  - Shows upload progress
  - On success: displays filename, file size, parse status
- After upload, shows extracted data (if parsing succeeds) or manual-entry fallback fields:
  - Certificate Number
  - GPH (number)
  - Issue Date / Valid Until
- Parse status indicator:
  - 🟡 Pending — "Automated parsing coming soon. Enter key data manually."
  - 🟢 Success — "Data extracted from certificate"
  - 🔴 Failed — "Could not parse certificate. Please enter data manually."

Uses existing design system: `modal-overlay`, `modal-container`, `modal-header`, `input-field`, `form-select`, `btn-base` classes.

---

### Frontend — BoatCard Enhancement

#### [MODIFY] [BoatCard.tsx](file:///c:/Projects/race-committee/ui/src/components/BoatCard.tsx)

- Certificate count badge
- Each certificate shows: type pill + cert number + file icon (📄 if has file, ✏️ if manual-only)
- Validity status (valid/expired)
- Click to open edit modal
- "View Certificate" link triggers download of the original PDF
- "Add Certificate" button

---

### Frontend — Entries Table

#### [MODIFY] [page.tsx (RegattaPage)](file:///c:/Projects/race-committee/ui/src/app/dashboard/regattas/%5Bid%5D/page.tsx)

- Certificate column with type badge or "Manual"
- "View Cert" link to download the original PDF (for RC review)
- Certificate selector dropdown in edit mode

---

### Phase 2: PDF Parsing Pipeline (Future)

> [!NOTE]
> Phase 2 is **out of scope** for this implementation but is documented here as the roadmap.

#### Parsing Approach

The strategy depends on the certificate format:

1. **ORR-EZ PDFs** (from regattaman.com): Likely machine-generated with consistent layout
   - **Primary tool:** `pdfplumber` (Python) or a .NET PDF library
   - Extract text, locate the polar table by anchor keywords
   - Parse the sec/mi grid into structured JSON
   
2. **ORR Full PDFs** (from US Sailing/ORA): Similar approach but more fields

3. **Fallback for messy PDFs:** Azure Document Intelligence or an LLM vision model for table extraction

#### Phase 2 Architecture

```
[Upload] → [Blob Storage] → [Parse Queue] → [Parser Service]
                                                    ↓
                                             [Update Certificate]
                                             - ParseStatus = "Success"/"Failed"
                                             - RawData = { polar JSON }
                                             - GPH = extracted value
                                             - CertificateNumber = extracted
                                             - IssueDate / ValidUntil = extracted
```

The parser would be either:
- An in-process background service (for v1 simplicity)
- An Azure Function triggered by blob upload (for production scale)

---

## Open Questions

> [!IMPORTANT]
> 1. **Sample certificates needed.** Do you have ORR-EZ or ORR certificate PDFs we can use as development samples for the parser? Without examples, Phase 2 can't proceed — but Phase 1 (upload/store/manual entry) works fine independently.

> [!IMPORTANT]
> 2. **File access control for Race Committee.** When a Race Committee member reviews entries, they need to view/download the certificate file. The current auth model only allows `Boat.OwnerId` to access their own certificates. Should RC members get read-only access to certificates for boats entered in their regatta?

> [!NOTE]
> 3. **Certificate types** — Should `CertificateType` be constrained to `PHRF`, `ORR`, `ORREZ`? Or do we need others (e.g., IRC, ORC Club)?

> [!NOTE]
> 4. **Expiration enforcement** — Should expired certificates (`ValidUntil < today`) be blocked from selection or just show a warning?

> [!NOTE]
> 5. **Delete behavior** — Block deletion if any entry references the certificate, or null-out and fall back to `DefaultRating`?

> [!NOTE]
> 6. **Max file size** — 10MB seems reasonable for PDF + scan certificates?

---

## Verification Plan

### Automated Tests
- Build the API: `dotnet build` from `api/` directory
- Run the UI dev server: `npm run dev` from `ui/` — no build errors
- Run existing E2E tests: `npx playwright test` from `e2e/`

### Manual Verification
1. **PHRF manual entry**: My Boats → Add Certificate (PHRF) → enter rating number → appears on BoatCard
2. **ORR file upload**: My Boats → Add Certificate (ORR-EZ) → upload a PDF → file stored, filename displayed, download link works
3. **Download**: Click "View Certificate" → PDF opens in browser/downloads
4. **Entry integration**: Regatta → Entries → select certificate → rating auto-populates
5. **RC review**: As a Race Committee member, view an entry → "View Certificate" link downloads the PDF
6. **Local dev fallback**: Dev without Azure connection string → files saved to disk, still works
