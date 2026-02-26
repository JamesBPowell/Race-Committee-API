using System.Collections.Generic;
using System.Threading.Tasks;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IFleetsService
    {
        Task<Fleet> CreateFleetAsync(int regattaId, CreateFleetDto dto, string userId);
        Task<Fleet> UpdateFleetAsync(int id, UpdateFleetDto dto, string userId);
        Task<bool> DeleteFleetAsync(int id, string userId);
        Task<IEnumerable<Fleet>> GetRegattaFleetsAsync(int regattaId);
    }
}
