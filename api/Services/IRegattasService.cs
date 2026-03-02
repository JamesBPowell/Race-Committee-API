using System.Collections.Generic;
using System.Threading.Tasks;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IRegattasService
    {
        Task<Regatta> CreateRegattaAsync(CreateRegattaDto dto, string userId);
        Task<IEnumerable<RegattaSummaryDto>> GetRegattasAsync();
        Task<IEnumerable<RegattaSummaryDto>> GetJoinedRegattasAsync(string userId);
        Task<IEnumerable<RegattaSummaryDto>> GetManagingRegattasAsync(string userId);
        Task<RegattaDetailsDto?> GetRegattaAsync(int id, string? userId = null);
        Task<Regatta?> UpdateRegattaAsync(int id, UpdateRegattaDto dto, string userId);
        Task<(bool Success, string ErrorMessage, Entry? Entry)> JoinRegattaAsync(int id, JoinRegattaDto dto, string userId);
        Task<Entry?> UpdateEntryAsync(int regattaId, int entryId, UpdateEntryDto dto, string userId);
    }
}
