using RaceCommittee.Api.Services;

namespace RaceCommittee.Api.Models.DTOs
{
    public class CertificateCaptureResult
    {
        public ParsedCertificateData ParsedData { get; set; } = null!;
        public byte[] PdfBytes { get; set; } = null!;
    }
}
