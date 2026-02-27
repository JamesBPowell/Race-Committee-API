using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class RacesService : IRacesService
    {
        private readonly ApplicationDbContext _context;

        public RacesService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Race> CreateRaceAsync(int regattaId, CreateRaceDto dto, string userId)
        {
            var regatta = await _context.Regattas
                .Include(r => r.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == regattaId);

            if (regatta == null)
            {
                throw new ArgumentException("Regatta not found");
            }

            // Verify the user is a committee member
            if (!regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this regatta");
            }

            var race = new Race
            {
                RegattaId = regattaId,
                Name = dto.Name,
                ScheduledStartTime = dto.ScheduledStartTime,
                Status = dto.Status ?? "Scheduled",
                StartType = dto.StartType,
                CourseType = dto.CourseType,
                CourseDistance = dto.CourseDistance,
                ScoringParameters = "{}" // Default empty parameters
            };

            var fleets = await _context.Fleets.Where(f => f.RegattaId == regattaId).ToListAsync();
            race.ParticipatingFleets = fleets.Select(f => {
                var rfDto = dto.RaceFleets?.FirstOrDefault(rf => rf.FleetId == f.Id);
                return new RaceFleet
                {
                    FleetId = f.Id,
                    RaceNumber = rfDto?.RaceNumber,
                    StartTimeOffset = rfDto?.StartTimeOffset,
                    CourseType = rfDto?.CourseType ?? dto.CourseType,
                    CourseDistance = rfDto?.CourseDistance ?? dto.CourseDistance,
                    ScoringParameters = "{}"
                };
            }).ToList();

            _context.Races.Add(race);
            await _context.SaveChangesAsync();

            return race;
        }

        public async Task<Race> UpdateRaceAsync(int id, UpdateRaceDto dto, string userId)
        {
            var race = await _context.Races
                .Include(r => r.Regatta)
                .ThenInclude(reg => reg.CommitteeMembers)
                .Include(r => r.ParticipatingFleets)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (race == null)
            {
                throw new ArgumentException("Race not found");
            }

            // Verify the user is a committee member for the regatta
            if (!race.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this race");
            }

            if (!string.IsNullOrEmpty(dto.Name)) race.Name = dto.Name;
            if (dto.ScheduledStartTime.HasValue) race.ScheduledStartTime = dto.ScheduledStartTime;
            if (dto.ActualStartTime.HasValue) race.ActualStartTime = dto.ActualStartTime;
            if (!string.IsNullOrEmpty(dto.Status)) race.Status = dto.Status;
            if (dto.StartType.HasValue) race.StartType = dto.StartType.Value;
            if (dto.CourseType.HasValue) race.CourseType = dto.CourseType.Value;
            if (dto.CourseDistance.HasValue) race.CourseDistance = dto.CourseDistance.Value;

            if (dto.RaceFleets != null)
            {
                foreach (var rfUpdate in dto.RaceFleets)
                {
                    var existingRf = race.ParticipatingFleets.FirstOrDefault(rf => rf.Id == rfUpdate.Id && rfUpdate.Id != 0);
                    if (existingRf != null)
                    {
                        if (rfUpdate.RaceNumber.HasValue) existingRf.RaceNumber = rfUpdate.RaceNumber;
                        if (rfUpdate.StartTimeOffset.HasValue) existingRf.StartTimeOffset = rfUpdate.StartTimeOffset;
                        if (rfUpdate.CourseType.HasValue) existingRf.CourseType = rfUpdate.CourseType.Value;
                        if (rfUpdate.CourseDistance.HasValue) existingRf.CourseDistance = rfUpdate.CourseDistance.Value;
                    }
                    else if (rfUpdate.FleetId != 0)
                    {
                        // Add new RaceFleet override for fleets added after race creation
                        race.ParticipatingFleets.Add(new RaceFleet
                        {
                            FleetId = rfUpdate.FleetId,
                            RaceNumber = rfUpdate.RaceNumber,
                            StartTimeOffset = rfUpdate.StartTimeOffset,
                            CourseType = rfUpdate.CourseType ?? race.CourseType,
                            CourseDistance = rfUpdate.CourseDistance ?? race.CourseDistance,
                            ScoringParameters = "{}"
                        });
                    }
                }
            }

            _context.Races.Update(race);
            await _context.SaveChangesAsync();

            return race;
        }

        public async Task<bool> DeleteRaceAsync(int id, string userId)
        {
            var race = await _context.Races
                .Include(r => r.Regatta)
                .ThenInclude(reg => reg.CommitteeMembers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (race == null)
            {
                return false;
            }

            // Verify the user is a committee member for the regatta
            if (!race.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this race");
            }

            _context.Races.Remove(race);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> SaveFinishesAsync(int raceId, RecordRaceFinishesDto data, string userId)
        {
            var race = await _context.Races
                .Include(r => r.Regatta)
                .ThenInclude(reg => reg.CommitteeMembers)
                .Include(r => r.Finishes)
                .FirstOrDefaultAsync(r => r.Id == raceId);

            if (race == null) return false;

            // Verify the user is a committee member for the regatta
            if (!race.Regatta.CommitteeMembers.Any(cm => cm.UserId == userId))
            {
                throw new UnauthorizedAccessException("You don't have permission to manage this race");
            }
 
            // Update race-level conditions
            if (data.WindSpeed.HasValue) race.WindSpeed = data.WindSpeed;
            if (data.WindDirection.HasValue) race.WindDirection = data.WindDirection;

            // Remove existing finishes
            _context.Finishes.RemoveRange(race.Finishes);

            // Add new finishes
            foreach (var finishDto in data.Finishes)
            {
                _context.Finishes.Add(new Finish
                {
                    RaceId = raceId,
                    EntryId = finishDto.EntryId,
                    FinishTime = finishDto.FinishTime,
                    TimePenalty = finishDto.TimePenalty,
                    PointPenalty = finishDto.PointPenalty,
                    Code = finishDto.Code ?? string.Empty,
                    Notes = finishDto.Notes ?? string.Empty
                });
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
