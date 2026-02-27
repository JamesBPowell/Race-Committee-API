using System.Collections.Generic;
using System.Threading.Tasks;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public interface IScoringService
    {
        Task<IEnumerable<FinishResultDto>> CalculateRaceScoresAsync(int raceId);
        // Task<IEnumerable<SeriesResultDto>> CalculateRegattaSeriesAsync(int regattaId);
    }
}
