namespace RaceCommittee.Api.Models.DTOs
{
    public class CertificateDto
    {
        public int Id { get; set; }
        public int BoatId { get; set; }
        public string CertificateType { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public DateTime? IssueDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public float? RatingSpinnaker { get; set; }
        public float? RatingNonSpinnaker { get; set; }
        public string RatingType { get; set; } = "SecondsPerMile";
        public float? NormalizedToD { get; set; }
        public string? Configuration { get; set; }
        public string? FileName { get; set; }
        public bool HasFile { get; set; }
        public string? FileDownloadUrl { get; set; }
        public string? SourceUrl { get; set; }
        public string? SourceContentPath { get; set; }
        public string ParseStatus { get; set; } = "None";
        public string? SchemaVersion { get; set; }
    }

    public class CreateCertificateManualDto
    {
        public string CertificateType { get; set; } = "PHRF";
        public string? CertificateNumber { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public float? RatingSpinnaker { get; set; }
        public float? RatingNonSpinnaker { get; set; }
    }

    public class ImportCertificateDto
    {
        public string CertificateType { get; set; } = string.Empty; // "ORR" or "ORREZ"
        public string SourceUrl { get; set; } = string.Empty;       // regattaman.com cert URL
    }

    public class UpdateCertificateDto
    {
        public string? CertificateNumber { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public float? RatingSpinnaker { get; set; }
        public float? RatingNonSpinnaker { get; set; }
    }

    public class CertificateSearchResultDto
    {
        public string Sku { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public string BoatName { get; set; } = string.Empty;
        public string SailNumber { get; set; } = string.Empty;
        public string BoatType { get; set; } = string.Empty;
        public string DisplayText { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }
}
