using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface ICertificatesService
    {
        Task<IEnumerable<CertificateDto>> GetCertificatesForBoatAsync(int boatId, string userId);
        Task<CertificateDto?> GetCertificateAsync(int id, string userId);
        Task<CertificateDto> CreateCertificateManualAsync(int boatId, CreateCertificateManualDto dto, string userId);
        Task<CertificateDto> ImportCertificateAsync(int boatId, ImportCertificateDto dto, string userId);
        Task<CertificateDto?> UploadFileAsync(int boatId, int certId, IFormFile file, string userId);
        Task<bool> UpdateCertificateAsync(int id, UpdateCertificateDto dto, string userId);
        Task<(bool Success, string ErrorMessage)> DeleteCertificateAsync(int id, string userId);
        Task<CertificateDto?> RefreshFromSourceAsync(int id, string userId);
        Task<(Stream? FileStream, string? ContentType, string? FileName)> GetFileDownloadAsync(int id, string userId);
    }
}
