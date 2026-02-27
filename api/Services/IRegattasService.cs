using System.Collections.Generic;
using System.Threading.Tasks;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IRegattasService
    {
        Task<Regatta> CreateRegattaAsync(CreateRegattaDto dto, string userId);
        Task<IEnumerable<Regatta>> GetRegattasAsync();
        Task<IEnumerable<Regatta>> GetJoinedRegattasAsync(string userId);
        Task<IEnumerable<Regatta>> GetManagingRegattasAsync(string userId);
        Task<RegattaDetailsDto?> GetRegattaAsync(int id);
        Task<Regatta?> UpdateRegattaAsync(int id, UpdateRegattaDto dto, string userId);
        Task<(bool Success, string ErrorMessage, Entry? Entry)> JoinRegattaAsync(int id, JoinRegattaDto dto, string userId);
        Task<Entry?> UpdateEntryAsync(int regattaId, int entryId, UpdateEntryDto dto, string userId);
    }
}
