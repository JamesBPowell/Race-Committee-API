using System.Threading.Tasks;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IRacesService
    {
        Task<Race> CreateRaceAsync(int regattaId, CreateRaceDto dto, string userId);
        Task<Race> UpdateRaceAsync(int id, UpdateRaceDto dto, string userId);
        Task<bool> DeleteRaceAsync(int id, string userId);
        Task<bool> SaveFinishesAsync(int raceId, System.Collections.Generic.List<RecordFinishDto> finishes, string userId);
    }
}
