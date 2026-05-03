using System;

namespace RaceCommittee.Api.Models
{
    public class Certificate
    {
        public int Id { get; set; }

        public int BoatId { get; set; }
        public Boat Boat { get; set; } = default!;

        public string CertificateType { get; set; } = string.Empty; // "PHRF", "ORR", "ORREZ"

        public string CertificateNumber { get; set; } = string.Empty;

        public DateTime? IssueDate { get; set; }
        public DateTime? ValidUntil { get; set; }

        public float? RatingSpinnaker { get; set; }       // The raw rating from the certificate
        public float? RatingNonSpinnaker { get; set; }    // The raw rating from the certificate
        public string RatingType { get; set; } = "SecondsPerMile"; // "PHRF", "SecondsPerMile" (GPH)
        
        // Normalized Seconds per Mile (Time-on-Distance)
        // For ORR/ORC, this equals GPH. 
        // For PHRF, this equals PHRF + 550.
        public float? NormalizedToD { get; set; }
        public string? Configuration { get; set; }        // Parsed from cert: crew config, spin type, etc.
        public string RawData { get; set; } = "{}";       // JSON: full parsed output (polars, config, ratings)

        // --- File storage (PHRF PDFs) ---
        public string? FileName { get; set; }
        public string? BlobPath { get; set; }
        public string? ContentType { get; set; }
        public long? FileSizeBytes { get; set; }
        public DateTime? FileUploadedAt { get; set; }

        // --- Remote certificate reference (ORR/ORREZ) ---
        public string? SourceUrl { get; set; }            // regattaman.com cert URL
        public string? SourceSku { get; set; }            // SKU parameter for re-fetching
        public string? SourceHtml { get; set; }           // Raw HTML snapshot for disaster recovery

        // --- Parse status ---
        public string ParseStatus { get; set; } = "None"; // None, Pending, Success, Failed, Manual
        public string? ParseErrors { get; set; }
        public string? SchemaVersion { get; set; }        // e.g. "ORR-2026-v1", "PHRF-v1"
    }

    public static class CertificateSchemas
    {
        public const string CurrentOrr = "ORR-2026-v1";
        public const string CurrentOrrEz = "ORREZ-2026-v1";
        public const string CurrentPhrf = "PHRF-v1";
    }
}
