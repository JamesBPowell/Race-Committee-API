using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface ICertificateListService
    {
        Task<IEnumerable<CertificateSearchResultDto>> SearchAsync(string certType, string query);
    }
}
