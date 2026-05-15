using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface ICertificateParserService
    {
        Task<ParsedCertificateData> ParseFromUrlAsync(string url, string certType);
        Task<ParsedCertificateData> ParseFromHtmlAsync(string html, string certType);
    }

    public class ParsedCertificateData
    {
        public string CertificateType { get; set; } = string.Empty;
        public string CertificateNumber { get; set; } = string.Empty;
        public string BoatName { get; set; } = string.Empty;
        public string SailNumber { get; set; } = string.Empty;
        public string BoatClass { get; set; } = string.Empty;
        public string? Configuration { get; set; }
        public DateTime? IssueDate { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public float? RatingSpinnaker { get; set; }
        public float? RatingNonSpinnaker { get; set; }
        public string RatingType { get; set; } = "SecondsPerMile"; // "PHRF", "SecondsPerMile"
        public float? NormalizedToD { get; set; }
        public string SchemaVersion { get; set; } = string.Empty;
        public string RawHtml { get; set; } = string.Empty;
        public string RawDataJson { get; set; } = "{}";
    }
}
