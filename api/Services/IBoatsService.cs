using System.Collections.Generic;
using System.Threading.Tasks;
using api.Models;
using api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IBoatsService
    {
        Task<IEnumerable<BoatDto>> GetBoatsAsync(string userId, bool includeCertificates = false);
        Task<BoatDto?> GetBoatAsync(int id, string userId, bool includeCertificates = false);
        Task<BoatDto> CreateBoatAsync(CreateBoatDto createBoatDto, string userId);
        Task<bool> UpdateBoatAsync(int id, UpdateBoatDto updateBoatDto, string userId);
        Task<(bool Success, string ErrorMessage)> DeleteBoatAsync(int id, string userId);
    }
}
